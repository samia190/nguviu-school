// routes/chat.js  — Chat‑bot API (ESM)
import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { ChatConfig, defaultCategories } from "../models/ChatConfig.js";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

// Map of dataSource string → { modelName, singletonId | null }
const SOURCE_MAP = {
  "admissions-page": { model: "AdmissionsPage", id: "admissions-page-singleton" },
  "home":            { model: "HomePage",       id: null },
  "about":           { model: "AboutPage",      id: null },
  "performance-page":{ model: "PerformancePage", id: null },
  "events-page":     { model: "EventsPage",     id: null },
  "student-life-page":{ model: "StudentLifePage", id: "student-life-page-singleton" },
  "student-page":    { model: "StudentPage",    id: "student-page-singleton" },
  "curriculum-page": { model: "CurriculumPage", id: "curriculum-page-singleton" },
  "gallery-page":    { model: "GalleryPage",    id: "gallery-page-singleton" },
};

/**
 * Resolve a dataSource + dataField → the actual text from the DB.
 * Returns empty string if anything fails.
 */
async function resolveData(dataSource, dataField) {
  if (!dataSource || !dataField) return "";
  const src = SOURCE_MAP[dataSource];
  if (!src) return "";

  try {
    const Model = mongoose.model(src.model);
    const doc = src.id ? await Model.findById(src.id).lean() : await Model.findOne({}).lean();
    if (!doc) return "";

    // dataField can be dot-separated e.g. "overview"
    const parts = dataField.split(".");
    let val = doc;
    for (const p of parts) {
      if (val == null) return "";
      val = val[p];
    }
    return typeof val === "string" ? val : "";
  } catch {
    return "";
  }
}

/**
 * Check if we're currently within office hours.
 */
function isOfficeOpen(officeHours) {
  if (!officeHours || !officeHours.enabled) return true; // no restriction

  const tz = officeHours.timezone || "Africa/Nairobi";
  const now = new Date();

  // Get current time in the configured timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");

  // Get day of week in timezone
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const dayStr = dayFormatter.format(now);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayNum = dayMap[dayStr] ?? new Date().getDay();

  // Check day
  const allowedDays = officeHours.days || [1, 2, 3, 4, 5];
  if (!allowedDays.includes(dayNum)) return false;

  // Check time window
  const [startH, startM] = (officeHours.start || "08:00").split(":").map(Number);
  const [endH, endM] = (officeHours.end || "17:00").split(":").map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/** getOrCreate the chat config singleton */
async function getOrCreateConfig() {
  let doc = await ChatConfig.findById("chat-config-singleton");
  if (!doc) {
    doc = await ChatConfig.create({
      _id: "chat-config-singleton",
      categories: defaultCategories,
    });
  }
  // Backfill defaults if categories are empty
  if (!doc.categories || doc.categories.length === 0) {
    doc.categories = defaultCategories;
    await doc.save();
  }
  return doc;
}

/* ────────────────────────────────────────────────────────────────
   PUBLIC ENDPOINTS
   ──────────────────────────────────────────────────────────────── */

/**
 * GET /  — Public: get chat config for the widget
 */
router.get("/", async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    const open = isOfficeOpen(config.officeHours);

    res.json({
      enabled: config.enabled,
      botName: config.botName,
      greeting: config.greeting,
      noMatchReply: config.noMatchReply,
      thankYouReply: config.thankYouReply,
      isOfficeOpen: open,
      closedMessage: config.closedMessage,
      whatsappNumber: config.whatsappNumber,
      categories: config.categories,
      quickReplies: config.quickReplies,
      showOnMobile: config.showOnMobile,
      position: config.position,
      primaryColor: config.primaryColor,
    });
  } catch (err) {
    console.error("Chat config GET error:", err);
    res.status(500).json({ error: "Failed to load chat config" });
  }
});

/**
 * GET /answer/:categoryId  — Resolve dynamic data for a category or child node
 * Query: ?childId=admissions.requirements (optional)
 */
router.get("/answer/:categoryId", async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const cat = config.categories.find((c) => c.id === req.params.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found" });

    let node = cat;
    const childId = req.query.childId;
    if (childId && cat.children) {
      const child = cat.children.find((c) => c.id === childId);
      if (child) node = child;
    }

    // If there's a static reply, use it
    let answer = node.reply || "";

    // If there's a data source, fetch live data
    if (node.dataSource && node.dataField) {
      const liveData = await resolveData(node.dataSource, node.dataField);
      if (liveData) {
        answer = liveData;
      }
    }

    // If still no answer, give a generic response
    if (!answer) {
      answer = `For more information about ${node.label || cat.label}, please contact the school office or visit the relevant page on our website.`;
    }

    res.json({
      answer,
      label: node.label,
      actions: node.actions || [],
    });
  } catch (err) {
    console.error("Chat answer error:", err);
    res.status(500).json({ error: "Failed to get answer" });
  }
});

/**
 * GET /office-status  — Quick check if office is open
 */
router.get("/office-status", async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({
      isOpen: isOfficeOpen(config.officeHours),
      closedMessage: config.closedMessage,
    });
  } catch {
    res.json({ isOpen: false, closedMessage: "Please try again later." });
  }
});

/**
 * POST /message  — Visitor leaves a message for admin
 */
router.post("/message", async (req, res) => {
  try {
    const { name, contact, message, topic, page } = req.body;

    if (!name || !contact || !message) {
      return res.status(400).json({ error: "Name, contact, and message are required." });
    }

    if (name.length > 200 || contact.length > 200 || message.length > 2000) {
      return res.status(400).json({ error: "Input exceeds maximum length." });
    }

    const config = await getOrCreateConfig();
    const open = isOfficeOpen(config.officeHours);

    const msg = await ChatMessage.create({
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim(),
      topic: topic || "general",
      page: page || "",
      wasOfficeHours: open,
    });

    res.status(201).json({
      success: true,
      refNumber: msg.refNumber,
      isOfficeOpen: open,
      closedMessage: !open ? config.closedMessage : "",
    });
  } catch (err) {
    console.error("Chat message error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

/* ────────────────────────────────────────────────────────────────
   ADMIN ENDPOINTS (requireAuth)
   ──────────────────────────────────────────────────────────────── */

/**
 * GET /admin  — Full config for admin panel
 */
router.get("/admin", requireAuth, async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json(config.toObject());
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat config" });
  }
});

/**
 * PUT /  — Update chat config
 */
router.put("/", requireAuth, async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const fields = [
      "botName", "greeting", "noMatchReply", "thankYouReply",
      "officeHours", "closedMessage", "whatsappNumber",
      "categories", "quickReplies",
      "enabled", "showOnMobile", "position", "primaryColor",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) config[f] = req.body[f];
    }
    await config.save();
    res.json(config.toObject());
  } catch (err) {
    console.error("Chat config PUT error:", err);
    res.status(500).json({ error: "Failed to update chat config" });
  }
});

/**
 * POST /reset-defaults  — Reset categories to defaults
 */
router.post("/reset-defaults", requireAuth, async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    config.categories = defaultCategories;
    await config.save();
    res.json({ success: true, config: config.toObject() });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset defaults" });
  }
});

/* ─── Messages management ─────────────────────────────────────── */

/**
 * GET /messages  — List messages with filters
 * Query: ?status=new&page=1&limit=20
 */
router.get("/messages", requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const total = await ChatMessage.countDocuments(filter);
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ messages, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

/**
 * GET /messages/stats  — Quick counts
 */
router.get("/messages/stats", requireAuth, async (_req, res) => {
  try {
    const [total, newCount, readCount, repliedCount] = await Promise.all([
      ChatMessage.countDocuments(),
      ChatMessage.countDocuments({ status: "new" }),
      ChatMessage.countDocuments({ status: "read" }),
      ChatMessage.countDocuments({ status: "replied" }),
    ]);
    res.json({ total, new: newCount, read: readCount, replied: repliedCount });
  } catch {
    res.json({ total: 0, new: 0, read: 0, replied: 0 });
  }
});

/**
 * PUT /messages/:id  — Update message status / add reply
 */
router.put("/messages/:id", requireAuth, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminReply !== undefined) {
      update.adminReply = adminReply;
      update.repliedAt = new Date();
      update.repliedBy = req.user?.name || req.user?.email || "admin";
      if (!status) update.status = "replied";
    }

    const msg = await ChatMessage.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!msg) return res.status(404).json({ error: "Message not found" });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

/**
 * DELETE /messages/:id  — Delete a message
 */
router.delete("/messages/:id", requireAuth, async (req, res) => {
  try {
    await ChatMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
