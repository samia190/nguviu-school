// models/Content.js (ESM)
import mongoose from "mongoose";

// Attachments such as newsletters, fee structure PDFs, images, videos, etc.
const attachmentSchema = new mongoose.Schema({
  // Custom human title for the media (what you want to show)
  title: { type: String },

  // Optional longer description/caption
  description: { type: String },

  // Internal display name if needed
  name: { type: String },

  // Original filename from upload
  originalName: { type: String },

  // Relative URL (served by Express static middleware), e.g. "/uploads/file.pdf"
  url: { type: String, required: true },

  // Full absolute URL, e.g. "http:///uploads/file.pdf"
  downloadUrl: { type: String },

  mimetype: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

const ContentSchema = new mongoose.Schema(
  {
    // Logical type of content: "home", "about", "newsletter", "feestructure", etc.
    type: {
      type: String,
      required: true,
      index: true,
    },

    // Generic fields used across many pages
    title: { type: String, default: "" },
    body: { type: String, default: "" },

    // Optional intro text for some pages
    intro: { type: String, default: "" },

    // Hero / banner image URL (if used)
    heroImage: { type: String, default: "" },

    // Attachments (files/media)
    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    // Any other dynamic fields (mission, vision, posts, etc.)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Allow extra fields on Content if needed
    strict: false,
  }
);

export default mongoose.models?.Content || mongoose.model("Content", ContentSchema);
