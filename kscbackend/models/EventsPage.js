import mongoose from "mongoose";

const eventItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date },
  endDate: { type: Date },
  location: { type: String, default: "" },
  category: {
    type: String,
    enum: ["academic", "sports", "cultural", "religious", "administrative", "social", "other"],
    default: "other",
  },
  imageUrl: { type: String, default: "" },
  imageAlt: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  color: { type: String, default: "#f3f4f6" },
  linkUrl: { type: String, default: "" },
}, { timestamps: true });

const eventsPageSchema = new mongoose.Schema({
  // Page settings
  title: { type: String, default: "School Events" },
  intro: { type: String, default: "Discover our upcoming and recent events at Kangaru Girls Senior School" },
  heroImage: { type: String, default: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5454.jpg" },
  heroOverlayText: { type: String, default: "Stay connected with everything happening at our school" },

  // Events array
  events: [eventItemSchema],
}, { timestamps: true });

// ─── Default events ────────────────────────────────────────────
const CLD = "https://res.cloudinary.com/ddm1dgws8/image/upload/w_600,q_auto,f_auto/kangaru";

export const defaultEvents = [
  {
    title: "Open Day",
    description: "Visit our campus and learn about our programs, meet teachers, and experience Kangaru Girls School firsthand.",
    date: new Date("2025-02-15"),
    location: "School Campus",
    category: "administrative",
    imageUrl: `${CLD}/DSC_5443.jpg`,
    featured: true,
    active: true,
    displayOrder: 1,
  },
  {
    title: "Science & Innovation Week",
    description: "A week dedicated to science experiments, innovation showcases, and hands-on STEM activities.",
    date: new Date("2025-03-10"),
    location: "Science Block",
    category: "academic",
    imageUrl: `${CLD}/DSC_5447.jpg`,
    featured: false,
    active: true,
    displayOrder: 2,
  },
  {
    title: "Inter-School Sports",
    description: "Competitive sports events with neighboring schools in athletics, volleyball, and more.",
    date: new Date("2025-04-05"),
    location: "Sports Ground",
    category: "sports",
    imageUrl: `${CLD}/DSC_5462.jpg`,
    featured: true,
    active: true,
    displayOrder: 3,
  },
  {
    title: "Career Day",
    description: "Professionals from various fields share career guidance and mentorship with students.",
    date: new Date("2025-05-20"),
    location: "School Hall",
    category: "academic",
    imageUrl: `${CLD}/DSC_5489.jpg`,
    featured: false,
    active: true,
    displayOrder: 4,
  },
  {
    title: "Music Festival",
    description: "Annual music festival featuring student performances, choir competitions, and instrumental showcases.",
    date: new Date("2025-06-15"),
    location: "School Grounds",
    category: "cultural",
    imageUrl: `${CLD}/DSC_5502.jpg`,
    featured: false,
    active: true,
    displayOrder: 5,
  },
  {
    title: "Graduation Ceremony",
    description: "Celebrating our graduating class achievements and welcoming them to the next chapter of their lives.",
    date: new Date("2025-11-28"),
    location: "Main Hall",
    category: "administrative",
    imageUrl: `${CLD}/DSC_5515.jpg`,
    featured: true,
    active: true,
    displayOrder: 6,
  },
];

const EventsPage = mongoose.model("EventsPage", eventsPageSchema);
export default EventsPage;
