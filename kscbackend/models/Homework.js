// models/Homework.js
import mongoose from "mongoose";

const HomeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    class: { type: String, required: true }, // e.g., "Form 1", "Form 2", etc.
    stream: { type: String },
    academicYear: { type: String },
    term: { type: String },
    topic: { type: String },
    department: { type: String },
    resourceType: {
      type: String,
      enum: ["notes", "homework", "assignment", "revision-paper", "practical", "past-paper", "video", "image", "presentation", "pdf", "zip", "external-link", "other"],
      default: "notes"
    },
    teacher: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true }
    },
    dueDate: { type: Date },
    contentType: {
      type: String,
      enum: ["assignment", "exam", "notes", "classwork", "revision", "practical", "past-paper", "resource"],
      default: "notes"
    },
    visibility: {
      type: String,
      enum: ["my-class", "selected-classes", "selected-stream", "whole-school", "revision-library", "archived"],
      default: "whole-school"
    },
    allowedClasses: [{ type: String }],
    allowedStreams: [{ type: String }],
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
    viewCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
HomeworkSchema.index({ teacher: 1, subject: 1, class: 1, academicYear: 1 });
HomeworkSchema.index({ status: 1, visibility: 1 });
HomeworkSchema.index({ createdAt: -1 });

export default mongoose.models?.Homework || mongoose.model("Homework", HomeworkSchema);
