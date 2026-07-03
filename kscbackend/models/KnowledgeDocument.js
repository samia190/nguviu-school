// models/KnowledgeDocument.js
import mongoose from "mongoose";

const KnowledgeDocumentSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    path: { type: String, required: true, unique: true },
    type: { type: String, default: "document" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    tags: [{ type: String }],
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "indexed", "error"],
      default: "pending",
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
    indexedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

KnowledgeDocumentSchema.index({ path: 1, source: 1 });
KnowledgeDocumentSchema.index({ visibility: 1, status: 1 });

export default mongoose.models?.KnowledgeDocument ||
  mongoose.model("KnowledgeDocument", KnowledgeDocumentSchema);
