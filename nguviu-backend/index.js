// index.js (ESM)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Import route files
import footerLinksRoutes from "./routes/footerLinks.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import filesRoutes from "./routes/files.js";
import downloadRoutes from "./routes/downloads.js";
import galleryRoutes from "./routes/galleryAttachments.js";
import adminRoutes from "./routes/admin.js";

// Initialize the Express app
const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, server-to-server)
      if (!origin) return callback(null, true);

      // If no allowed origins provided, allow all origins
      if (allowedOrigins.length === 0) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS for origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

console.log("CORS allowed origins:", allowedOrigins.length ? allowedOrigins : "(all)");
app.use(express.json());

// Ensure static folders exist and are ready for use
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
app.use("/api/footer-links", footerLinksRoutes);

// MongoDB connection setup
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

// Health check route
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
