// models/StudentPage.js
import mongoose from "mongoose";

const CLD = "https://res.cloudinary.com/ddm1dgws8/image/upload";

/* ── Download / file attachment ────────────────────────────── */
const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  url: { type: String, required: true },
  mimetype: { type: String, default: "" },
  size: { type: Number, default: 0 },
}, { _id: true });

/* ── Announcement ──────────────────────────────────────────── */
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  body: { type: String, default: "", maxlength: 5000 },
  date: { type: Date, default: Date.now },
  category: {
    type: String,
    enum: ["general", "academic", "exams", "fees", "events", "urgent"],
    default: "general",
  },
  active: { type: Boolean, default: true },
}, { _id: true });

/* ── Section (timetables, council, conduct, etc.) ──────────── */
const sectionSchema = new mongoose.Schema({
  key: { type: String, required: true },          // e.g. "timetables", "council"
  heading: { type: String, required: true, maxlength: 255 },
  intro: { type: String, default: "", maxlength: 5000 },
  files: [fileSchema],
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { _id: true });

/* ── Quick-link tab ────────────────────────────────────────── */
const quickLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, maxlength: 100 },
  route: { type: String, required: true },          // e.g. "student/exams"
  icon: { type: String, default: "📄" },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  requiresAuth: { type: Boolean, default: false },  // e.g. "My Results" needs student login
  allowedRoles: [{ type: String }],                  // e.g. ["student"]
}, { _id: true });

/* ── Root page schema ──────────────────────────────────────── */
const studentPageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "student-page-singleton" },

    // Hero / page settings
    title: { type: String, default: "Student Portal" },
    subtitle: {
      type: String,
      default: "Access all your academic resources, timetables, and student services",
    },
    heroImage: {
      type: String,
      default: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5384.jpg`,
    },
    heroOverlayText: {
      type: String,
      default: "Welcome to the Student Portal",
    },

    // Content sections (admin-editable)
    sections: [sectionSchema],

    // Quick-link tabs (admin-configurable)
    quickLinks: [quickLinkSchema],

    // Announcements
    announcements: [announcementSchema],
  },
  { timestamps: true }
);

/* ── Default sections ──────────────────────────────────────── */
export const defaultSections = [
  {
    key: "timetables",
    heading: "Class Timetables",
    intro: "Download your class timetable for the current term.",
    files: [],
    active: true,
    displayOrder: 0,
  },
  {
    key: "homework",
    heading: "Homework Portal",
    intro: "Access assignments, notes, and study materials uploaded by your teachers. Log in to access the homework portal.",
    files: [],
    active: true,
    displayOrder: 1,
  },
  {
    key: "council",
    heading: "Student Council",
    intro: "Our student leaders represent your voice. Elections are held every January. Download the charter and candidate form below.",
    files: [],
    active: true,
    displayOrder: 2,
  },
  {
    key: "conduct",
    heading: "Code of Conduct",
    intro: "All students are expected to uphold our values of respect, responsibility, and excellence.",
    files: [],
    active: true,
    displayOrder: 3,
  },
  {
    key: "resources",
    heading: "Student Resources",
    intro: "Important forms, guides, and documents for students.",
    files: [],
    active: true,
    displayOrder: 4,
  },
];

/* ── Default quick links ──────────────────────────────────── */
export const defaultQuickLinks = [
  { label: "Exams", route: "student/exams", icon: "📝", active: true, displayOrder: 0, requiresAuth: false, allowedRoles: [] },
  { label: "Fee Structure", route: "feestructure", icon: "💰", active: true, displayOrder: 1, requiresAuth: false, allowedRoles: [] },
  { label: "Clubs & Activities", route: "student-life", icon: "🎭", active: true, displayOrder: 2, requiresAuth: false, allowedRoles: [] },
  { label: "Homework Portal", route: "portal/homework", icon: "📚", active: true, displayOrder: 3, requiresAuth: true, allowedRoles: ["student", "teacher", "admin"] },
  { label: "My Results", route: "student-results", icon: "📊", active: true, displayOrder: 4, requiresAuth: true, allowedRoles: ["student"] },
];

export default mongoose.models?.StudentPage ||
  mongoose.model("StudentPage", studentPageSchema);
