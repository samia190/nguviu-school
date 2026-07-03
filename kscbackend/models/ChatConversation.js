// models/ChatConversation.js
import mongoose from "mongoose";

const ChatConversationSchema = new mongoose.Schema(
  {
    // User information
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Conversation metadata
    title: { type: String },
    model: { type: String, default: "gpt-3.5-turbo" },
    
    // Status
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    
    // Statistics
    messageCount: { type: Number, default: 0 },
    tokenCount: { type: Number, default: 0 },
    
    // Timestamps
    startedAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
ChatConversationSchema.index({ userId: 1, createdAt: -1 });
ChatConversationSchema.index({ isPinned: 1, lastMessageAt: -1 });

export default mongoose.models?.ChatConversation || 
  mongoose.model("ChatConversation", ChatConversationSchema);
