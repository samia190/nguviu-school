// routes/content.js
import express from "express";
import mongoose from "mongoose";
import Content from "../models/Content.js";

const router = express.Router();

/**
 * ✅ GET /api/content
 * Returns a list of all content documents (for AdminPanel list)
 */
router.get("/", async (req, res) => {
  try {
    const items = await Content.find({}).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error("Error listing content:", err);
    return res.status(500).json({ error: "Server error listing content" });
  }
});

/**
 * ✅ GET /api/content/:idOrType
 *
 * - If :idOrType is a valid MongoDB ObjectId → look up by _id.
 *   - If not found → 404 (this is a genuine error when you ask by id).
 * - Otherwise → treat :idOrType as a "type" (e.g. "home", "about", "admin").
 *   - If no content exists yet for that type → return a SAFE DEFAULT object
 *     with status 200 so the frontend does NOT break.
 */
router.get("/:idOrType", async (req, res) => {
  const { idOrType } = req.params;

  try {
    // If it's a valid ObjectId, treat it as an _id lookup
    if (mongoose.Types.ObjectId.isValid(idOrType)) {
      const content = await Content.findById(idOrType);
      if (!content) return res.status(404).json({ error: "Content not found" });
      return res.json(content);
    }

    // Otherwise treat it as a "type" lookup (e.g., "home", "about", "admin")
    const contentByType = await Content.findOne({ type: idOrType });

    // IMPORTANT CHANGE:
    // If nothing is found for this type, DO NOT return 404.
    // Return a safe default object instead so pages can still load.
    if (!contentByType) {
      return res.json({
        type: idOrType,
        title: "",
        body: "",
        attachments: [],
      });
    }

    return res.json(contentByType);
  } catch (err) {
    console.error("Error fetching content:", err);
    return res.status(500).json({ error: "Server error fetching content" });
  }
});

/**
 * ✅ POST /api/content
 * Create a new content document (not heavily used by the current frontend,
 * but kept for completeness).
 */
router.post("/", async (req, res) => {
  try {
    const newContent = await Content.create(req.body);
    return res.status(201).json(newContent);
  } catch (err) {
    console.error("Error creating content:", err);
    return res.status(400).json({ error: "Invalid content data" });
  }
});

/**
 * ✅ PUT /api/content/:id
 * Replace an existing content document by ID.
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedContent) {
      return res.status(404).json({ error: "Content not found" });
    }

    return res.json(updatedContent);
  } catch (err) {
    console.error("Error updating content:", err);
    return res.status(400).json({ error: "Invalid content data" });
  }
});

/**
 * ✅ DELETE /api/content/:id
 * Delete a content document by ID.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);
    if (!deletedContent) {
      return res.status(404).json({ error: "Content not found" });
    }
    return res.json({ message: "Content deleted successfully" });
  } catch (err) {
    console.error("Error deleting content:", err);
    return res.status(500).json({ error: "Server error deleting content" });
  }
});

export default router;
