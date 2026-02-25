// routes/student-page.js
import express from "express";
import multer from "multer";
import StudentPage, {
  defaultSections,
  defaultQuickLinks,
} from "../models/StudentPage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

async function getOrCreateStudentPage() {
  let page = await StudentPage.findById("student-page-singleton");
  if (!page) {
    page = new StudentPage({
      _id: "student-page-singleton",
      sections: defaultSections,
      quickLinks: defaultQuickLinks,
    });
    await page.save();
  }
  return page;
}

// ─── GET / — public (active content only) ───────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const page = await getOrCreateStudentPage();
    res.json({
      title: page.title,
      subtitle: page.subtitle,
      heroImage: page.heroImage,
      heroOverlayText: page.heroOverlayText,
      sections: page.sections
        .filter((s) => s.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      quickLinks: page.quickLinks
        .filter((l) => l.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      announcements: page.announcements
        .filter((a) => a.active)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10),
    });
  } catch (err) {
    console.error("Student page GET error:", err);
    res.status(500).json({ error: "Failed to load student page" });
  }
});

// ─── GET /admin — full data for admin panel ─────────────────────────────────
router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const page = await getOrCreateStudentPage();
    res.json(page);
  } catch (err) {
    console.error("Student page admin GET error:", err);
    res.status(500).json({ error: "Failed to load student page admin" });
  }
});

// ─── PUT / — update student page ────────────────────────────────────────────
router.put("/", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateStudentPage();

    // Track old file URLs for cloud cleanup
    const oldFileUrls = new Set();
    page.sections.forEach((s) => s.files.forEach((f) => { if (f.url) oldFileUrls.add(f.url); }));
    const oldHero = page.heroImage;

    const {
      title,
      subtitle,
      heroImage,
      heroOverlayText,
      sections,
      quickLinks,
      announcements,
    } = req.body;

    if (title !== undefined) page.title = title;
    if (subtitle !== undefined) page.subtitle = subtitle;
    if (heroImage !== undefined) page.heroImage = heroImage;
    if (heroOverlayText !== undefined) page.heroOverlayText = heroOverlayText;
    if (sections !== undefined) page.sections = sections;
    if (quickLinks !== undefined) page.quickLinks = quickLinks;
    if (announcements !== undefined) page.announcements = announcements;

    await page.save();

    // Cleanup removed files from cloud storage
    if (sections !== undefined) {
      const newFileUrls = new Set();
      page.sections.forEach((s) => s.files.forEach((f) => { if (f.url) newFileUrls.add(f.url); }));
      for (const url of oldFileUrls) {
        if (!newFileUrls.has(url)) {
          try { await deleteFile(url); } catch (_) { /* ignore */ }
        }
      }
    }
    // Cleanup old hero if changed
    if (heroImage !== undefined && oldHero && oldHero !== heroImage) {
      try { await deleteFile(oldHero); } catch (_) { /* ignore */ }
    }

    res.json(page);
  } catch (err) {
    console.error("Student page PUT error:", err);
    res.status(500).json({ error: "Failed to update student page" });
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
    console.error("Student page upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── POST /reset-defaults — reset to default data ──────────────────────────
router.post("/reset-defaults", requireAuth, async (_req, res) => {
  try {
    await StudentPage.deleteOne({ _id: "student-page-singleton" });
    const page = await getOrCreateStudentPage();
    res.json(page);
  } catch (err) {
    console.error("Student page reset error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
