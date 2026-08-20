import Exam from "../models/Exam.js";
import ExamSession from "../models/ExamSession.js";
import { isExamManager, isSessionActive, sameId } from "../utils/examAccess.js";

/** Validates a Socket.IO/HTTP invigilation request against a real exam session. */
export async function authorizeInvigilationSession(sessionId, user, { requireActiveForStudent = true } = {}) {
  const session = await ExamSession.findById(sessionId);
  if (!session) {
    const error = new Error("Exam session not found.");
    error.status = 404;
    throw error;
  }
  const exam = await Exam.findById(session.examId);
  if (!exam) {
    const error = new Error("Exam not found.");
    error.status = 404;
    throw error;
  }

  if (user?.role === "student") {
    if (!sameId(session.studentId, user.id || user._id)) {
      const error = new Error("Students may access only their own exam session.");
      error.status = 403;
      throw error;
    }
    if (requireActiveForStudent && !isSessionActive(session)) {
      const error = new Error("The exam session is not active.");
      error.status = 409;
      throw error;
    }
    return { session, exam, memberRole: "student" };
  }

  if (!isExamManager(exam, user)) {
    const error = new Error("Only the assigned exam teacher or an administrator may monitor this session.");
    error.status = 403;
    throw error;
  }
  return { session, exam, memberRole: "staff" };
}
