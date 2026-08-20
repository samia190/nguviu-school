import Exam from "../models/Exam.js";
import ExamQuestion from "../models/ExamQuestion.js";
import ExamSession from "../models/ExamSession.js";
import StudentExamResult from "../models/StudentExamResult.js";
import File from "../models/File.js";
import ExamPaperVersion from "../models/ExamPaperVersion.js";
import ProctoringLog from "../models/ProctoringLog.js";
import { broadcastMonitoringEvent } from "../services/realtimeMonitoring.js";
import { computeSessionExpiry, getExamAvailability, isAdminRole, isEnrolledStudent, isExamManager, isSessionActive, studentSafeExam, studentSafeQuestion } from "../utils/examAccess.js";

const getUserId = (req) => req.user?._id || req.user?.id;
const pageNumber = (value, fallback) => Math.max(1, Number.parseInt(value || fallback, 10) || fallback);

export async function secureGetAllExams(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Authentication required." });
    const page = pageNumber(req.query.page, 1);
    const limit = Math.min(50, pageNumber(req.query.limit, 10));
    const query = req.user.role === "student"
      ? { isActive: true, isPublished: true, enrolledStudents: userId }
      : req.user.role === "teacher"
        ? { createdBy: userId }
        : isAdminRole(req.user.role)
          ? {}
          : null;
    if (!query) return res.status(403).json({ ok: false, error: "Not authorized to view exams." });
    if (req.query.subject) query.subject = req.query.subject;

    const [exams, total] = await Promise.all([
      Exam.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("createdBy", "name email"),
      Exam.countDocuments(query),
    ]);
    return res.json({ ok: true, exams: req.user.role === "student" ? exams.map(studentSafeExam) : exams, total, page, limit });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch exams." });
  }
}

export async function secureGetExamById(req, res) {
  try {
    const exam = await Exam.findById(req.params.id).populate("createdBy", "name email");
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found." });
    const manager = isExamManager(exam, req.user);
    if (!manager) {
      if (!isEnrolledStudent(exam, req.user)) return res.status(403).json({ ok: false, error: "You are not enrolled in this exam." });
      const availability = getExamAvailability(exam);
      if (!availability.allowed) return res.status(403).json({ ok: false, error: availability.reason });
    }
    const questions = await ExamQuestion.find({ examId: exam._id }).sort({ questionNumber: 1 }).lean();
    return res.json({
      ok: true,
      exam: manager ? exam : studentSafeExam(exam),
      questions: manager ? questions.map((question) => ({ ...question, type: question.questionType || question.type })) : questions.map(studentSafeQuestion),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch exam." });
  }
}

export async function secureStartExamSession(req, res) {
  try {
    const studentId = getUserId(req);
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found." });
    if (!isEnrolledStudent(exam, req.user)) return res.status(403).json({ ok: false, error: "You are not enrolled in this exam." });
    const availability = getExamAvailability(exam);
    if (!availability.allowed) return res.status(403).json({ ok: false, error: availability.reason });
    const now = new Date();
    let paper = null;
    if (exam.paperVersionId) {
      paper = await ExamPaperVersion.findById(exam.paperVersionId);
      if (!paper) return res.status(409).json({ ok: false, error: "The assigned paper version is unavailable." });
      if (!paper.frozenAt) {
        const frozen = await ExamPaperVersion.findOneAndUpdate({ _id: paper._id, frozenAt: null }, { $set: { frozenAt: now } }, { new: true });
        paper = frozen || paper;
      }
    }

    const activeSession = await ExamSession.findOne({ examId: exam._id, studentId, status: "in_progress" }).sort({ startTime: -1 });
    if (activeSession && isSessionActive(activeSession, now)) return res.json({ ok: true, session: activeSession, resumed: true });
    if (activeSession) await ExamSession.updateOne({ _id: activeSession._id, status: "in_progress" }, { $set: { status: "expired", endTime: activeSession.expiresAt || now } });

    const attempts = await ExamSession.countDocuments({ examId: exam._id, studentId, status: { $in: ["submitted", "graded", "expired", "abandoned"] } });
    if (attempts >= Number(exam.maxAttempts || 1)) return res.status(409).json({ ok: false, error: "No assessment attempts remain." });

    const session = await ExamSession.create({
      examId: exam._id,
      studentId,
      startTime: now,
      expiresAt: computeSessionExpiry(exam, now),
      attemptNumber: attempts + 1,
      lastActivityAt: now,
      status: "in_progress",
      paperVersionId: paper?._id,
      paperChecksum: paper?.sourceChecksum,
      answers: [],
    });
    return res.status(201).json({ ok: true, session });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ ok: false, error: "An assessment session already exists. Refresh and continue it." });
    return res.status(500).json({ ok: false, error: "Unable to start exam session." });
  }
}

function normaliseAnswers(answers) {
  return Array.isArray(answers) ? answers : Object.entries(answers || {}).map(([questionId, answer]) => ({ questionId, answer }));
}

export async function secureAutosaveExamAnswers(req, res) {
  try {
    const studentId = getUserId(req);
    const session = await ExamSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found." });
    if (String(session.studentId) !== String(studentId)) return res.status(403).json({ ok: false, error: "Not authorized." });
    if (!isSessionActive(session)) return res.status(409).json({ ok: false, error: "This exam session has expired." });
    const questions = await ExamQuestion.find({ examId: session.examId }).select("_id").lean();
    const validQuestionIds = new Set(questions.map((question) => String(question._id)));
    const answers = normaliseAnswers(req.body?.answers);
    const seen = new Set();
    for (const answer of answers) {
      const questionId = String(answer.questionId || "");
      if (!validQuestionIds.has(questionId) || seen.has(questionId)) return res.status(400).json({ ok: false, error: "Autosave contains an invalid or duplicate question." });
      if (typeof answer.answer === "string" && answer.answer.length > 20_000) return res.status(400).json({ ok: false, error: "An answer exceeds the permitted length." });
      seen.add(questionId);
    }
    const expectedVersion = Number(req.body?.answerVersion);
    const versionPredicate = Number.isInteger(expectedVersion) && expectedVersion >= 0 ? { answerVersion: expectedVersion } : {};
    const now = new Date();
    const updated = await ExamSession.findOneAndUpdate(
      { _id: session._id, studentId, status: "in_progress", expiresAt: { $gt: now }, ...versionPredicate },
      {
        $set: {
          answers: answers.map((answer) => ({ questionId: answer.questionId, answer: answer.answer, submittedAt: now })),
          autoSavedAt: now,
          lastActivityAt: now,
        },
        $inc: { answerVersion: 1 },
      },
      { new: true }
    );
    if (!updated) return res.status(409).json({ ok: false, error: "Your saved answers are out of date. Refresh the session before continuing." });
    return res.json({ ok: true, answerVersion: updated.answerVersion, expiresAt: updated.expiresAt, autoSavedAt: updated.autoSavedAt });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to autosave answers." });
  }
}

export async function secureSubmitExam(req, res) {
  try {
    const studentId = getUserId(req);
    const session = await ExamSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found." });
    if (String(session.studentId) !== String(studentId)) return res.status(403).json({ ok: false, error: "Not authorized." });
    if (["submitted", "graded"].includes(session.status)) {
      return res.json({ ok: true, result: await StudentExamResult.findOne({ sessionId: session._id }), alreadySubmitted: true });
    }
    if (!isSessionActive(session)) {
      await ExamSession.updateOne({ _id: session._id, status: "in_progress" }, { $set: { status: "expired", endTime: session.expiresAt || new Date() } });
      return res.status(409).json({ ok: false, error: "This exam session has expired." });
    }

    const exam = await Exam.findById(session.examId);
    const questions = await ExamQuestion.find({ examId: session.examId }).lean();
    const questionById = new Map(questions.map((question) => [String(question._id), question]));
    const normalized = normaliseAnswers(req.body?.answers);
    const answerIds = new Set();
    for (const answer of normalized) {
      const id = String(answer.questionId || "");
      if (!questionById.has(id) || answerIds.has(id)) return res.status(400).json({ ok: false, error: "Answers contain an invalid or duplicate question." });
      answerIds.add(id);
    }

    const submittedAt = new Date();
    const trustedFiles = await File.find({ examId: session.examId, sessionId: session._id }).lean();
    const updatedSession = await ExamSession.findOneAndUpdate(
      { _id: session._id, studentId, status: "in_progress", expiresAt: { $gt: submittedAt } },
      {
        $set: {
          answers: normalized.map((answer) => ({ questionId: answer.questionId, answer: answer.answer, submittedAt })),
          submittedFiles: trustedFiles.map((file) => ({ questionId: file.questionId || null, fileName: file.originalName, fileUrl: file.url, uploadedAt: file.uploadedAt })),
          status: "submitted",
          endTime: submittedAt,
          submissionKey: req.get("Idempotency-Key") || `submission-${session._id}`,
        },
        $inc: { answerVersion: 1 },
      },
      { new: true }
    );
    if (!updatedSession) return res.status(409).json({ ok: false, error: "The session has already been finalised or expired." });

    let score = 0;
    for (const answer of normalized) {
      const question = questionById.get(String(answer.questionId));
      if ((question.questionType || question.type) === "mcq") {
        const correct = question.options?.find((option) => option.isCorrect);
        if (correct && answer.answer === correct.text) score += Number(question.marks || 0);
      }
    }
    const percentage = exam.totalMarks ? (score / Number(exam.totalMarks)) * 100 : 0;
    const result = await StudentExamResult.findOneAndUpdate(
      { sessionId: updatedSession._id },
      {
        $set: {
          studentId: updatedSession.studentId,
          examId: updatedSession.examId,
          score,
          totalMarks: exam.totalMarks,
          percentage,
          passed: percentage >= Number(exam.passThreshold),
          grade: percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : "F",
          attemptNumber: updatedSession.attemptNumber,
          gradedAt: submittedAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to submit exam." });
  }
}

export async function secureGetExamResults(req, res) {
  try {
    const studentId = req.params.studentId;
    let query = { studentId };
    if (req.user.role === "student" && String(getUserId(req)) !== String(studentId)) return res.status(403).json({ ok: false, error: "Not authorized." });
    if (req.user.role === "teacher") {
      const owned = await Exam.find({ createdBy: getUserId(req) }).select("_id").lean();
      query.examId = { $in: owned.map((exam) => exam._id) };
    } else if (!isAdminRole(req.user.role) && req.user.role !== "student") {
      return res.status(403).json({ ok: false, error: "Not authorized." });
    }
    const limit = Math.min(50, pageNumber(req.query.limit, 10));
    const results = await StudentExamResult.find(query).populate("examId", "title subject totalMarks").sort({ gradedAt: -1 }).limit(limit);
    return res.json({ ok: true, results });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch exam results." });
  }
}

const browserEventSeverity = {
  window_blur: "warning",
  window_focus: "info",
  copy_paste: "warning",
  right_click: "warning",
  page_visibility: "warning",
  tab_switch: "warning",
  screenshot_detected: "warning",
  suspicious_movement: "warning",
  multiple_faces: "critical",
  no_face: "warning",
  auto_save: "info",
  answer_submitted: "info",
  activity_update: "info",
  camera_started: "info",
  camera_stopped: "warning",
  question_viewed: "info",
  question_answered: "info",
  fullscreen_enter: "info",
  fullscreen_exit: "warning",
  refresh_or_close: "warning",
  file_uploaded: "info",
  print_attempt: "warning",
};

function safeEventDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  const permitted = {};
  for (const key of ["hidden", "action", "questionId", "questionIndex", "fileCount", "source", "cameraEnabled", "cameraStatus"]) {
    if (typeof details[key] === "string" || typeof details[key] === "number" || typeof details[key] === "boolean") permitted[key] = details[key];
  }
  return permitted;
}

export async function secureLogProctoringEvent(req, res) {
  try {
    const session = await ExamSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found." });
    if (String(session.studentId) !== String(getUserId(req))) return res.status(403).json({ ok: false, error: "Not authorized." });
    if (!isSessionActive(session)) return res.status(409).json({ ok: false, error: "The exam session is not active." });
    const eventType = req.body?.eventType;
    if (!browserEventSeverity[eventType]) return res.status(400).json({ ok: false, error: "Unsupported proctoring event." });
    const log = await ProctoringLog.create({
      sessionId: session._id,
      studentId: session.studentId,
      examId: session.examId,
      eventType,
      severity: browserEventSeverity[eventType],
      description: `Browser telemetry: ${eventType}`,
      details: safeEventDetails(req.body),
    });
    await broadcastMonitoringEvent({ examId: session.examId, sessionId: session._id, eventType, severity: log.severity, description: log.description, details: log.details, log });
    return res.status(201).json({ ok: true, log: { id: log._id, eventType: log.eventType, severity: log.severity, timestamp: log.timestamp } });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to record proctoring telemetry." });
  }
}

export async function secureGetActiveExamSessions(req, res) {
  try {
    const examId = req.query.examId;
    if (!examId) return res.status(400).json({ ok: false, error: "Exam identifier is required." });
    const exam = await Exam.findById(examId);
    if (!exam || !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized to monitor this exam." });
    const sessions = await ExamSession.find({ examId, status: "in_progress" }).populate("studentId", "name email admissionNumber class stream").lean();
    const ids = sessions.map((session) => session._id);
    const logs = await ProctoringLog.find({ sessionId: { $in: ids } }).sort({ timestamp: -1 }).lean();
    const bySession = new Map();
    for (const log of logs) {
      const key = String(log.sessionId);
      const current = bySession.get(key) || [];
      if (current.length < 5) current.push({ _id: log._id, eventType: log.eventType, severity: log.severity, description: log.description, timestamp: log.timestamp, acknowledged: log.acknowledged });
      bySession.set(key, current);
    }
    return res.json({ ok: true, sessions: sessions.map((session) => ({ ...session, recentEvents: bySession.get(String(session._id)) || [] })) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch monitored sessions." });
  }
}

export async function secureGetProctoringAlerts(req, res) {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam || !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized to view alerts." });
    const alerts = await ProctoringLog.find({ examId: exam._id, severity: { $in: ["warning", "critical"] } }).sort({ timestamp: -1 }).limit(100).populate("studentId", "name admissionNumber").lean();
    return res.json({ ok: true, alerts });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch alerts." });
  }
}

export async function secureAcknowledgeAlert(req, res) {
  try {
    const alert = await ProctoringLog.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ ok: false, error: "Alert not found." });
    const exam = await Exam.findById(alert.examId);
    if (!exam || !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized to acknowledge this alert." });
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = getUserId(req);
    await alert.save();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to acknowledge alert." });
  }
}

export async function secureGetExamSessionDetails(req, res) {
  try {
    const session = await ExamSession.findById(req.params.sessionId).populate("studentId", "name admissionNumber class stream");
    if (!session) return res.status(404).json({ ok: false, error: "Session not found." });
    const exam = await Exam.findById(session.examId);
    if (req.user.role === "student" && String(session.studentId?._id || session.studentId) !== String(getUserId(req))) return res.status(403).json({ ok: false, error: "Not authorized." });
    if (req.user.role !== "student" && !isExamManager(exam, req.user)) return res.status(403).json({ ok: false, error: "Not authorized." });
    return res.json({ ok: true, session });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Unable to fetch session details." });
  }
}
