import mongoose from "mongoose";

/**
 * AboutPage Model
 * Unified single collection for all about page content:
 * - Page settings (title, intro)
 * - Hero section (image, title, subtitle)
 * - Motto, Vision, Mission, Promise
 * - Core values (editable list)
 * - Leadership (embedded: principal + deputies with name, photo, remarks, department)
 */

const LeadershipMemberSchema = new mongoose.Schema(
  {
    photoUrl: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const DeputyMemberSchema = new mongoose.Schema(
  {
    photoUrl: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: ["Administration", "Academic", "Discipline", "Finance", "Other"],
      default: "Administration",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const CoreValueSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      default: 0,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const HeroContentSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      default: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5392.jpg",
    },
    title: {
      type: String,
      default: "WELCOME TO KANGARU GIRLS SCHOOL",
    },
    subtitle: {
      type: String,
      default: "A nurturing environment where young girls grow into confident, responsible leaders.",
    },
  },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const LeadershipSchema = new mongoose.Schema(
  {
    principal: LeadershipMemberSchema,
    deputies: [DeputyMemberSchema],
  },
  { _id: false }
);

const AboutPageSchema = new mongoose.Schema(
  {
    // Page settings
    title: {
      type: String,
      default: "About KANGARU GIRLS' SCHOOL",
    },
    intro: {
      type: String,
      default: "KANGARU GIRLS' SCHOOL is a center of excellence dedicated to nurturing young girls into confident, capable leaders.",
    },

    // Hero section
    heroContent: HeroContentSchema,

    // Motto, Vision, Mission, Promise
    motto: SectionSchema,
    vision: SectionSchema,
    mission: SectionSchema,
    promise: SectionSchema,

    // Core values (editable list)
    coreValues: {
      type: [CoreValueSchema],
      default: [
        { order: 1, value: "Integrity" },
        { order: 2, value: "Professionalism" },
        { order: 3, value: "Teamwork" },
        { order: 4, value: "Excellence" },
        { order: 5, value: "Courtesy" },
        { order: 6, value: "Fidelity to Law" },
      ],
    },

    // Leadership (principal + deputies with embedded photos, names, remarks)
    leadership: LeadershipSchema,

    // Page status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Theme settings
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

/**
 * Default motto, vision, mission
 */
const defaultMotto = {
  heading: "MOTTO",
  text: "Grow in Grace",
};

const defaultVision = {
  heading: "VISION",
  text: "To be a centre of excellence in holistic education in Kenya for global competitiveness",
};

const defaultMission = {
  heading: "MISSION",
  text: "To create an enabling environment where learners are equipped with knowledge, skills and attitudes to excel in a globally competitive society",
};

const defaultPromise = {
  heading: "Our Promise",
  text: "Excellence, Our Choice",
};

/**
 * Default core values
 */
const defaultCoreValues = [
  { order: 1, value: "Integrity" },
  { order: 2, value: "Professionalism" },
  { order: 3, value: "Teamwork" },
  { order: 4, value: "Excellence" },
  { order: 5, value: "Courtesy" },
  { order: 6, value: "Fidelity to Law" },
];

/**
 * Default hero
 */
const defaultHero = {
  imageUrl: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5392.jpg",
  title: "WELCOME TO KANGARU GIRLS SCHOOL",
  subtitle: "A nurturing environment where young girls grow into confident, responsible leaders.",
};

export {
  defaultMotto,
  defaultVision,
  defaultMission,
  defaultPromise,
  defaultCoreValues,
  defaultHero,
};

export default mongoose.model("RoutineAboutPage", AboutPageSchema, "aboutpages");
