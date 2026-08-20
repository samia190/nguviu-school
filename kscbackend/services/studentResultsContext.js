import Result from "../models/Result.js";
import User from "../models/User.js";
import Homework from "../models/Homework.js";
import { performCompleteAnalysis } from "../utils/performanceAnalysis.js";

function studentDisplayName(student) {
  return student.name || student.fullName || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
}

function safeSubject(subject) {
  return {
    subjectName: subject.subjectName || subject.name || "Subject",
    marks: Number(subject.marks ?? subject.score ?? 0),
    grade: subject.grade || null,
  };
}

function safeResult(result) {
  return {
    id: result._id,
    term: result.term,
    year: result.year,
    examType: result.examType,
    curriculum: result.curriculum,
    overallGrade: result.overallGrade || result.grades?.grade || null,
    averageMarks: Number(result.averageMarks ?? result.grades?.average ?? 0),
    subjects: Array.isArray(result.subjects) ? result.subjects.map(safeSubject) : [],
    attendance: result.attendance ? {
      daysPresent: Number(result.attendance.daysPresent ?? 0),
      daysAbsent: Number(result.attendance.daysAbsent ?? 0),
      totalDays: Number(result.attendance.totalDays ?? 0),
    } : null,
  };
}

/**
 * Produces student-owned, published-only data for results pages and AI support.
 * This function intentionally never returns DOB, staff comments, class ranking,
 * another student's records, or unpublished results.
 */
export async function getStudentPublishedResultsContext(userId) {
  const student = await User.findById(userId).select("name fullName firstName lastName admissionNumber class stream role").lean();
  if (!student || student.role !== "student") {
    const error = new Error("Student profile not found");
    error.status = 404;
    throw error;
  }

  const resultQuery = student.admissionNumber
    ? { admissionNumber: student.admissionNumber, published: true }
    : { studentId: student._id, published: true };
  const results = await Result.find(resultQuery).sort({ year: -1, term: -1 }).lean();
  const latest = results[0] || null;
  const analysis = latest
    ? await performCompleteAnalysis(String(student._id), latest, [...results].reverse())
    : null;
  const prioritySubjects = latest?.subjects
    ? latest.subjects.filter((subject) => Number(subject.marks ?? subject.score ?? 0) < 60).sort((left, right) => Number(left.marks ?? 0) - Number(right.marks ?? 0)).slice(0, 3).map((subject) => subject.subjectName || subject.name).filter(Boolean)
    : [];
  const materials = prioritySubjects.length
    ? await Homework.find({
      status: "published",
      subject: { $in: prioritySubjects },
      visibility: { $in: ["whole-school", "revision-library", "my-class", "selected-classes", "selected-stream"] },
      $or: [
        { visibility: { $in: ["whole-school", "revision-library"] } },
        { class: student.class },
        { allowedClasses: student.class },
        ...(student.stream ? [{ stream: student.stream }, { allowedStreams: student.stream }] : []),
      ],
    }).sort({ createdAt: -1 }).limit(12).lean()
    : [];

  return {
    student: {
      name: studentDisplayName(student),
      admissionNumber: student.admissionNumber || "",
      class: student.class || "",
      stream: student.stream || "",
    },
    latestResult: latest ? safeResult(latest) : null,
    results: results.map(safeResult),
    analysis,
    materials: materials.map((resource) => ({
      id: resource._id,
      title: resource.title,
      subject: resource.subject,
      topic: resource.topic || "",
      resourceType: resource.resourceType || resource.contentType || "notes",
      description: resource.description || "",
      attachments: (resource.attachments || []).map((attachment) => ({ originalName: attachment.originalName, url: attachment.url, mimetype: attachment.mimetype })),
    })),
  };
}

/** A compact, non-diagnostic context suitable for a server-side student-support AI prompt. */
export function buildStudentSupportContext(context) {
  if (!context.latestResult) return "No published academic results are currently available for this student.";
  const latest = context.latestResult;
  const subjects = latest.subjects.map((subject) => `${subject.subjectName}: ${subject.marks}${subject.grade ? ` (${subject.grade})` : ""}`).join(", ");
  const weak = context.analysis?.consistentlyWeakSubjects?.slice(0, 3).join(", ") || "none identified";
  const strong = context.analysis?.consistentlyStrongSubjects?.slice(0, 3).join(", ") || "none identified";
  const prioritySubjects = latest.subjects.filter((subject) => subject.marks < 60).sort((left, right) => left.marks - right.marks).slice(0, 3).map((subject) => subject.subjectName);
  const revisionPlan = prioritySubjects.length
    ? prioritySubjects.map((subject, index) => `Priority ${index + 1}: ${subject}. Schedule three focused 35-minute sessions each week: recall key ideas, work one guided example, then answer practice questions and correct mistakes.`).join(" ")
    : "Maintain strengths with spaced revision, mixed practice, and weekly self-quizzes.";
  const materials = (context.materials || []).slice(0, 8).map((item) => `${item.subject}: ${item.title}${item.topic ? ` (${item.topic})` : ""}`).join("; ");
  return [
    `The signed-in student's latest published result is ${latest.term || "current term"} ${latest.year || ""}.`,
    `Average: ${latest.averageMarks}%. Overall grade: ${latest.overallGrade || "not recorded"}.`,
    `Subject results: ${subjects || "not recorded"}.`,
    `Observed trend: ${context.analysis?.historicalAnalysis?.overallTrend || "insufficient history"}.`,
    `Potential study priorities: ${weak}. Strengths: ${strong}.`,
    `Suggested revision routine: ${revisionPlan}`,
    `Approved school revision materials available to this student: ${materials || "none currently matched; advise the student to ask their teacher for an approved resource."}`,
    "Use this only to provide encouraging, educational study support. Explain topics step by step in student-friendly language, offer worked examples and practice questions, and suggest approved school notes or teacher materials where available. Do not diagnose health or wellbeing, invent external resource links, predict outcomes as certain, make disciplinary decisions, or reveal data about other students.",
  ].join("\n");
}
