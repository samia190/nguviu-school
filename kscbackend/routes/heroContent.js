import express from "express";
import multer from "multer";
import HeroContent from "../models/HeroContent.js";
import { uploadBuffer, deleteFile } from "../utils/storage.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: convert relative URLs to absolute
function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

// GET hero content for a specific page
router.get("/", async (req, res) => {
  try {
    const { page, type } = req.query;
    const filter = { active: true };
    
    if (page) filter.page = page;
    if (type) filter.type = type;
    
    const heroContent = await HeroContent.find(filter).sort({ displayOrder: 1 });
    
    const heroWithAbsoluteUrls = heroContent.map(item => ({
      ...item.toObject(),
      url: toAbsoluteUrl(req, item.url)
    }));
    
    res.json(heroWithAbsoluteUrls);
  } catch (err) {
    console.error("Error fetching hero content:", err);
    res.status(500).json({ error: "Failed to fetch hero content" });
  }
});

// GET single hero content item
router.get("/:id", async (req, res) => {
  try {
    const hero = await HeroContent.findById(req.params.id);
    if (!hero) {
      return res.status(404).json({ error: "Hero content not found" });
    }
    
    res.json({
      ...hero.toObject(),
      url: toAbsoluteUrl(req, hero.url)
    });
  } catch (err) {
    console.error("Error fetching hero content:", err);
    res.status(500).json({ error: "Failed to fetch hero content" });
  }
});

// POST create new hero content (with file upload)
router.post("/", upload.single("media"), async (req, res) => {
  try {
    const { title, description, page, type: contentType, displayOrder } = req.body;

    if (!contentType || !page) {
      return res.status(400).json({ error: "Missing required fields: type, page" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Media file required" });
    }

    let mediaUrl;
    try {
      const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      mediaUrl = uploaded.url;
    } catch (err) {
      console.error("Error uploading media:", err);
      return res.status(400).json({ error: "Failed to upload media" });
    }

    const heroContent = new HeroContent({
      type: contentType,
      page,
      title,
      description,
      url: mediaUrl,
      displayOrder: displayOrder || 0,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      active: true
    });

    await heroContent.save();
    
    res.status(201).json({
      ...heroContent.toObject(),
      url: toAbsoluteUrl(req, heroContent.url)
    });
  } catch (err) {
    console.error("Error creating hero content:", err);
    res.status(500).json({ error: "Failed to create hero content" });
  }
});

// PUT update hero content
router.put("/:id", upload.single("media"), async (req, res) => {
  try {
    const hero = await HeroContent.findById(req.params.id);
    if (!hero) {
      return res.status(404).json({ error: "Hero content not found" });
    }

    const { title, description, page, displayOrder, active } = req.body;

    if (title) hero.title = title;
    if (description) hero.description = description;
    if (page) hero.page = page;
    if (displayOrder !== undefined) hero.displayOrder = displayOrder;
    if (active !== undefined) hero.active = active === "true" || active === true;

    // Handle media upload if provided
    if (req.file) {
      try {
        // Delete old media if it exists
        if (hero.url) await deleteFile(hero.url);
        const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
        hero.url = uploaded.url;
        hero.originalName = req.file.originalname;
        hero.size = req.file.size;
        hero.mimetype = req.file.mimetype;
      } catch (err) {
        console.error("Error uploading media:", err);
        return res.status(400).json({ error: "Failed to upload media" });
      }
    }

    hero.updatedAt = new Date();
    await hero.save();
    
    res.json({
      ...hero.toObject(),
      url: toAbsoluteUrl(req, hero.url)
    });
  } catch (err) {
    console.error("Error updating hero content:", err);
    res.status(500).json({ error: "Failed to update hero content" });
  }
});

// DELETE hero content
router.delete("/:id", async (req, res) => {
  try {
    const hero = await HeroContent.findByIdAndDelete(req.params.id);
    if (!hero) {
      return res.status(404).json({ error: "Hero content not found" });
    }
    // Clean up the stored media
    if (hero.url) await deleteFile(hero.url);
    res.json({ message: "Hero content deleted successfully" });
  } catch (err) {
    console.error("Error deleting hero content:", err);
    res.status(500).json({ error: "Failed to delete hero content" });
  }
});

export default router;
