// routes/gallery.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import GalleryItem from "../models/GalleryItem.js";

const router = express.Router();

// ✅ Must match your index.js static folder
// index.js: app.use("/uploads", express.static(path.join(process.cwd(),"public","uploads")))
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Optional: basic file type filter (you can loosen/tighten)
function fileFilter(req, file, cb) {
  // allow images, video, pdf, word, ppt, zip, etc.
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file (change as you want)
    files: 150, // allow many files in request (frontend chunks anyway)
  },
});

// =======================
// GALLERY CRUD
// =======================

// GET /api/content/gallery  -> list all gallery items
router.get("/", async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json(items);
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
    res.json(item);
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

// PATCH /api/content/gallery/:id -> update title/body
router.patch("/:id", async (req, res) => {
  try {
    const { title, body } = req.body || {};
    const updated = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      { ...(title !== undefined ? { title } : {}), ...(body !== undefined ? { body } : {}) },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ updated });
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

// POST /api/content/gallery/:id/attachments  (supports 100 files per request)
router.post("/:id/attachments", upload.array("attachments", 100), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Gallery item not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const added = req.files.map((f) => ({
      originalName: f.originalname,
      filename: f.filename,
      url: `/uploads/${f.filename}`, // ✅ served by index.js
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date(),
    }));

    item.attachments.push(...added);
    await item.save();

    res.json({ added, item });
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

    // try deleting the physical file too (optional but good)
    if (att.filename) {
      const p = path.join(uploadsDir, att.filename);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch (e) {
          console.warn("Could not delete file from disk:", e?.message || e);
        }
      }
    }

    att.deleteOne(); // mongoose subdoc delete
    await item.save();

    const after = item.attachments.length;
    res.json({ ok: true, removed: before - after, item });
  } catch (err) {
    console.error("Delete attachment error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
