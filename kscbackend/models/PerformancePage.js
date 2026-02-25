import mongoose from "mongoose";

/**
 * PerformancePage Model
 * Unified single-document collection for public school performance page:
 * - Page settings (title, intro, headings)
 * - KCSE Results (year, meanScore as decimal, meanGrade)
 * - Achievements (absorbs old SchoolPerformance model)
 * - Highlights (editable text)
 * - Reports (downloadable links)
 */

const KcseResultSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    meanScore: { type: Number, required: true }, // e.g. 7.2993
    meanGrade: { type: String, required: true }, // e.g. "C+"
  },
  { _id: false }
);

const AchievementSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Term 3", "Annual"],
      default: "Annual",
    },
    category: {
      type: String,
      enum: [
        "Academic Excellence",
        "KCSE Results",
        "National Rankings",
        "Co-curricular",
        "Competitions",
        "University Admissions",
        "Other",
      ],
      default: "Other",
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    metric: { type: String, default: "" }, // e.g. "95%", "1st Place"
    ranking: { type: String, default: "" }, // e.g. "National", "County"
    published: { type: Boolean, default: true },
  },
  { _id: true }
);

const ReportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: true }
);

const PerformancePageSchema = new mongoose.Schema(
  {
    // Page settings
    title: {
      type: String,
      default: "School Performance",
    },
    intro: {
      type: String,
      default:
        "We are proud of our students' achievements and continually strive for academic excellence. Our performance reflects the dedication of our learners, teachers, and parents.",
    },
    resultsHeading: {
      type: String,
      default: "KCSE Performance Over the Years",
    },
    achievementsHeading: {
      type: String,
      default: "School Achievements",
    },
    highlightsHeading: {
      type: String,
      default: "Progress Highlights",
    },
    reportsHeading: {
      type: String,
      default: "Downloadable Reports",
    },

    // KCSE Results — real numeric data
    kcseResults: [KcseResultSchema],

    // Achievements — absorbs old SchoolPerformance model
    achievements: [AchievementSchema],

    // Highlights — editable text block
    highlights: {
      type: String,
      default:
        "• Consistent improvement in mean grade over the past years\n• Strong performance in STEM subjects and languages\n• Dedicated teaching staff committed to student success",
    },

    // Reports — downloadable file links
    reports: [ReportSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Default KCSE results — real Kangaru Girls' School data 2017-2024
 */
export const defaultKcseResults = [
  { year: 2017, meanScore: 6.731, meanGrade: "C+" },
  { year: 2018, meanScore: 7.303, meanGrade: "C+" },
  { year: 2019, meanScore: 8.032, meanGrade: "B-" },
  { year: 2020, meanScore: 7.995, meanGrade: "B-" },
  { year: 2021, meanScore: 7.53, meanGrade: "B-" },
  { year: 2022, meanScore: 6.8054, meanGrade: "C+" },
  { year: 2023, meanScore: 6.9961, meanGrade: "C+" },
  { year: 2024, meanScore: 7.2993, meanGrade: "C+" },
];

/**
 * Default highlights text
 */
export const defaultHighlights =
  "• Consistent improvement in mean grade over the past years\n• Strong performance in STEM subjects and languages\n• Dedicated teaching staff committed to student success";

export default mongoose.models?.PerformancePage ||
  mongoose.model("PerformancePage", PerformancePageSchema);
