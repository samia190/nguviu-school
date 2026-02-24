// models/GalleryItem.js
import mongoose from "mongoose";

// ========== UPDATED: Added thumbnail, filename, and extension fields for proper URL handling ==========
const attachmentSchema = new mongoose.Schema({
  originalName: String,
  filename: String,        // Filename on disk (for deletion)
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // URL must either be http(s) or start with /
        return /^(https?:\/\/|\/)/.test(v);
      },
      message: 'URL must be either absolute (http/https) or relative (starting with /)'
    }
  },
  extension: {
    type: String,          // File extension, e.g. '.jpg', '.png', '.mp4'
    default: '',
    validate: {
      validator: function(v) {
        // Extension should start with dot or be empty
        return v === '' || /^\.[a-z0-9]+$/i.test(v);
      },
      message: 'Extension should be empty or start with a dot followed by alphanumeric characters'
    }
  },
  thumbnail: String,       // Optional: video thumbnail URL
  mimetype: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled',
    maxlength: 255
  },
  body: {
    type: String,
    default: '',
    maxlength: 5000
  },
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models?.GalleryItem || mongoose.model("GalleryItem", galleryItemSchema);
