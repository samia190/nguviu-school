// models/GalleryItem.js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  originalName: String,
  url: String,
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
