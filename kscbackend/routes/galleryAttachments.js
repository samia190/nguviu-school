// routes/gallery.js (ESM)
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import GalleryItem from "../models/GalleryItem.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";
// ========== MEDIA OPTIMIZATION ==========
import { optimizeMedia, mediaFileFilter } from "../middleware/mediaOptimizer.js";

const router = express.Router();

function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

// ✅ Must match your index.js static folder
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Use memory storage so we can route to Cloudinary/S3/disk via uploadBuffer()
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 150,
  },
});

// =======================
// GALLERY CRUD
// =======================

// GET /api/content/gallery  -> list all gallery items
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    const itemsWithAbsoluteUrls = items.map(item => ({
      ...item.toObject(),
      attachments: (item.attachments || []).map(att => ({
        ...att,
        url: toAbsoluteUrl(req, att.url),
        thumbnail: toAbsoluteUrl(req, att.thumbnail)
      }))
    }));
    res.json(itemsWithAbsoluteUrls);
  } catch (err) {
    console.error("Gallery list error:", err);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

// GET /api/content/gallery/:id -> single item
router.get("/:id", async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({
      ...item.toObject(),
      attachments: (item.attachments || []).map(att => ({
        ...att,
        url: toAbsoluteUrl(req, att.url),
        thumbnail: toAbsoluteUrl(req, att.thumbnail)
      }))
    });
  } catch (err) {
    console.error("Gallery get error:", err);
    res.status(500).json({ error: "Failed to load gallery item" });
  }
});

// POST /api/content/gallery -> create item
router.post("/", async (req, res) => {
  try {
    const { title, body } = req.body || {};
    const item = await GalleryItem.create({
      title: title || "Gallery Item",
      body: body || "",
      attachments: [],
    });
    // frontend accepts either {item} or direct item; we return both safely
    res.status(201).json({ item });
  } catch (err) {
    console.error("Gallery create error:", err);
    res.status(400).json({ error: "Failed to create gallery item" });
  }
});

// PATCH /api/content/gallery/:id -> update title/body/attachments
router.patch("/:id", async (req, res) => {
  try {
    const { title, body, attachments } = req.body || {};
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (body !== undefined) updateFields.body = body;
    if (attachments !== undefined) updateFields.attachments = attachments;

    const updated = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({
      updated: {
        ...updated.toObject(),
        attachments: (updated.attachments || []).map(att => ({
          ...att,
          url: toAbsoluteUrl(req, att.url),
          thumbnail: toAbsoluteUrl(req, att.thumbnail)
        }))
      }
    });
  } catch (err) {
    console.error("Gallery update error:", err);
    res.status(400).json({ error: "Failed to update gallery item" });
  }
});

// DELETE /api/content/gallery/:id -> delete item
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Gallery delete error:", err);
    res.status(500).json({ error: "Failed to delete gallery item" });
  }
});

// =======================
// ATTACHMENTS (UPLOAD/DELETE)
// =======================

// ========== UPDATED: Added optimizeMedia() middleware after Multer ==========
// POST /api/content/gallery/:id/attachments  (supports 100 files per request)
router.post("/:id/attachments", upload.array("attachments", 100), optimizeMedia(), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Gallery item not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Upload each file via unified storage (Cloudinary > S3 > Disk)
    const added = [];
    for (const f of req.files) {
      const uploaded = await uploadBuffer(f.buffer, f.originalname, f.mimetype, uploadsDir);
      
      // Extract file extension from original name or mimetype
      let extension = '';
      if (f.originalname && f.originalname.includes('.')) {
        extension = '.' + f.originalname.split('.').pop().toLowerCase();
      } else {
        // Infer from mimetype if no extension in filename
        const mimeToExt = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
          'video/mp4': '.mp4',
          'video/webm': '.webm',
          'application/pdf': '.pdf'
        };
        extension = mimeToExt[f.mimetype] || '.bin';
      }
      
      // Ensure URL has extension for proper srcset parsing
      let url = uploaded.url;
      if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf)(\?|$)/i)) {
        url = url + extension;
      }
      
      const attachment = {
        originalName: f.originalname,
        filename: (uploaded.filename || uploaded.public_id || f.originalname) + extension,
        url: url,
        extension: extension,
        mimetype: f.mimetype,
        size: f.size || (f.buffer ? f.buffer.length : 0),
        uploadedAt: new Date(),
      };

      // If video has thumbnail, upload it too
      if (f._thumbnail) {
        const thumbUploaded = await uploadBuffer(f._thumbnail.buffer, f._thumbnail.name, "image/jpeg", uploadsDir);
        attachment.thumbnail = thumbUploaded.url;
      }

      added.push(attachment);
    }

    item.attachments.push(...added);
    await item.save();

    const normalizedAttachments = (item.attachments || []).map(att => ({
      ...(att.toObject ? att.toObject() : att),
      url: toAbsoluteUrl(req, att.url),
      thumbnail: toAbsoluteUrl(req, att.thumbnail)
    }));

    res.json({ 
      added: normalizedAttachments.slice(-added.length),
      item: { ...item.toObject(), attachments: normalizedAttachments }
    });
  } catch (err) {
    console.error("Gallery attachment upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// DELETE /api/content/gallery/:id/attachments/:attachmentId
router.delete("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Gallery item not found" });

    const before = item.attachments.length;

    // remove attachment from DB
    const att = item.attachments.id(req.params.attachmentId);
    if (!att) return res.status(404).json({ error: "Attachment not found" });

    // try deleting the physical file too (Cloud or disk)
    if (att.url) {
      try {
        await deleteFile(att.url);
      } catch (e) {
        console.warn("Could not delete file from storage:", e?.message || e);
      }
    }

    att.deleteOne(); // mongoose subdoc delete
    await item.save();

    const after = item.attachments.length;
    const normalizedAttachments = (item.attachments || []).map(a => ({
      ...(a.toObject ? a.toObject() : a),
      url: toAbsoluteUrl(req, a.url),
      thumbnail: toAbsoluteUrl(req, a.thumbnail)
    }));

    res.json({ 
      ok: true, 
      removed: before - after, 
      item: { ...item.toObject(), attachments: normalizedAttachments }
    });
  } catch (err) {
    console.error("Delete attachment error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
