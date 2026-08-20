import dotenv from "dotenv";
dotenv.config();
import { connectToDatabase } from "../services/dbConnection.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StaffProfile from "../models/StaffProfile.js";
import DirectoryIdentity from "../models/DirectoryIdentity.js";

const roles = ["student", "teacher", "staff", "admin", "superadmin"];
await connectToDatabase();
const users = await User.find({ role: { $in: roles } }).lean();
let created = 0; let skipped = 0;

for (const user of users) {
  if (await DirectoryIdentity.exists({ $or: [{ accountUser: user._id }, { email: user.email }] })) { skipped += 1; continue; }
  const student = user.role === "student" && user.admissionNumber ? await Student.findOne({ admissionNumber: user.admissionNumber }).lean() : null;
  const teacher = user.role === "teacher" ? await TeacherProfile.findOne({ user: user._id }).lean() : null;
  const staff = user.role === "staff" ? await StaffProfile.findOne({ user: user._id }).lean() : null;
  await DirectoryIdentity.create({
    name: user.name, email: user.email, role: user.role, phone: user.phone || teacher?.phone || staff?.phone,
    admissionNumber: user.admissionNumber || undefined, staffId: teacher?.staffId || staff?.staffId || undefined,
    student: student?._id, class: student?.class, stream: student?.stream || user.stream, curriculum: student?.curriculum,
    grade: student?.grade, form: student?.form, department: teacher?.department || staff?.department, position: staff?.position,
    subjects: teacher?.subjects || [], accountUser: user._id, accountStatus: user.isActive ? "active" : "blocked", activatedAt: user.createdAt,
  });
  if (student) await Student.findByIdAndUpdate(student._id, { accountUser: user._id, accountStatus: user.isActive ? "active" : "blocked" });
  created += 1;
}
console.log(JSON.stringify({ created, skipped, total: users.length }, null, 2));
process.exit(0);
