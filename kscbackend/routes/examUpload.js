// routes/examUpload.js (ESM)
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"));
    }
  }
});

/**
 * POST /api/exams/upload-pdf
 * Upload exam PDF to Cloudinary
 * Returns URL and public ID for storage in database
 */
router.post("/upload-pdf", requireRole(["teacher", "admin"]), upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file provided" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ ok: false, error: "Only PDF files allowed" });
    }

    console.log(`[PDF Upload] User: ${req.user._id}, File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Upload to Cloudinary as raw file
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: "raw",
        folder: "kangaru_exams",
        public_id: `exam_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        format: "pdf"
      },
      (error, result) => {
        if (error) {
          console.error("[PDF Upload] Cloudinary error:", error);
          return res.status(500).json({ 
            ok: false, 
            error: "Upload failed",
            details: error.message 
          });
        }

        console.log(`[PDF Upload] Success: ${result.secure_url}`);

        let signedUrl;
        try {
          signedUrl = cloudinary.url(result.public_id, {
            resource_type: "raw",
            type: "authenticated",
            secure: true,
            sign_url: true,
            format: "pdf",
          });
        } catch (err) {
          console.warn("[PDF Upload] signed URL generation failed", err?.message || err);
          signedUrl = result.secure_url;
        }

        console.log(`[PDF Upload] Signed URL: ${signedUrl}`);

        res.json({
          ok: true,
          url: signedUrl,
          signedUrl,
          publicId: result.public_id,
          fileName: req.file.originalname,
          size: req.file.size,
          uploadedAt: new Date(),
        });
      }
    );

    uploadStream.on("error", (error) => {
      console.error("[PDF Upload Stream] Error:", error);
      res.status(500).json({ ok: false, error: "Stream upload failed" });
    });

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("[PDF Upload] Exception:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/exams/upload-status/:publicId
 * Check status of uploaded PDF (optional verification endpoint)
 */
router.get("/upload-status/:publicId", requireRole(["teacher", "admin"]), async (req, res) => {
  try {
    const { publicId } = req.params;

    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "raw"
    });

    res.json({
      ok: true,
      fileName: resource.public_id,
      size: resource.bytes,
      uploadedAt: resource.created_at,
      url: resource.secure_url
    });
  } catch (error) {
    console.error("[Upload Status] Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
