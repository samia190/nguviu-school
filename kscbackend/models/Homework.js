// models/Homework.js
import mongoose from "mongoose";

const HomeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    class: { type: String, required: true }, // e.g., "Form 1", "Form 2", etc.
    teacher: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true }
    },
    dueDate: { type: Date },
    contentType: {
      type: String,
      enum: ["assignment", "exam", "notes", "classwork"],
      default: "assignment"
    },
    attachments: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        originalName: String,
        name: String,
        url: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published"
    },
    isPublic: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
HomeworkSchema.index({ teacher: 1, subject: 1, class: 1 });
HomeworkSchema.index({ status: 1 });

export default mongoose.models?.Homework || mongoose.model("Homework", HomeworkSchema);
