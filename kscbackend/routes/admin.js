// routes/admin.js (ESM)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Content from "../models/Content.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StaffProfile from "../models/StaffProfile.js";
import ParentProfile from "../models/ParentProfile.js";
import { sendEmail } from "../utils/email.js";
import { uploadBuffer } from "../utils/storage.js";
// ========== MEDIA OPTIMIZATION ==========
import { optimizeMedia, mediaFileFilter } from "../middleware/mediaOptimizer.js";

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
// ========== UPDATED: Added file filter and size limits ==========
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFileFilter,  // Validate file types (images, videos, documents)
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (videos can be large)
  },
});

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
// ========== UPDATED: Added optimizeMedia() middleware after Multer ==========
router.post("/content", upload.array("files", 10), optimizeMedia(), async (req, res) => {
  try {
    const { type, title, body = "" } = req.body;

    if (!type) {
      return res
        .status(400)
        .json({ ok: false, error: "Field 'type' is required" });
    }

    const files = req.files || [];

    const attachments = [];

    for (const f of files) {
      // Unified upload: Cloudinary > S3 > Disk
      const uploaded = await uploadBuffer(f.buffer, f.originalname, f.mimetype, uploadsDir);
      let relUrl = uploaded.url;
      let name = uploaded.filename || uploaded.public_id || f.originalname;
      let thumbnailUrl = null;

      // Handle video thumbnail if present
      if (f._thumbnail) {
        const thumbUploaded = await uploadBuffer(f._thumbnail.buffer, f._thumbnail.name, f._thumbnail.mimetype, uploadsDir);
        thumbnailUrl = thumbUploaded.url;
      }

      // ========== UPDATED: Include thumbnail in attachment if present ==========
      const attachment = {
        name: f.originalname,
        originalName: f.originalname,
        url: relUrl,
        downloadUrl: makeDownloadUrl(req, relUrl),
        mimetype: f.mimetype,
        size: f.size,
        uploadedAt: new Date(),
      };
      
      if (thumbnailUrl) {
        attachment.thumbnail = thumbnailUrl;
      }
      
      attachments.push(attachment);
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
    // Try to find attachment by Mongo subdocument id first
    let attachment = content.attachments.id(mediaId);

    // If not found, allow fallback matching by url, downloadUrl, originalName or name
    if (!attachment) {
      const decoded = decodeURIComponent(mediaId || "");
      attachment = (content.attachments || []).find((a) => {
        if (!a) return false;
        return (
          String(a._id) === mediaId ||
          String(a._id) === decoded ||
          a.url === mediaId ||
          a.url === decoded ||
          a.downloadUrl === mediaId ||
          a.downloadUrl === decoded ||
          a.originalName === mediaId ||
          a.originalName === decoded ||
          a.name === mediaId ||
          a.name === decoded
        );
      });
    }

    if (!attachment) return res.status(404).json({ error: "Media not found" });

    // Optional: delete physical file when stored on disk
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
// ========== UPDATED: Added optimizeMedia() middleware after Multer ==========
router.put("/content/:contentId/media/:mediaId", upload.single("file"), optimizeMedia(), async (req, res) => {
  try {
    const { contentId, mediaId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    //CHECK IN ATTACHMENTS
    // Find attachment by id first, otherwise try flexible matching (url/name)
    let attachment = content.attachments.id(mediaId);
    if (!attachment) {
      const decoded = decodeURIComponent(mediaId || "");
      attachment = (content.attachments || []).find((a) => {
        if (!a) return false;
        return (
          String(a._id) === mediaId ||
          String(a._id) === decoded ||
          a.url === mediaId ||
          a.url === decoded ||
          a.downloadUrl === mediaId ||
          a.downloadUrl === decoded ||
          a.originalName === mediaId ||
          a.originalName === decoded ||
          a.name === mediaId ||
          a.name === decoded
        );
      });
    }

    if (!attachment) return res.status(404).json({ error: "Media not found" });

    // Unified upload: Cloudinary > S3 > Disk
    const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, uploadsDir);
    const newUrl = uploaded.url;

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

// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/admin/users
// List all registered users with optional role filter
router.get("/users", async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: rx }, { email: rx }];
    }

    const users = await User.find(query)
      .select("-passwordHash -resetTokenHash -accessTokenHash")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, users });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ ok: false, error: "Failed to list users" });
  }
});

// GET /api/admin/users/:id/profile
// Get a user + their role-specific profile
router.get("/users/:id/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash -resetTokenHash -accessTokenHash")
      .lean();
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    let profile = null;
    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "teacher") {
      profile = await TeacherProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "staff") {
      profile = await StaffProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "parent") {
      profile = await ParentProfile.findOne({ user: user._id })
        .populate("linkedStudents", "name email admissionNumber")
        .lean();
    }

    return res.json({ ok: true, user, profile });
  } catch (err) {
    console.error("Get user profile error:", err);
    return res.status(500).json({ ok: false, error: "Failed to get user profile" });
  }
});

// POST /api/admin/users/create
// Admin directly creates a teacher or parent account (no invite link needed)
// Body: { name, email, password, role, ...profileFields }
router.post("/users/create", async (req, res) => {
  try {
    const {
      name, email, password, role,
      // teacher fields
      staffId, subjects, department, qualifications,
      // staff fields
      position,
      // parent fields
      occupation, providedAdmissionNumbers,
      // shared
      phone,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ ok: false, error: "name, email, password and role are required" });
    }

    const allowed = ["teacher", "staff", "parent"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ ok: false, error: `Role must be one of: ${allowed.join(", ")}` });
    }

    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ ok: false, error: "An account with this email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash: hash, role });
    await user.save();

    if (role === "teacher") {
      await TeacherProfile.create({
        user: user._id,
        staffId: staffId || undefined,
        subjects: subjects ? (Array.isArray(subjects) ? subjects : [subjects]) : [],
        department: department || undefined,
        qualifications: qualifications || undefined,
        phone: phone || undefined,
      });
    } else if (role === "staff") {
      await StaffProfile.create({
        user: user._id,
        staffId: staffId || undefined,
        position: position || undefined,
        department: department || undefined,
        phone: phone || undefined,
      });
    } else if (role === "parent") {
      const admNums = providedAdmissionNumbers
        ? (Array.isArray(providedAdmissionNumbers) ? providedAdmissionNumbers : [providedAdmissionNumbers]).filter(Boolean)
        : [];
      await ParentProfile.create({
        user: user._id,
        phone: phone || undefined,
        occupation: occupation || undefined,
        providedAdmissionNumbers: admNums,
      });
    }

    return res.status(201).json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return res.status(500).json({ ok: false, error: "Failed to create account" });
  }
});

// POST /api/admin/users/:id/link-student
// Manually link a parent to a student by admission number
router.post("/users/:id/link-student", async (req, res) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ ok: false, error: "Parent user not found" });
    }

    const { admissionNumber } = req.body;
    if (!admissionNumber) {
      return res.status(400).json({ ok: false, error: "admissionNumber is required" });
    }

    const student = await User.findOne({ admissionNumber, role: "student" });
    if (!student) {
      return res.status(404).json({ ok: false, error: `No student found with admission number ${admissionNumber}` });
    }

    const profile = await ParentProfile.findOne({ user: parent._id });
    if (!profile) {
      return res.status(404).json({ ok: false, error: "Parent profile not found" });
    }

    if (profile.linkedStudents.some((id) => id.equals(student._id))) {
      return res.status(409).json({ ok: false, error: "Student already linked to this parent" });
    }

    profile.linkedStudents.push(student._id);
    await profile.save();

    return res.json({ ok: true, message: `Linked ${student.name} to ${parent.name}` });
  } catch (err) {
    console.error("Link student error:", err);
    return res.status(500).json({ ok: false, error: "Failed to link student" });
  }
});

export default router;
