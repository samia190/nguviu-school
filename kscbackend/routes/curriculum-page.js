// routes/curriculum-page.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import CurriculumPage, {
  defaultStreams,
  defaultSections,
} from "../models/CurriculumPage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

async function getOrCreateCurriculumPage() {
  let page = await CurriculumPage.findById("curriculum-page-singleton");
  if (!page) {
    page = new CurriculumPage({
      _id: "curriculum-page-singleton",
      streams: defaultStreams,
      sections: defaultSections,
    });
    await page.save();
  }
  return page;
}

// ─── GET / — public (active only) ───────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        title: "Our Curriculum",
        subtitle: "",
        heroImage: "",
        heroOverlayText: "",
        intro: "",
        schoolName: "",
        schoolLocation: "",
        schoolCategory: "",
        streams: [],
        sections: [],
      });
    }
    const page = await getOrCreateCurriculumPage();
    res.json({
      title: page.title,
      subtitle: page.subtitle,
      heroImage: page.heroImage,
      heroOverlayText: page.heroOverlayText,
      intro: page.intro,
      schoolName: page.schoolName,
      schoolLocation: page.schoolLocation,
      schoolCategory: page.schoolCategory,
      streams: page.streams
        .filter((s) => s.active)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((s) => ({
          name: s.name,
          icon: s.icon,
          displayOrder: s.displayOrder,
          combinations: s.combinations.filter((c) => c.active),
        })),
      sections: page.sections
        .filter((s) => s.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    });
  } catch (err) {
    console.error("Curriculum page GET error:", err);
    res.status(500).json({ error: "Failed to load curriculum page" });
  }
});

// ─── GET /admin — full data for admin panel ─────────────────────────────────
router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const page = await getOrCreateCurriculumPage();
    res.json(page);
  } catch (err) {
    console.error("Curriculum admin GET error:", err);
    res.status(500).json({ error: "Failed to load curriculum admin" });
  }
});

// ─── PUT / — update curriculum page ─────────────────────────────────────────
router.put("/", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateCurriculumPage();

    // Track old URLs for cloud cleanup
    const oldHero = page.heroImage;
    const oldSectionImages = new Set(
      page.sections.map((s) => s.imageUrl).filter(Boolean)
    );
    const oldFileUrls = new Set();
    for (const sec of page.sections) {
      for (const f of sec.files || []) {
        if (f.url) oldFileUrls.add(f.url);
      }
    }

    const {
      title,
      subtitle,
      heroImage,
      heroOverlayText,
      intro,
      schoolName,
      schoolLocation,
      schoolCategory,
      streams,
      sections,
    } = req.body;

    if (title !== undefined) page.title = title;
    if (subtitle !== undefined) page.subtitle = subtitle;
    if (heroImage !== undefined) page.heroImage = heroImage;
    if (heroOverlayText !== undefined) page.heroOverlayText = heroOverlayText;
    if (intro !== undefined) page.intro = intro;
    if (schoolName !== undefined) page.schoolName = schoolName;
    if (schoolLocation !== undefined) page.schoolLocation = schoolLocation;
    if (schoolCategory !== undefined) page.schoolCategory = schoolCategory;
    if (streams !== undefined) page.streams = streams;
    if (sections !== undefined) page.sections = sections;

    await page.save();

    // Cleanup removed cloud assets
    if (heroImage !== undefined && oldHero && oldHero !== heroImage) {
      try { await deleteFile(oldHero); } catch (_) { /* ignore */ }
    }
    if (sections !== undefined) {
      const newSectionImages = new Set(
        page.sections.map((s) => s.imageUrl).filter(Boolean)
      );
      const newFileUrls = new Set();
      for (const sec of page.sections) {
        for (const f of sec.files || []) {
          if (f.url) newFileUrls.add(f.url);
        }
      }
      for (const url of oldSectionImages) {
        if (!newSectionImages.has(url)) {
          try { await deleteFile(url); } catch (_) { /* ignore */ }
        }
      }
      for (const url of oldFileUrls) {
        if (!newFileUrls.has(url)) {
          try { await deleteFile(url); } catch (_) { /* ignore */ }
        }
      }
    }

    res.json(page);
  } catch (err) {
    console.error("Curriculum PUT error:", err);
    res.status(500).json({ error: "Failed to update curriculum page" });
  }
});

// ─── POST /upload — upload file to Cloudinary ───────────────────────────────
router.post("/upload", requireAuth, mem.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const result = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({
      url: result.url,
      name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error("Curriculum upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── POST /reset-defaults — reset to default data ──────────────────────────
router.post("/reset-defaults", requireAuth, async (_req, res) => {
  try {
    await CurriculumPage.deleteOne({ _id: "curriculum-page-singleton" });
    const page = await getOrCreateCurriculumPage();
    res.json(page);
  } catch (err) {
    console.error("Curriculum reset error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
