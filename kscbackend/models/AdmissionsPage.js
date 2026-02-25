// models/AdmissionsPage.js
import mongoose from "mongoose";

/* ── Sub-schemas ─────────────────────────────────────────────── */

const downloadSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  url: { type: String, default: "" },
  mimetype: { type: String, default: "" },
  size: { type: Number, default: 0 },
  description: { type: String, default: "" },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

const formStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  icon: { type: String, default: "" },
  title: { type: String, default: "" },
  instructions: { type: String, default: "" },
});

const formDeclarationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  heading: { type: String, default: "" },
  text: { type: String, default: "" },
});

/* ── Root schema ─────────────────────────────────────────────── */

const admissionsPageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "admissions-page-singleton" },

    // Hero / header
    title: { type: String, default: "Admissions" },
    subtitle: {
      type: String,
      default:
        "We welcome applications from girls across Kenya who are passionate about learning and growth.",
    },
    heroImage: { type: String, default: "" },

    // Page text sections
    overview: {
      type: String,
      default:
        "Kangaru Girls Senior School is a centre of academic excellence committed to holistic education. We invite qualified girls from junior schools across Kenya to apply for admission into our senior school programs.",
    },
    process: {
      type: String,
      default:
        "Our admissions process is transparent, student-centred, and guided by the Ministry of Education regulations. Applications are reviewed on merit, with consideration given to academic performance, character, and extracurricular involvement.",
    },
    requirements: {
      type: String,
      default:
        "Applicants should provide the following:\n• Completed application form\n• Recent report forms / Junior School leaving certificate\n• Birth certificate (certified copy)\n• Two passport-size photographs\n• Medical fitness certificate\n• Transfer letter (for transferring students)\n• Baptism certificate (if applicable)",
    },
    importantDates: {
      type: String,
      default:
        "Key dates such as application deadlines, interview days, and reporting dates will be communicated through this page and our official communication channels.",
    },
    contactInfo: {
      type: String,
      default:
        "For any questions on admissions, kindly contact the school office:\nPhone: +254796214804\nEmail: kangarugirls@yahoo.com\nAddress: P.O. BOX 1094-60100, EMBU, KENYA",
    },
    downloadsHeading: {
      type: String,
      default: "Downloads – Application Forms & Related Documents",
    },

    // Downloadable files (brochures, forms, etc.)
    downloads: [downloadSchema],

    // Form settings
    formEnabled: { type: Boolean, default: true },
    formTitle: {
      type: String,
      default: "Online Admission Application",
    },
    admissionYear: {
      type: Number,
      default: () => {
        const now = new Date();
        return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
      },
    },
    formInstructions: {
      type: String,
      default: "Please fill in all required fields accurately. Fields marked with * are mandatory.",
    },

    // Per-step customization
    formSteps: [formStepSchema],

    // Declaration texts (admin-editable)
    formDeclarations: [formDeclarationSchema],

    // Warning / disclaimer shown at the bottom of the form
    formDisclaimer: {
      type: String,
      default:
        "Please ensure all information provided is accurate and truthful. False information may lead to disqualification of the application.",
    },
  },
  { timestamps: true }
);

/* ── Defaults for steps and declarations ─────────────────────── */

export const defaultFormSteps = [
  { step: 1, icon: "📝", title: "Personal Information", instructions: "Fill in the student's personal details as they appear on official documents." },
  { step: 2, icon: "📍", title: "Location & Contact Details", instructions: "Provide the student's home address and contact information." },
  { step: 3, icon: "🎓", title: "Academic Information", instructions: "Enter details about the student's previous school and academic performance." },
  { step: 4, icon: "👨‍👩‍👧", title: "Religion & Parent/Guardian Information", instructions: "Provide religion and parent/guardian details." },
  { step: 5, icon: "📎", title: "Upload Required Documents", instructions: "Please upload all required documents. Accepted formats: PDF, JPG, JPEG, PNG (Max 5MB each)." },
  { step: 6, icon: "✅", title: "Declarations & Submission", instructions: "Review the declarations below and submit your application." },
];

export const defaultFormDeclarations = [
  {
    key: "studentPromise",
    heading: "Student Promise",
    text: "I promise to abide by the school rules and regulations, respect teachers and fellow students, and work hard to achieve academic excellence.",
  },
  {
    key: "parentConfirmFit",
    heading: "Parent/Guardian Declaration — Medical Fitness",
    text: "I confirm that the student is medically and mentally fit to attend school and participate in all school activities.",
  },
  {
    key: "parentUnderstandDiet",
    heading: "Parent/Guardian Declaration — Fees & Diet",
    text: "I understand and accept the school's dietary provisions and agree to pay all fees as per the school's fee structure.",
  },
];

const AdmissionsPage =
  mongoose.models?.AdmissionsPage ||
  mongoose.model("AdmissionsPage", admissionsPageSchema);

export default AdmissionsPage;
