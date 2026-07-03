// routes/files.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import File from "../models/File.js";
import { uploadBuffer } from "../utils/storage.js";
import { requireRole } from "../middleware/requireAuth.js";
// ========== MEDIA OPTIMIZATION ==========
import { optimizeMedia, mediaFileFilter } from "../middleware/mediaOptimizer.js";

const router = express.Router();

// Ensure upload folder exists (disk fallback)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  }
});

// helper: build absolute url (passes Cloudinary/S3 https URLs through unchanged)
function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin =
    process.env.PUBLIC_ORIGIN ||
    `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

// ✅ POST: single file upload (used by Events, StudentLife, Staff, News, Magazine admin panels)
router.post("/upload", upload.single("file"), optimizeMedia(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Unified upload: Cloudinary > S3 > Disk
    const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, uploadsDir);
    const storedUrl = uploaded.url;
    const storedFilename = uploaded.filename || uploaded.public_id || req.file.originalname;

    // Check if DB is available
    const dbUnavailable = mongoose.connection.readyState !== 1;
    
    if (dbUnavailable) {
      return res.json({
        id: `transient-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        originalName: req.file.originalname,
        filename: storedFilename,
        url: toAbsoluteUrl(req, storedUrl),
        path: storedUrl,
        uploadedAt: new Date(),
        warning: "DB unavailable; file not persisted to database"
      });
    }

    // Save to database
    const doc = await File.create({
      originalName: req.file.originalname,
      filename: storedFilename,
      url: storedUrl,
      level: req.body.level || "",
      subject: req.body.subject || "",
      notes: req.body.notes || "",
      type: req.body.type || "",
    });

    return res.json({
      id: doc._id,
      originalName: doc.originalName,
      filename: doc.filename,
      url: toAbsoluteUrl(req, doc.url),
      path: doc.url,
      uploadedAt: doc.uploadedAt,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// ✅ POST: upload student homework (multiple files)
router.post("/", upload.array("attachments", 10), optimizeMedia(), async (req, res) => {
  try {
    const { level, subject, notes, studentEmail, studentRole, examId, sessionId, questionId, type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const savedFiles = [];
    const dbUnavailable = mongoose.connection.readyState !== 1;

    for (const f of req.files) {
      // Unified upload: Cloudinary > S3 > Disk
      const uploaded = await uploadBuffer(f.buffer, f.originalname, f.mimetype, uploadsDir);
      const storedUrl = uploaded.url;
      const storedFilename = uploaded.filename || uploaded.public_id || f.originalname;

      if (dbUnavailable) {
        savedFiles.push({
          id: `transient-${Date.now()}-${Math.floor(Math.random()*10000)}`,
          originalName: f.originalname,
          filename: storedFilename,
          url: storedUrl,
          level: level || "",
          subject: subject || "",
          notes: notes || "",
          studentEmail: studentEmail || "",
          studentRole: studentRole || "",
          examId: examId || null,
          sessionId: sessionId || null,
          questionId: questionId || null,
          type: type || "",
          uploadedAt: new Date(),
        });
      } else {
        const doc = await File.create({
          originalName: f.originalname,
          filename: storedFilename,
          url: storedUrl,
          level: level || "",
          subject: subject || "",
          notes: notes || "",
          studentEmail: studentEmail || "",
          studentRole: studentRole || "",
          examId: examId || null,
          sessionId: sessionId || null,
          questionId: questionId || null,
          type: type || "",
        });

        savedFiles.push(doc);
      }
    }

    const response = savedFiles.map((doc) => ({
      ...(doc.toObject ? doc.toObject() : doc),
      downloadUrl: toAbsoluteUrl(req, doc.url),
      questionId: doc.questionId || null,
      examId: doc.examId || null,
      sessionId: doc.sessionId || null,
    }));

    if (dbUnavailable) return res.json({ warning: "DB unavailable; files not persisted", items: response });

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// ✅ GET: teacher/admin fetch all submissions
router.get("/", requireRole(["admin","teacher"]), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const files = await File.find().sort({ uploadedAt: -1 });

    const response = files.map((doc) => ({
      ...doc.toObject(),
      downloadUrl: toAbsoluteUrl(req, doc.url),
    }));

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch files" });
  }
});

export default router;
