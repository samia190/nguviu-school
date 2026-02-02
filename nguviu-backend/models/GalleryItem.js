// models/GalleryItem.js
import mongoose from "mongoose";

// ========== UPDATED: Added thumbnail and filename fields for video support ==========
const attachmentSchema = new mongoose.Schema({
  originalName: String,
  filename: String,        // Filename on disk (for deletion)
  url: String,
  thumbnail: String,       // Optional: video thumbnail URL
  mimetype: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const galleryItemSchema = new mongoose.Schema({
  title: String,
  body: String,
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.GalleryItem || mongoose.model("GalleryItem", galleryItemSchema);
