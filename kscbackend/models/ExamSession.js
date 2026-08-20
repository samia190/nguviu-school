// models/ExamSession.js
import mongoose from "mongoose";

const ExamSessionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Session timing
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    expiresAt: { type: Date, required: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    submissionKey: { type: String, index: true, sparse: true },
    answerVersion: { type: Number, default: 0 },
    paperVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamPaperVersion" },
    paperChecksum: { type: String },
    lastActivityAt: { type: Date },
    
    // Session status
    status: { 
      type: String, 
      enum: ["not_started", "in_progress", "submitted", "graded", "abandoned", "expired"], 
      default: "not_started" 
    },
    
    // Live monitoring
    currentQuestionIndex: { type: Number, default: 0 },
    currentQuestionId: { type: mongoose.Schema.Types.ObjectId },
    currentAnswerPreview: { type: String },
    lastActivitySource: { type: String, default: "exam" },
    cameraEnabled: { type: Boolean, default: false },
    cameraStatus: { type: String, enum: ["off", "ready", "paused"], default: "off" },
    recordingState: {
      type: String,
      enum: ["idle", "recording", "stopped"],
      default: "idle"
    },
    recordingSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "RecordingSession" },

    // Answers
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        answer: mongoose.Schema.Types.Mixed, // Can be string, array, or file URL
        submittedAt: Date,
        marks: Number,
        isCorrect: Boolean,
        feedback: String
      }
    ],
    
    // File submissions
    submittedPdfUrl: { type: String }, // For upload-based answers
    submittedFiles: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        fileName: String,
        fileUrl: String,
        uploadedAt: Date
      }
    ],
    
    // Scoring
    totalScore: { type: Number },
    totalMarks: { type: Number },
    percentage: { type: Number },
    passed: { type: Boolean },
    gradedAt: { type: Date },
    feedback: { type: String },
    
    // Proctoring data
    trustScore: { type: Number }, // 0-100
    proofOfWork: [
      {
        timestamp: Date,
        eventType: String,
        severity: String, // info, warning, critical
        details: mongoose.Schema.Types.Mixed
      }
    ],
    
    // Auto-save tracking
    autoSavedAt: { type: Date },
    autoSaveIntervalMs: { type: Number, default: 30000 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
ExamSessionSchema.index({ examId: 1, studentId: 1 });
ExamSessionSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
ExamSessionSchema.index({ studentId: 1, status: 1 });
ExamSessionSchema.index({ startTime: 1 });

export default mongoose.models?.ExamSession || 
  mongoose.model("ExamSession", ExamSessionSchema);
