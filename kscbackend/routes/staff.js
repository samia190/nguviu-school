import express from "express";
import multer from "multer";
import Staff from "../models/Staff.js";
import { uploadBuffer } from "../utils/storage.js";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: convert relative URLs to absolute
function toAbsoluteUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (String(relativePath).startsWith("http")) return relativePath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  return `${origin}${relativePath}`;
}

// Middleware to check admin role
function isAdmin(req, res, next) {
  // This assumes auth middleware sets req.user
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function makeDownloadUrl(req, relPath) {
  if (!relPath) return relPath;
  if (String(relPath).startsWith("http")) return relPath;
  const origin = process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
  const p = String(relPath).startsWith("/") ? relPath : `/${relPath}`;
  return `${origin}${p}`;
}

// GET all staff members
router.get("/", async (req, res) => {
  try {
    const { type, active } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (active !== undefined) filter.active = active === "true";
    
    const staff = await Staff.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    
    // Convert photoUrl to absolute URLs
    const staffWithAbsoluteUrls = staff.map(member => ({
      ...member.toObject(),
      photoUrl: toAbsoluteUrl(req, member.photoUrl)
    }));
    
    res.json(staffWithAbsoluteUrls);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// GET single staff member
router.get("/:id", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    
    const staffWithAbsoluteUrl = {
      ...staff.toObject(),
      photoUrl: toAbsoluteUrl(req, staff.photoUrl)
    };
    
    res.json(staffWithAbsoluteUrl);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// POST create new staff member (requires admin)
router.post("/", async (req, res) => {
  try {
    const { fullName, title, type, department, remarks, email, phone, qualifications, experience, displayOrder } = req.body;

    // Validate required fields
    if (!fullName || !title || !type) {
      return res.status(400).json({ error: "Missing required fields: fullName, title, type" });
    }

    const staff = new Staff({
      fullName,
      title,
      type,
      department,
      remarks,
      email,
      phone,
      // Handle qualifications - convert empty arrays to empty string
      qualifications: Array.isArray(qualifications) && qualifications.length === 0 ? "" : qualifications,
      // Handle experience - convert empty arrays to empty string
      experience: Array.isArray(experience) && experience.length === 0 ? "" : experience,
      displayOrder: displayOrder || 0,
      active: true
    });

    await staff.save();
    
    const response = {
      ...staff.toObject(),
      photoUrl: toAbsoluteUrl(req, staff.photoUrl)
    };
    
    res.status(201).json(response);
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// PUT update staff member
router.put("/:id", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Update basic fields
    const { fullName, title, type, department, remarks, email, phone, qualifications, experience, displayOrder, photoUrl } = req.body;

    if (fullName) staff.fullName = fullName;
    if (title) staff.title = title;
    if (type) staff.type = type;
    if (department) staff.department = department;
    if (remarks) staff.remarks = remarks;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    // Handle qualifications - convert empty arrays to empty string
    if (qualifications !== undefined) {
      staff.qualifications = Array.isArray(qualifications) && qualifications.length === 0 ? "" : qualifications;
    }
    // Handle experience - convert empty arrays to empty string
    if (experience !== undefined) {
      staff.experience = Array.isArray(experience) && experience.length === 0 ? "" : experience;
    }
    if (displayOrder !== undefined) staff.displayOrder = displayOrder;
    if (photoUrl) staff.photoUrl = photoUrl;

    staff.updatedAt = new Date();
    await staff.save();
    
    const response = {
      ...staff.toObject(),
      photoUrl: toAbsoluteUrl(req, staff.photoUrl)
    };
    
    res.json(response);
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// DELETE staff member
router.delete("/:id", async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json({ message: "Staff member deleted successfully" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;
