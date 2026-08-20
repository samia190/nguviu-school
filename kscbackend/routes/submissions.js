import express from "express";
import mongoose from "mongoose";
import File from "../models/File.js";
import Exam from "../models/Exam.js";
import { deleteFile } from "../utils/storage.js";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireRole(["admin", "superadmin", "teacher"]));

async function ownedExamFilter(user) {
  if (["admin", "superadmin"].includes(user.role)) return {};
  return { examId: { $in: await Exam.find({ createdBy: user.id || user._id }).distinct("_id") } };
}

async function canAccessSubmission(user, doc) {
  if (["admin", "superadmin"].includes(user.role)) return true;
  return Boolean(doc.examId && await Exam.exists({ _id: doc.examId, createdBy: user.id || user._id }));
}

router.get("/", async (req, res) => {
  try {
    const { search, status, studentEmail, page = 1, limit = 50 } = req.query;
    const q = await ownedExamFilter(req.user);
    if (status) q.status = status;
    if (studentEmail) q.studentEmail = studentEmail;
    if (search) { const term = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); q.$or = [{ originalName: { $regex: term, $options: "i" } }, { studentEmail: { $regex: term, $options: "i" } }, { notes: { $regex: term, $options: "i" } }]; }
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50)); const skip = (Math.max(1, Number(page) || 1) - 1) * safeLimit;
    if (mongoose.connection.readyState !== 1) return res.json({ items: [], total: 0, page: Number(page), limit: safeLimit });
    const [items, total] = await Promise.all([File.find(q).sort({ uploadedAt: -1 }).skip(skip).limit(safeLimit), File.countDocuments(q)]);
    return res.json({ items, total, page: Number(page), limit: safeLimit });
  } catch { return res.status(500).json({ error: "Failed to fetch submissions" }); }
});

router.get("/stats", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ stats: { total: 0, pending: 0, approved: 0, rejected: 0 } });
    const q = await ownedExamFilter(req.user);
    const [total, pending, approved, rejected] = await Promise.all([File.countDocuments(q), File.countDocuments({ ...q, status: "pending" }), File.countDocuments({ ...q, status: "approved" }), File.countDocuments({ ...q, status: "rejected" })]);
    return res.json({ stats: { total, pending, approved, rejected } });
  } catch { return res.status(500).json({ error: "Failed to fetch submission statistics" }); }
});

router.get("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const doc = await File.findById(req.params.id); if (!doc) return res.status(404).json({ error: "Submission not found" });
    if (!await canAccessSubmission(req.user, doc)) return res.status(403).json({ error: "Not authorized to access this submission" });
    return res.json(doc);
  } catch { return res.status(500).json({ error: "Failed to fetch submission" }); }
});

const updateSubmission = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const doc = await File.findById(req.params.id); if (!doc) return res.status(404).json({ error: "Submission not found" });
    if (!await canAccessSubmission(req.user, doc)) return res.status(403).json({ error: "Not authorized to review this submission" });
    const { status, reviewerNotes } = req.body || {};
    if (status && !["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid review status" });
    if (status) doc.status = status; if (typeof reviewerNotes === "string") doc.reviewerNotes = reviewerNotes.slice(0, 5000); doc.reviewedBy = req.user.id || req.user._id;
    await doc.save(); return res.json(doc);
  } catch { return res.status(500).json({ error: "Failed to update submission" }); }
};

router.put("/:id", updateSubmission); router.patch("/:id", updateSubmission);
router.delete("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "DB unavailable" });
    const doc = await File.findById(req.params.id); if (!doc) return res.status(404).json({ error: "Submission not found" });
    if (!await canAccessSubmission(req.user, doc)) return res.status(403).json({ error: "Not authorized to delete this submission" });
    await deleteFile(doc.url).catch(() => {}); await doc.deleteOne(); return res.json({ ok: true });
  } catch { return res.status(500).json({ error: "Failed to delete submission" }); }
});

export default router;
