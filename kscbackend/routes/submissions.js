// routes/submissions.js
import express from "express";
import mongoose from "mongoose";
import File from "../models/File.js";
import { deleteFile } from "../utils/storage.js";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// Only teachers and admins can access submissions management
router.use(requireRole(["admin", "teacher"]));

// GET /api/submissions
// supports query: search, status, studentEmail, page, limit
router.get("/", async (req, res) => {
  try {
    const { search, status, studentEmail, page = 1, limit = 50 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (studentEmail) q.studentEmail = studentEmail;
    if (search) {
      q.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { studentEmail: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    if (mongoose.connection.readyState !== 1) {
      return res.json({ items: [], total: 0, page: Number(page), limit: Number(limit) });
    }
    const docs = await File.find(q).sort({ uploadedAt: -1 }).skip(skip).limit(Number(limit));
    const total = await File.countDocuments(q);
    return res.json({ items: docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// GET single submission
router.get("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Submission not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch submission" });
  }
});

// PUT /api/submissions/:id  -> update status and reviewer notes
router.put("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const { status, reviewerNotes } = req.body;
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Submission not found" });

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      doc.status = status;
    }
    if (typeof reviewerNotes === "string") doc.reviewerNotes = reviewerNotes;
    if (req.user?.id) doc.reviewedBy = req.user.id;

    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update submission" });
  }
});

// DELETE /api/submissions/:id
router.delete("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Submission not found" });

    // attempt to delete underlying file from storage (S3 or disk)
    try {
      await deleteFile(doc.url);
    } catch (err) {
      console.warn("Failed to delete file from storage:", err.message);
    }

    await doc.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete submission" });
  }
});

export default router;
