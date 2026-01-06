import express from "express";
import mongoose from "mongoose";
import Content from "../models/Content.js";

const router = express.Router();

function makeDownloadUrl(req, relPath) {
  if (!relPath) return relPath;
  if (String(relPath).startsWith("http")) return relPath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  const p = String(relPath).startsWith("/") ? relPath : `/${relPath}`;
  return `${origin}${p}`;
}

// GET /api/content/home  -> return the 'home' content doc or a safe default
router.get("/", async (req, res) => {
  try {
    // If DB is not connected, return a safe default to avoid 500s during degraded mode
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        type: "home",
        title: "",
        intro: "",
        body: "",
        attachments: [],
      });
    }
    const doc = await Content.findOne({ type: "home" });
    if (!doc) {
      return res.json({
        type: "home",
        title: "",
        intro: "",
        body: "",
        attachments: [],
      });
    }

    // Normalize attachments to always include downloadUrl
    const attachments = (doc.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));

    const out = { ...doc.toObject ? doc.toObject() : doc, attachments };
    return res.json(out);
  } catch (err) {
    console.error("Error fetching home content:", err);
    return res.status(500).json({ error: "Server error fetching home content" });
  }
});

// PUT /api/content/home/:id  -> update home content by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Content not found" });

    const attachments = (updated.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));
    const out = { ...updated.toObject ? updated.toObject() : updated, attachments };
    return res.json(out);
  } catch (err) {
    console.error("Error updating home content:", err);
    return res.status(400).json({ error: "Invalid content data" });
  }
});

export default router;
