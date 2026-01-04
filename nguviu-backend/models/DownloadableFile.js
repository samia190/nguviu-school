// models/DownloadableFile.js
const mongoose = require("mongoose");

const DownloadableFileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  originalName: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DownloadableFile", DownloadableFileSchema);
