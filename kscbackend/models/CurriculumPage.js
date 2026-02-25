// models/CurriculumPage.js
import mongoose from "mongoose";

/* ── Sub-schemas ─────────────────────────────────────────────── */

const subjectCombinationSchema = new mongoose.Schema({
  code: { type: String, required: true, maxlength: 20 },
  subjects: [{ type: String, maxlength: 120 }],
  active: { type: Boolean, default: true },
});

const streamSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  icon: { type: String, default: "", maxlength: 10 },
  combinations: [subjectCombinationSchema],
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const fileSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  url: { type: String, default: "" },
  mimetype: { type: String, default: "" },
  size: { type: Number, default: 0 },
});

const sectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  heading: { type: String, required: true, maxlength: 255 },
  body: { type: String, default: "", maxlength: 10000 },
  imageUrl: { type: String, default: "" },
  files: [fileSchema],
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

/* ── Root schema ─────────────────────────────────────────────── */

const curriculumPageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "curriculum-page-singleton" },

    // Hero / header
    title: { type: String, default: "Our Curriculum" },
    subtitle: {
      type: String,
      default:
        "Comprehensive academic programs preparing students for excellence in the CBC and 8-4-4 curriculum systems",
    },
    heroImage: { type: String, default: "" },
    heroOverlayText: { type: String, default: "Curriculum at Kangaru Girls" },

    // Intro paragraph
    intro: {
      type: String,
      default:
        "Kangaru Girls Senior School offers a rich and diverse curriculum designed to equip students with the knowledge, skills, and attitudes needed for success in a rapidly evolving world. Our academic programs span STEM, Social Sciences, and Arts & Sports pathways.",
    },

    // School profile info (admin-editable, not hardcoded)
    schoolName: { type: String, default: "KANGARU GIRLS' SENIOR SCHOOL" },
    schoolLocation: { type: String, default: "EMBU" },
    schoolCategory: { type: String, default: "REGULAR" },

    // Subject combination streams
    streams: [streamSchema],

    // Content sections (replaces all 7 subpages)
    sections: [sectionSchema],
  },
  { timestamps: true }
);

/* ── Default streams (KCSE subject combinations) ─────────────── */

export const defaultStreams = [
  {
    name: "STEM",
    icon: "🔬",
    displayOrder: 1,
    active: true,
    combinations: [
      { code: "ST2007", subjects: ["Business Studies", "Computer Studies", "Physics"], active: true },
      { code: "ST2067", subjects: ["Agriculture", "Computer Studies", "Physics"], active: true },
      { code: "ST2075", subjects: ["Agriculture", "Geography", "Physics"], active: true },
      { code: "ST2097", subjects: ["Biology", "Business Studies", "Computer Studies"], active: true },
      { code: "ST2065", subjects: ["Core Mathematics", "Agriculture", "Computer Studies"], active: true },
      { code: "ST2018", subjects: ["Computer Studies", "Geography", "Physics"], active: true },
      { code: "ST1046", subjects: ["Biology", "Chemistry", "Computer Studies"], active: true },
      { code: "ST2013", subjects: ["Chemistry", "Computer Studies", "Geography"], active: true },
      { code: "ST2044", subjects: ["Agriculture", "Biology", "Business Studies"], active: true },
      { code: "ST2050", subjects: ["Agriculture", "Business Studies", "Geography"], active: true },
      { code: "ST2061", subjects: ["Agriculture", "Computer Studies", "General Science"], active: true },
      { code: "ST2072", subjects: ["Core Mathematics", "Agriculture", "Geography"], active: true },
      { code: "ST2099", subjects: ["Business Studies", "Chemistry", "Computer Studies"], active: true },
      { code: "ST1020", subjects: ["Core Mathematics", "Chemistry", "Physics"], active: true },
    ],
  },
  {
    name: "Social Sciences",
    icon: "📖",
    displayOrder: 2,
    active: true,
    combinations: [
      { code: "SS2033", subjects: ["Computer Studies", "Geography", "Islamic Religious Education"], active: true },
      { code: "SS2112", subjects: ["Business Studies", "Christian Religious Education", "French"], active: true },
      { code: "SS2061", subjects: ["Business Studies", "Geography", "Literature in English"], active: true },
      { code: "SS2024", subjects: ["Computer Studies", "Geography", "History & Citizenship"], active: true },
      { code: "SS2056", subjects: ["Core Mathematics", "Business Studies", "Geography"], active: true },
      { code: "SS2110", subjects: ["Business Studies", "Fasihi ya Kiswahili", "Islamic Religious Education"], active: true },
      { code: "SS2115", subjects: ["Business Studies", "Christian Religious Education", "General Science"], active: true },
      { code: "SS2018", subjects: ["Fasihi ya Kiswahili", "Geography", "History & Citizenship"], active: true },
      { code: "SS1080", subjects: ["Business Studies", "Fasihi ya Kiswahili", "Literature in English"], active: true },
    ],
  },
  {
    name: "Arts & Sports",
    icon: "🎯",
    displayOrder: 3,
    active: true,
    combinations: [
      { code: "AS2009", subjects: ["Biology", "Geography", "Sports & Recreation"], active: true },
      { code: "AS2003", subjects: ["Biology", "Computer Studies", "Sports & Recreation"], active: true },
      { code: "AS2020", subjects: ["General Science", "Islamic Religious Education", "Sports & Recreation"], active: true },
      { code: "AS2002", subjects: ["Biology", "Business Studies", "Sports & Recreation"], active: true },
      { code: "AS2007", subjects: ["Biology", "Fasihi ya Kiswahili", "Sports & Recreation"], active: true },
      { code: "AS2008", subjects: ["Biology", "French", "Sports & Recreation"], active: true },
      { code: "AS2019", subjects: ["Christian Religious Education", "General Science", "Sports & Recreation"], active: true },
      { code: "AS2004", subjects: ["Biology", "Christian Religious Education", "Sports & Recreation"], active: true },
      { code: "AS2022", subjects: ["Fasihi ya Kiswahili", "General Science", "Sports & Recreation"], active: true },
      { code: "AS2023", subjects: ["French", "General Science", "Sports & Recreation"], active: true },
    ],
  },
];

/* ── Default sections (replaces the 7 empty subpages) ────────── */

export const defaultSections = [
  {
    key: "overview",
    heading: "Curriculum Overview",
    body: "Our school follows both the 8-4-4 and CBC curriculum systems, offering a comprehensive education that prepares students for national examinations and beyond. The curriculum emphasizes critical thinking, practical skills, and holistic development.",
    active: true,
    displayOrder: 1,
  },
  {
    key: "secondary",
    heading: "Senior Secondary Curriculum",
    body: "The senior secondary program (Grade 10-12 / Form 3-4) focuses on specialization through carefully designed subject combinations across three pathways: STEM, Social Sciences, and Arts & Sports. Students select combinations based on their strengths, interests, and career aspirations.",
    active: true,
    displayOrder: 2,
  },
  {
    key: "assessment",
    heading: "Assessment & Examinations",
    body: "Students are continuously assessed through class assignments, practical work, and termly examinations. The Kenya Certificate of Secondary Education (KCSE) is the culminating national examination. Our assessment approach ensures students are well-prepared and confident.",
    active: true,
    displayOrder: 3,
  },
  {
    key: "syllabus",
    heading: "Syllabus & Resources",
    body: "We follow the Kenya Institute of Curriculum Development (KICD) approved syllabus. Schemes of work, term outlines, and downloadable resources are made available to students and parents through this portal.",
    active: true,
    displayOrder: 4,
  },
  {
    key: "careers",
    heading: "Career Guidance & Pathways",
    body: "Our career guidance program helps students make informed decisions about subject choices and future career paths. We provide mentorship, career talks, and university placement support to ensure every student is equipped for their chosen profession.",
    active: true,
    displayOrder: 5,
  },
];

const CurriculumPage =
  mongoose.models?.CurriculumPage ||
  mongoose.model("CurriculumPage", curriculumPageSchema);

export default CurriculumPage;
