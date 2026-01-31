// routes/admin.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Content from "../models/Content.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { sendEmail } = require('../utils/email-sender-fallback.js');
import { isS3Enabled, uploadBufferToS3, saveBufferToDisk } from "../utils/storage.js";

const router = express.Router();
import { requireRole } from "../middleware/requireAuth.js";

// Protect admin endpoints — only 'admin' role may access
router.use(requireRole(["admin"]));

// Ensure uploads folder exists (same as in index.js)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage so we can forward to S3 or persist to disk
const upload = multer({ storage: multer.memoryStorage() });

function makeDownloadUrl(req, relPath) {
  if (!relPath) return relPath;
  // If already absolute (S3 or external), return as-is
  if (String(relPath).startsWith("http")) return relPath;

  // Prefer explicit PUBLIC_ORIGIN env var when set (useful in proxies / deployments)
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  // Ensure relPath begins with a slash
  const p = String(relPath).startsWith("/") ? relPath : `/${relPath}`;
  return `${origin}${p}`;
}

/**
 * POST /api/admin/content
 *
 * Fields (multipart/form-data):
 *  - type  (required)  e.g. "newsletter", "feestructure"
 *  - title (optional)  -> section title
 *  - body  (optional)  -> main text / description
 *  - files (optional)  -> field name "files"
 */
router.post("/content", upload.array("files", 10), async (req, res) => {
  try {
    const { type, title, body = "" } = req.body;

    if (!type) {
      return res
        .status(400)
        .json({ ok: false, error: "Field 'type' is required" });
    }

    const files = req.files || [];
    const useS3 = isS3Enabled();

    const attachments = [];

    for (const f of files) {
      let relUrl;
      let name = f.originalname;

      if (useS3) {
        const uploaded = await uploadBufferToS3(f.buffer, f.originalname, f.mimetype);
        relUrl = uploaded.url; // absolute
        name = uploaded.key;
      } else {
        const saved = saveBufferToDisk(f.buffer, f.originalname, uploadsDir);
        relUrl = saved.url; // relative
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

    // If DB is not connected, skip persistence and return a transient content object
    if (mongoose.connection.readyState !== 1) {
      const transientContent = {
        id: `transient-${Date.now()}`,
        type,
        title: title || "",
        body: body || "",
        attachments,
      };
      return res.json({ ok: true, content: transientContent, warning: "DB unavailable; content not persisted" });
    }

    // Find or create content by type
    let content = await Content.findOne({ type });

    if (!content) {
      // First time creating this type
      content = new Content({
        type,
        title: title || "",
        body: body || "",
        attachments,
      });
    } else {
      // ✅ Only overwrite title/body if you actually provide new values
      if (title && title.trim().length > 0) {
        content.title = title;
      }
      if (body && body.trim().length > 0) {
        content.body = body;
      }
      // ✅ Always APPEND new attachments; never wipe the old ones
      content.attachments = [...(content.attachments || []), ...attachments];
    }

    await content.save();

    // Ensure every attachment has a downloadUrl before returning
    const normalized = (content.attachments || []).map((a) => ({
      ...a.toObject ? a.toObject() : a,
      downloadUrl: a.downloadUrl || makeDownloadUrl(req, a.url),
    }));
    content.attachments = normalized;

    res.json({ ok: true, content });
  } catch (err) {
    console.error("Failed to process content upload:", err);
    res.status(500).json({ ok: false, error: "Failed to save content" });
  }
});

// --- Admin media management endpoints ---
/**
 * DELETE /api/admin/content/:contentId/media/:mediaId
 * Delete a media file from a content document
 */
router.delete("/content/:contentId/media/:mediaId", async (req, res) => {
  try {
    const { contentId, mediaId } = req.params;
    
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    const attachment = content.attachments.id(mediaId);
    if (!attachment) return res.status(404).json({ error: "Media not found" });

    // Optional: delete physical file
    // if (attachment.url && !attachment.url.startsWith("http")) {
    //   const filePath = path.join(process.cwd(), attachment.url.replace(/^\//, ""));
    //   try { fs.unlinkSync(filePath); } catch (e) {}
    // }

    attachment.deleteOne();
    await content.save();

    res.json({ success: true, message: "Media deleted" });
  } catch (err) {
    console.error("Failed to delete media:", err);
    res.status(500).json({ error: "Failed to delete media" });
  }
});

/**
 * PUT /api/admin/content/:contentId/media/:mediaId
 * Replace a media file in a content document
 */
router.put("/content/:contentId/media/:mediaId", upload.single("file"), async (req, res) => {
  try {
    const { contentId, mediaId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    const attachment = content.attachments.id(mediaId);
    if (!attachment) return res.status(404).json({ error: "Media not found" });

    const useS3 = isS3Enabled();
    let newUrl;

    if (useS3) {
      const uploaded = await uploadBufferToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
      newUrl = uploaded.url;
    } else {
      const saved = saveBufferToDisk(req.file.buffer, req.file.originalname, uploadsDir);
      newUrl = saved.url;
    }

    // Update attachment
    attachment.url = newUrl;
    attachment.originalName = req.file.originalname;
    attachment.mimetype = req.file.mimetype;
    attachment.size = req.file.size;
    attachment.downloadUrl = makeDownloadUrl(req, newUrl);
    attachment.uploadedAt = new Date();

    await content.save();

    res.json({ success: true, message: "Media replaced", attachment });
  } catch (err) {
    console.error("Failed to replace media:", err);
    res.status(500).json({ error: "Failed to replace media" });
  }
});

/**
 * GET /api/admin/users
 * List all users with filtering and pagination
 */
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page || "0", 10));
    const limit = Math.min(200, parseInt(req.query.limit || "50", 10));
    const q = req.query.q ? { $or: [ { email: new RegExp(req.query.q, 'i') }, { name: new RegExp(req.query.q, 'i') } ] } : {};
    const total = await User.countDocuments(q);
    const users = await User.find(q).sort({ createdAt: -1 }).skip(page * limit).limit(limit).select("name email role createdAt");
    res.json({ ok: true, users, total, page, limit });
  } catch (err) {
    console.error("Failed to list users:", err);
    res.status(500).json({ ok: false, error: "Failed to list users" });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const allowed = ["admin", "teacher", "student", "staff", "parent", "user", "pending"];
    if (!role || !allowed.includes(role)) return res.status(400).json({ ok: false, error: "Invalid role" });
    const u = await User.findById(id);
    if (!u) return res.status(404).json({ ok: false, error: "User not found" });
    const previous = u.role;
    u.role = role;
    await u.save();

    // create audit log
    try {
      await AuditLog.create({
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        action: 'role_change',
        targetId: u._id,
        targetEmail: u.email,
        meta: { previousRole: previous, newRole: role }
      });
    } catch (elog) {
      console.warn('Failed to write audit log', elog.message);
    }

    // attempt to send confirmation email to the affected user
    (async () => {
      try {
        if (u.email) {
          const subject = `Your account role has changed to ${role}`;
          const text = `Hello ${u.name || ''},\n\nYour account role on the school site has been changed to '${role}' by ${req.user?.email || 'an administrator'}.\n\nIf this was not you, please contact the school administrator.`;
          await sendEmail(u.email, subject, text);
        }
      } catch (eem) {
        console.warn('Failed to send role-change email:', eem.message || eem);
      }
    })();

    res.json({ ok: true, user: { id: u._id, email: u.email, name: u.name, role: u.role } });
  } catch (err) {
    console.error("Failed to update user role:", err);
    res.status(500).json({ ok: false, error: "Failed to update role" });
  }
});

export default router;
