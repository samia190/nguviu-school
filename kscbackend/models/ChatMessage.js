import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    // Visitor info
    name: { type: String, required: true, trim: true, maxlength: 200 },
    contact: { type: String, required: true, trim: true, maxlength: 200 }, // phone or email
    message: { type: String, required: true, trim: true, maxlength: 2000 },

    // Context
    topic: { type: String, default: "general" },        // category ID they were browsing
    page: { type: String, default: "" },                 // which page they were on

    // Status tracking
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },
    adminReply: { type: String, default: "" },
    repliedAt: { type: Date },
    repliedBy: { type: String, default: "" },

    // Office hours context
    wasOfficeHours: { type: Boolean, default: false },

    // Reference number for the visitor
    refNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-generate reference number before save
chatMessageSchema.pre("save", async function (next) {
  if (!this.refNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("ChatMessage").countDocuments();
    this.refNumber = `MSG-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Index for quick lookups
chatMessageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
