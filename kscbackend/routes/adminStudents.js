import express from "express";
import multer from "multer";
import Student from "../models/Student.js";
import { uploadBuffer } from "../utils/storage.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET students for dropdown/selection (minimal data)
router.get("/list/simple", requireAuth, async (req, res) => {
  try {
    const students = await Student.find({ status: "Active" })
      .select("_id admissionNumber firstName lastName class stream")
      .sort({ class: 1, admissionNumber: 1 });
    
    res.json(students);
  } catch (err) {
    console.error("Error fetching student list:", err);
    res.status(500).json({ error: "Failed to fetch student list" });
  }
});

// GET all students
router.get("/", requireAuth, async (req, res) => {
  try {
    const { class: studentClass, status, searchTerm } = req.query;
    const filter = {};
    
    if (studentClass) filter.class = studentClass;
    if (status) filter.status = status;
    
    if (searchTerm) {
      filter.$or = [
        { admissionNumber: { $regex: searchTerm, $options: "i" } },
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } }
      ];
    }
    
    const students = await Student.find(filter)
      .select("-idCardSecret")
      .sort({ class: 1, admissionNumber: 1 });
    
    res.json({ students, count: students.length });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET single student
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-idCardSecret");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// POST create new student
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      admissionNumber,
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      class: studentClass,
      stream,
      yearOfAdmission,
      assessmentNumber,
      email,
      phoneNumber,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelationship,
      county,
      subCounty,
      ward,
      village,
      photoUrl
    } = req.body;

    // Validate required fields
    if (!admissionNumber || !firstName || !lastName || !studentClass || !dateOfBirth || !guardianName || !guardianPhone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if admission number already exists
    const existing = await Student.findOne({ admissionNumber });
    if (existing) {
      return res.status(400).json({ error: "Admission number already exists" });
    }

    const student = new Student({
      admissionNumber,
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      class: studentClass,
      stream,
      yearOfAdmission: yearOfAdmission || new Date().getFullYear(),
      assessmentNumber,
      email,
      phoneNumber,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelationship,
      county,
      subCounty,
      ward,
      village,
      photoUrl,
      status: "Active"
    });

    // Generate ID card secret for student
    student.generateIdCardSecret();

    await student.save();
    
    // Return without sensitive data
    const studentObj = student.toObject();
    delete studentObj.idCardSecret;
    
    res.status(201).json(studentObj);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
});

// PUT update student
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const {
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      class: studentClass,
      stream,
      yearOfAdmission,
      assessmentNumber,
      email,
      phoneNumber,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelationship,
      county,
      subCounty,
      ward,
      village,
      status,
      photoUrl
    } = req.body;

    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (otherNames) student.otherNames = otherNames;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (studentClass) student.class = studentClass;
    if (stream) student.stream = stream;
    if (yearOfAdmission) student.yearOfAdmission = yearOfAdmission;
    if (assessmentNumber) student.assessmentNumber = assessmentNumber;
    if (email) student.email = email;
    if (phoneNumber) student.phoneNumber = phoneNumber;
    if (guardianName) student.guardianName = guardianName;
    if (guardianPhone) student.guardianPhone = guardianPhone;
    if (guardianEmail) student.guardianEmail = guardianEmail;
    if (guardianRelationship) student.guardianRelationship = guardianRelationship;
    if (county) student.county = county;
    if (subCounty) student.subCounty = subCounty;
    if (ward) student.ward = ward;
    if (village) student.village = village;
    if (status) student.status = status;
    if (photoUrl) student.photoUrl = photoUrl;

    await student.save();

    // Return without sensitive data
    const studentObj = student.toObject();
    delete studentObj.idCardSecret;
    
    res.json(studentObj);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// DELETE student
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
