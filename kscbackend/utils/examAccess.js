export const isAdminRole = (role) => ["admin", "superadmin"].includes(role);
export const isExamStaffRole = (role) => ["teacher", "admin", "superadmin"].includes(role);

export const sameId = (left, right) => Boolean(left && right && String(left) === String(right));

export function isExamManager(exam, user) {
  return Boolean(user && exam && (isAdminRole(user.role) || sameId(exam.createdBy, user.id || user._id)));
}

export function isEnrolledStudent(exam, user) {
  return Boolean(user?.role === "student" && exam?.enrolledStudents?.some((id) => sameId(id, user.id || user._id)));
}

export function getExamAvailability(exam, now = new Date()) {
  if (!exam?.isActive || !exam?.isPublished) return { allowed: false, reason: "This exam is not available." };
  if (exam.scheduledStart && now < new Date(exam.scheduledStart)) return { allowed: false, reason: "This exam has not opened yet." };
  if (exam.scheduledEnd && now >= new Date(exam.scheduledEnd)) return { allowed: false, reason: "This exam window has closed." };
  return { allowed: true };
}

export function computeSessionExpiry(exam, startedAt = new Date()) {
  const durationExpiry = new Date(new Date(startedAt).getTime() + Number(exam.duration || 0) * 60_000);
  if (!exam.scheduledEnd) return durationExpiry;
  const scheduledEnd = new Date(exam.scheduledEnd);
  return scheduledEnd < durationExpiry ? scheduledEnd : durationExpiry;
}

export function isSessionActive(session, now = new Date()) {
  return Boolean(session?.status === "in_progress" && (!session.expiresAt || new Date(session.expiresAt) > now));
}

export function studentSafeExam(exam) {
  const plain = exam.toObject ? exam.toObject() : exam;
  return {
    _id: plain._id,
    title: plain.title,
    subject: plain.subject,
    description: plain.description,
    duration: plain.duration,
    totalMarks: plain.totalMarks,
    passThreshold: plain.passThreshold,
    allowedMaterials: plain.allowedMaterials || [],
    scheduledStart: plain.scheduledStart || null,
    scheduledEnd: plain.scheduledEnd || null,
    instructions: plain.instructions || "",
    attachments: (plain.attachments || []).map(({ originalName, url, downloadUrl, mimeType, size }) => ({ originalName, url, downloadUrl, mimeType, size })),
    pdfUrl: plain.pdfUrl || null,
    cameraRequired: Boolean(plain.cameraRequired),
    microphoneRequired: Boolean(plain.microphoneRequired),
  };
}

export function studentSafeQuestion(question) {
  const plain = question.toObject ? question.toObject() : question;
  return {
    _id: plain._id,
    questionNumber: plain.questionNumber,
    questionText: plain.questionText,
    type: plain.questionType || plain.type,
    marks: plain.marks,
    requireWorking: Boolean(plain.requireWorking || plain.requiresWorking),
    imageUrl: plain.imageUrl || null,
    imageThumbnail: plain.imageThumbnail || null,
    options: Array.isArray(plain.options) ? plain.options.map(({ text }) => ({ text })) : [],
  };
}
