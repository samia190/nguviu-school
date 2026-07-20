// models/StudentProfile.js
import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // CBE or 8-4-4
    curriculum: { type: String, required: true, enum: ["CBE", "8-4-4"] },

    admissionNumber: { type: String, index: true, sparse: true },
    stream: { type: String },
    yearOfAdmission: { type: Number },

    // CBE-specific
    grade: { type: String }, // e.g. "Grade 7", "Grade 8", "Grade 9"

    // 8-4-4-specific
    form: { type: String }, // e.g. "Form 1", "Form 2", "Form 3", "Form 4"

    dateOfBirth: { type: String }, // YYYY-MM-DD

    photoUrl: { type: String, default: "" },

    // Emergency / parent contact info
    guardianName: { type: String },
    guardianPhone: { type: String },
    guardianRelation: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models?.StudentProfile ||
  mongoose.model("StudentProfile", StudentProfileSchema);
