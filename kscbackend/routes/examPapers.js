import express from "express";
import multer from "multer";
import crypto from "crypto";
import mammoth from "mammoth";
import Exam from "../models/Exam.js";
import ExamSession from "../models/ExamSession.js";
import ExamPaperVersion from "../models/ExamPaperVersion.js";
import File from "../models/File.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { examMutationLimiter } from "../middleware/rateLimiter.js";
import { getExamAvailability, isEnrolledStudent, isExamManager } from "../utils/examAccess.js";
import { uploadBuffer } from "../utils/storage.js";
import { canReplaceExamPaper, sanitiseExamPaperHtml } from "../services/assessmentContentPolicy.js";

const router = express.Router();
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 }, fileFilter: (req, file, done) => done(null, file.mimetype === DOCX && file.originalname.toLowerCase().endsWith(".docx")) });
const text = (value, max = 160) => String(value || "").trim().slice(0, max);
const safeMedia = (raw) => (Array.isArray(raw) ? raw : []).slice(0, 12).map((item) => ({ label: text(item?.label), url: text(item?.url, 2048), type: ["image", "audio", "video", "resource"].includes(item?.type) ? item.type : "resource" })).filter((item) => /^https:\/\//.test(item.url));

router.post("/:examId", requireRole(["teacher", "admin", "superadmin"]), examMutationLimiter, upload.single("paper"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "Upload a DOCX exam paper." });
    const exam = await Exam.findById(req.params.examId);
    if (!exam || !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized to update this exam paper." });
    if (!canReplaceExamPaper(Boolean(await ExamSession.exists({ examId: exam._id, status: { $in: ["in_progress", "submitted", "graded", "expired"] } })))) return res.status(409).json({ ok: false, error: "The exam paper is immutable once a student session has started." });
    const converted = await mammoth.convertToHtml({ buffer: req.file.buffer });
    const renderedHtml = sanitiseExamPaperHtml(converted.value || "");
    if (!renderedHtml.replace(/<[^>]*>/g, "").trim()) return res.status(400).json({ ok: false, error: "The Word paper contains no readable question content." });
    if (Buffer.byteLength(renderedHtml, "utf8") > 8 * 1024 * 1024) return res.status(400).json({ ok: false, error: "The rendered paper is too large." });
    const stored = await uploadBuffer(req.file.buffer, req.file.originalname, DOCX);
    const latest = await ExamPaperVersion.findOne({ examId: exam._id }).sort({ version: -1 }).lean();
    const paper = await ExamPaperVersion.create({ examId: exam._id, version: Number(latest?.version || 0) + 1, sourceName: req.file.originalname, sourceUrl: stored.url, sourceMimeType: DOCX, sourceChecksum: crypto.createHash("sha256").update(req.file.buffer).digest("hex"), renderedHtml, renderedText: renderedHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(), mediaReferences: safeMedia(JSON.parse(req.body?.mediaReferences || "[]")), createdBy: req.user.id || req.user._id });
    exam.paperVersionId = paper._id; exam.paperVersion = paper.version; exam.updatedAt = new Date(); await exam.save();
    return res.status(201).json({ ok: true, paper: { id: paper._id, version: paper.version, sourceName: paper.sourceName, warnings: converted.messages?.length || 0 } });
  } catch (error) { return res.status(500).json({ ok: false, error: "Unable to prepare the Word exam paper." }); }
});

router.get("/:examId", requireAuth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found." });
    const manager = isExamManager(exam, req.user);
    if (!manager) {
      if (!isEnrolledStudent(exam, req.user) || !getExamAvailability(exam).allowed) return res.status(403).json({ ok: false, error: "Not authorized to view this paper." });
      const session = await ExamSession.findOne({ examId: exam._id, studentId: req.user.id || req.user._id, status: { $in: ["in_progress", "submitted", "graded"] } }).sort({ startTime: -1 }).lean();
      if (!session?.paperVersionId) return res.status(409).json({ ok: false, error: "Start the exam before opening the paper." });
      const paper = await ExamPaperVersion.findById(session.paperVersionId).lean();
      if (!paper) return res.status(404).json({ ok: false, error: "Paper version unavailable." });
      return res.json({ ok: true, paper: { version: paper.version, renderedHtml: paper.renderedHtml, mediaReferences: paper.mediaReferences || [] } });
    }
    const paper = exam.paperVersionId && await ExamPaperVersion.findById(exam.paperVersionId).lean();
    if (!paper) return res.status(404).json({ ok: false, error: "No Word paper has been attached." });
    return res.json({ ok: true, paper: { id: paper._id, version: paper.version, sourceName: paper.sourceName, sourceUrl: paper.sourceUrl, renderedHtml: paper.renderedHtml, mediaReferences: paper.mediaReferences || [], frozenAt: paper.frozenAt } });
  } catch (error) { return res.status(500).json({ ok: false, error: "Unable to retrieve the exam paper." }); }
});

router.get("sessions/:sessionId/review", requireRole(["teacher", "admin", "superadmin"]), async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.sessionId).populate("studentId", "name admissionNumber class stream");
    if (!session) return res.status(404).json({ ok: false, error: "Exam session not found." });
    const exam = await Exam.findById(session.examId);
    if (!exam || !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized to review this submission." });
    const paper = await ExamPaperVersion.findById(session.paperVersionId || exam.paperVersionId).lean();
    const workingFiles = await File.find({ examId: session.examId, sessionId: session._id }).select("originalName url questionId uploadedAt status reviewerNotes").lean();
    return res.json({ ok: true, paper: paper && { version: paper.version, sourceName: paper.sourceName, renderedHtml: paper.renderedHtml, mediaReferences: paper.mediaReferences || [] }, session, workingFiles });
  } catch (error) { return res.status(500).json({ ok: false, error: "Unable to load the submission review package." }); }
});

export default router;
