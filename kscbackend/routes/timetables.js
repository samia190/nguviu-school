import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import BulkImport from "../models/BulkImport.js";
import Timetable from "../models/Timetable.js";
import DirectoryIdentity from "../models/DirectoryIdentity.js";
import Student from "../models/Student.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validateTimetableRow } from "../services/assessmentContentPolicy.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 }, fileFilter: (req, file, done) => done(null, /spreadsheetml|excel/.test(file.mimetype) && file.originalname.toLowerCase().endsWith(".xlsx")) });
const requiredHeaders = ["term", "year", "class", "stream", "day", "startTime", "endTime", "subject", "teacherStaffId", "room"];
const text = (value, max = 120) => String(value ?? "").trim().slice(0, max);
const key = (row) => `${row.term}|${row.year}|${row.class}|${row.stream}`;

function rowData(values, headers) { return Object.fromEntries(headers.map((header, index) => [header, values[index] instanceof Date ? values[index].toISOString().slice(0, 10) : text(values[index], 240)])); }

router.get("/template", requireRole(["admin", "superadmin"]), async (req, res) => { const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("Timetable"); sheet.addRow(requiredHeaders); sheet.getRow(1).font = { bold: true }; sheet.addRow(["Term 1", new Date().getFullYear(), "Form 2", "East", "Monday", "08:00", "08:40", "Mathematics", "T-001", "Room 12"]); sheet.columns = requiredHeaders.map(() => ({ width: 18 })); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", "attachment; filename=kangaru-timetable-template.xlsx"); return res.send(Buffer.from(await workbook.xlsx.writeBuffer())); });

router.post("/preview", requireRole(["admin", "superadmin"]), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload one .xlsx timetable file." });
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(req.file.buffer); const sheet = workbook.worksheets[0]; if (!sheet) return res.status(400).json({ error: "The workbook has no timetable sheet." });
    const headers = sheet.getRow(1).values.slice(1).map((header) => text(header)); if (requiredHeaders.some((header) => !headers.includes(header))) return res.status(400).json({ error: `Template headers are required: ${requiredHeaders.join(", ")}` });
    const rows = []; sheet.eachRow((worksheetRow, number) => { if (number > 1 && worksheetRow.values.slice(1).some((value) => String(value || "").trim())) rows.push({ rowNumber: number, data: rowData(worksheetRow.values.slice(1), headers), errors: [] }); });
    if (!rows.length || rows.length > 2000) return res.status(400).json({ error: "The timetable must contain between 1 and 2,000 entries." });
    const staffIds = [...new Set(rows.map((row) => row.data.teacherStaffId).filter(Boolean))]; const placements = [...new Set(rows.map((row) => `${row.data.class}|${row.data.stream}`))];
    const [teachers, groups] = await Promise.all([DirectoryIdentity.find({ role: "teacher", staffId: { $in: staffIds }, accountStatus: { $ne: "blocked" } }).select("_id staffId").lean(), Student.aggregate([{ $match: { status: "Active", $or: placements.map((value) => { const [className, stream] = value.split("|"); return { class: className, stream }; }) } }, { $group: { _id: { class: "$class", stream: "$stream" }, count: { $sum: 1 } } }])]);
    const teacherById = new Map(teachers.map((teacher) => [teacher.staffId, teacher])); const placementSet = new Set(groups.map((group) => `${group._id.class}|${group._id.stream}`));
    for (const row of rows) { row.errors.push(...validateTimetableRow(row.data)); if (!teacherById.has(row.data.teacherStaffId)) row.errors.push("teacherStaffId does not match an active verified teacher"); if (!placementSet.has(`${row.data.class}|${row.data.stream}`)) row.errors.push("class and stream do not match an active student group"); }
    const summary = { totalRows: rows.length, validRows: rows.filter((row) => !row.errors.length).length, invalidRows: rows.filter((row) => row.errors.length).length, appliedRows: 0 };
    const staged = await BulkImport.create({ type: "timetable", sourceName: req.file.originalname, createdBy: req.user.id || req.user._id, rows, summary, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    return res.status(201).json({ import: { id: staged._id, summary, rows } });
  } catch (error) { return res.status(500).json({ error: "Unable to validate the timetable workbook." }); }
});

router.post("/:id/confirm", requireRole(["admin", "superadmin"]), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const staged = await BulkImport.findById(req.params.id); if (!staged || staged.type !== "timetable" || staged.status !== "validated") return res.status(404).json({ error: "Validated timetable import not found." });
    if (String(staged.createdBy) !== String(req.user.id || req.user._id) && req.user.role !== "superadmin") return res.status(403).json({ error: "Not authorized to confirm this import." });
    if (staged.summary.invalidRows) return res.status(409).json({ error: "Correct all invalid rows before confirmation." });
    const staffIds = [...new Set(staged.rows.map((row) => row.data.teacherStaffId))]; const teachers = await DirectoryIdentity.find({ role: "teacher", staffId: { $in: staffIds }, accountStatus: { $ne: "blocked" } }).select("_id staffId").lean(); const teacherById = new Map(teachers.map((teacher) => [teacher.staffId, teacher]));
    const grouped = new Map(); for (const item of staged.rows) { const row = item.data; const groupKey = key(row); const current = grouped.get(groupKey) || { term: row.term, year: Number(row.year), class: row.class, stream: row.stream, entries: [] }; current.entries.push({ day: row.day, startTime: row.startTime, endTime: row.endTime, subject: row.subject, teacherIdentity: teacherById.get(row.teacherStaffId)._id, teacherStaffId: row.teacherStaffId, room: row.room }); grouped.set(groupKey, current); }
    await session.withTransaction(async () => { for (const item of grouped.values()) await Timetable.findOneAndUpdate({ term: item.term, year: item.year, class: item.class, stream: item.stream }, { $set: { ...item, uploadedBy: req.user.id || req.user._id, publishedAt: new Date() } }, { upsert: true, new: true, session }); staged.status = "applied"; staged.summary.appliedRows = staged.summary.validRows; staged.appliedAt = new Date(); staged.appliedBy = req.user.id || req.user._id; await staged.save({ session }); });
    return res.json({ ok: true, distributedTimetables: grouped.size, appliedRows: staged.summary.appliedRows });
  } catch (error) { return res.status(500).json({ error: "Unable to distribute the timetable." }); } finally { await session.endSession(); }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; let query;
    if (req.user.role === "teacher") { const identity = await DirectoryIdentity.findOne({ accountUser: userId, role: "teacher" }).lean(); if (!identity) return res.json({ timetables: [] }); query = { "entries.teacherIdentity": identity._id }; const timetables = await Timetable.find(query).sort({ year: -1, term: 1 }).lean(); return res.json({ timetables: timetables.map((timetable) => ({ ...timetable, entries: timetable.entries.filter((entry) => String(entry.teacherIdentity) === String(identity._id)) })) }); }
    else if (req.user.role === "student") { const student = await Student.findOne({ accountUser: userId, status: "Active" }).lean(); if (!student) return res.json({ timetables: [] }); query = { class: student.class, stream: student.stream }; }
    else return res.status(403).json({ error: "Only teachers and students have a personal timetable." });
    const timetables = await Timetable.find(query).sort({ year: -1, term: 1 }).lean(); return res.json({ timetables });
  } catch { return res.status(500).json({ error: "Unable to load your timetable." }); }
});

export default router;
