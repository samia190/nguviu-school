import crypto from "crypto";
import bcrypt from "bcrypt";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import BulkImport from "../models/BulkImport.js";
import Result from "../models/Result.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StaffProfile from "../models/StaffProfile.js";
import DirectoryIdentity from "../models/DirectoryIdentity.js";
import InviteToken from "../models/InviteToken.js";
import AuditLog from "../models/AuditLog.js";
import { sendEmail } from "../utils/email.js";

const MAX_IMPORT_ROWS = Number(process.env.BULK_IMPORT_MAX_ROWS || 2000);
const IMPORT_EXPIRY_MS = 24 * 60 * 60 * 1000;
const accountRoles = new Set(["student", "teacher", "staff", "admin"]);
const resultTerms = new Set(["Term 1", "Term 2", "Term 3"]);
const resultExamTypes = new Set(["Mid Term", "End of Term", "Final Exam", "Mock Exam"]);

const string = (value) => String(value ?? "").trim();
const normalizedHeader = (value) => string(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
const normalizedEmail = (value) => string(value).toLowerCase();
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const gradeFor = (average) => average >= 80 ? "A" : average >= 70 ? "B" : average >= 60 ? "C" : average >= 50 ? "D" : average >= 40 ? "E" : "F";

export const canProvisionRole = (actor, role) => role !== "admin" || actor?.role === "superadmin";
export const matchesDirectoryPlacement = (student, row) => string(student?.class).toLowerCase() === string(row?.class).toLowerCase() && string(student?.stream).toLowerCase() === string(row?.stream).toLowerCase();

function workbookRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  return workbook.xlsx.load(buffer).then(() => {
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("The workbook does not contain a worksheet.");
    const headerRow = sheet.getRow(1);
    const headers = headerRow.values.slice(1).map(normalizedHeader);
    if (!headers.length || headers.every((header) => !header)) throw new Error("The first row must contain column headers.");
    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || rows.length >= MAX_IMPORT_ROWS) return;
      const raw = row.values.slice(1);
      if (raw.every((value) => string(value) === "")) return;
      const item = { rowNumber, data: {} };
      headers.forEach((header, index) => { if (header) item.data[header] = raw[index] ?? ""; });
      rows.push(item);
    });
    if (sheet.rowCount - 1 > MAX_IMPORT_ROWS) throw new Error(`Imports are limited to ${MAX_IMPORT_ROWS} non-empty rows.`);
    return rows;
  });
}

export function parseAccountRow(row, actor) {
  const data = row.data;
  const role = string(data.role).toLowerCase();
  const parsed = {
    name: string(data.name), email: normalizedEmail(data.email), role,
    admissionNumber: string(data.admissionnumber), dateOfBirth: string(data.dateofbirth),
    phone: string(data.phone), class: string(data.class), stream: string(data.stream), curriculum: string(data.curriculum) || "8-4-4",
    grade: string(data.grade), form: string(data.form), yearOfAdmission: Number(data.yearofadmission || 0) || undefined,
    staffId: string(data.staffid), department: string(data.department), position: string(data.position),
    subjects: string(data.subjects).split(",").map(string).filter(Boolean),
  };
  const errors = [];
  if (!parsed.name) errors.push("name is required");
  if (!validEmail(parsed.email)) errors.push("a valid email is required");
  if (!accountRoles.has(parsed.role)) errors.push("role must be student, teacher, staff, or admin");
  if (!canProvisionRole(actor, parsed.role)) errors.push("only a superadmin may provision admin accounts");
  if (parsed.role === "student") {
    if (!parsed.admissionNumber) errors.push("student admissionNumber is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.dateOfBirth)) errors.push("student dateOfBirth must be YYYY-MM-DD");
    if (!["CBE", "8-4-4"].includes(parsed.curriculum)) errors.push("student curriculum must be CBE or 8-4-4");
    if (!parsed.class) errors.push("student class is required");
    if (!parsed.stream) errors.push("student stream is required");
    if (parsed.curriculum === "CBE" && !parsed.grade) errors.push("CBE student grade is required");
    if (parsed.curriculum === "8-4-4" && !parsed.form) errors.push("8-4-4 student form is required");
  } else if ((parsed.role === "teacher" || parsed.role === "staff") && !parsed.staffId) {
    errors.push("staffId is required for teacher and staff accounts");
  }
  return { ...row, data: parsed, errors };
}

export function parseResultRow(row) {
  const data = row.data;
  const parsed = {
    admissionNumber: string(data.admissionnumber), term: string(data.term), year: Number(data.year), examType: string(data.examtype) || "End of Term",
    curriculum: string(data.curriculum) || "8-4-4", subjectName: string(data.subject), marks: Number(data.marks), grade: string(data.grade),
    class: string(data.class), stream: string(data.stream), attendancePresent: Number(data.attendancedayspresent || 0), attendanceAbsent: Number(data.attendancedaysabsent || 0),
    attendanceTotal: Number(data.attendancetotaldays || 0), assessmentNumber: string(data.assessmentnumber),
  };
  const errors = [];
  if (!parsed.admissionNumber) errors.push("admissionNumber is required");
  if (!resultTerms.has(parsed.term)) errors.push("term must be Term 1, Term 2, or Term 3");
  if (!Number.isInteger(parsed.year) || parsed.year < 2000 || parsed.year > 2100) errors.push("year must be valid");
  if (!resultExamTypes.has(parsed.examType)) errors.push("examType is invalid");
  if (!["CBE", "8-4-4"].includes(parsed.curriculum)) errors.push("curriculum must be CBE or 8-4-4");
  if (!parsed.subjectName) errors.push("subject is required");
  if (!Number.isFinite(parsed.marks) || parsed.marks < 0 || parsed.marks > 100) errors.push("marks must be between 0 and 100");
  if (!parsed.class) errors.push("class is required");
  if (!parsed.stream) errors.push("stream is required so results can be matched to the exact school directory record");
  return { ...row, data: parsed, errors };
}

async function validateExistingAccounts(rows, type) {
  if (type === "accounts") {
    const emails = rows.map((row) => row.data.email).filter(Boolean);
    const admissions = rows.map((row) => row.data.admissionNumber).filter(Boolean);
    const staffIds = rows.map((row) => row.data.staffId).filter(Boolean);
    const [existingEmails, existingAdmissions, existingDirectoryEmails, existingDirectoryAdmissions, existingStaffIds] = await Promise.all([
      User.find({ email: { $in: emails } }).select("email").lean(),
      User.find({ admissionNumber: { $in: admissions } }).select("admissionNumber").lean(),
      DirectoryIdentity.find({ email: { $in: emails } }).select("email").lean(),
      DirectoryIdentity.find({ admissionNumber: { $in: admissions } }).select("admissionNumber").lean(),
      DirectoryIdentity.find({ staffId: { $in: staffIds } }).select("staffId").lean(),
    ]);
    const emailSet = new Set([...existingEmails, ...existingDirectoryEmails].map((user) => user.email));
    const admissionSet = new Set([...existingAdmissions, ...existingDirectoryAdmissions].map((user) => user.admissionNumber));
    const staffIdSet = new Set(existingStaffIds.map((identity) => identity.staffId));
    const seenEmails = new Set(); const seenAdmissions = new Set(); const seenStaffIds = new Set();
    rows.forEach((row) => {
      if (row.data.email && (emailSet.has(row.data.email) || seenEmails.has(row.data.email))) row.errors.push("email already exists or is duplicated in this file");
      if (row.data.email) seenEmails.add(row.data.email);
      if (row.data.admissionNumber && (admissionSet.has(row.data.admissionNumber) || seenAdmissions.has(row.data.admissionNumber))) row.errors.push("admissionNumber already exists or is duplicated in this file");
      if (row.data.admissionNumber) seenAdmissions.add(row.data.admissionNumber);
      if (row.data.staffId && (staffIdSet.has(row.data.staffId) || seenStaffIds.has(row.data.staffId))) row.errors.push("staffId already exists or is duplicated in this file");
      if (row.data.staffId) seenStaffIds.add(row.data.staffId);
    });
  } else {
    const admissions = [...new Set(rows.map((row) => row.data.admissionNumber).filter(Boolean))];
    const students = await Student.find({ admissionNumber: { $in: admissions } }).select("_id admissionNumber class stream curriculum grade form status").lean();
    const byAdmission = new Map(students.map((student) => [student.admissionNumber, student]));
    rows.forEach((row) => {
      const student = byAdmission.get(row.data.admissionNumber);
      if (row.data.admissionNumber && !student) row.errors.push("no verified school directory record matches this admissionNumber");
      if (!student) return;
      if (student.status !== "Active") row.errors.push("the matched school directory record is not active");
      if (string(student.class).toLowerCase() !== string(row.data.class).toLowerCase()) row.errors.push("class does not match the verified school directory record");
      if (string(student.stream).toLowerCase() !== string(row.data.stream).toLowerCase()) row.errors.push("stream does not match the verified school directory record");
      if (student.curriculum && student.curriculum !== row.data.curriculum) row.errors.push("curriculum does not match the verified school directory record");
    });
  }
}

export async function stageExcelImport({ buffer, sourceName, type, actor }) {
  const rawRows = await workbookRows(buffer);
  if (!rawRows.length) throw new Error("The workbook has no data rows.");
  let rows = rawRows.map((row) => type === "accounts" ? parseAccountRow(row, actor) : parseResultRow(row));
  await validateExistingAccounts(rows, type);
  const validRows = rows.filter((row) => row.errors.length === 0).length;
  const record = await BulkImport.create({
    type, sourceName, createdBy: actor.id || actor._id, expiresAt: new Date(Date.now() + IMPORT_EXPIRY_MS), rows,
    summary: { totalRows: rows.length, validRows, invalidRows: rows.length - validRows, appliedRows: 0 },
  });
  return record;
}

function activationLink(token) {
  const base = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  return `${base}/signup#invite=${token}`;
}

async function applyAccountImport(record, actor) {
  const validRows = record.rows.filter((row) => row.errors.length === 0);
  if (validRows.length !== record.rows.length) throw new Error("Resolve every invalid row before confirming this import.");
  if (!process.env.RESEND_API_KEY || !process.env.FRONTEND_URL) {
    throw new Error("Account imports require RESEND_API_KEY and FRONTEND_URL so every account receives a secure one-time password setup link.");
  }
  const databaseSession = await mongoose.startSession();
  const activationDeliveries = [];
  try {
    await databaseSession.withTransaction(async () => {
      for (const row of validRows) {
        const account = row.data;
        let student = null;
        if (account.role === "student") {
          const names = account.name.split(/\s+/).filter(Boolean);
          [student] = await Student.create([{
            admissionNumber: account.admissionNumber, firstName: names.shift() || account.name, lastName: names.pop() || "Student", otherNames: names.join(" ") || undefined,
            dateOfBirth: new Date(account.dateOfBirth), class: account.class, stream: account.stream, curriculum: account.curriculum, grade: account.grade || undefined, form: account.form || undefined,
            yearOfAdmission: account.yearOfAdmission || new Date().getFullYear(), email: account.email, phoneNumber: account.phone || undefined, accountStatus: "invited", registrationInvitationIssuedAt: new Date(),
          }], { session: databaseSession });
          student.generateIdCardSecret(); await student.save({ session: databaseSession });
        }
        const [identity] = await DirectoryIdentity.create([{
          name: account.name, email: account.email, role: account.role, phone: account.phone || undefined, staffId: account.staffId || undefined, admissionNumber: account.admissionNumber || undefined,
          student: student?._id, class: account.class || undefined, stream: account.stream || undefined, curriculum: account.curriculum || undefined, grade: account.grade || undefined, form: account.form || undefined,
          department: account.department || undefined, position: account.position || undefined, subjects: account.subjects || [], accountStatus: "invited", invitedAt: new Date(),
        }], { session: databaseSession });
        const token = crypto.randomBytes(32).toString("hex");
        const linkType = account.role === "student" ? (account.curriculum === "CBE" ? "student-CBE" : "student-844") : account.role;
        await InviteToken.create([{ token, linkType, role: account.role, label: `Directory activation: ${account.name}`, createdBy: actor.id || actor._id, directoryIdentity: identity._id, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), maxUses: 1 }], { session: databaseSession });
        activationDeliveries.push({ account, token });
      }
    });
  } catch (error) {
    throw error;
  } finally {
    await databaseSession.endSession();
  }
  for (const { account, token } of activationDeliveries) {
    try { await sendEmail(account.email, "Activate your Kangaru account", `Hello ${account.name},\n\nThe school has registered your ${account.role} record. Create your password using this one-time activation link within 72 hours:\n${activationLink(token)}\n\nIf you were not expecting this invitation, contact the school office.`); } catch (error) { console.error(`Activation delivery failed for ${account.email}; the school must revoke and reissue a secure activation link.`); }
  }
  return validRows.length;
}

async function applyResultImport(record, actor, publish) {
  const validRows = record.rows.filter((row) => row.errors.length === 0);
  if (validRows.length !== record.rows.length) throw new Error("Resolve every invalid row before confirming this import.");
  const grouped = new Map();
  for (const row of validRows) {
    const key = [row.data.admissionNumber, row.data.term, row.data.year, row.data.examType, row.data.curriculum].join("|");
    const group = grouped.get(key) || { ...row.data, subjects: [], rowNumbers: [] };
    group.subjects.push({ subjectName: row.data.subjectName, marks: row.data.marks, grade: row.data.grade || gradeFor(row.data.marks) });
    group.rowNumbers.push(row.rowNumber); grouped.set(key, group);
  }
  const admissions = [...new Set(validRows.map((row) => row.data.admissionNumber))];
  const students = await Student.find({ admissionNumber: { $in: admissions }, status: "Active" }).lean();
  const studentMap = new Map(students.map((student) => [student.admissionNumber, student]));
  const operations = [];
  for (const group of grouped.values()) {
    const student = studentMap.get(group.admissionNumber);
    if (!student?.dateOfBirth) throw new Error(`Student ${group.admissionNumber} lacks a verified directory date of birth required by the current result schema.`);
    if (!matchesDirectoryPlacement(student, group)) throw new Error(`Student ${group.admissionNumber} no longer matches the imported class and stream.`);
    const totalMarks = group.subjects.reduce((sum, subject) => sum + subject.marks, 0);
    const averageMarks = totalMarks / group.subjects.length;
    operations.push({
      updateOne: {
        filter: { admissionNumber: group.admissionNumber, term: group.term, year: group.year, examType: group.examType, curriculum: group.curriculum },
        update: { $set: {
          studentId: student._id, admissionNumber: group.admissionNumber, studentName: [student.firstName, student.otherNames, student.lastName].filter(Boolean).join(" "), class: student.class, stream: student.stream || "", assessmentNumber: group.assessmentNumber || student.assessmentNumber || undefined,
          curriculum: group.curriculum, term: group.term, year: group.year, examType: group.examType, subjects: group.subjects, totalMarks, averageMarks, overallGrade: gradeFor(averageMarks),
          attendance: { daysPresent: group.attendancePresent, daysAbsent: group.attendanceAbsent, totalDays: group.attendanceTotal }, dateOfBirth: new Date(student.dateOfBirth),
          published: Boolean(publish), publishedDate: publish ? new Date() : undefined, createdBy: actor.id || actor._id,
        } }, upsert: true,
      },
    });
  }
  const databaseSession = await mongoose.startSession();
  try {
    await databaseSession.withTransaction(async () => { await Result.bulkWrite(operations, { ordered: true, session: databaseSession }); });
  } finally { await databaseSession.endSession(); }
  return operations.length;
}

export async function applyStagedImport({ importId, actor, publishResults = false }) {
  const record = await BulkImport.findById(importId);
  if (!record || record.status !== "validated") throw new Error("This import is unavailable or has already been applied.");
  if (String(record.createdBy) !== String(actor.id || actor._id) && actor.role !== "superadmin") throw new Error("Only the importing administrator or a superadmin may confirm this import.");
  const appliedRows = record.type === "accounts" ? await applyAccountImport(record, actor) : await applyResultImport(record, actor, publishResults);
  record.status = "applied"; record.appliedAt = new Date(); record.appliedBy = actor.id || actor._id; record.summary.appliedRows = appliedRows; await record.save();
  await AuditLog.create({ actorId: actor.id || actor._id, actorEmail: actor.email, action: `bulk_${record.type}_import_applied`, targetId: record._id, meta: { appliedRows, publishResults: Boolean(publishResults), sourceName: record.sourceName } });
  return record;
}

export async function createImportTemplate(type) {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet(type === "accounts" ? "Accounts" : "Results");
  const columns = type === "accounts"
    ? ["name", "email", "role", "admissionNumber", "dateOfBirth", "curriculum", "class", "stream", "grade", "form", "yearOfAdmission", "phone", "staffId", "department", "position", "subjects"]
    : ["admissionNumber", "term", "year", "examType", "curriculum", "class", "stream", "assessmentNumber", "subject", "marks", "grade", "attendanceDaysPresent", "attendanceDaysAbsent", "attendanceTotalDays"];
  sheet.addRow(columns); sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.columns = columns.map((column) => ({ key: column, width: Math.max(14, column.length + 4) }));
  return workbook.xlsx.writeBuffer();
}

export async function createImportErrorReport(record) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Import errors");
  sheet.addRow(["Row", "Data", "Errors"]); sheet.getRow(1).font = { bold: true };
  record.rows.filter((row) => row.errors?.length).forEach((row) => sheet.addRow([row.rowNumber, JSON.stringify(row.data), row.errors.join("; ")]));
  sheet.columns = [{ width: 10 }, { width: 80 }, { width: 80 }]; sheet.views = [{ state: "frozen", ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}
