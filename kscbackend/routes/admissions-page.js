// routes/admissions-page.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import AdmissionsPage, {
  defaultFormSteps,
  defaultFormDeclarations,
} from "../models/AdmissionsPage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

async function getOrCreateAdmissionsPage() {
  let page = await AdmissionsPage.findById("admissions-page-singleton");
  if (!page) {
    page = new AdmissionsPage({
      _id: "admissions-page-singleton",
      formSteps: defaultFormSteps,
      formDeclarations: defaultFormDeclarations,
    });
    await page.save();
  }
  // Backfill defaults if arrays are empty (existing docs before this feature)
  let needSave = false;
  if (!page.formSteps || page.formSteps.length === 0) {
    page.formSteps = defaultFormSteps;
    needSave = true;
  }
  if (!page.formDeclarations || page.formDeclarations.length === 0) {
    page.formDeclarations = defaultFormDeclarations;
    needSave = true;
  }
  if (needSave) await page.save();
  return page;
}

// ─── GET / — public ─────────────────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        title: "Admissions",
        subtitle: "",
        heroImage: "",
        overview: "",
        process: "",
        requirements: "",
        importantDates: "",
        contactInfo: "",
        downloadsHeading: "",
        downloads: [],
        formEnabled: true,
        formTitle: "Online Admission Application",
        admissionYear: new Date().getFullYear(),
      });
    }
    const page = await getOrCreateAdmissionsPage();
    res.json({
      title: page.title,
      subtitle: page.subtitle,
      heroImage: page.heroImage,
      overview: page.overview,
      process: page.process,
      requirements: page.requirements,
      importantDates: page.importantDates,
      contactInfo: page.contactInfo,
      downloadsHeading: page.downloadsHeading,
      downloads: page.downloads
        .filter((d) => d.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      formEnabled: page.formEnabled,
      formTitle: page.formTitle,
      admissionYear: page.admissionYear,
      formInstructions: page.formInstructions,
      formSteps: page.formSteps,
      formDeclarations: page.formDeclarations,
      formDisclaimer: page.formDisclaimer,
    });
  } catch (err) {
    console.error("Admissions page GET error:", err);
    res.status(500).json({ error: "Failed to load admissions page" });
  }
});

// ─── GET /admin — full data for admin panel ─────────────────────────────────
router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const page = await getOrCreateAdmissionsPage();
    res.json(page);
  } catch (err) {
    console.error("Admissions admin GET error:", err);
    res.status(500).json({ error: "Failed to load admissions admin" });
  }
});

// ─── PUT / — update admissions page ─────────────────────────────────────────
router.put("/", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateAdmissionsPage();

    // Track old URLs for cloud cleanup
    const oldHero = page.heroImage;
    const oldDownloadUrls = new Set(
      page.downloads.map((d) => d.url).filter(Boolean)
    );

    const {
      title,
      subtitle,
      heroImage,
      overview,
      process,
      requirements,
      importantDates,
      contactInfo,
      downloadsHeading,
      downloads,
      formEnabled,
      formTitle,
      admissionYear,
      formInstructions,
      formSteps,
      formDeclarations,
      formDisclaimer,
    } = req.body;

    if (title !== undefined) page.title = title;
    if (subtitle !== undefined) page.subtitle = subtitle;
    if (heroImage !== undefined) page.heroImage = heroImage;
    if (overview !== undefined) page.overview = overview;
    if (process !== undefined) page.process = process;
    if (requirements !== undefined) page.requirements = requirements;
    if (importantDates !== undefined) page.importantDates = importantDates;
    if (contactInfo !== undefined) page.contactInfo = contactInfo;
    if (downloadsHeading !== undefined)
      page.downloadsHeading = downloadsHeading;
    if (downloads !== undefined) page.downloads = downloads;
    if (formEnabled !== undefined) page.formEnabled = formEnabled;
    if (formTitle !== undefined) page.formTitle = formTitle;
    if (admissionYear !== undefined) page.admissionYear = admissionYear;
    if (formInstructions !== undefined) page.formInstructions = formInstructions;
    if (formSteps !== undefined) page.formSteps = formSteps;
    if (formDeclarations !== undefined) page.formDeclarations = formDeclarations;
    if (formDisclaimer !== undefined) page.formDisclaimer = formDisclaimer;

    await page.save();

    // Cleanup removed cloud assets
    if (heroImage !== undefined && oldHero && oldHero !== heroImage) {
      try {
        await deleteFile(oldHero);
      } catch (_) {
        /* ignore */
      }
    }
    if (downloads !== undefined) {
      const newDownloadUrls = new Set(
        page.downloads.map((d) => d.url).filter(Boolean)
      );
      for (const url of oldDownloadUrls) {
        if (!newDownloadUrls.has(url)) {
          try {
            await deleteFile(url);
          } catch (_) {
            /* ignore */
          }
        }
      }
    }

    res.json(page);
  } catch (err) {
    console.error("Admissions PUT error:", err);
    res.status(500).json({ error: "Failed to update admissions page" });
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
    console.error("Admissions upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── POST /reset-defaults — reset to default data ──────────────────────────
router.post("/reset-defaults", requireAuth, async (_req, res) => {
  try {
    await AdmissionsPage.deleteOne({ _id: "admissions-page-singleton" });
    const page = await getOrCreateAdmissionsPage();
    res.json(page);
  } catch (err) {
    console.error("Admissions reset error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
