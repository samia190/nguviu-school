// index.js (ESM)
import dotenv from "dotenv";
// Load .env early so index.js can access MONGO_URI and other settings
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Import route files
import footerLinksRoutes from "./routes/footerLinks.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import homeRoutes from "./routes/contentHome.js";
import aboutRoutes from "./routes/contentAbout.js";
import filesRoutes from "./routes/files.js";
import downloadRoutes from "./routes/downloads.js";
import galleryRoutes from "./routes/galleryAttachments.js";
import adminRoutes from "./routes/admin.js";
import submissionsRoutes from "./routes/submissions.js";
import submitFormRoutes from "./routes/submitForm.js";

// Initialize the Express app
const app = express();

// Railway (and other PaaS) often run behind a proxy/load balancer.
// Trusting the proxy ensures req.protocol/secure are set correctly.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
// Mount dedicated home route BEFORE the generic content router so it takes precedence
app.use("/api/content/home", homeRoutes);
app.use("/api/content/about", aboutRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/content/gallery", galleryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionsRoutes);
// Public submit form and admin helpers
app.use("/api/submit-form", submitFormRoutes);
app.use("/api/footer-links", footerLinksRoutes);

// MongoDB connection setup — attempt to connect but don't crash the server
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;
let dbConnected = false;
if (!mongoUri) {
  console.warn(
    "⚠️ Mongo connection string not set (MONGO_URI/MONGO_URL/MONGODB_URI/DATABASE_URL) — running in degraded mode without DB"
  );
} else {
  mongoose
    .connect(mongoUri)
    .then(() => {
      dbConnected = true;
      console.log("✅ Connected to MongoDB");
    })
    .catch((err) => {
      dbConnected = false;
      console.warn("⚠️ MongoDB connect error — continuing without DB:", err.message || err);
    });
}

// Export dbConnected flag so routes can optionally check it (not required)
export { dbConnected };

// Health check route
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
