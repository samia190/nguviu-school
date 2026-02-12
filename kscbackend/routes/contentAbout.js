import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Content from "../models/Content.js";
import { isS3Enabled, uploadBufferToS3, saveBufferToDisk } from "../utils/storage.js";
import path from "path";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function makeDownloadUrl(req, relPath) {
  if (!relPath) return relPath;
  if (String(relPath).startsWith("http")) return relPath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  const p = String(relPath).startsWith("/") ? relPath : `/${relPath}`;
  return `${origin}${p}`;
}

// GET /api/content/about
router.get("/", async (req, res) => {
  console.log("GET /api/content/about called");
  try {
    // Default values for all about page fields
    const defaults = {
      type: "about",
      title: "",
      intro: "",
      body: "",
      heroBackgroundUrl: "",
      heroTitle: "",
      heroSubtitle: "",
      mottoHeading: "MOTTO",
      motto: "Strive for Excellence",
      visionHeading: "VISION",
      vision: "Holistically Developed Person",
      missionHeading: "MISSION",
      mission: "Nurture excellence in a well-integrated person in line with Vision 2030",
      coreValuesHeading: "CORE VALUES",
      coreValues: "Responsibility\nAccountability & Transparency\nHonesty\nIntegrity\nRespect\nTeam Work\nHumility\nProfessionalism\nSelf & Emotional Awareness\nCreativity & Innovation",
      promiseHeading: "Our Promise",
      promise: "Excellence, Our Choice",
      principalImageUrl: "",
      principalMessage: "",
      deputyImageUrl: "",
      deputyMessage: "",
      attachments: [],
    };

    console.log("MongoDB connection state:", mongoose.connection.readyState);

    // If DB is not connected, return defaults to avoid 500s during degraded mode
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB not connected, returning defaults");
      return res.json(defaults);
    }

    const doc = await Content.findOne({ type: "about" });
    console.log("Found document:", doc ? "yes" : "no");
    
    if (!doc) {
      console.log("No document found, returning defaults");
      return res.json(defaults);
    }

    const attachments = (doc.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));

    // Merge saved data with defaults - only use saved values if they're not empty
    const docObj = doc.toObject ? doc.toObject() : doc;
    const out = { ...defaults };
    
    console.log("Merging document with defaults");
    // Override defaults only with non-empty values from the database
    for (const [key, value] of Object.entries(docObj)) {
      if (value !== "" && value !== null && value !== undefined) {
        out[key] = value;
      }
    }
    
    out.attachments = attachments;
    console.log("Returning result with coreValues:", out.coreValues ? "present" : "missing");
    return res.json(out);
  } catch (err) {
    console.error("Error fetching about content:", err);
    return res.status(500).json({ error: "Server error fetching about content" });
  }
});

// PATCH /api/content/about/:field -> update a specific field in about content
router.patch("/:field", async (req, res) => {
  try {
    const { field } = req.params;
    const { value } = req.body;

    // List of allowed fields for the about page
    const ALLOWED_FIELDS = new Set([
      "title", "intro", "body",
      "heroBackgroundUrl", "heroTitle", "heroSubtitle",
      "mottoHeading", "motto",
      "visionHeading", "vision",
      "missionHeading", "mission",
      "coreValuesHeading", "coreValues",
      "promiseHeading", "promise",
      "principalImageUrl", "principalMessage",
      "deputyImageUrl", "deputyMessage"
    ]);

    if (!ALLOWED_FIELDS.has(field)) {
      return res.status(400).json({ error: `Field '${field}' is not editable` });
    }

    // If DB is not connected, return a safe response
    if (mongoose.connection.readyState !== 1) {
      return res.json({ type: "about", [field]: value });
    }

    // Find or create about content
    let doc = await Content.findOne({ type: "about" });
    if (!doc) {
      doc = new Content({ type: "about", [field]: value });
    } else {
      doc[field] = value;
    }

    await doc.save();

    const attachments = (doc.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));

    const out = { ...doc.toObject ? doc.toObject() : doc, attachments };
    return res.json(out);
  } catch (err) {
    console.error("Error updating about field:", err);
    return res.status(500).json({ error: "Server error updating about content" });
  }
});

// PUT /api/content/about/:id  -> update about content by id
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
    console.error("Error updating about content:", err);
    return res.status(400).json({ error: "Invalid content data" });
  }
});

// POST /api/content/about/upload
// Accepts multipart files and optional fields (title, body, heroTitle, heroSubtitle)
router.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files || [];
    const useS3 = isS3Enabled();

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    const attachments = [];

    for (const f of files) {
      let relUrl;
      let name = f.originalname;
      if (useS3) {
        const uploaded = await uploadBufferToS3(f.buffer, f.originalname, f.mimetype);
        relUrl = uploaded.url; // absolute S3 url
        name = uploaded.key;
      } else {
        const saved = saveBufferToDisk(f.buffer, f.originalname, uploadsDir);
        relUrl = saved.url; // relative url
        name = saved.filename;
      }

      attachments.push({
        name: f.originalname,
        originalName: f.originalname,
        url: relUrl,
        downloadUrl: makeDownloadUrl(req, relUrl),
        mimetype: f.mimetype,
        size: f.size,
        uploadedAt: new Date(),
      });
    }

    // find or create about content
    let content = await Content.findOne({ type: "about" });
    if (!content) {
      content = new Content({
        type: "about",
        title: req.body.title || "",
        body: req.body.body || "",
        attachments,
      });
    } else {
      // optionally update text fields if provided
      if (req.body.title) content.title = req.body.title;
      if (req.body.body) content.body = req.body.body;
      if (req.body.heroTitle) content.heroTitle = req.body.heroTitle;
      if (req.body.heroSubtitle) content.heroSubtitle = req.body.heroSubtitle;
      if (req.body.heroBackgroundUrl) content.heroBackgroundUrl = req.body.heroBackgroundUrl;

      content.attachments = [...(content.attachments || []), ...attachments];
    }

    await content.save();

    const normalizedAttachments = (content.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));
    content.attachments = normalizedAttachments;

    return res.json({ ok: true, content });
  } catch (err) {
    console.error("Failed to upload about media:", err);
    return res.status(500).json({ ok: false, error: "Failed to upload media" });
  }
});

export default router;
