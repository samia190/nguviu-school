// models/LinkAnalytic.js
import mongoose from "mongoose";

const LinkAnalyticSchema = new mongoose.Schema(
  {
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: "GeneratedLink", required: true },
    
    // Visitor information
    visitorId: { type: String }, // Anonymous ID or user ID
    visitorIp: { type: String },
    visitorEmail: { type: String },
    
    // Access details
    timestamp: { type: Date, default: Date.now },
    referrer: { type: String },
    userAgent: { type: String },
    
    // Device & location
    deviceType: { type: String }, // desktop, mobile, tablet
    osName: { type: String },
    browserName: { type: String },
    
    // Geolocation
    country: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    
    // Interaction
    duration: { type: Number }, // seconds
    wasSuccessful: { type: Boolean, default: true },
    passwordRequired: { type: Boolean, default: false },
    passwordCorrect: { type: Boolean },
    
    // Custom data
    customData: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

// Index for faster queries
LinkAnalyticSchema.index({ linkId: 1, timestamp: -1 });
LinkAnalyticSchema.index({ visitorIp: 1 });
LinkAnalyticSchema.index({ country: 1 });

export default mongoose.models?.LinkAnalytic || 
  mongoose.model("LinkAnalytic", LinkAnalyticSchema);
