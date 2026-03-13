import express from "express";
import multer from "multer";
import EventsPage, { defaultEvents } from "../models/EventsPage.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { uploadBuffer } from "../utils/storage.js";

const router = express.Router();
const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─── Helper: get or create singleton ────────────────────────────
async function getOrCreateEventsPage() {
  let doc = await EventsPage.findOne();
  if (!doc) {
    doc = await EventsPage.create({ events: defaultEvents });
  }
  return doc;
}

// ─── GET /api/events-page (public) ──────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const doc = await getOrCreateEventsPage();
    const obj = doc.toObject();
    // Filter: only active events, sorted by date desc then displayOrder
    obj.events = (obj.events || [])
      .filter((e) => e.active)
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        if (db !== da) return db - da;
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
    res.json(obj);
  } catch (err) {
    console.error("EventsPage GET error:", err);
    res.status(500).json({ error: "Failed to fetch events page" });
  }
});

// ─── GET /api/events-page/admin (protected) ─────────────────────
router.get("/admin", requireRole(['admin']), async (_req, res) => {
  try {
    const doc = await getOrCreateEventsPage();
    res.json(doc);
  } catch (err) {
    console.error("EventsPage admin GET error:", err);
    res.status(500).json({ error: "Failed to fetch events page" });
  }
});

// ─── PUT /api/events-page (protected) ───────────────────────────
router.put("/", requireRole(['admin']), async (req, res) => {
  try {
    const doc = await getOrCreateEventsPage();
    const { title, intro, heroImage, heroOverlayText, events } = req.body;

    if (title !== undefined) doc.title = title;
    if (intro !== undefined) doc.intro = intro;
    if (heroImage !== undefined) doc.heroImage = heroImage;
    if (heroOverlayText !== undefined) doc.heroOverlayText = heroOverlayText;
    if (events !== undefined) doc.events = events;

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("EventsPage PUT error:", err);
    res.status(500).json({ error: "Failed to update events page" });
  }
});

// ─── POST /api/events-page/upload (protected, image upload) ─────
router.post("/upload", requireRole(['admin']), mem.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const result = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ url: result.url });
  } catch (err) {
    console.error("EventsPage upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── POST /api/events-page/reset-defaults (protected) ──────────
router.post("/reset-defaults", requireRole(['admin']), async (_req, res) => {
  try {
    const doc = await getOrCreateEventsPage();
    doc.title = "School Events";
    doc.intro = "Discover our upcoming and recent events at Kangaru Girls Senior School";
    doc.heroImage = "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5454.jpg";
    doc.heroOverlayText = "Stay connected with everything happening at our school";
    doc.events = defaultEvents;
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("EventsPage reset error:", err);
    res.status(500).json({ error: "Failed to reset events page" });
  }
});

export default router;
