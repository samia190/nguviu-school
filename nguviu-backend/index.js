// index.js (ESM)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// ✅ default imports (route files must use: export default router)
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import filesRoutes from "./routes/files.js";
import downloadRoutes from "./routes/downloads.js";
import galleryRoutes from "./routes/galleryAttachments.js";
import adminRoutes from "./routes/admin.js";

const app = express();

// ✅ CORS (adjust origin if needed)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Ensure static folders exist
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const downloadsDir = path.join(process.cwd(), "downloads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// Serve static folders
app.use("/uploads", express.static(uploadsDir));
app.use("/downloads", express.static(downloadsDir));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/content/gallery", galleryRoutes);
app.use("/api/admin", adminRoutes);

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI is not set in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connect error:", err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
