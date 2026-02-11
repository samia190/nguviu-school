// routes/results.js
import express from "express";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { performCompleteAnalysis } from "../utils/performanceAnalysis.js";
import { extractResultFromPDF } from "../utils/pdfExtraction.js";

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "results");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "result-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Enhanced helper function to analyze performance using full history
async function analyzePerformance(studentId, currentResult) {
  try {
    // Fetch ALL results for this student
    const allResults = await Result.find({
      studentId,
      published: true
    }).sort({ year: 1, term: 1 });
    
    // Include current result if not already saved
    let resultsToAnalyze = allResults;
    if (!allResults.find(r => r._id?.toString() === currentResult._id?.toString())) {
      resultsToAnalyze = [...allResults, currentResult];
    }
    
    // Perform complete analysis
    const analysis = await performCompleteAnalysis(studentId, currentResult, resultsToAnalyze);
    
    return analysis;
  } catch (err) {
    console.error("Performance analysis error:", err);
    return {
      performanceChange: null,
      improvementAreas: [],
      recommendations: []
    };
  }
}

// Verify student and get their results (STUDENT only)
router.post("/verify-and-fetch", requireAuth, async (req, res) => {
  try {
    // Only students can access this
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Student access only" });
    }
    
    const { admissionNumber, studentName, dateOfBirth, assessmentNumber } = req.body;
    
    if (!admissionNumber || !studentName || !dateOfBirth) {
      return res.status(400).json({ 
        error: "Admission number, full name, and date of birth are required" 
      });
    }
    
    // Find student
    const student = await Student.findOne({ admissionNumber });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Verify name matches (case-insensitive, flexible matching)
    const studentFullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
    const inputName = studentName.trim().toLowerCase();
    const dbName = studentFullName.trim().toLowerCase();
    
    if (inputName !== dbName) {
      return res.status(401).json({ 
        error: "Verification failed. Name does not match our records."
      });
    }
    
    // Verify date of birth matches
    const inputDate = new Date(dateOfBirth);
    const studentDOB = new Date(student.dateOfBirth);
    
    if (inputDate.toDateString() !== studentDOB.toDateString()) {
      return res.status(401).json({ 
        error: "Verification failed. Date of birth does not match."
      });
    }
    
    // Fetch all published results for this student
    const results = await Result.find({
      admissionNumber,
      published: true
    }).sort({ year: -1, term: -1 });
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: "No results found",
        message: "Your results are not yet available. Please check back later."
      });
    }
    
    // Check if any CBC results exist and assessment number is required
    const hasCBCResults = results.some(r => r.curriculum === "CBC");
    
    if (hasCBCResults && assessmentNumber) {
      // Verify assessment number matches for CBC results
      const cbcResults = results.filter(r => r.curriculum === "CBC");
      const mismatch = cbcResults.some(r => 
        r.assessmentNumber && r.assessmentNumber !== assessmentNumber
      );
      
      if (mismatch) {
        return res.status(401).json({ 
          error: "Verification failed. Assessment number does not match."
        });
      }
    }
    
    // Return results with latest first
    const latestResult = results[0];
    const hasHistory = results.length > 1;
    
    // Add performance analysis to latest result
    if (latestResult && student._id) {
      const performanceData = await analyzePerformance(student._id, latestResult);
      latestResult._doc = {
        ...latestResult._doc,
        ...performanceData
      };
    }
    
    return res.json({
      success: true,
      student: {
        name: student.fullName,
        admissionNumber: student.admissionNumber,
        class: student.class,
        stream: student.stream
      },
      latestResult,
      results,
      hasHistory,
      totalResults: results.length
    });
    
  } catch (err) {
    console.error("Verify and fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Get specific result by ID (STUDENT only - with verification)
router.get("/:resultId", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Student access only" });
    }
    
    const result = await Result.findById(req.params.resultId);
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    if (!result.published) {
      return res.status(403).json({ error: "Result not yet published" });
    }
    
    return res.json({ result });
    
  } catch (err) {
    console.error("Get result error:", err);
    return res.status(500).json({ error: "Failed to fetch result" });
  }
});

// ============ ADMIN ROUTES ============

// Get all results (ADMIN only)
router.get("/admin/all", requireRole('admin'), async (req, res) => {
  try {
    const { term, year, published } = req.query;
    
    const query = {};
    if (term) query.term = term;
    if (year) query.year = parseInt(year);
    if (published !== undefined) query.published = published === 'true';
    
    const results = await Result.find(query)
      .sort({ year: -1, term: -1, class: 1, studentName: 1 });
    
    return res.json({ results });
    
  } catch (err) {
    console.error("Get all results error:", err);
    return res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Create/upload new result (ADMIN only)
router.post("/admin/create", requireRole('admin'), async (req, res) => {
  try {
    const resultData = req.body;
    
    // Verify student exists
    const student = await Student.findOne({ 
      admissionNumber: resultData.admissionNumber 
    });
    
    if (!student) {
      return res.status(404).json({ 
        error: "Student not found with admission number: " + resultData.admissionNumber 
      });
    }
    
    // Check if result already exists for this term/year
    const existing = await Result.findOne({
      admissionNumber: resultData.admissionNumber,
      term: resultData.term,
      year: resultData.year,
      examType: resultData.examType || 'End of Term'
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: "Result already exists for this student, term, and year" 
      });
    }
    
    // Create result with student reference and DOB
    const result = new Result({
      ...resultData,
      studentId: student._id,
      dateOfBirth: student.dateOfBirth,
      createdBy: req.user.id
    });
    
    // Analyze performance if subjects exist
    if (result.subjects && result.subjects.length > 0) {
      const performanceData = await analyzePerformance(student._id, result);
      Object.assign(result, performanceData);
    }
    
    await result.save();
    
    return res.status(201).json({
      message: "Result created successfully",
      result
    });
    
  } catch (err) {
    console.error("Create result error:", err);
    return res.status(500).json({ error: "Failed to create result" });
  }
});

// Upload PDF result (ADMIN only)
router.post("/admin/upload-pdf", requireRole('admin'), upload.single('pdf'), async (req, res) => {
  try {
    console.log("PDF Upload request received");
    console.log("File:", req.file);
    console.log("Body:", req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const {
      admissionNumber,
      studentName,
      term,
      year,
      examType,
      overallGrade,
      averageMarks,
      curriculum,
      assessmentNumber
    } = req.body;

    // Verify student exists
    const student = await Student.findOne({ admissionNumber });
    
    if (!student) {
      // Delete uploaded file if student not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        error: "Student not found with admission number: " + admissionNumber 
      });
    }

    // Create result with PDF reference
    const result = new Result({
      admissionNumber,
      studentName: studentName || student.fullName,
      class: student.class,
      stream: student.stream,
      assessmentNumber: assessmentNumber || student.assessmentNumber,
      curriculum: curriculum || "8-4-4",
      term,
      year: parseInt(year),
      examType: examType || "End of Term",
      overallGrade,
      averageMarks: parseFloat(averageMarks) || 0,
      totalMarks: 0,
      subjects: [],
      uploadedPdfUrl: `/results/${req.file.filename}`,
      uploadedPdfFilename: req.file.originalname,
      isUploadedPdf: true,
      studentId: student._id,
      dateOfBirth: student.dateOfBirth,
      published: req.body.published === 'true' || req.body.published === true,
      createdBy: req.user.id
    });

    await result.save();

    return res.status(201).json({
      message: "PDF result uploaded successfully",
      result
    });

  } catch (err) {
    console.error("Upload PDF error:", err);
    console.error("Error stack:", err.stack);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Failed to delete file:", e);
      }
    }
    return res.status(500).json({ 
      error: "Failed to upload PDF result",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update result (ADMIN only)
router.put("/admin/:resultId", requireRole('admin'), async (req, res) => {
  try {
    const updates = req.body;
    
    // Prevent changing student reference
    delete updates.studentId;
    delete updates.admissionNumber;
    delete updates.createdBy;
    
    const result = await Result.findByIdAndUpdate(
      req.params.resultId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    return res.json({
      message: "Result updated successfully",
      result
    });
    
  } catch (err) {
    console.error("Update result error:", err);
    return res.status(500).json({ error: "Failed to update result" });
  }
});

// Publish/unpublish result (ADMIN only)
router.patch("/admin/:resultId/publish", requireRole('admin'), async (req, res) => {
  try {
    const { published } = req.body;
    
    const result = await Result.findByIdAndUpdate(
      req.params.resultId,
      { 
        published,
        publishedDate: published ? new Date() : null
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    return res.json({
      message: `Result ${published ? 'published' : 'unpublished'} successfully`,
      result
    });
    
  } catch (err) {
    console.error("Publish result error:", err);
    return res.status(500).json({ error: "Failed to publish result" });
  }
});

// Delete result (ADMIN only)
router.delete("/admin/:resultId", requireRole('admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.resultId);
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    return res.json({
      message: "Result deleted successfully"
    });
    
  } catch (err) {
    console.error("Delete result error:", err);
    return res.status(500).json({ error: "Failed to delete result" });
  }
});

// Extract data from uploaded PDF (ADMIN only)
router.post("/admin/extract-pdf", requireRole('admin'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Extract data from PDF
    const extractionResult = await extractResultFromPDF(req.file.path);
    
    // Keep the file for later use
    const pdfUrl = `/results/${req.file.filename}`;
    
    return res.json({
      success: true,
      extraction: extractionResult,
      pdfUrl,
      pdfFilename: req.file.originalname,
      message: extractionResult.confidence === 'high' 
        ? 'Data extracted successfully with high confidence'
        : extractionResult.confidence === 'medium'
        ? 'Data extracted with medium confidence. Please verify.'
        : 'Low confidence extraction. Manual entry may be needed.'
    });

  } catch (err) {
    console.error("PDF extraction error:", err);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Failed to delete file:", e);
      }
    }
    return res.status(500).json({ 
      error: "Failed to extract data from PDF",
      message: err.message
    });
  }
});

// Re-analyze all results for a student (ADMIN only)
router.post("/admin/reanalyze/:studentId", requireRole('admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get all results for this student
    const results = await Result.find({ studentId }).sort({ year: -1, term: -1 });
    
    if (results.length === 0) {
      return res.status(404).json({ error: "No results found for this student" });
    }
    
    // Re-analyze the latest result with full history
    const latestResult = results[0];
    const analysis = await analyzePerformance(studentId, latestResult);
    
    // Update the latest result with new analysis
    await Result.findByIdAndUpdate(latestResult._id, {
      ...analysis,
      updatedAt: new Date()
    });
    
    return res.json({
      message: "Results re-analyzed successfully",
      analysis,
      resultsAnalyzed: results.length
    });
    
  } catch (err) {
    console.error("Re-analysis error:", err);
    return res.status(500).json({ error: "Failed to re-analyze results" });
  }
});

// Get detailed analysis for a specific result (ADMIN only)
router.get("/admin/:resultId/analysis", requireRole('admin'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }
    
    // Get full analysis
    const analysis = await analyzePerformance(result.studentId, result);
    
    return res.json({
      result,
      analysis
    });
    
  } catch (err) {
    console.error("Get analysis error:", err);
    return res.status(500).json({ error: "Failed to get analysis" });
  }
});

// Batch re-analyze all students' results (ADMIN only)
router.post("/admin/batch-reanalyze", requireRole('admin'), async (req, res) => {
  try {
    // Get all unique student IDs with results
    const studentIds = await Result.distinct('studentId');
    
    let analyzed = 0;
    let errors = 0;
    
    for (const studentId of studentIds) {
      try {
        const results = await Result.find({ studentId, published: true })
          .sort({ year: -1, term: -1 });
        
        if (results.length > 0) {
          const latestResult = results[0];
          const analysis = await analyzePerformance(studentId, latestResult);
          
          await Result.findByIdAndUpdate(latestResult._id, {
            ...analysis,
            updatedAt: new Date()
          });
          
          analyzed++;
        }
      } catch (e) {
        console.error(`Error analyzing student ${studentId}:`, e);
        errors++;
      }
    }
    
    return res.json({
      message: "Batch re-analysis complete",
      studentsAnalyzed: analyzed,
      errors: errors,
      totalStudents: studentIds.length
    });
    
  } catch (err) {
    console.error("Batch re-analysis error:", err);
    return res.status(500).json({ error: "Failed to batch re-analyze" });
  }
});

export default router;
