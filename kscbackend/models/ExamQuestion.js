// models/ExamQuestion.js
import mongoose from "mongoose";

const ExamQuestionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    questionNumber: { type: Number, required: true },
    questionText: { type: String, required: true },
    
    // Question type
    type: {
      type: String,
      enum: ["mcq", "short", "essay", "upload", "image"],
      default: "mcq"
    },
    requiresWorking: { type: Boolean, default: false },
    
    // MCQ options
    options: [
      {
        text: String,
        isCorrect: Boolean,
        explanation: String
      }
    ],
    
    // Marks
    marks: { type: Number, default: 1 },
    order: { type: Number },
    
    // Image support
    imageUrl: { type: String },
    imageThumbnail: { type: String },
    
    // Metadata
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    requireWorking: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
ExamQuestionSchema.index({ examId: 1, questionNumber: 1 });

export default mongoose.models?.ExamQuestion || 
  mongoose.model("ExamQuestion", ExamQuestionSchema);
