import express from "express";
import multer from "multer";
import Homework from "../models/Homework.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { uploadBuffer } from "../utils/storage.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

function normalizeHomeworkUrls(req, homework) {
  if (!homework) return homework;
  const obj = homework.toObject ? homework.toObject() : homework;
  return {
    ...obj,
    attachments: (obj.attachments || []).map(att => ({
      ...att,
      url: toAbsoluteUrl(req, att.url)
    }))
  };
}

// GET all homework (public or admin/teacher)
router.get("/", async (req, res) => {
  try {
    const { subject, class: classFilter, teacher, status } = req.query;
    const filter = { status: "published" };

    if (subject) filter.subject = subject;
    if (classFilter) filter.class = classFilter;
    if (teacher) filter["teacher._id"] = teacher;
    if (status && req.user?.role === "admin") filter.status = status;

    const homework = await Homework.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .limit(100);

    const normalized = homework.map(hw => normalizeHomeworkUrls(req, hw));
    res.json(normalized);
  } catch (err) {
    console.error("Error fetching homework:", err);
    res.status(500).json({ error: "Failed to fetch homework" });
  }
});

// GET all homework for admin dashboard (all statuses)
router.get("/admin/all", requireAuth, async (req, res) => {
  try {
    console.log("Admin homework fetch - User:", req.user?._id, "Role:", req.user?.role);
    
    // Only admins and teachers can view all homework
    if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
      console.log("Unauthorized - user role:", req.user?.role);
      return res.status(403).json({ error: "Unauthorized" });
    }

    const homework = await Homework.find({})
      .sort({ dueDate: -1, createdAt: -1 })
      .limit(200)
      .lean();

    console.log("Found homework count:", homework.length);
    const normalized = (homework || []).map(hw => normalizeHomeworkUrls(req, hw));
    res.json(normalized);
  } catch (err) {
    console.error("Error fetching homework:", err.message);
    res.status(500).json({ error: "Failed to fetch homework: " + err.message });
  }
});

// GET homework by ID
router.get("/:id", async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }
    res.json(normalizeHomeworkUrls(req, homework));
  } catch (err) {
    console.error("Error fetching homework:", err);
    res.status(500).json({ error: "Failed to fetch homework" });
  }
});

// POST create homework (teachers & admins)
router.post("/", requireAuth, upload.array("attachments", 10), async (req, res) => {
  try {
    const { title, description, subject, class: classParam, contentType, dueDate, status } = req.body;
    const user = req.user;

    // Only teachers and admins can upload homework
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ error: "Only teachers and admins can upload homework" });
    }

    if (!title || !subject || !classParam) {
      return res.status(400).json({ error: "Missing required fields: title, subject, class" });
    }

    // Process file uploads via unified storage (Cloudinary > S3 > Disk)
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploaded = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
          attachments.push({
            originalName: file.originalname,
            name: uploaded.filename || uploaded.public_id || file.originalname,
            url: uploaded.url,
            mimetype: file.mimetype,
            size: file.size
          });
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }

    const homework = new Homework({
      title,
      description,
      subject,
      class: classParam,
      contentType: contentType || "assignment",
      teacher: {
        _id: user._id,
        name: user.name
      },
      dueDate: dueDate || null,
      attachments,
      status: status || "published"
    });

    await homework.save();
    res.status(201).json(normalizeHomeworkUrls(req, homework));
  } catch (err) {
    console.error("Error creating homework:", err);
    res.status(500).json({ error: "Failed to create homework" });
  }
});

// PUT update homework (own homework or admin)
router.put("/:id", requireAuth, upload.array("attachments", 10), async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }

    // Check authorization
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to update this homework" });
    }

    const { title, description, subject, class: classParam, contentType, dueDate, status } = req.body;

    if (title) homework.title = title;
    if (description) homework.description = description;
    if (subject) homework.subject = subject;
    if (classParam) homework.class = classParam;
    if (contentType) homework.contentType = contentType;
    if (dueDate !== undefined) homework.dueDate = dueDate || null;
    if (status) homework.status = status;

    // Handle new file uploads via unified storage (Cloudinary > S3 > Disk)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploaded = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
          homework.attachments.push({
            originalName: file.originalname,
            name: uploaded.filename || uploaded.public_id || file.originalname,
            url: uploaded.url,
            mimetype: file.mimetype,
            size: file.size
          });
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }

    homework.updatedAt = new Date();
    await homework.save();
    res.json(normalizeHomeworkUrls(req, homework));
  } catch (err) {
    console.error("Error updating homework:", err);
    res.status(500).json({ error: "Failed to update homework" });
  }
});

// DELETE homework (own or admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }

    // Check authorization
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to delete this homework" });
    }

    await Homework.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting homework:", err);
    res.status(500).json({ error: "Failed to delete homework" });
  }
});

// DELETE attachment (own or admin)
router.delete("/:homeworkId/attachments/:attachmentId", requireAuth, async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.homeworkId);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }

    // Check authorization
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    homework.attachments = homework.attachments.filter(att => att._id.toString() !== req.params.attachmentId);
    await homework.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting attachment:", err);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

export default router;
