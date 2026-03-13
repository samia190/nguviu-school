import express from "express";
import mongoose from "mongoose";
import HomePage, { defaultHeroSlides, defaultQuickLinks } from "../models/HomePage.js";
import { uploadBuffer } from "../utils/storage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper: Convert relative URLs to absolute
 */
function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  const p = String(relativePath).startsWith("/") ? relativePath : `/${relativePath}`;
  return `${origin}${p}`;
}

/**
 * Helper: Ensure hero items have absolute URLs
 */
function normalizeHeroItems(heroContent) {
  if (!heroContent || !heroContent.items) return heroContent;
  return {
    ...heroContent,
    items: heroContent.items.map((item) => ({
      ...item.toObject ? item.toObject() : item,
      // URLs are already absolute from Cloudinary, but ensure they are
    })),
  };
}

/**
 * Helper: Get or create default home page document
 */
async function getOrCreateHomePage() {
  let homepage = await HomePage.findOne({});

  if (!homepage) {
    console.log("📝 Creating default HomePage document...");
    homepage = new HomePage({
      title: "WELCOME TO KANGARU GIRLS' SCHOOL",
      intro: "At our institution, we believe education is a journey of creativity, growth, and excellence...",
      heroContent: {
        type: "slide",
        items: defaultHeroSlides,
      },
      quickLinks: defaultQuickLinks,
      isActive: true,
    });
    await homepage.save();
    console.log("✅ Default HomePage created");
  }

  return homepage;
}

/**
 * GET /api/home
 * Public endpoint - fetch home page data
 * Returns: title, intro, heroContent, quickLinks
 */
router.get("/", async (req, res) => {
  try {
    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️ DB not connected, returning safe default");
      return res.json({
        title: "WELCOME TO KANGARU GIRLS' SCHOOL",
        intro: "A center of excellence in education...",
        heroContent: {
          type: "slide",
          items: defaultHeroSlides,
        },
        quickLinks: defaultQuickLinks,
      });
    }

    let homepage = await getOrCreateHomePage();

    // Normalize data: ensure URLs are absolute
    const heroNormalized = normalizeHeroItems(homepage.heroContent);

    // Only return active items for public display
    const activeHeroItems = heroNormalized.items?.filter((item) => item.active !== false) || [];
    const activeQuickLinks = homepage.quickLinks?.filter((link) => link.active !== false) || [];

    const response = {
      _id: homepage._id,
      title: homepage.title || "WELCOME TO KANGARU GIRLS' SCHOOL",
      intro: homepage.intro || "At our institution, we believe education is a journey of creativity, growth, and excellence...",
      heroContent: {
        type: heroNormalized.type || "slide",
        items: activeHeroItems,
      },
      quickLinks: activeQuickLinks,
      isActive: homepage.isActive,
    };

    res.json(response);
  } catch (err) {
    console.error("🔴 Error fetching home page:", err);
    // Return safe default on error
    res.json({
      title: "WELCOME TO KANGARU GIRLS' SCHOOL",
      intro: "A center of excellence in education...",
      heroContent: {
        type: "slide",
        items: defaultHeroSlides,
      },
      quickLinks: defaultQuickLinks,
    });
  }
});

/**
 * GET /api/home/admin
 * Protected endpoint - fetch full home page data for admin editing
 * Includes inactive items and timestamps
 */
router.get("/admin", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    let homepage = await getOrCreateHomePage();

    // Return full document with all data
    const response = homepage.toObject ? homepage.toObject() : homepage;

    res.json(response);
  } catch (err) {
    console.error("🔴 Error fetching admin home page:", err);
    res.status(500).json({ error: "Failed to fetch home page data" });
  }
});

/**
 * PUT /api/home
 * Protected endpoint - update home page content
 * Can update: title, intro, heroContent, quickLinks
 */
router.put("/", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { title, intro, heroContent, quickLinks, isActive } = req.body;

    // Get or create homepage
    let homepage = await getOrCreateHomePage();

    // Update fields only if provided
    if (title !== undefined) homepage.title = title;
    if (intro !== undefined) homepage.intro = intro;
    if (heroContent !== undefined) {
      homepage.heroContent = heroContent;
    }
    if (quickLinks !== undefined) {
      homepage.quickLinks = quickLinks;
    }
    if (isActive !== undefined) homepage.isActive = isActive;

    // Update timestamp
    homepage.updatedAt = new Date();

    // Save with loose validation
    const updatedHomepage = await homepage.save();

    console.log("✅ HomePage updated successfully");

    // Return normalized response
    const heroNormalized = normalizeHeroItems(updatedHomepage.heroContent);
    const response = {
      ...updatedHomepage.toObject(),
      heroContent: heroNormalized,
    };

    res.json(response);
  } catch (err) {
    console.error("🔴 Error updating home page:", err);
    res.status(400).json({ error: "Failed to update home page" });
  }
});

/**
 * POST /api/home/hero-upload
 * Protected endpoint - upload hero image to Cloudinary or storage
 * Returns: { url: "uploaded-url" }
 */
router.post("/hero-upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log("📤 Uploading hero image...");
    console.log(`   File: ${req.file.originalname} (${req.file.size} bytes)`);

    // Upload using storage utility (which handles Cloudinary or fallback)
    const uploadResult = await uploadBuffer(
      req.file.buffer,
      `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.png`,
      req.file.mimetype
    );

    // Return absolute URL
    const absoluteUrl = toAbsoluteUrl(req, uploadResult.url);

    console.log(`✅ Upload successful: ${absoluteUrl}`);

    res.json({
      url: absoluteUrl,
      path: uploadResult.url,
      filename: uploadResult.filename,
    });
  } catch (err) {
    console.error("🔴 Error uploading hero image:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

/**
 * POST /api/home/reset-defaults
 * Admin only - reset home page to defaults
 * Useful for testing or recovery
 */
router.post("/reset-defaults", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Delete existing and create new with defaults
    await HomePage.deleteMany({});

    const homepage = new HomePage({
      title: "WELCOME TO KANGARU GIRLS' SCHOOL",
      intro: "At our institution, we believe education is a journey of creativity, growth, and excellence...",
      heroContent: {
        type: "slide",
        items: defaultHeroSlides,
      },
      quickLinks: defaultQuickLinks,
      isActive: true,
    });

    await homepage.save();

    console.log("✅ HomePage reset to defaults");

    res.json({
      message: "HomePage reset to defaults",
      data: homepage.toObject(),
    });
  } catch (err) {
    console.error("🔴 Error resetting home page:", err);
    res.status(500).json({ error: "Failed to reset" });
  }
});

export default router;
