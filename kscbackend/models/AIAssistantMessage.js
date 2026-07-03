// models/AIAssistantMessage.js
// Separate from support chat widget, this is for user-to-AI conversations
import mongoose from "mongoose";

const AIAssistantMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "AIAssistantConversation", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Message content
    role: { 
      type: String, 
      enum: ["user", "assistant", "system"], 
      default: "user" 
    },
    content: { type: String, required: true },
    
    // Metadata
    tokenCount: { type: Number },
    model: { type: String },
    
    // Formatting
    contentType: { 
      type: String, 
      enum: ["text", "markdown", "code", "image"], 
      default: "text" 
    },
    
    // Attachments
    attachments: [
      {
        type: String,
        name: String,
        url: String
      }
    ],
    
    // Feedback
    isFavorite: { type: Boolean, default: false },
    feedback: { type: String }, // user feedback (helpful/not helpful)
    
    // Timestamps
    timestamp: { type: Date, default: Date.now },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
AIAssistantMessageSchema.index({ conversationId: 1, timestamp: 1 });
AIAssistantMessageSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models?.AIAssistantMessage || 
  mongoose.model("AIAssistantMessage", AIAssistantMessageSchema);
