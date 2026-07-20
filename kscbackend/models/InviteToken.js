// models/InviteToken.js
import mongoose from "mongoose";

const InviteTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },

    // The type of link — determines which signup form is rendered and which role is assigned
    linkType: {
      type: String,
      required: true,
      enum: ["student-CBE", "student-844", "teacher", "staff", "parent"],
    },

    // The role that will be assigned to users who register using this link
    role: {
      type: String,
      required: true,
      enum: ["student", "teacher", "staff", "parent"],
    },

    // Label for the admin to identify the link (e.g. "Form 3 East — Parents 2025")
    label: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    expiresAt: { type: Date, required: true },

    // null = unlimited; number = cap on total uses
    maxUses: { type: Number, default: null },

    useCount: { type: Number, default: 0 },

    revoked: { type: Boolean, default: false },

    // Record of each registration that used this token
    usages: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Virtual to check if the token is still valid
InviteTokenSchema.virtual("isValid").get(function () {
  if (this.revoked) return false;
  if (this.expiresAt < new Date()) return false;
  if (this.maxUses !== null && this.useCount >= this.maxUses) return false;
  return true;
});

export default mongoose.models?.InviteToken ||
  mongoose.model("InviteToken", InviteTokenSchema);
