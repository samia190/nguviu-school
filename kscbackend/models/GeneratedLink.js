// models/GeneratedLink.js
import mongoose from "mongoose";

const GeneratedLinkSchema = new mongoose.Schema(
  {
    // Link identification
    shortCode: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    
    // Metadata
    title: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    
    // Access control
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    password: { type: String }, // Optional password protection
    maxAccesses: { type: Number }, // Max number of clicks before expiration
    
    // Expiration
    expiresAt: { type: Date },
    isExpired: { type: Boolean, default: false },
    
    // Analytics
    accessCount: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    
    // Visitor tracking
    visitorSessions: [
      {
        visitorId: String, // Anonymous or user ID
        accessTime: Date,
        referrer: String,
        userAgent: String,
        ipAddress: String,
        deviceType: String,
        location: {
          country: String,
          city: String,
          lat: Number,
          lng: Number
        },
        duration: Number // seconds spent
      }
    ],
    
    // Metadata
    qrCodeUrl: { type: String }, // Generated QR code URL
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for faster queries
GeneratedLinkSchema.index({ createdBy: 1, createdAt: -1 });
GeneratedLinkSchema.index({ expiresAt: 1 });
GeneratedLinkSchema.index({ shortCode: 1 });

export default mongoose.models?.GeneratedLink || 
  mongoose.model("GeneratedLink", GeneratedLinkSchema);
