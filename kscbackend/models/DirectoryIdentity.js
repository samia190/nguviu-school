import mongoose from "mongoose";

const DirectoryIdentitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ["student", "teacher", "staff", "admin", "superadmin"], index: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  phone: { type: String, trim: true },
  staffId: { type: String, trim: true, sparse: true, unique: true, index: true },
  admissionNumber: { type: String, trim: true, sparse: true, unique: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", sparse: true, unique: true },
  class: { type: String, trim: true },
  stream: { type: String, trim: true },
  curriculum: { type: String, enum: ["CBE", "8-4-4"] },
  grade: { type: String, trim: true },
  form: { type: String, trim: true },
  department: { type: String, trim: true },
  position: { type: String, trim: true },
  subjects: [{ type: String }],
  accountStatus: { type: String, enum: ["pre_registered", "invited", "active", "blocked"], default: "pre_registered", index: true },
  accountUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true, unique: true },
  registrationLocked: { type: Boolean, default: false },
  invitedAt: { type: Date },
  activatedAt: { type: Date },
}, { timestamps: true });

DirectoryIdentitySchema.index({ role: 1, accountStatus: 1 });

export default mongoose.models?.DirectoryIdentity || mongoose.model("DirectoryIdentity", DirectoryIdentitySchema);
