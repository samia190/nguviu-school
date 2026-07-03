// models/ProctoringLog.js
import mongoose from "mongoose";

const ProctoringLogSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    
    // Event details
    eventType: { 
      type: String, 
      enum: [
        "window_blur",
        "window_focus",
        "copy_paste",
        "right_click",
        "page_visibility",
        "tab_switch",
        "screenshot_detected",
        "recording_started",
        "suspicious_movement",
        "multiple_faces",
        "no_face",
        "auto_save",
        "answer_submitted",
        "activity_update",
        "camera_started",
        "camera_stopped",
        "question_viewed",
        "question_answered",
        "fullscreen_enter",
        "fullscreen_exit",
        "refresh_or_close",
        "file_uploaded",
        "print_attempt"
      ],
      required: true 
    },
    
    severity: { 
      type: String, 
      enum: ["info", "warning", "critical"], 
      required: true 
    },
    
    // Details
    description: { type: String },
    details: mongoose.Schema.Types.Mixed,
    
    // Timestamp
    timestamp: { type: Date, default: Date.now },
    
    // Response
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Index for faster queries
ProctoringLogSchema.index({ sessionId: 1, timestamp: 1 });
ProctoringLogSchema.index({ studentId: 1, severity: 1 });
ProctoringLogSchema.index({ eventType: 1 });

export default mongoose.models?.ProctoringLog || 
  mongoose.model("ProctoringLog", ProctoringLogSchema);
