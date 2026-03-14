// index.js (ESM)
import dotenv from "dotenv";
// Load .env early so index.js can access MONGO_URI and other settings
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import compression from "compression";
import helmet from "helmet";
import { connectToDatabase, isDbConnected as getDbConnected } from "./services/dbConnection.js";

// Import route files
import footerLinksRoutes from "./routes/footerLinks.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import homePageRoutes from "./routes/home.js";
import homeRoutes from "./routes/contentHome.js";
import aboutPageRoutes from "./routes/about.js";
import aboutRoutes from "./routes/contentAbout.js";
import filesRoutes from "./routes/files.js";
import downloadRoutes from "./routes/downloads.js";
import galleryRoutes from "./routes/galleryAttachments.js";
import galleryPageRoutes from "./routes/gallery-page.js";
import adminRoutes from "./routes/admin.js";
import submissionsRoutes from "./routes/submissions.js";
import submitFormRoutes from "./routes/submitForm.js";
import studentVerificationRoutes from "./routes/studentVerification.js";
import resultsRoutes from "./routes/results.js";
import parentPortalRoutes from "./routes/parentPortal.js";
import engagementRoutes from "./routes/engagement.js";
import performanceRoutes from "./routes/performance.js";
import performancePageRoutes from "./routes/performance-page.js";
import schoolMagazineRoutes from "./routes/schoolMagazine.js";
import admissionsRoutes from "./routes/admissions.js";
import staffRoutes from "./routes/staff.js";
import heroContentRoutes from "./routes/heroContent.js";
import homeNewsRoutes from "./routes/homeNews.js";
import adminStudentsRoutes from "./routes/adminStudents.js";
import eventsRoutes from "./routes/events.js";
import eventsPageRoutes from "./routes/events-page.js";
import studentLifePageRoutes from "./routes/student-life-page.js";
import studentPageRoutes from "./routes/student-page.js";
import curriculumPageRoutes from "./routes/curriculum-page.js";
import admissionsPageRoutes from "./routes/admissions-page.js";
import homeworkRoutes from "./routes/homework.js";
import chatRoutes from "./routes/chat.js";
import inviteRoutes from "./routes/invites.js";
import invitePublicRoutes from "./routes/invitePublic.js";

// Initialize the Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Compression middleware (Gzip/Brotli)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is balanced)
}));

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

// Body parser with larger limits for file uploads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Ensure static folders exist and are ready for use
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const downloadsDir = path.join(process.cwd(), "downloads");
const imagesDir = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// Cache control middleware for static assets
const setStaticCacheHeaders = (res, path) => {
  if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/)) {
    // Images - cache for 1 year with immutable
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept-Encoding');
  } else if (path.match(/\.(css|js)$/)) {
    // CSS/JS - cache for 1 year (with hash in filename)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept-Encoding');
  } else if (path.match(/\.(mp4|webm|ogg)$/)) {
    // Videos - cache for 1 month
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Accept-Ranges', 'bytes');
  } else if (path.match(/\.(pdf|doc|docx)$/)) {
    // Documents - cache for 1 week
    res.setHeader('Cache-Control', 'public, max-age=604800');
  } else {
    // Other files - cache for 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
};

// Serve static folders with caching
app.use("/uploads", cors(), express.static(uploadsDir, { 
  setHeaders: setStaticCacheHeaders,
  maxAge: '1y',
  etag: true,
  lastModified: true
}));
app.use("/downloads", cors(), express.static(downloadsDir, { 
  setHeaders: setStaticCacheHeaders,
  maxAge: '1w',
  etag: true,
  lastModified: true
}));
app.use("/images", cors(), express.static(imagesDir, { 
  setHeaders: setStaticCacheHeaders,
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Mount routes
app.use("/api/auth", authRoutes);
// Mount new unified home routes FIRST (highest priority)
app.use("/api/home", homePageRoutes);
// Mount new unified about routes (highest priority for about)
app.use("/api/about", aboutPageRoutes);
// Mount dedicated content routes BEFORE the generic content router so they take precedence
app.use("/api/content/home", homeRoutes);
app.use("/api/content/about", aboutRoutes);
app.use("/api/gallery-page", galleryPageRoutes);
app.use("/api/content/gallery", galleryRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/invite", inviteRoutes);
app.use("/api/invite", invitePublicRoutes);
app.use("/api/submissions", submissionsRoutes);
// Public submit form and admin helpers
app.use("/api/submit-form", submitFormRoutes);
app.use("/api/footer-links", footerLinksRoutes);
app.use("/api/student-verification", studentVerificationRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/parent", parentPortalRoutes);
app.use("/api/engagement", engagementRoutes);
app.use("/api/performance-page", performancePageRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/school-magazine", schoolMagazineRoutes);
app.use("/api/admissions", admissionsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/hero-content", heroContentRoutes);
app.use("/api/home-news", homeNewsRoutes);
app.use("/api/admin/students", adminStudentsRoutes);
app.use("/api/events-page", eventsPageRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/student-life-page", studentLifePageRoutes);
app.use("/api/student-page", studentPageRoutes);
app.use("/api/curriculum-page", curriculumPageRoutes);
app.use("/api/admissions-page", admissionsPageRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/chat", chatRoutes);

// ==========================================
// DATABASE CONNECTION
// ==========================================
let dbConnected = false;
await connectToDatabase().then((connected) => {
  dbConnected = connected;
});

// Export dbConnected flag so routes can optionally check it
export { dbConnected };

// Health check route — returns 503 when database is unreachable
app.get("/api/health", (req, res) => {
  const dbReady = getDbConnected();
  if (!dbReady) {
    return res.status(503).json({ ok: false, db: false, time: new Date().toISOString() });
  }
  res.json({ ok: true, db: true, time: new Date().toISOString() });
});

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});

// Global error handler - MUST be last, catches any errors thrown by routes
app.use((err, req, res, next) => {
  console.error("[ERROR]", req.method, req.path);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  res.status(err.status || 500).json({ 
    error: "Internal Server Error"
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
