import express from "express";
import crypto from "crypto";
import Student from "../models/Student.js";
import DirectoryIdentity from "../models/DirectoryIdentity.js";
import InviteToken from "../models/InviteToken.js";
import AuditLog from "../models/AuditLog.js";
import { requireRole } from "../middleware/requireAuth.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();
router.use(requireRole(["admin", "superadmin"]));

const activeStudents = { status: "Active" };
const activationLinkType = (identity) => identity.role === "student" ? (identity.curriculum === "CBE" ? "student-CBE" : "student-844") : identity.role;
const activationUrl = (token) => `${String(process.env.FRONTEND_URL || "").replace(/\/$/, "")}/signup#invite=${token}`;

router.get("/summary", async (req, res) => {
  try {
    const [studentCount, accountStates, classes, streams, curriculumGroups, personnel] = await Promise.all([
      Student.countDocuments(activeStudents),
      Student.aggregate([{ $match: activeStudents }, { $group: { _id: "$accountStatus", count: { $sum: 1 } } }]),
      Student.aggregate([
        { $match: activeStudents },
        { $group: { _id: { class: "$class", stream: "$stream" }, students: { $sum: 1 }, activated: { $sum: { $cond: [{ $eq: ["$accountStatus", "active"] }, 1, 0] } } } },
        { $sort: { "_id.class": 1, "_id.stream": 1 } },
      ]),
      Student.aggregate([{ $match: activeStudents }, { $group: { _id: "$stream", students: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Student.aggregate([{ $match: activeStudents }, { $group: { _id: { curriculum: "$curriculum", grade: "$grade", form: "$form" }, students: { $sum: 1 } } }, { $sort: { "_id.curriculum": 1, "_id.grade": 1, "_id.form": 1 } }]),
      DirectoryIdentity.aggregate([{ $match: { role: { $in: ["teacher", "staff", "admin", "superadmin"] } } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);
    return res.json({
      wholeSchool: { activeStudents: studentCount, totalPersonnel: personnel.reduce((sum, item) => sum + item.count, 0) },
      accountStates: Object.fromEntries(accountStates.map((item) => [item._id || "unassigned", item.count])),
      byClassAndStream: classes.map((item) => ({ class: item._id.class || "Unassigned", stream: item._id.stream || "Unassigned", students: item.students, activatedAccounts: item.activated })),
      byStream: streams.map((item) => ({ stream: item._id || "Unassigned", students: item.students })),
      byCurriculum: curriculumGroups.map((item) => ({ curriculum: item._id.curriculum || "Unassigned", gradeOrForm: item._id.grade || item._id.form || "Unassigned", students: item.students })),
      personnel: Object.fromEntries(personnel.map((item) => [item._id, item.count])),
    });
  } catch (error) { return res.status(500).json({ error: "Unable to load school directory summary." }); }
});

router.get("/students", async (req, res) => {
  try {
    const { class: className, stream, accountStatus, search } = req.query;
    const filter = { ...activeStudents };
    if (className) filter.class = className;
    if (stream) filter.stream = stream;
    if (accountStatus) filter.accountStatus = accountStatus;
    if (search) filter.$or = ["admissionNumber", "firstName", "lastName", "email"].map((field) => ({ [field]: { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
    const students = await Student.find(filter).select("admissionNumber firstName lastName class stream curriculum grade form accountStatus email status").sort({ class: 1, stream: 1, admissionNumber: 1 }).limit(500).lean();
    return res.json({ students, count: students.length });
  } catch (error) { return res.status(500).json({ error: "Unable to load school directory records." }); }
});

router.get("/personnel", async (req, res) => {
  try {
    const { role, accountStatus, search } = req.query;
    const filter = { role: { $in: ["teacher", "staff", "admin", "superadmin"] } };
    if (role && filter.role.$in.includes(role)) filter.role = role;
    if (accountStatus) filter.accountStatus = accountStatus;
    if (search) filter.$or = ["name", "email", "staffId", "department", "position"].map((field) => ({ [field]: { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
    const personnel = await DirectoryIdentity.find(filter).select("name role staffId email department position accountStatus").sort({ role: 1, name: 1 }).limit(500).lean();
    return res.json({ personnel, count: personnel.length });
  } catch (error) { return res.status(500).json({ error: "Unable to load school personnel records." }); }
});

router.post("/:id/reissue-activation", async (req, res) => {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.FRONTEND_URL) return res.status(503).json({ error: "Activation email delivery is not configured." });
    const identity = await DirectoryIdentity.findById(req.params.id) || await DirectoryIdentity.findOne({ student: req.params.id });
    if (!identity) return res.status(404).json({ error: "Directory record not found." });
    if (identity.role === "admin" && req.user.role !== "superadmin") return res.status(403).json({ error: "Only a superadmin may reissue administrator activation links." });
    if (identity.registrationLocked || identity.accountStatus === "blocked" || identity.accountStatus === "active") return res.status(409).json({ error: "Only unactivated, unlocked directory records can receive a new activation link." });
    await InviteToken.updateMany({ directoryIdentity: identity._id, revoked: false }, { $set: { revoked: true } });
    const token = crypto.randomBytes(32).toString("hex");
    const invite = await InviteToken.create({ token, linkType: activationLinkType(identity), role: identity.role, label: `Reissued directory activation: ${identity.name}`, createdBy: req.user.id, directoryIdentity: identity._id, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), maxUses: 1 });
    try {
      const url = activationUrl(token);
      await sendEmail(identity.email, "Your new Kangaru account activation link", `Hello ${identity.name},\n\nThe school has reissued your one-time activation link. Set your password within 72 hours:\n${url}\n\nIf you did not request this, contact the school office.`, `<p>Hello ${identity.name},</p><p>The school has reissued your one-time activation link. It expires in 72 hours.</p><p><a href="${url}">Activate your Kangaru account</a></p><p>If you did not request this, contact the school office.</p>`);
    } catch (error) {
      invite.revoked = true; await invite.save();
      return res.status(502).json({ error: "Activation email could not be delivered. No usable link was issued." });
    }
    identity.accountStatus = "invited"; identity.invitedAt = new Date(); await identity.save();
    if (identity.student) await Student.findByIdAndUpdate(identity.student, { accountStatus: "invited", registrationInvitationIssuedAt: new Date() });
    await AuditLog.create({ actorId: req.user.id, actorEmail: req.user.email, action: "directory_activation_reissued", targetId: identity.accountUser || undefined, targetEmail: identity.email, meta: { directoryIdentity: identity._id, role: identity.role } });
    return res.json({ ok: true, message: "A new activation link was sent to the registered school email." });
  } catch (error) { return res.status(500).json({ error: "Unable to reissue the activation link." }); }
});

export default router;
