// models/ParentProfile.js
import mongoose from "mongoose";

const ParentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    phone: { type: String },

    occupation: { type: String },

    photoUrl: { type: String, default: "" },

    // Admission numbers provided at signup (may not yet match a registered student)
    providedAdmissionNumbers: [{ type: String }],

    // Linked after admin verifies / student registers
    linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.models?.ParentProfile ||
  mongoose.model("ParentProfile", ParentProfileSchema);
