import express from "express";
import Event from "../models/Event.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * GET /api/events
 * Fetch all active events or featured events
 */
router.get("/", async (req, res) => {
  try {
    const { featured } = req.query;
    const query = { active: true };
    
    if (featured === "true") {
      query.featured = true;
    }

    const events = await Event.find(query)
      .sort({ date: -1, displayOrder: 1 })
      .exec();

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/**
 * GET /api/events/:id
 * Fetch single event
 */
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

/**
 * POST /api/events
 * Create new event (admin only)
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { title, description, date, location, imageUrl, imageAlt, featured, displayOrder, originalName } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ error: "Title and image URL are required" });
    }

    const event = await Event.create({
      title,
      description,
      date: date ? new Date(date) : undefined,
      location,
      imageUrl,
      imageAlt: imageAlt || title,
      featured: featured || false,
      displayOrder: displayOrder || 0,
      originalName
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/**
 * PATCH /api/events/:id
 * Update event (admin only)
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event (admin only)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
