import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import Homework from "../models/Homework.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadBuffer } from "../utils/storage.js";
import { buildHomeworkPayload } from "../utils/homeworkPayload.js";
import { buildHomeworkSubmissionRecord } from "../utils/homeworkSubmission.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all homework (students, teachers, admins only)
router.get("/", requireAuth, async (req, res) => {
  try {
    const allowedRoles = ["student", "teacher", "admin"];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { subject, class: classFilter, teacher, status } = req.query;
    const filter = { status: "published" };

    if (subject) filter.subject = subject;
    if (classFilter) filter.class = classFilter;
    if (teacher) filter["teacher._id"] = teacher;
    if (status && req.user.role === "admin") filter.status = status;

    const homework = await Homework.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .limit(100);

    res.json(homework);
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
    res.json(homework || []);
  } catch (err) {
    console.error("Error fetching homework:", err.message);
    res.status(500).json({ error: "Failed to fetch homework" });
  }
});

// GET homework by ID (students, teachers, admins only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const allowedRoles = ["student", "teacher", "admin"];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }
    res.json(homework);
  } catch (err) {
    console.error("Error fetching homework:", err.message);
    res.status(500).json({ error: "Failed to fetch homework" });
  }
});

// GET submissions for a homework item (teacher/admin only)
router.get("/:id/submissions", requireAuth, async (req, res) => {
  try {
    if (!["teacher", "admin"].includes(req.user?.role)) {
      return res.status(403).json({ error: "Only teachers and admins can view submissions" });
    }

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }

    const Submission = mongoose.model("HomeworkSubmission");
    const submissions = await Submission.find({ homeworkId: req.params.id }).sort({ submittedAt: -1 }).lean();
    res.json(submissions || []);
  } catch (err) {
    console.error("Error fetching homework submissions:", err.message);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// POST create a student submission for a homework item
router.post("/:id/submissions", requireAuth, upload.array("attachments", 10), async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ error: "Only students can submit homework" });
    }

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ error: "Homework not found" });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
        attachments.push({
          originalName: file.originalname,
          name: uploaded.filename || uploaded.public_id || file.originalname,
          url: uploaded.url,
          mimetype: file.mimetype,
          size: file.size,
        });
      }
    }

    const Submission = mongoose.model("HomeworkSubmission");
    const submissionPayload = buildHomeworkSubmissionRecord({
      homework,
      user: req.user,
      notes: req.body?.notes || "",
      attachments,
    });

    const submission = await Submission.create(submissionPayload);
    res.status(201).json(submission);
  } catch (err) {
    console.error("Error creating homework submission:", err.message);
    res.status(500).json({ error: "Failed to submit homework" });
  }
});

// POST create homework (teachers & admins)
router.post("/", requireAuth, upload.array("attachments", 10), async (req, res) => {
  try {
    const user = req.user;
    const payload = buildHomeworkPayload(req.body);
    const { title, description, subject, class: classParam, contentType, dueDate, status, stream, academicYear, term, topic, department, resourceType, visibility, allowedClasses, allowedStreams } = payload;

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

    // Get teacher name — prefer JWT name, fallback to DB lookup
    let teacherName = user.name;
    if (!teacherName) {
      try {
        const User = mongoose.model("User");
        const dbUser = await User.findById(user.id).select("name").lean();
        teacherName = dbUser?.name || user.email || "Unknown";
      } catch { teacherName = user.email || "Unknown"; }
    }

    const homework = new Homework({
      title,
      description,
      subject,
      class: classParam,
      stream,
      academicYear,
      term,
      topic,
      department,
      resourceType: resourceType || "notes",
      contentType: contentType || "notes",
      teacher: {
        _id: user.id,
        name: teacherName
      },
      dueDate: dueDate || null,
      attachments,
      status: status || "published",
      visibility: visibility || "whole-school",
      allowedClasses: Array.isArray(allowedClasses) ? allowedClasses : [],
      allowedStreams: Array.isArray(allowedStreams) ? allowedStreams : [],
    });

    await homework.save();
    res.status(201).json(homework);
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
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to update this homework" });
    }

    const payload = buildHomeworkPayload(req.body);
    const { title, description, subject, class: classParam, contentType, dueDate, status, stream, academicYear, term, topic, department, resourceType, visibility, allowedClasses, allowedStreams } = payload;

    if (title) homework.title = title;
    if (description !== undefined) homework.description = description;
    if (subject) homework.subject = subject;
    if (classParam) homework.class = classParam;
    if (stream !== undefined) homework.stream = stream;
    if (academicYear !== undefined) homework.academicYear = academicYear;
    if (term !== undefined) homework.term = term;
    if (topic !== undefined) homework.topic = topic;
    if (department !== undefined) homework.department = department;
    if (resourceType) homework.resourceType = resourceType;
    if (contentType) homework.contentType = contentType;
    if (dueDate !== undefined) homework.dueDate = dueDate || null;
    if (status) homework.status = status;
    if (visibility) homework.visibility = visibility;
    if (allowedClasses !== undefined) homework.allowedClasses = Array.isArray(allowedClasses) ? allowedClasses : [];
    if (allowedStreams !== undefined) homework.allowedStreams = Array.isArray(allowedStreams) ? allowedStreams : [];

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

    await homework.save();
    res.json(homework);
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
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user.id.toString();
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
    const isTeacher = req.user.role === "teacher" && homework.teacher._id.toString() === req.user.id.toString();
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
