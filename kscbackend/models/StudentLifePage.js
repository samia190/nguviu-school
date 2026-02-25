// models/StudentLifePage.js
import mongoose from "mongoose";

const CLD = "https://res.cloudinary.com/ddm1dgws8/image/upload";

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  description: { type: String, default: "", maxlength: 5000 },
  category: {
    type: String,
    enum: ["sports", "clubs", "activities", "traditions", "academics", "community"],
    default: "activities",
  },
  imageUrl: { type: String, default: "" },
  imageAlt: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const studentLifePageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "student-life-page-singleton" },
    title: { type: String, default: "Student Life" },
    subtitle: {
      type: String,
      default:
        "Explore the vibrant life and activities at Kangaru Girls Senior School",
    },
    heroImage: {
      type: String,
      default: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5384.jpg`,
    },
    heroOverlayText: {
      type: String,
      default: "Student Life at Kangaru Girls",
    },
    activities: [activitySchema],
  },
  { timestamps: true }
);

export const defaultActivities = [
  // Sports
  {
    title: "Sports Day",
    category: "sports",
    description:
      "Annual sports day featuring athletics, swimming, and team sports competitions where students showcase their athletic abilities.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5410.jpg`,
    featured: true,
    active: true,
    displayOrder: 1,
  },
  {
    title: "Athletics",
    category: "sports",
    description:
      "Track and field events where students compete at inter-school and regional level.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5432.jpg`,
    active: true,
    displayOrder: 2,
  },
  {
    title: "Volleyball",
    category: "sports",
    description:
      "Competitive volleyball training and tournaments building teamwork and sportsmanship.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5614.jpg`,
    active: true,
    displayOrder: 3,
  },
  // Clubs
  {
    title: "Drama Club",
    category: "clubs",
    description:
      "Students showcase their acting talents in plays and drama performances throughout the school year.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5415.jpg`,
    active: true,
    displayOrder: 4,
  },
  {
    title: "Debate Club",
    category: "clubs",
    description:
      "Developing public speaking and critical thinking skills through competitive debate sessions.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5440.jpg`,
    active: true,
    displayOrder: 5,
  },
  {
    title: "Music Club",
    category: "clubs",
    description:
      "Students explore musical talents through choir, instrumental music, and music festivals.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5501.jpg`,
    active: true,
    displayOrder: 6,
  },
  // Activities
  {
    title: "Science Fair",
    category: "activities",
    description:
      "Students present innovative science projects and experiments, pushing the boundaries of discovery.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5420.jpg`,
    active: true,
    displayOrder: 7,
  },
  {
    title: "Community Service",
    category: "community",
    description:
      "Students give back to the community through various outreach programs and volunteer work.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5456.jpg`,
    active: true,
    displayOrder: 8,
  },
  {
    title: "Environmental Club",
    category: "community",
    description:
      "Promoting environmental awareness through tree planting, recycling, and conservation activities.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5728.jpg`,
    active: true,
    displayOrder: 9,
  },
  // Traditions
  {
    title: "Cultural Day",
    category: "traditions",
    description:
      "Celebrating our diverse cultures and traditions through music, dance, food, and vibrant performances.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5427.jpg`,
    featured: true,
    active: true,
    displayOrder: 10,
  },
  {
    title: "Prize Giving Day",
    category: "traditions",
    description:
      "Annual ceremony recognizing academic and extracurricular achievements of our students.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5472.jpg`,
    active: true,
    displayOrder: 11,
  },
  {
    title: "Founders Day",
    category: "traditions",
    description:
      "Commemorating the founding of our school with special ceremonies and celebrations.",
    imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5463.jpg`,
    active: true,
    displayOrder: 12,
  },
];

const StudentLifePage =
  mongoose.models?.StudentLifePage ||
  mongoose.model("StudentLifePage", studentLifePageSchema);

export default StudentLifePage;
