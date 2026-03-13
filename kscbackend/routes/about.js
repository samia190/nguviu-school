import express from "express";
import mongoose from "mongoose";
import AboutPage, {
  defaultMotto,
  defaultVision,
  defaultMission,
  defaultPromise,
  defaultCoreValues,
  defaultHero,
} from "../models/AboutPage.js";
import { uploadBuffer } from "../utils/storage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper: Get or create default about page document
 */
async function getOrCreateAboutPage() {
  let aboutpage = await AboutPage.findOne({});

  if (!aboutpage) {
    console.log("📝 Creating default AboutPage document...");
    aboutpage = new AboutPage({
      title: "About KANGARU GIRLS' SCHOOL",
      intro: "KANGARU GIRLS' SCHOOL is a center of excellence dedicated to nurturing young girls into confident, capable leaders.",
      heroContent: defaultHero,
      motto: defaultMotto,
      vision: defaultVision,
      mission: defaultMission,
      promise: defaultPromise,
      coreValues: defaultCoreValues,
      leadership: {
        principal: null,
        deputies: [],
      },
      isActive: true,
      theme: "light",
    });
    await aboutpage.save();
    console.log("✅ AboutPage document created");
  }

  return aboutpage;
}

/**
 * GET /api/about
 * Public endpoint: Fetch all about page content with safe defaults
 */
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Connection not ready, return safe defaults
      return res.json({
        title: "About KANGARU GIRLS' SCHOOL",
        intro: "KANGARU GIRLS' SCHOOL is a center of excellence...",
        heroContent: defaultHero,
        motto: defaultMotto,
        vision: defaultVision,
        mission: defaultMission,
        promise: defaultPromise,
        coreValues: defaultCoreValues,
        leadership: { principal: null, deputies: [] },
      });
    }

    let aboutpage = await getOrCreateAboutPage();

    res.json({
      _id: aboutpage._id,
      title: aboutpage.title,
      intro: aboutpage.intro,
      heroContent: aboutpage.heroContent || defaultHero,
      motto: aboutpage.motto || defaultMotto,
      vision: aboutpage.vision || defaultVision,
      mission: aboutpage.mission || defaultMission,
      promise: aboutpage.promise || defaultPromise,
      coreValues: aboutpage.coreValues || defaultCoreValues,
      leadership: aboutpage.leadership || { principal: null, deputies: [] },
      isActive: aboutpage.isActive,
    });
  } catch (err) {
    console.error("❌ Error fetching about page:", err.message);
    res.json({
      title: "About KANGARU GIRLS' SCHOOL",
      intro: "KANGARU GIRLS' SCHOOL is a center of excellence...",
      heroContent: defaultHero,
      motto: defaultMotto,
      vision: defaultVision,
      mission: defaultMission,
      promise: defaultPromise,
      coreValues: defaultCoreValues,
      leadership: { principal: null, deputies: [] },
    });
  }
});

/**
 * GET /api/about/admin
 * Protected endpoint: Fetch all data for admin editing
 */
router.get("/admin", requireAuth, async (req, res) => {
  try {
    let aboutpage = await getOrCreateAboutPage();

    res.json(aboutpage.toObject());
  } catch (err) {
    console.error("❌ Error fetching about page (admin):", err.message);
    res.status(500).json({ error: "Failed to load about page" });
  }
});

/**
 * PUT /api/about
 * Protected endpoint: Update any about page section
 * Body: { title, intro, heroContent, motto, vision, mission, promise, coreValues, leadership }
 */
router.put("/", requireAuth, async (req, res) => {
  try {
    const updates = req.body;

    let aboutpage = await getOrCreateAboutPage();

    // Update allowed fields
    if (updates.title !== undefined) aboutpage.title = updates.title;
    if (updates.intro !== undefined) aboutpage.intro = updates.intro;
    if (updates.heroContent !== undefined) aboutpage.heroContent = updates.heroContent;
    if (updates.motto !== undefined) aboutpage.motto = updates.motto;
    if (updates.vision !== undefined) aboutpage.vision = updates.vision;
    if (updates.mission !== undefined) aboutpage.mission = updates.mission;
    if (updates.promise !== undefined) aboutpage.promise = updates.promise;
    if (updates.coreValues !== undefined) aboutpage.coreValues = updates.coreValues;
    if (updates.leadership !== undefined) aboutpage.leadership = updates.leadership;
    if (updates.isActive !== undefined) aboutpage.isActive = updates.isActive;

    aboutpage.updatedAt = new Date();
    await aboutpage.save();

    console.log("✅ About page updated");

    res.json(aboutpage.toObject());
  } catch (err) {
    console.error("❌ Error updating about page:", err.message);
    res.status(500).json({ error: "Failed to update about page" });
  }
});

/**
 * POST /api/about/hero-upload
 * Protected endpoint: Upload hero image to Cloudinary
 */
router.post("/hero-upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log("📤 Uploading hero image...");
    console.log(`   File: ${req.file.originalname} (${req.file.size} bytes)`);

    const uploadResult = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const imageUrl = uploadResult.url;

    console.log(`✅ Upload successful: ${imageUrl}`);

    res.json({ url: imageUrl });
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * POST /api/about/reset-defaults
 * Protected endpoint: Reset about page to defaults (admin recovery)
 */
router.post("/reset-defaults", requireAuth, async (req, res) => {
  try {
    const aboutpage = await AboutPage.findOneAndUpdate(
      {},
      {
        title: "About KANGARU GIRLS' SCHOOL",
        intro: "KANGARU GIRLS' SCHOOL is a center of excellence dedicated to nurturing young girls into confident, capable leaders.",
        heroContent: defaultHero,
        motto: defaultMotto,
        vision: defaultVision,
        mission: defaultMission,
        promise: defaultPromise,
        coreValues: defaultCoreValues,
        leadership: { principal: null, deputies: [] },
        isActive: true,
        theme: "light",
      },
      { new: true, upsert: true }
    );

    console.log("✅ About page reset to defaults");

    res.json(aboutpage.toObject());
  } catch (err) {
    console.error("❌ Error resetting about page:", err.message);
    res.status(500).json({ error: "Failed to reset about page" });
  }
});

export default router;
