import mongoose from "mongoose";

const ExamPaperVersionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
  version: { type: Number, required: true, min: 1 },
  sourceName: { type: String, required: true, maxlength: 255 },
  sourceUrl: { type: String, required: true },
  sourceMimeType: { type: String, enum: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], required: true },
  sourceChecksum: { type: String, required: true, index: true },
  renderedHtml: { type: String, required: true, maxlength: 8 * 1024 * 1024 },
  renderedText: { type: String, maxlength: 2 * 1024 * 1024 },
  mediaReferences: [{ label: { type: String, maxlength: 160 }, url: { type: String, maxlength: 2048 }, type: { type: String, enum: ["image", "audio", "video", "resource"] } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  frozenAt: { type: Date },
}, { timestamps: true });

ExamPaperVersionSchema.index({ examId: 1, version: 1 }, { unique: true });
export default mongoose.models?.ExamPaperVersion || mongoose.model("ExamPaperVersion", ExamPaperVersionSchema);
