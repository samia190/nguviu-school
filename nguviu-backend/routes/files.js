// routes/files.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File.js";

const router = express.Router();

// Ensure upload folder exists
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

// helper: build absolute url
function toAbsoluteUrl(req, relativePath) {
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

    const savedFiles = await Promise.all(
      req.files.map((f) =>
        File.create({
          originalName: f.originalname,
          filename: f.filename,
          url: `/uploads/${f.filename}`, // stored as relative
          level: level || "",
          subject: subject || "",
          notes: notes || "",
          studentEmail: studentEmail || "",
          studentRole: studentRole || "",
        })
      )
    );

    // return absolute url so frontend can download
    const response = savedFiles.map((doc) => ({
      ...doc.toObject(),
      downloadUrl: toAbsoluteUrl(req, doc.url),
    }));

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// ✅ GET: teacher/admin fetch all submissions
router.get("/", async (req, res) => {
  try {
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
