// routes/exams.js (ESM)
import express from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { examMutationLimiter } from "../middleware/rateLimiter.js";
import {
  createExam,
  updateExam,
  deleteExam,
  enrollStudentInExam,
  getAllExamResults,
  getActiveExamSessions,
  updateSessionActivity,
  addQuestionToExam,
  getExamWorkingFiles,
} from "../controllers/examController.js";
import {
  secureGetAllExams as getAllExams,
  secureGetExamById as getExamById,
  secureGetExamResults as getExamResults,
  secureAutosaveExamAnswers,
  secureStartExamSession as startExamSession,
  secureSubmitExam as submitExam,
  secureGetActiveExamSessions as getTeacherMonitoringSessions,
  secureGetExamSessionDetails as getSessionDetails,
  secureLogProctoringEvent as logProctoringEvent,
  secureGetProctoringAlerts as getExamAlerts,
  secureAcknowledgeAlert as acknowledgeAlert,
} from "../controllers/productionExamController.js";

const router = express.Router();

const requireAuthIfOnlyMine = (req, res, next) => {
  if (req.query.onlyMine === "true") {
    return requireAuth(req, res, next);
  }
  return next();
};

// Exam content is sensitive. All listings and details require a role-aware user.
router.get("/", requireAuth, getAllExams);
router.get("/mine", requireAuth, (req, res) => {
  req.query.onlyMine = "true";
  return getAllExams(req, res);
});

// Teacher/Admin create/update/delete
router.post("/", requireRole(["teacher", "admin"]), examMutationLimiter, createExam);
router.put("/:id", requireRole(["teacher", "admin"]), examMutationLimiter, updateExam);
router.delete("/:id", requireRole(["teacher", "admin"]), examMutationLimiter, deleteExam);
router.post("/:examId/questions", requireRole(["teacher", "admin"]), examMutationLimiter, addQuestionToExam);
router.get("/:id/working-files", requireRole(["teacher", "admin"]), getExamWorkingFiles);

// Admin result routes
router.get("/results", requireRole(["admin", "superadmin"]), getAllExamResults);
router.get("/results/:studentId", requireRole(["student", "teacher", "admin", "superadmin"]), getExamResults);

// Proctoring and student session routes
router.get("/sessions/active", requireRole(["admin", "teacher", "superadmin"]), getActiveExamSessions);
router.get("/sessions/monitoring", requireRole(["teacher", "admin", "superadmin"]), getTeacherMonitoringSessions);
router.post("/session/:sessionId/activity", requireRole(["student"]), updateSessionActivity);
router.get("/session/:sessionId", requireRole(["student", "teacher", "admin"]), getSessionDetails);
router.post("/:sessionId/proctoring-log", requireRole(["student"]), examMutationLimiter, logProctoringEvent);

// Alert routes for live invigilation
router.get("/:examId/alerts", requireRole(["teacher", "admin", "superadmin"]), getExamAlerts);
router.post("/alerts/:alertId/acknowledge", requireRole(["teacher", "admin", "superadmin"]), acknowledgeAlert);

// Student exam actions
router.post("/:examId/enroll", requireRole(["student"]), examMutationLimiter, enrollStudentInExam);
router.post("/:examId/start", requireRole(["student"]), examMutationLimiter, startExamSession);
router.put("/session/:sessionId/answers", requireRole(["student"]), examMutationLimiter, secureAutosaveExamAnswers);
router.post("/:sessionId/submit", requireRole(["student"]), examMutationLimiter, submitExam);

// Exam details by ID must come last so more specific routes are matched first
router.get("/:id", requireAuth, getExamById);

export default router;

