// models/StaffProfile.js
import mongoose from "mongoose";

const StaffProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    staffId: { type: String, index: true, sparse: true },

    position: { type: String }, // e.g. "Librarian", "Lab Technician", "Bursar"

    department: { type: String },

    phone: { type: String },

    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models?.StaffProfile ||
  mongoose.model("StaffProfile", StaffProfileSchema);
