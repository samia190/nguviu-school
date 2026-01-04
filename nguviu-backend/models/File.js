// models/File.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },

    // metadata from student submission form
    level: { type: String, default: "" },
    subject: { type: String, default: "" },
    notes: { type: String, default: "" },
    studentEmail: { type: String, default: "" },
    studentRole: { type: String, default: "" },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: "updatedAt" } }
);

export default mongoose.model("File", fileSchema);
