import express from "express";
import multer from "multer";
import HomeNews from "../models/HomeNews.js";
import { isS3Enabled, uploadBufferToS3, saveBufferToDisk } from "../utils/storage.js";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all active news items
router.get("/", async (req, res) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    
    if (active !== undefined) filter.active = active === "true";
    if (category) filter.category = category;
    
    const news = await HomeNews.find(filter)
      .sort({ displayOrder: 1, publishDate: -1 })
      .limit(20);
    
    res.json(news);
  } catch (err) {
    console.error("Error fetching home news:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// GET single news item
router.get("/:id", async (req, res) => {
  try {
    const newsItem = await HomeNews.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ error: "News item not found" });
    }
    // Increment view count
    newsItem.views = (newsItem.views || 0) + 1;
    await newsItem.save();
    res.json(newsItem);
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// POST create new news item (with image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, displayOrder, link, author } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Missing required fields: title, description" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file required" });
    }

    let imageUrl;
    try {
      if (isS3Enabled()) {
        imageUrl = await uploadBufferToS3(req.file.buffer, `news/${req.file.originalname}`);
      } else {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "news");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
        const dest = path.join(uploadsDir, safeName);
        fs.writeFileSync(dest, req.file.buffer);
        imageUrl = `/uploads/news/${safeName}`;
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      return res.status(400).json({ error: "Failed to upload image" });
    }

    const newsItem = new HomeNews({
      title,
      description,
      imageUrl,
      category: category || "news",
      displayOrder: displayOrder || 0,
      link,
      author,
      active: true,
      publishDate: new Date()
    });

    await newsItem.save();
    res.status(201).json(newsItem);
  } catch (err) {
    console.error("Error creating news:", err);
    res.status(500).json({ error: "Failed to create news item" });
  }
});

// PUT update news item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const newsItem = await HomeNews.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ error: "News item not found" });
    }

    const { title, description, category, displayOrder, link, author, active } = req.body;

    if (title) newsItem.title = title;
    if (description) newsItem.description = description;
    if (category) newsItem.category = category;
    if (displayOrder !== undefined) newsItem.displayOrder = displayOrder;
    if (link) newsItem.link = link;
    if (author) newsItem.author = author;
    if (active !== undefined) newsItem.active = active === "true" || active === true;

    // Handle image upload if provided
    if (req.file) {
      try {
        let imageUrl;
        if (isS3Enabled()) {
          imageUrl = await uploadBufferToS3(req.file.buffer, `news/${req.file.originalname}`);
        } else {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "news");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
          const dest = path.join(uploadsDir, safeName);
          fs.writeFileSync(dest, req.file.buffer);
          imageUrl = `/uploads/news/${safeName}`;
        }
        newsItem.imageUrl = imageUrl;
      } catch (err) {
        console.error("Error uploading image:", err);
        return res.status(400).json({ error: "Failed to upload image" });
      }
    }

    newsItem.updatedAt = new Date();
    await newsItem.save();
    res.json(newsItem);
  } catch (err) {
    console.error("Error updating news:", err);
    res.status(500).json({ error: "Failed to update news item" });
  }
});

// DELETE news item
router.delete("/:id", async (req, res) => {
  try {
    const newsItem = await HomeNews.findByIdAndDelete(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ error: "News item not found" });
    }
    res.json({ message: "News item deleted successfully" });
  } catch (err) {
    console.error("Error deleting news:", err);
    res.status(500).json({ error: "Failed to delete news item" });
  }
});

export default router;
