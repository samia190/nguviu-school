import express from "express";
import StudentLife from "../models/StudentLife.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

/**
 * GET /api/student-life
 * Fetch all active student life items or by category
 */
router.get("/", async (req, res) => {
  try {
    const { category, featured } = req.query;
    const query = { active: true };
    
    if (category) {
      query.category = category;
    }

    if (featured === "true") {
      query.featured = true;
    }

    const items = await StudentLife.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();

    const itemsWithAbsoluteUrls = items.map(item => ({
      ...item.toObject(),
      imageUrl: toAbsoluteUrl(req, item.imageUrl)
    }));

    res.json(itemsWithAbsoluteUrls);
  } catch (error) {
    console.error("Error fetching student life items:", error);
    res.status(500).json({ error: "Failed to fetch student life items" });
  }
});

/**
 * GET /api/student-life/:id
 * Fetch single student life item
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await StudentLife.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Student life item not found" });
    }
    res.json({
      ...item.toObject(),
      imageUrl: toAbsoluteUrl(req, item.imageUrl)
    });
  } catch (error) {
    console.error("Error fetching student life item:", error);
    res.status(500).json({ error: "Failed to fetch student life item" });
  }
});

/**
 * POST /api/student-life
 * Create new student life item (admin only)
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { title, description, category, imageUrl, imageAlt, featured, displayOrder, originalName } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ error: "Title and image URL are required" });
    }

    const item = await StudentLife.create({
      title,
      description,
      category: category || "activities",
      imageUrl,
      imageAlt: imageAlt || title,
      featured: featured || false,
      displayOrder: displayOrder || 0,
      originalName
    });

    res.status(201).json({
      ...item.toObject(),
      imageUrl: toAbsoluteUrl(req, item.imageUrl)
    });
  } catch (error) {
    console.error("Error creating student life item:", error);
    res.status(500).json({ error: "Failed to create student life item" });
  }
});

/**
 * PATCH /api/student-life/:id
 * Update student life item (admin only)
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const item = await StudentLife.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: "Student life item not found" });
    }

    res.json({
      ...item.toObject(),
      imageUrl: toAbsoluteUrl(req, item.imageUrl)
    });
  } catch (error) {
    console.error("Error updating student life item:", error);
    res.status(500).json({ error: "Failed to update student life item" });
  }
});

/**
 * DELETE /api/student-life/:id
 * Delete student life item (admin only)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const item = await StudentLife.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: "Student life item not found" });
    }

    res.json({ message: "Student life item deleted successfully" });
  } catch (error) {
    console.error("Error deleting student life item:", error);
    res.status(500).json({ error: "Failed to delete student life item" });
  }
});

export default router;
