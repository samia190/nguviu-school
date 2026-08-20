import mongoose from "mongoose";

const BulkImportSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["accounts", "results", "timetable"] },
  status: { type: String, required: true, enum: ["validated", "applied", "failed", "expired"], default: "validated" },
  sourceName: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  summary: {
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    appliedRows: { type: Number, default: 0 },
  },
  rows: [{
    rowNumber: Number,
    data: mongoose.Schema.Types.Mixed,
    errors: [String],
  }],
  appliedAt: Date,
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.models?.BulkImport || mongoose.model("BulkImport", BulkImportSchema);
