// routes/gallery-page.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import GalleryPage, {
  defaultAlbums,
  defaultImages,
} from "../models/GalleryPage.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 250 },
});

/**
 * Get or create the singleton gallery page document.
 * On first creation, links default images to their respective albums.
 */
async function getOrCreateGalleryPage() {
  let page = await GalleryPage.findById("gallery-page-singleton");
  if (!page) {
    page = new GalleryPage({
      _id: "gallery-page-singleton",
      albums: defaultAlbums,
      images: defaultImages,
    });
    await page.save();

    // Link default images to albums by position (3 images per album)
    if (page.albums.length >= 5 && page.images.length >= 15) {
      page.images.forEach((img, i) => {
        img.albumId = page.albums[Math.floor(i / 3)]._id.toString();
      });
      await page.save();
    }
  }
  return page;
}

// ─── GET / — public (active albums & images only) ───────────────────────────
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        title: "School Gallery",
        subtitle: "",
        heroImage: "",
        heroOverlayText: "",
        albums: [],
        images: [],
      });
    }
    const page = await getOrCreateGalleryPage();
    res.json({
      title: page.title,
      subtitle: page.subtitle,
      heroImage: page.heroImage,
      heroOverlayText: page.heroOverlayText,
      albums: page.albums
        .filter((a) => a.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      images: page.images
        .filter((i) => i.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    });
  } catch (err) {
    console.error("Gallery page GET error:", err);
    res.status(500).json({ error: "Failed to load gallery" });
  }
});

// ─── GET /admin — full data for admin panel ─────────────────────────────────
router.get("/admin", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateGalleryPage();
    res.json(page);
  } catch (err) {
    console.error("Gallery admin GET error:", err);
    res.status(500).json({ error: "Failed to load gallery admin" });
  }
});

// ─── PUT / — update gallery page ────────────────────────────────────────────
router.put("/", requireAuth, async (req, res) => {
  try {
    const page = await getOrCreateGalleryPage();

    // Track old image URLs for cloud cleanup
    const oldUrls = new Set(page.images.map((i) => i.url));

    const { title, subtitle, heroImage, heroOverlayText, albums, images } =
      req.body;
    if (title !== undefined) page.title = title;
    if (subtitle !== undefined) page.subtitle = subtitle;
    if (heroImage !== undefined) page.heroImage = heroImage;
    if (heroOverlayText !== undefined) page.heroOverlayText = heroOverlayText;
    if (albums !== undefined) page.albums = albums;
    if (images !== undefined) page.images = images;

    await page.save();

    // Cleanup removed images from cloud storage
    if (images !== undefined) {
      const newUrls = new Set(page.images.map((i) => i.url));
      for (const url of oldUrls) {
        if (!newUrls.has(url)) {
          try {
            await deleteFile(url);
          } catch (e) {
            /* ignore cleanup errors */
          }
        }
      }
    }

    res.json(page);
  } catch (err) {
    console.error("Gallery PUT error:", err);
    res.status(500).json({ error: "Failed to update gallery" });
  }
});

// ─── POST /upload — upload images to Cloudinary (parallel batches) ───────────
router.post(
  "/upload",
  requireAuth,
  mem.array("images", 250),
  async (req, res) => {
    try {
      if (!req.files?.length) {
        return res.status(400).json({ error: "No files provided" });
      }

      // Upload in parallel batches of 5 for speed
      const BATCH_SIZE = 5;
      const urls = new Array(req.files.length);
      for (let i = 0; i < req.files.length; i += BATCH_SIZE) {
        const batch = req.files.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map((f) => uploadBuffer(f.buffer, f.originalname, f.mimetype))
        );
        results.forEach((r, j) => {
          urls[i + j] = r.url;
        });
      }

      // If albumId provided, also add images to the gallery page
      if (req.body.albumId) {
        const page = await getOrCreateGalleryPage();
        const newImgs = urls.map((url, i) => ({
          url,
          caption: req.files[i].originalname
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]/g, " "),
          albumId: req.body.albumId,
          featured: false,
          active: true,
          displayOrder: page.images.length + i + 1,
        }));
        page.images.push(...newImgs);
        await page.save();
        return res.json({ urls, page });
      }

      res.json({ urls });
    } catch (err) {
      console.error("Gallery upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// ─── POST /reset-defaults — reset to default data ──────────────────────────
router.post("/reset-defaults", requireAuth, async (req, res) => {
  try {
    await GalleryPage.deleteOne({ _id: "gallery-page-singleton" });
    const page = await getOrCreateGalleryPage();
    res.json(page);
  } catch (err) {
    console.error("Gallery reset error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
