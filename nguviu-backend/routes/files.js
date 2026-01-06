// routes/files.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import File from "../models/File.js";
import { isS3Enabled, uploadBufferToS3, saveBufferToDisk } from "../utils/storage.js";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// Ensure upload folder exists
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Use memory storage so we can optionally push to S3 or write to disk
const upload = multer({ storage: multer.memoryStorage() });

// helper: build absolute url
function toAbsoluteUrl(req, relativePath) {
  // If already an absolute URL (S3), return as-is
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin =
    process.env.PUBLIC_ORIGIN ||
    `${req.protocol}://${req.get("host")}`; // e.g. http://
  return `${origin}${relativePath}`;
}

// ✅ POST: upload student homework
router.post("/", upload.array("attachments", 10), async (req, res) => {
  try {
    const { level, subject, notes, studentEmail, studentRole } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const useS3 = isS3Enabled();

    const savedFiles = [];

    // If DB is not connected, persist files to disk but do not create DB docs
    const dbUnavailable = mongoose.connection.readyState !== 1;

    for (const f of req.files) {
      let storedUrl;
      let storedFilename = f.originalname;

      if (useS3) {
        const uploaded = await uploadBufferToS3(f.buffer, f.originalname, f.mimetype);
        storedUrl = uploaded.url; // absolute S3 url
        storedFilename = uploaded.key;
      } else {
        const saved = saveBufferToDisk(f.buffer, f.originalname, uploadsDir);
        storedUrl = saved.url; // relative url served by static middleware
        storedFilename = saved.filename;
      }

      if (dbUnavailable) {
        // return transient object without saving to DB
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
        });

        savedFiles.push(doc);
      }
    }

    // return absolute url so frontend can download
    const response = savedFiles.map((doc) => ({
      ...(doc.toObject ? doc.toObject() : doc),
      downloadUrl: toAbsoluteUrl(req, doc.url),
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
