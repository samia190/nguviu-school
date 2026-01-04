// routes/admin.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Content from "../models/Content.js";

const router = express.Router();

// Ensure uploads folder exists (same as in index.js)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${uniqueSuffix}-${safeOriginal}`);
  },
});

const upload = multer({ storage });

function makeDownloadUrl(req, relPath) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${relPath}`;
}

/**
 * POST /api/admin/content
 *
 * Fields (multipart/form-data):
 *  - type  (required)  e.g. "newsletter", "feestructure"
 *  - title (optional)  -> section title
 *  - body  (optional)  -> main text / description
 *  - files (optional)  -> field name "files"
 */
router.post("/content", upload.array("files", 10), async (req, res) => {
  try {
    const { type, title, body = "" } = req.body;

    if (!type) {
      return res
        .status(400)
        .json({ ok: false, error: "Field 'type' is required" });
    }

    const files = req.files || [];

    const attachments = files.map((f) => {
      const relUrl = `/uploads/${f.filename}`;
      return {
        name: f.originalname,
        originalName: f.originalname,
        url: relUrl,
        downloadUrl: makeDownloadUrl(req, relUrl),
        mimetype: f.mimetype,
        size: f.size,
        uploadedAt: new Date(),
      };
    });

    // Find or create content by type
    let content = await Content.findOne({ type });

    if (!content) {
      // First time creating this type
      content = new Content({
        type,
        title: title || "",
        body: body || "",
        attachments,
      });
    } else {
      // ✅ Only overwrite title/body if you actually provide new values
      if (title && title.trim().length > 0) {
        content.title = title;
      }
      if (body && body.trim().length > 0) {
        content.body = body;
      }
      // ✅ Always APPEND new attachments; never wipe the old ones
      content.attachments = [...(content.attachments || []), ...attachments];
    }

    await content.save();

    res.json({
      ok: true,
      content,
    });
  } catch (err) {
    console.error("Failed to process content upload:", err);
    res.status(500).json({ ok: false, error: "Failed to save content" });
  }
});

export default router;
