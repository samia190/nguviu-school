import express from "express";
import multer from "multer";
import Staff from "../models/Staff.js";
import { isS3Enabled, uploadBufferToS3, saveBufferToDisk } from "../utils/storage.js";
import path from "path";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    
    res.json(staff);
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
    res.json(staff);
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
      qualifications,
      experience,
      displayOrder: displayOrder || 0,
      active: true
    });

    await staff.save();
    res.status(201).json(staff);
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// PUT update staff member (with optional photo upload)
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Update basic fields
    const { fullName, title, type, department, remarks, email, phone, qualifications, experience, displayOrder } = req.body;

    if (fullName) staff.fullName = fullName;
    if (title) staff.title = title;
    if (type) staff.type = type;
    if (department) staff.department = department;
    if (remarks) staff.remarks = remarks;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (qualifications) staff.qualifications = qualifications;
    if (experience) staff.experience = experience;
    if (displayOrder !== undefined) staff.displayOrder = displayOrder;

    // Handle photo upload if provided
    if (req.file) {
      try {
        let photoUrl;
        if (isS3Enabled()) {
          photoUrl = await uploadBufferToS3(req.file.buffer, `staff/${req.file.originalname}`);
        } else {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "staff");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const safeName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
          const dest = path.join(uploadsDir, safeName);
          fs.writeFileSync(dest, req.file.buffer);
          photoUrl = `/uploads/staff/${safeName}`;
        }
        staff.photoUrl = photoUrl;
      } catch (err) {
        console.error("Error uploading photo:", err);
        return res.status(400).json({ error: "Failed to upload photo" });
      }
    }

    staff.updatedAt = new Date();
    await staff.save();
    res.json(staff);
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
