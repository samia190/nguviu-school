import mongoose from "mongoose";

/**
 * HomePage Model
 * Unified single collection for all home page content:
 * - Page settings (title, intro)
 * - Hero section (slides, videos, images)
 * - Quick links (7 sections with child containers)
 */

const HeroItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["slide", "video", "image"],
      default: "slide",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const ChildContainerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const QuickLinkSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: false,
    },
    key: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    childContainers: [ChildContainerSchema],
    displayOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const HeroContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["slide", "video", "image"],
      default: "slide",
    },
    items: [HeroItemSchema],
  },
  { _id: false }
);

const HomePageSchema = new mongoose.Schema(
  {
    // Page settings
    title: {
      type: String,
      default: "WELCOME TO KANGARU GIRLS' SCHOOL",
    },
    intro: {
      type: String,
      default: "At our institution, we believe education is a journey of creativity, growth, and excellence...",
    },

    // Hero section (consolidated)
    heroContent: HeroContentSchema,

    // Quick links sections
    quickLinks: [QuickLinkSchema],

    // Page status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Theme settings (can expand later)
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
    strict: false, // Allow additional fields for flexibility
  }
);

/**
 * Default quick links structure
 * Used for initialization if collection is empty
 */
export const defaultQuickLinks = [
  {
    key: "about",
    title: "About Us",
    text: "Learn about our mission, history, values, and vision.",
    childContainers: [
      {
        title: "Our Vision",
        text: "To be a centre of excellence in holistic education in Kenya for global competitiveness.",
      },
      {
        title: "Leadership",
        text: "We believe in strong leadership to guide our students.",
      },
    ],
    displayOrder: 0,
    active: true,
  },
  {
    key: "admissions",
    title: "Admission Process",
    text: "See the full admission process and join our school.",
    childContainers: [
      {
        title: "Admission Requirements",
        text: "Find out the requirements to apply to our school.",
      },
      {
        title: "Scholarships",
        text: "Explore the scholarship opportunities we offer.",
      },
      {
        title: "Application Deadline",
        text: "Check the deadlines for applying for the upcoming academic year.",
      },
      {
        title: "Admission Events",
        text: "Attend our open days and information sessions.",
      },
    ],
    displayOrder: 1,
    active: true,
  },
  {
    key: "curriculum",
    title: "Curriculum Overview",
    text: "Explore subjects, programs, and academic structure.",
    childContainers: [
      {
        title: "Secondary School Curriculum",
        text: "A detailed overview of our secondary school offerings.",
      },
      {
        title: "Extracurricular Activities",
        text: "Sports, arts, and leadership programs beyond the classroom.",
      },
      {
        title: "Assessments and Exams",
        text: "Information on how we assess our students' progress.",
      },
      {
        title: "Curriculum Syllabus",
        text: "Detailed breakdown of each subject and course.",
      },
    ],
    displayOrder: 2,
    active: true,
  },
  {
    key: "staff",
    title: "Our Staff",
    text: "Meet our teachers, leadership, and support staff.",
    childContainers: [
      {
        title: "Leadership Team",
        text: "Meet the leaders guiding our institution.",
      },
      {
        title: "Teaching Staff",
        text: "Our team of dedicated educators.",
      },
      {
        title: "Support Staff",
        text: "The support team that ensures the smooth running of our school.",
      },
      {
        title: "Staff Training",
        text: "Our continuous professional development programs.",
      },
      {
        title: "Staff Wellness",
        text: "We prioritize the well-being of our staff members.",
      },
      {
        title: "Faculty Achievements",
        text: "Recognizing the accomplishments of our academic staff.",
      },
    ],
    displayOrder: 3,
    active: true,
  },
  {
    key: "gallery",
    title: "School Gallery",
    text: "Browse photos of school events and student life.",
    childContainers: [
      {
        title: "Graduation Ceremony",
        text: "Celebrate our students' achievements.",
      },
      {
        title: "Field Trips",
        text: "Our students' educational field trips and excursions.",
      },
      {
        title: "Student Performances",
        text: "Talent shows, performances, and arts exhibitions.",
      },
    ],
    displayOrder: 4,
    active: true,
  },
  {
    key: "contact",
    title: "Get in Touch",
    text: "Reach out to us for inquiries and support.",
    childContainers: [
      {
        title: "Contact Information",
        text: "Call us through the school official number on 0113688538.",
      },
      {
        title: "Whatsapp Account Details",
        text: "For any inquiry reach us through whatsapp account on +254 720 123456.",
      },
      {
        title: "Visit Us",
        text: "Plan visit to our institution and experience our learning environment.",
      },
      {
        title: "Email Us",
        text: "Send us an email at info@kangarugirls.com for any questions or support.",
      },
    ],
    displayOrder: 5,
    active: true,
  },
];

/**
 * Default hero slides
 * Used when first initializing or as fallback
 */
export const defaultHeroSlides = [
  {
    url: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5353.jpg",
    title: "Welcome to Kangaru Girls School",
    description: "A center of excellence in education",
    type: "slide",
    displayOrder: 0,
    active: true,
  },
  {
    url: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5400.jpg",
    title: "Academic Excellence",
    description: "Nurturing future leaders with knowledge and confidence",
    type: "slide",
    displayOrder: 1,
    active: true,
  },
  {
    url: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5500.jpg",
    title: "Student Life",
    description: "Vibrant community and enriching experiences",
    type: "slide",
    displayOrder: 2,
    active: true,
  },
  {
    url: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5613.jpg",
    title: "Sports & Activities",
    description: "Building character through sports and extracurricular activities",
    type: "slide",
    displayOrder: 3,
    active: true,
  },
  {
    url: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5820.jpg",
    title: "Our Campus",
    description: "A beautiful and serene learning environment",
    type: "slide",
    displayOrder: 4,
    active: true,
  },
];

export default mongoose.models?.HomePage || mongoose.model("HomePage", HomePageSchema);
