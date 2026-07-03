// models/Exam.js
import mongoose from "mongoose";

const ExamAttachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String },
    url: { type: String, required: true },
    downloadUrl: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String },
    description: { type: String },
    pdfUrl: { type: String }, // Backward-compatible URL to exam PDF/resource
    pdfKey: { type: String }, // Cloudinary or S3 key
    attachments: [ExamAttachmentSchema],
    
    // Exam settings
    duration: { type: Number, required: true }, // minutes
    totalMarks: { type: Number, default: 100 },
    passThreshold: { type: Number, default: 40 }, // percentage
    
    // Proctoring settings
    proctoringLevel: { 
      type: String, 
      enum: ["strict", "moderate", "light"], 
      default: "moderate" 
    },
    trustScoreThreshold: { type: Number, default: 40 },
    allowedMaterials: [{ type: String }],
    
    // Scheduling
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    instructions: { type: String },
    
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
ExamSchema.index({ createdBy: 1, isActive: 1 });
ExamSchema.index({ scheduledStart: 1, scheduledEnd: 1 });

export default mongoose.models?.Exam || mongoose.model("Exam", ExamSchema);
