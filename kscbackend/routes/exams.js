// routes/exams.js (ESM)
import express from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  enrollStudentInExam,
  startExamSession,
  submitExam,
  getAllExamResults,
  getExamResults,
  getActiveExamSessions,
  getTeacherMonitoringSessions,
  updateSessionActivity,
  addQuestionToExam,
  getExamWorkingFiles,
  logProctoringEvent,
  getSessionDetails,
  getExamAlerts,
  acknowledgeAlert,
} from "../controllers/examController.js";

const router = express.Router();

const requireAuthIfOnlyMine = (req, res, next) => {
  if (req.query.onlyMine === "true") {
    return requireAuth(req, res, next);
  }
  return next();
};

// Public exam list
router.get("/", requireAuthIfOnlyMine, getAllExams);
router.get("/mine", requireAuth, (req, res) => {
  req.query.onlyMine = "true";
  return getAllExams(req, res);
});

// Teacher/Admin create/update/delete
router.post("/", requireRole(["teacher", "admin"]), createExam);
router.put("/:id", requireRole(["teacher", "admin"]), updateExam);
router.delete("/:id", requireRole(["teacher", "admin"]), deleteExam);
router.post("/:examId/questions", requireRole(["teacher", "admin"]), addQuestionToExam);
router.get("/:id/working-files", requireRole(["teacher", "admin"]), getExamWorkingFiles);

// Admin result routes
router.get("/results", requireRole(["admin", "superadmin"]), getAllExamResults);
router.get("/results/:studentId", requireRole(["student", "teacher", "admin"]), getExamResults);

// Proctoring and student session routes
router.get("/sessions/active", requireRole(["admin", "teacher", "superadmin"]), getActiveExamSessions);
router.get("/sessions/monitoring", requireRole(["teacher", "admin", "superadmin"]), getTeacherMonitoringSessions);
router.post("/session/:sessionId/activity", requireRole(["student"]), updateSessionActivity);
router.get("/session/:sessionId", requireRole(["student", "teacher", "admin"]), getSessionDetails);
router.post("/:sessionId/proctoring-log", requireRole(["student", "teacher", "admin"]), logProctoringEvent);

// Alert routes for live invigilation
router.get("/:examId/alerts", requireRole(["teacher", "admin", "superadmin"]), getExamAlerts);
router.post("/alerts/:alertId/acknowledge", requireRole(["teacher", "admin", "superadmin"]), acknowledgeAlert);

// Student exam actions
router.post("/:examId/enroll", requireRole(["student"]), enrollStudentInExam);
router.post("/:examId/start", requireRole(["student"]), startExamSession);
router.post("/:sessionId/submit", requireRole(["student"]), submitExam);

// Exam details by ID must come last so more specific routes are matched first
router.get("/:id", getExamById);

export default router;

