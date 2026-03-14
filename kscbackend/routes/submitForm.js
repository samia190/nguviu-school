import express from "express";
import multer from "multer";
import path from "path";
import File from "../models/File.js";
import { uploadBuffer } from "../utils/storage.js";
import { requireRole } from "../middleware/requireAuth.js";
import { formLimiter } from "../middleware/rateLimiter.js";
// ========== MEDIA OPTIMIZATION ==========
import { optimizeMedia, mediaFileFilter } from "../middleware/mediaOptimizer.js";

const router = express.Router();

// Public endpoint for submitting admission forms
const storage = multer.memoryStorage();
// ========== UPDATED: Added file filter for validation ==========
const upload = multer({ 
  storage, 
  fileFilter: mediaFileFilter,  // Validate file types
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// ========== UPDATED: Added optimizeMedia() middleware after Multer ==========
// POST /api/submit-form
// fields: name, email, phone, classLevel
// files: applicationForm (pdf), image (profile)
router.post("/", formLimiter, upload.fields([ { name: "applicationForm", maxCount: 1 }, { name: "image", maxCount: 1 } ]), optimizeMedia(), async (req, res) => {
  try {
    const { name, email, phone, classLevel } = req.body || {};
    const files = req.files || {};
    const created = [];

    // helper to persist one file buffer via unified storage (Cloudinary > S3 > Disk)
    async function persistFile(file) {
      if (!file) return null;
      const uploaded = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
      return { filename: uploaded.filename || uploaded.public_id || file.originalname, url: uploaded.url };
    }

    if (files.applicationForm && files.applicationForm[0]) {
      const f = files.applicationForm[0];
      const saved = await persistFile(f);
      const doc = await File.create({
        originalName: f.originalname,
        filename: saved.filename,
        url: saved.url,
        studentEmail: email || "",
        notes: `name:${name || ""} phone:${phone || ""} class:${classLevel || ""}`,
        status: "pending",
      });
      created.push(doc);
    }

    if (files.image && files.image[0]) {
      const f = files.image[0];
      const saved = await persistFile(f);
      // store image as a separate File record so admins can see both
      const doc = await File.create({
        originalName: f.originalname,
        filename: saved.filename,
        url: saved.url,
        studentEmail: email || "",
        notes: `profile image for ${name || ""}`,
      });
      created.push(doc);
    }

    return res.json({ success: true, items: created });
  } catch (err) {
    console.error("submit-form error:", err);
    return res.status(500).json({ success: false, error: "Form submission failed" });
  }
});

// Admin-only: download a submitted file by File _id
// GET /api/download-form/:id
router.get("/download/:id", requireRole(["admin", "teacher"]), async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await File.findById(id);
    if (!doc) return res.status(404).json({ error: "File not found" });

    // If URL is absolute (S3) redirect; if it's a local /uploads path, stream file
    if (typeof doc.url === "string" && doc.url.startsWith("http")) {
      return res.redirect(doc.url);
    }

    // local file - url like /uploads/filename
    const fileName = path.basename(String(doc.url || doc.filename));
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);
    return res.download(filePath, doc.originalName || fileName);
  } catch (err) {
    console.error("download-form error:", err);
    return res.status(500).json({ error: "Failed to download file" });
  }
});

// Admin-only: list submitted forms (wrapper around existing File model query)
router.get("/list", requireRole(["admin", "teacher"]), async (req, res) => {
  try {
    const items = await File.find({}).sort({ uploadedAt: -1 }).limit(100);
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch submitted forms" });
  }
});

export default router;
