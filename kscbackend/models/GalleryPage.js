// models/GalleryPage.js
import mongoose from "mongoose";

const CLD = "https://res.cloudinary.com/ddm1dgws8/image/upload";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: "", maxlength: 500 },
  albumId: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const albumSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  coverImage: { type: String, default: "" },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const galleryPageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "gallery-page-singleton" },
    title: { type: String, default: "School Gallery" },
    subtitle: {
      type: String,
      default:
        "Explore highlights from school life, events, and activities. Click on any image to view it in full screen.",
    },
    heroImage: {
      type: String,
      default: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5535.jpg`,
    },
    heroOverlayText: { type: String, default: "Explore Our School Gallery" },
    albums: [albumSchema],
    images: [imageSchema],
  },
  { timestamps: true }
);

// Default albums (5 categories)
export const defaultAlbums = [
  { name: "Campus Life", description: "Daily life and moments at Kangaru Girls School", displayOrder: 1, active: true },
  { name: "Academics", description: "Academic programs, classrooms, and learning activities", displayOrder: 2, active: true },
  { name: "Sports & Activities", description: "Sports, athletics, and co-curricular activities", displayOrder: 3, active: true },
  { name: "Events & Celebrations", description: "School events, ceremonies, and celebrations", displayOrder: 4, active: true },
  { name: "Facilities", description: "School buildings, grounds, and infrastructure", displayOrder: 5, active: true },
];

// Default images (3 per album = 15 total, linked to albums in getOrCreate)
export const defaultImages = [
  // Campus Life
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5353.jpg`, caption: "School Life", featured: true, active: true, displayOrder: 1 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5364.jpg`, caption: "Campus View", featured: false, active: true, displayOrder: 2 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5372.jpg`, caption: "Our Students", featured: false, active: true, displayOrder: 3 },
  // Academics
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5400.jpg`, caption: "Academic Programs", featured: false, active: true, displayOrder: 4 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5403.jpg`, caption: "Learning Environment", featured: false, active: true, displayOrder: 5 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5441.jpg`, caption: "In the Classroom", featured: false, active: true, displayOrder: 6 },
  // Sports & Activities
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5410.jpg`, caption: "Sports Day", featured: true, active: true, displayOrder: 7 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5411.jpg`, caption: "Athletics", featured: false, active: true, displayOrder: 8 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5613.jpg`, caption: "Sports Field", featured: false, active: true, displayOrder: 9 },
  // Events & Celebrations
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5427.jpg`, caption: "Cultural Day", featured: true, active: true, displayOrder: 10 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5472.jpg`, caption: "Prize Giving", featured: false, active: true, displayOrder: 11 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5515.jpg`, caption: "Graduation", featured: false, active: true, displayOrder: 12 },
  // Facilities
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5712.jpg`, caption: "School Building", featured: false, active: true, displayOrder: 13 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5766.jpg`, caption: "School Facilities", featured: false, active: true, displayOrder: 14 },
  { url: `${CLD}/w_800,q_auto,f_auto/kangaru/DSC_5781.jpg`, caption: "Modern Facilities", featured: false, active: true, displayOrder: 15 },
];

const GalleryPage =
  mongoose.models?.GalleryPage ||
  mongoose.model("GalleryPage", galleryPageSchema);

export default GalleryPage;
