// models/AIMessage.js
// For AI Assistant feature (separate from ChatMessage which handles support messages)
import mongoose from "mongoose";

// In your main website, import the same models:
import { User, ChatHistory } from "./server/models";

const AIMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "AIConversation", required: true },
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
    feedback: { type: String }, // user feedback
    
    // Timestamps
    timestamp: { type: Date, default: Date.now },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
AIMessageSchema.index({ conversationId: 1, timestamp: 1 });
AIMessageSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models?.AIMessage || 
  mongoose.model("AIMessage", AIMessageSchema);
