// models/TeacherProfile.js
import mongoose from "mongoose";

const TeacherProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    staffId: { type: String, index: true, sparse: true },

    subjects: [{ type: String }], // e.g. ["Mathematics", "Physics"]

    department: { type: String },

    qualifications: { type: String },

    phone: { type: String },

    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models?.TeacherProfile ||
  mongoose.model("TeacherProfile", TeacherProfileSchema);
