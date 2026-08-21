import mongoose from "mongoose";

const AIAssistantConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Conversation" },
    configId: { type: mongoose.Schema.Types.ObjectId, ref: "AIAssistantConfig" },
    messageCount: { type: Number, default: 0 },
    tokenCount: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AIAssistantConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export default mongoose.models?.AIAssistantConversation || 
  mongoose.model("AIAssistantConversation", AIAssistantConversationSchema);
