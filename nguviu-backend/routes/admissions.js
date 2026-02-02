// routes/admissions.js
import express from "express";
import Admission from "../models/Admission.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "admissions");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "adm-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// File fields for admission form
const admissionUploadFields = upload.fields([
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'medicalCertificate', maxCount: 1 },
  { name: 'leavingCertificate', maxCount: 1 },
  { name: 'baptismCertificate', maxCount: 1 },
  { name: 'passportPhoto1', maxCount: 1 },
  { name: 'passportPhoto2', maxCount: 1 },
  { name: 'transferLetter', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

// ============ PUBLIC ROUTES ============

// Submit admission application (PUBLIC)
router.post("/apply", admissionUploadFields, async (req, res) => {
  try {
    const data = req.body;
    
    // Process uploaded files
    const fileFields = [
      'birthCertificate', 'medicalCertificate', 'leavingCertificate',
      'baptismCertificate', 'passportPhoto1', 'passportPhoto2',
      'transferLetter', 'transcript', 'certificate'
    ];
    
    fileFields.forEach(field => {
      if (req.files && req.files[field] && req.files[field][0]) {
        data[field] = `/uploads/admissions/${req.files[field][0].filename}`;
      }
    });
    
    // Convert date string to Date object
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    
    // Convert boolean strings to booleans
    ['studentPromise', 'parentConfirmFit', 'parentUnderstandDiet'].forEach(field => {
      if (data[field] === 'true') data[field] = true;
      if (data[field] === 'false') data[field] = false;
    });
    
    const admission = new Admission(data);
    await admission.save();
    
    return res.status(201).json({
      ok: true,
      message: "Application submitted successfully",
      applicationNumber: admission.applicationNumber
    });
    
  } catch (err) {
    console.error("Admission application error:", err);
    
    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error("Failed to delete file:", e);
        }
      });
    }
    
    return res.status(500).json({ 
      ok: false,
      error: "Failed to submit application",
      message: err.message
    });
  }
});

// Check application status (PUBLIC - by application number and email)
router.get("/status/:applicationNumber", async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const { email } = req.query;
    
    const query = { applicationNumber };
    if (email) {
      query.email = email.toLowerCase();
    }
    
    const admission = await Admission.findOne(query).select('applicationNumber fullName status createdAt reviewedAt');
    
    if (!admission) {
      return res.status(404).json({ error: "Application not found" });
    }
    
    return res.json(admission);
    
  } catch (err) {
    console.error("Check status error:", err);
    return res.status(500).json({ error: "Failed to check status" });
  }
});

// ============ ADMIN ROUTES ============

// Get all admissions (ADMIN only)
router.get("/", requireRole('admin'), async (req, res) => {
  try {
    const { status, year, search, limit = 50, skip = 0 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (year) query.applicationYear = parseInt(year);
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const admissions = await Admission.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Admission.countDocuments(query);
    
    return res.json(admissions);
    
  } catch (err) {
    console.error("Get admissions error:", err);
    return res.status(500).json({ error: "Failed to fetch admissions" });
  }
});

// Get admission statistics (ADMIN only)
router.get("/stats", requireRole('admin'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const stats = await Admission.aggregate([
      { $match: { applicationYear: year } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    
    const result = {
      total,
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0
    };
    
    stats.forEach(s => {
      result[s._id] = s.count;
    });
    
    return res.json(result);
    
  } catch (err) {
    console.error("Get stats error:", err);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get single admission (ADMIN only)
router.get("/:id", requireRole('admin'), async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }
    
    return res.json(admission);
    
  } catch (err) {
    console.error("Get admission error:", err);
    return res.status(500).json({ error: "Failed to fetch admission" });
  }
});

// Update admission status (ADMIN only)
router.patch("/:id/status", requireRole('admin'), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    
    if (!['pending', 'reviewing', 'approved', 'rejected', 'waitlisted'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }
    
    return res.json({
      message: `Application ${status} successfully`,
      admission
    });
    
  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({ error: "Failed to update status" });
  }
});

// Delete admission (ADMIN only)
router.delete("/:id", requireRole('admin'), async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }
    
    // Delete associated files
    const fileFields = [
      'birthCertificate', 'medicalCertificate', 'leavingCertificate',
      'baptismCertificate', 'passportPhoto1', 'passportPhoto2',
      'transferLetter', 'transcript', 'certificate'
    ];
    
    fileFields.forEach(field => {
      if (admission[field]) {
        const filePath = path.join(process.cwd(), "public", admission[field]);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error("Failed to delete file:", e);
        }
      }
    });
    
    await Admission.findByIdAndDelete(req.params.id);
    
    return res.json({ message: "Admission deleted successfully" });
    
  } catch (err) {
    console.error("Delete admission error:", err);
    return res.status(500).json({ error: "Failed to delete admission" });
  }
});

// Bulk update status (ADMIN only)
router.post("/bulk-status", requireRole('admin'), async (req, res) => {
  try {
    const { ids, status, reviewNotes } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No admission IDs provided" });
    }
    
    if (!['pending', 'reviewing', 'approved', 'rejected', 'waitlisted'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const result = await Admission.updateMany(
      { _id: { $in: ids } },
      {
        status,
        reviewNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    return res.json({
      message: `${result.modifiedCount} applications updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
    
  } catch (err) {
    console.error("Bulk update error:", err);
    return res.status(500).json({ error: "Failed to bulk update" });
  }
});

export default router;
