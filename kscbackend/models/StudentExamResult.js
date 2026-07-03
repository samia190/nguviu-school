// models/StudentExamResult.js
import mongoose from "mongoose";

const StudentExamResultSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    
    // Scoring
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean },
    grade: { type: String }, // A, B, C, D, F
    
    // Proctoring assessment
    trustScore: { type: Number }, // 0-100, higher is better
    proctoringFlags: [
      {
        type: String,
        severity: String,
        description: String,
        timestamp: Date
      }
    ],
    
    // Result details
    questionWiseAnalysis: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        marks: Number,
        maxMarks: Number,
        isCorrect: Boolean,
        timeSpent: Number // seconds
      }
    ],
    
    // Feedback
    teacherFeedback: { type: String },
    studentFeedback: { type: String },
    
    // Timestamps
    attemptNumber: { type: Number, default: 1 },
    gradedAt: { type: Date },
    reviewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
StudentExamResultSchema.index({ studentId: 1, examId: 1 });
StudentExamResultSchema.index({ passed: 1, percentage: 1 });

export default mongoose.models?.StudentExamResult || 
  mongoose.model("StudentExamResult", StudentExamResultSchema);
