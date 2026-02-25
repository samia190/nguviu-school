// routes/student-life-page.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import StudentLifePage, {
  defaultActivities,
} from "../models/StudentLifePage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

async function getOrCreateStudentLifePage() {
  let page = await StudentLifePage.findById("student-life-page-singleton");
  if (!page) {
    page = new StudentLifePage({
      _id: "student-life-page-singleton",
      activities: defaultActivities,
    });
    await page.save();
  }
  return page;
}

// ─── GET / — public (active activities only) ────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        title: "Student Life",
        subtitle: "",
        heroImage: "",
        heroOverlayText: "",
        activities: [],
      });
    }
    const page = await getOrCreateStudentLifePage();
    res.json({
      title: page.title,
      subtitle: page.subtitle,
      heroImage: page.heroImage,
      heroOverlayText: page.heroOverlayText,
      activities: page.activities
        .filter((a) => a.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    });
  } catch (err) {
    console.error("Student life page GET error:", err);
    res.status(500).json({ error: "Failed to load student life page" });
  }
});

// ─── GET /admin — full data for admin panel ─────────────────────────────────
router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const page = await getOrCreateStudentLifePage();
    res.json(page);
  } catch (err) {
    console.error("Student life admin GET error:", err);
    res.status(500).json({ error: "Failed to load student life admin" });
  }
});

// ─── PUT / — update student life page ───────────────────────────────────────
router.put("/", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateStudentLifePage();

    // Track old image URLs for cloud cleanup
    const oldUrls = new Set(page.activities.map((a) => a.imageUrl).filter(Boolean));
    const oldHero = page.heroImage;

    const {
      title,
      subtitle,
      heroImage,
      heroOverlayText,
      activities,
    } = req.body;

    if (title !== undefined) page.title = title;
    if (subtitle !== undefined) page.subtitle = subtitle;
    if (heroImage !== undefined) page.heroImage = heroImage;
    if (heroOverlayText !== undefined) page.heroOverlayText = heroOverlayText;
    if (activities !== undefined) page.activities = activities;

    await page.save();

    // Cleanup removed images from cloud storage
    if (activities !== undefined) {
      const newUrls = new Set(
        page.activities.map((a) => a.imageUrl).filter(Boolean)
      );
      for (const url of oldUrls) {
        if (!newUrls.has(url)) {
          try {
            await deleteFile(url);
          } catch (_) {
            /* ignore cleanup errors */
          }
        }
      }
    }
    // Cleanup old hero if changed
    if (heroImage !== undefined && oldHero && oldHero !== heroImage) {
      try {
        await deleteFile(oldHero);
      } catch (_) {
        /* ignore */
      }
    }

    res.json(page);
  } catch (err) {
    console.error("Student life PUT error:", err);
    res.status(500).json({ error: "Failed to update student life page" });
  }
});

// ─── POST /upload — upload image to Cloudinary ──────────────────────────────
router.post("/upload", requireAuth, mem.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const result = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({ url: result.url });
  } catch (err) {
    console.error("Student life upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── POST /reset-defaults — reset to default data ──────────────────────────
router.post("/reset-defaults", requireAuth, async (_req, res) => {
  try {
    await StudentLifePage.deleteOne({ _id: "student-life-page-singleton" });
    const page = await getOrCreateStudentLifePage();
    res.json(page);
  } catch (err) {
    console.error("Student life reset error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
