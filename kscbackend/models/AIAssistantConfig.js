// models/AIAssistantConfig.js
// Separate from support chat config, this manages AI assistant settings
import mongoose from "mongoose";
// In your main website, import the same models:


const AIAssistantConfigSchema = new mongoose.Schema(
  {
    // Configuration name
    name: { type: String, required: true },
    description: { type: String },
    
    // AI Model settings
    model: { type: String, default: "gpt-3.5-turbo" },
    systemPrompt: { type: String, required: true },
    
    // Parameters
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 2000 },
    topP: { type: Number, default: 1, min: 0, max: 1 },
    frequencyPenalty: { type: Number, default: 0 },
    presencePenalty: { type: Number, default: 0 },
    
    // Context
    contextWindow: { type: Number, default: 5 }, // Number of previous messages to consider
    
    // Status
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: false }, // Available to all users or specific role
    allowedRoles: [{ type: String }], // admin, teacher, student, parent
    
    // Access control
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // Usage stats
    usageCount: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    
    // Metadata
    tags: [{ type: String }],
    version: { type: Number, default: 1 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
AIAssistantConfigSchema.index({ createdBy: 1, isActive: 1 });
AIAssistantConfigSchema.index({ isPublic: 1, isActive: 1 });

export default mongoose.models?.AIAssistantConfig || 
  mongoose.model("AIAssistantConfig", AIAssistantConfigSchema);
