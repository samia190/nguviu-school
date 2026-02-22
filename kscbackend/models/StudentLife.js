import mongoose from "mongoose";

const studentLifeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ["sports", "clubs", "activities", "traditions"],
    default: "activities"
  },
  imageUrl: {
    type: String
  },
  imageAlt: {
    type: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  originalName: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.models?.StudentLife || mongoose.model("StudentLife", studentLifeSchema);
