import express from "express";
import multer from "multer";
import HomeNews from "../models/HomeNews.js";
import { uploadBuffer } from "../utils/storage.js";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: convert relative URLs to absolute
function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

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
    
    // Convert imageUrl to absolute URL
    const newsWithAbsoluteUrls = news.map(item => ({
      ...item.toObject(),
      imageUrl: toAbsoluteUrl(req, item.imageUrl)
    }));
    
    res.json(newsWithAbsoluteUrls);
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
    
    // Convert imageUrl to absolute URL
    const newsWithAbsoluteUrl = {
      ...newsItem.toObject(),
      imageUrl: toAbsoluteUrl(req, newsItem.imageUrl)
    };
    
    res.json(newsWithAbsoluteUrl);
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// POST create new news item
router.post("/", async (req, res) => {
  try {
    const { title, description, category, displayOrder, link, author, imageUrl } = req.body;

    console.log("\n🔍 DEBUG: Home News POST");
    console.log(`   Received imageUrl: "${imageUrl}"`);
    console.log(`   Is absolute (starts with http): ${imageUrl?.startsWith("http")}`);
    console.log(`   Is relative (starts with /): ${imageUrl?.startsWith("/")}`);

    if (!title || !description) {
      return res.status(400).json({ error: "Missing required fields: title, description" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Image file required (url: /api/home-news)" });
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

    console.log(`   Stored in DB as: "${newsItem.imageUrl}"`);
    console.log(`   Storage successful: ${newsItem._id}`);
    
    const response = {
      ...newsItem.toObject(),
      imageUrl: toAbsoluteUrl(req, newsItem.imageUrl)
    };

    console.log(`   Response imageUrl will be: "${response.imageUrl}"`);

    res.status(201).json(response);
  } catch (err) {
    console.error("Error creating news:", err);
    res.status(500).json({ error: "Failed to create news item" });
  }
});

// PUT update news item
router.put("/:id", async (req, res) => {
  try {
    const newsItem = await HomeNews.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ error: "News item not found" });
    }

    const { title, description, category, displayOrder, link, author, active, imageUrl } = req.body;

    if (title) newsItem.title = title;
    if (description) newsItem.description = description;
    if (category) newsItem.category = category;
    if (displayOrder !== undefined) newsItem.displayOrder = displayOrder;
    if (link) newsItem.link = link;
    if (author) newsItem.author = author;
    if (active !== undefined) newsItem.active = active === "true" || active === true;
    if (imageUrl) newsItem.imageUrl = imageUrl;

    newsItem.updatedAt = new Date();
    await newsItem.save();
    
    const response = {
      ...newsItem.toObject(),
      imageUrl: toAbsoluteUrl(req, newsItem.imageUrl)
    };
    
    res.json(response);
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
