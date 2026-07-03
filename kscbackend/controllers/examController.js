// controllers/examController.js (ESM)
import Exam from "../models/Exam.js";
import ExamQuestion from "../models/ExamQuestion.js";
import ExamSession from "../models/ExamSession.js";
import StudentExamResult from "../models/StudentExamResult.js";
import ProctoringLog from "../models/ProctoringLog.js";
import File from "../models/File.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { broadcastMonitoringEvent } from "../services/realtimeMonitoring.js";
import { classifyEventSeverity } from "../utils/proctoringEvents.js";

// Create a new exam
export const createExam = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      pdfUrl,
      attachments,
      duration,
      totalMarks,
      passThreshold,
      proctoringLevel,
      trustScoreThreshold,
      allowedMaterials,
      scheduledStart,
      scheduledEnd,
      instructions,
    } = req.body;

    const exam = new Exam({
      title,
      subject,
      description,
      pdfUrl,
      attachments: Array.isArray(attachments) ? attachments : [],
      duration,
      totalMarks,
      passThreshold,
      proctoringLevel,
      trustScoreThreshold,
      allowedMaterials,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      instructions,
      createdBy: req.user._id,
    });

    await exam.save();
    res.status(201).json({ ok: true, exam });
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get all exams (with pagination)
export const getAllExams = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, onlyMine } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (subject) query.subject = subject;
    if (onlyMine === "true") {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        return res.status(401).json({ ok: false, error: "Authentication required to view your exams." });
      }
      query.createdBy = userId;
    }

    const exams = await Exam.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const total = await Exam.countDocuments(query);

    res.json({ ok: true, exams, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get exam by ID with questions
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id).populate("createdBy", "name email");
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    const questions = await ExamQuestion.find({ examId: id }).sort({ questionNumber: 1 }).lean();
    const normalizedQuestions = questions.map((question) => ({
      ...question,
      type: question.questionType || question.type,
    }));

    res.json({ ok: true, exam, questions: normalizedQuestions });
  } catch (error) {
    console.error("Error fetching exam:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.attachments && !Array.isArray(updates.attachments)) {
      updates.attachments = [];
    }

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    // Only creator can update
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized to update this exam" });
    }

    Object.assign(exam, updates);
    await exam.save();

    res.json({ ok: true, exam });
  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized to delete this exam" });
    }

    // Delete related data
    await ExamQuestion.deleteMany({ examId: id });
    await ExamSession.deleteMany({ examId: id });
    await StudentExamResult.deleteMany({ examId: id });
    await ProctoringLog.deleteMany({ examId: id });
    await Exam.findByIdAndDelete(id);

    res.json({ ok: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Enroll student in exam
export const enrollStudentInExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    if (exam.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ ok: false, error: "Already enrolled in this exam" });
    }

    exam.enrolledStudents.push(studentId);
    await exam.save();

    res.json({ ok: true, message: "Enrolled successfully", exam });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Start exam session
export const startExamSession = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    if (!exam.enrolledStudents.includes(studentId)) {
      return res.status(403).json({ ok: false, error: "Not enrolled in this exam" });
    }

    // Check if already in progress
    const existingSession = await ExamSession.findOne({
      examId,
      studentId,
      status: "in_progress",
    });

    if (existingSession) {
      return res.json({ ok: true, session: existingSession });
    }

    const session = new ExamSession({
      examId,
      studentId,
      startTime: new Date(),
      status: "in_progress",
      answers: [],
    });

    await session.save();

    res.status(201).json({ ok: true, session });
  } catch (error) {
    console.error("Error starting exam session:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Submit exam (save answers)
export const submitExam = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, files } = req.body;

    const session = await ExamSession.findById(sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

    if (session.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    const normalizedAnswers = Array.isArray(answers)
      ? answers
      : Object.entries(answers || {}).map(([questionId, answer]) => ({ questionId, answer }));

    session.answers = normalizedAnswers;

    // Accept submitted files metadata (from /api/files upload response)
    if (Array.isArray(files) && files.length > 0) {
      session.submittedFiles = files.map((f) => ({
        questionId: f.questionId || null,
        fileName: f.originalName || f.filename || f.fileName || "",
        fileUrl: f.url || f.downloadUrl || f.path || f.fileUrl || "",
        uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : new Date(),
      }));
    }
    session.endTime = new Date();
    session.status = "submitted";
    await session.save();

    // Create result record
    let result = await StudentExamResult.findOne({ sessionId });
    if (!result) {
      result = new StudentExamResult({
        sessionId,
        studentId: session.studentId,
        examId: session.examId,
      });
    }

    // Calculate score (simplified - replace with actual grading logic)
    let score = 0;
    for (const answer of normalizedAnswers) {
      const question = await ExamQuestion.findById(answer.questionId);
      if (question) {
        // For MCQ, check if answer is correct
        if ((question.questionType || question.type) === "mcq" && question.options) {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          if (correctOption && answer.answer === correctOption.text) {
            score += question.marks || 0;
          }
        }
      }
    }

    const exam = await Exam.findById(session.examId);
    result.score = score;
    result.totalMarks = exam.totalMarks;
    result.percentage = (score / exam.totalMarks) * 100;
    result.passed = result.percentage >= exam.passThreshold;
    result.grade = result.percentage >= 90 ? "A" : result.percentage >= 80 ? "B" : result.percentage >= 70 ? "C" : "F";

    await result.save();

    res.json({ ok: true, result });
  } catch (error) {
    console.error("Error submitting exam:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getExamWorkingFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Not authorized to view this exam's working files" });
    }

    const files = await File.find({ examId: id })
      .populate("questionId", "questionText")
      .populate({
        path: "sessionId",
        populate: { path: "studentId", select: "name email" },
      })
      .sort({ uploadedAt: -1 });

    const normalizedFiles = files.map((file) => {
      const fileObj = file.toObject({ getters: true, virtuals: false });
      const student = fileObj.sessionId?.studentId;
      const studentName = student?.name || fileObj.studentEmail || "Unknown student";
      const studentEmail = student?.email || fileObj.studentEmail || "";
      const questionText = fileObj.questionId?.questionText || "General attachment";
      const downloadUrl = fileObj.url && fileObj.url.startsWith("http")
        ? fileObj.url
        : `${req.protocol}://${req.get("host")}${fileObj.url?.startsWith("/") ? "" : "/"}${fileObj.url || ""}`;

      return {
        ...fileObj,
        studentName,
        studentEmail,
        questionText,
        sessionId: fileObj.sessionId?._id || null,
        downloadUrl,
      };
    });

    res.json({ ok: true, files: normalizedFiles });
  } catch (error) {
    console.error("Error fetching exam working files:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getActiveExamSessions = async (req, res) => {
  try {
    const sessions = await ExamSession.find({ status: "in_progress" })
      .populate("examId", "title duration totalMarks")
      .populate("studentId", "name email");

    res.json({ ok: true, sessions });
  } catch (error) {
    console.error("Error fetching active exam sessions:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getMyExams = async (req, res) => {
  try {
    req.query.onlyMine = "true";
    return getAllExams(req, res);
  } catch (error) {
    console.error("Error fetching teacher exams:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getTeacherMonitoringSessions = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { examId } = req.query;
    
    let examIds;
    if (examId) {
      // Filter by specific exam if provided
      examIds = [examId];
    } else {
      // Get all exams created by teacher
      const teacherExams = await Exam.find({ createdBy: teacherId }).select("_id");
      examIds = teacherExams.map((exam) => exam._id);
    }

    const sessions = await ExamSession.find({
      examId: { $in: examIds },
      status: { $in: ["in_progress", "submitted"] },
    })
      .populate("examId", "title duration totalMarks")
      .populate("studentId", "name email admissionNumber")
      .sort({ lastActivityAt: -1, startTime: -1 });

    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const logs = await ProctoringLog.find({ sessionId: session._id }).sort({ timestamp: -1 }).limit(5);
        const now = new Date();
        const lastActivity = session.lastActivityAt ? new Date(session.lastActivityAt) : session.startTime ? new Date(session.startTime) : null;
        const idleMs = lastActivity ? now.getTime() - lastActivity.getTime() : Number.POSITIVE_INFINITY;
        const examDurationMinutes = session.examId?.duration || 0;
        const durationSeconds = Math.max(0, examDurationMinutes * 60);
        const sessionStart = session.startTime ? new Date(session.startTime) : null;
        const elapsedSeconds = sessionStart ? Math.max(0, Math.floor((now.getTime() - sessionStart.getTime()) / 1000)) : 0;
        const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

        let monitoringStatus = "Active";
        let connectionStatus = "Connected";

        if (session.status === "submitted") {
          monitoringStatus = "Submitted";
          connectionStatus = "Submitted";
        } else if (idleMs > 90 * 1000) {
          monitoringStatus = "Disconnected";
          connectionStatus = "Disconnected";
        }

        return {
          ...session.toObject(),
          monitoringStatus,
          connectionStatus,
          remainingSeconds,
          recentEvents: logs,
        };
      })
    );

    res.json({ ok: true, sessions: enriched });
  } catch (error) {
    console.error("Error fetching teacher monitoring sessions:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateSessionActivity = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentQuestionIndex, currentQuestionId, currentAnswerPreview, eventType, source, cameraEnabled, cameraStatus, description } = req.body;

    const session = await ExamSession.findById(sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

    if (session.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    if (typeof currentQuestionIndex === "number") session.currentQuestionIndex = currentQuestionIndex;
    if (currentQuestionId) session.currentQuestionId = currentQuestionId;
    if (typeof currentAnswerPreview === "string") session.currentAnswerPreview = currentAnswerPreview;
    if (typeof cameraEnabled === "boolean") session.cameraEnabled = cameraEnabled;
    if (cameraStatus) session.cameraStatus = cameraStatus;
    session.lastActivityAt = new Date();
    session.lastActivitySource = source || "exam";
    await session.save();

    if (eventType) {
      const severity = classifyEventSeverity(eventType, "info");
      const log = await ProctoringLog.create({
        sessionId,
        studentId: session.studentId,
        examId: session.examId,
        eventType,
        severity,
        description: description || source || "Student activity update",
        details: {
          source,
          currentQuestionIndex,
          cameraEnabled,
          cameraStatus,
        },
        timestamp: new Date(),
      });

      await broadcastMonitoringEvent({
        examId: session.examId,
        sessionId,
        eventType,
        severity,
        description: log.description,
        details: log.details,
        log,
      });
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error("Error updating session activity:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getAllExamResults = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const results = await StudentExamResult.find()
      .populate("examId", "title subject totalMarks")
      .populate("studentId", "name email")
      .sort({ gradedAt: -1 })
      .limit(parseInt(limit));

    res.json({ ok: true, results });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get exam results for a specific student
export const getExamResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = req.query.limit || 10;

    const results = await StudentExamResult.find({ studentId })
      .populate("examId", "title subject totalMarks")
      .populate("studentId", "name email")
      .sort({ gradedAt: -1 })
      .limit(parseInt(limit));

    res.json({ ok: true, results });
  } catch (error) {
    console.error("Error fetching student exam results:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Add question to exam
export const addQuestionToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionText, type, questionType, options, marks, difficulty, requireWorking } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ ok: false, error: "Exam not found" });

    // Only creator can add questions
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized to add questions to this exam" });
    }

    const questionNumber = (await ExamQuestion.countDocuments({ examId })) + 1;

    const question = new ExamQuestion({
      examId,
      questionNumber,
      questionText,
      type: questionType || type,
      options,
      marks,
      difficulty,
      requireWorking: !!requireWorking,
    });

    await question.save();
    const savedQuestion = question.toObject();
    savedQuestion.type = savedQuestion.type;

    res.status(201).json({ ok: true, question: savedQuestion });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Log proctoring event
export const logProctoringEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, severity, description, details } = req.body;

    const session = await ExamSession.findById(sessionId);
    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

    const normalizedSeverity = severity || classifyEventSeverity(eventType, "info");
    const log = new ProctoringLog({
      sessionId,
      studentId: session.studentId,
      examId: session.examId,
      eventType,
      severity: normalizedSeverity,
      description,
      details,
      timestamp: new Date(),
    });

    await log.save();

    await broadcastMonitoringEvent({
      examId: session.examId,
      sessionId,
      eventType,
      severity: normalizedSeverity,
      description: log.description,
      log,
    });

    // Update session trust score if critical event
    if (normalizedSeverity === "critical") {
      session.trustScore = (session.trustScore || 100) - 10;
      await session.save();
    }

    res.status(201).json({ ok: true, log });
  } catch (error) {
    console.error("Error logging proctoring event:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get session details
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId)
      .populate("examId", "title duration totalMarks")
      .populate("studentId", "name email");

    if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

    const logs = await ProctoringLog.find({ sessionId });

    res.json({ ok: true, session, proctoringLogs: logs });
  } catch (error) {
    console.error("Error fetching session details:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get alerts for an exam
export const getExamAlerts = async (req, res) => {
  try {
    const { examId } = req.params;
    const limit = req.query.limit || 50;

    // Get all exam sessions for this exam
    const sessions = await ExamSession.find({ examId });
    const sessionIds = sessions.map((s) => s._id);

    // Get all proctoring logs for these sessions, filtering by severity
    const alerts = await ProctoringLog.find({
      sessionId: { $in: sessionIds },
      severity: { $in: ["warning", "critical"] },
    })
      .populate("studentId", "name email")
      .populate("sessionId", "_id currentQuestionIndex")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ ok: true, alerts });
  } catch (error) {
    console.error("Error fetching exam alerts:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Acknowledge an alert
export const acknowledgeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const log = await ProctoringLog.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user._id,
      },
      { new: true }
    );

    if (!log) return res.status(404).json({ ok: false, error: "Alert not found" });

    res.json({ ok: true, alert: log });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
