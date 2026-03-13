// routes/results.js
import express from "express";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
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
    
    // Find student in User collection (where seed script creates them)
    let student = await User.findOne({ 
      admissionNumber,
      role: 'student'
    });
    
    // If not found in User collection, try Student collection for backward compatibility
    if (!student) {
      student = await Student.findOne({ admissionNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
    }
    
    // Verify name matches (case-insensitive, flexible matching)
    const studentFullName = student.name || student.fullName || `${student.firstName} ${student.lastName}`.trim();
    const inputName = studentName.trim().toLowerCase();
    const dbName = studentFullName.trim().toLowerCase();
    
    if (inputName !== dbName) {
      return res.status(401).json({ 
        error: "Verification failed: Name does not match our records.",
        details: `Expected: "${studentFullName}" but got: "${studentName}". Please check the spelling and try again.`,
        field: "name"
      });
    }
    
    // Verify date of birth matches
    // Handle both ISO date strings and Date objects
    const parseDate = (dateInput) => {
      if (typeof dateInput === 'string') {
        const [day, month, year] = dateInput.split('/');
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(dateInput);
    };
    
    const inputDate = parseDate(dateOfBirth);
    const studentDOBDate = student.dateOfBirth instanceof Date ? student.dateOfBirth : new Date(student.dateOfBirth);
    
    if (inputDate.toDateString() !== studentDOBDate.toDateString()) {
      return res.status(401).json({ 
        error: "Verification failed: Date of birth does not match our records.",
        details: `Expected: ${studentDOBDate.toDateString()} but got: ${inputDate.toDateString()}. Please check and try again.`,
        field: "dateOfBirth"
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

// Get all published results for a student by their User ID (STUDENT own results)
router.get("/student/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Students can only view their own results
    if (req.user.role === 'student' && req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Student or admin access only" });
    }

    const user = await User.findById(userId).select('admissionNumber').lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.admissionNumber) {
      return res.json([]);
    }

    const results = await Result.find({
      admissionNumber: user.admissionNumber,
      published: true
    }).sort({ year: -1, term: -1 }).lean();

    return res.json(results);
  } catch (err) {
    console.error("Get student results error:", err);
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

    if (result.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Access denied" });
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
    const { term, year, published, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (term) query.term = term;
    if (year) query.year = parseInt(year);
    if (published !== undefined) query.published = published === 'true';
    
    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageLimit;

    // Get total count for pagination
    const total = await Result.countDocuments(query);

    const results = await Result.find(query)
      .sort({ year: -1, term: -1, class: 1, studentName: 1 })
      .skip(skip)
      .limit(pageLimit);
    
    return res.json({ 
      results,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit)
      }
    });
    
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

    // Validate position ≤ outOf
    if (resultData.position && resultData.outOf) {
      const position = parseInt(resultData.position);
      const outOf = parseInt(resultData.outOf);
      if (position > outOf) {
        return res.status(400).json({
          error: "Validation failed: Position cannot be greater than class size",
          details: `Position ${position} exceeds class size ${outOf}`
        });
      }
    }

    // Validate attendance consistency
    if (resultData.attendance) {
      const { daysPresent, daysAbsent, totalDays } = resultData.attendance;
      if (daysPresent && daysAbsent && totalDays) {
        const present = parseInt(daysPresent);
        const absent = parseInt(daysAbsent);
        const total = parseInt(totalDays);
        if (present + absent !== total) {
          return res.status(400).json({
            error: "Validation failed: Attendance days do not add up",
            details: `Days Present (${present}) + Days Absent (${absent}) = ${present + absent}, but Total Days is ${total}`
          });
        }
      }
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
    
    // Validate position ≤ outOf if provided
    if (updates.position && updates.outOf) {
      const position = parseInt(updates.position);
      const outOf = parseInt(updates.outOf);
      if (position > outOf) {
        return res.status(400).json({
          error: "Validation failed: Position cannot be greater than class size",
          details: `Position ${position} exceeds class size ${outOf}`
        });
      }
    }

    // Validate attendance consistency if provided
    if (updates.attendance) {
      const { daysPresent, daysAbsent, totalDays } = updates.attendance;
      if (daysPresent && daysAbsent && totalDays) {
        const present = parseInt(daysPresent);
        const absent = parseInt(daysAbsent);
        const total = parseInt(totalDays);
        if (present + absent !== total) {
          return res.status(400).json({
            error: "Validation failed: Attendance days do not add up",
            details: `Days Present (${present}) + Days Absent (${absent}) = ${present + absent}, but Total Days is ${total}`
          });
        }
      }
    }
    
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

// Batch publish results (ADMIN only)
router.post("/admin/batch-publish", requireRole('admin'), async (req, res) => {
  try {
    const { resultIds } = req.body;
    
    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ error: "Result IDs array is required" });
    }

    const result = await Result.updateMany(
      { _id: { $in: resultIds } },
      { 
        published: true,
        publishedDate: new Date()
      }
    );

    return res.json({
      message: `${result.modifiedCount} result(s) published successfully`,
      published: result.modifiedCount
    });

  } catch (err) {
    console.error("Batch publish error:", err);
    return res.status(500).json({ error: "Failed to batch publish results" });
  }
});

// Bulk import results from CSV
router.post("/admin/bulk-import", requireRole('admin'), async (req, res) => {
  try {
    const { results } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "Results array is required" });
    }

    const importedResults = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      try {
        const resultData = results[i];
        
        // Verify student exists
        const student = await Student.findOne({
          admissionNumber: resultData.admissionNumber
        });
        
        if (!student) {
          errors.push({
            row: i + 1,
            admissionNumber: resultData.admissionNumber,
            error: "Student not found in system"
          });
          continue;
        }

        // Create result document with performance analysis
        const newResult = new Result({
          ...resultData,
          studentId: student._id,
          createdBy: req.user._id,
          createdDate: new Date()
        });

        // Perform performance analysis
        await analyzePerformance(newResult);
        
        await newResult.save();
        importedResults.push(newResult._id);

      } catch (rowErr) {
        errors.push({
          row: i + 1,
          error: "Row validation failed"
        });
      }
    }

    return res.json({
      message: `Imported ${importedResults.length} result(s) successfully`,
      imported: importedResults.length,
      created: importedResults.length,
      errors: errors.length > 0 ? errors : undefined,
      resultIds: importedResults
    });

  } catch (err) {
    console.error("Bulk import error:", err);
    return res.status(500).json({ 
      error: "Failed to bulk import results"
    });
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
      error: "Failed to extract data from PDF"
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

// ===== PHASE 3: ANALYTICS ENDPOINTS =====

// Class Statistics Dashboard
router.get("/admin/analytics/class-statistics", requireRole('admin'), async (req, res) => {
  try {
    const { year, term } = req.query;
    
    let query = { published: true };
    if (year) query.year = parseInt(year);
    if (term) query.term = term;

    const results = await Result.find(query)
      .populate('studentId', 'class stream')
      .lean();

    // Group by class
    const classByGroup = {};
    results.forEach(result => {
      if (result.studentId) {
        const classKey = result.studentId.class;
        if (!classByGroup[classKey]) {
          classByGroup[classKey] = [];
        }
        classByGroup[classKey].push(result);
      }
    });

    // Calculate statistics per class
    const classStats = Object.entries(classByGroup).map(([className, classResults]) => {
      const grades = classResults
        .filter(r => r.grades && r.grades.average)
        .map(r => r.grades.average);
      
      const attendance = classResults
        .filter(r => r.attendance && r.attendance.totalDays)
        .map(r => r.attendance.daysPresent / r.attendance.totalDays);

      const mean = grades.length > 0 
        ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)
        : 0;

      const gradeDistribution = {
        'A': classResults.filter(r => r.grades?.grade === 'A').length,
        'B': classResults.filter(r => r.grades?.grade === 'B').length,
        'C': classResults.filter(r => r.grades?.grade === 'C').length,
        'D': classResults.filter(r => r.grades?.grade === 'D').length,
        'E': classResults.filter(r => r.grades?.grade === 'E').length
      };

      return {
        className,
        studentCount: classResults.length,
        meanGrade: parseFloat(mean),
        medianGrade: grades.length > 0 
          ? grades.sort((a, b) => a - b)[Math.floor(grades.length / 2)]
          : 0,
        minGrade: grades.length > 0 ? Math.min(...grades) : 0,
        maxGrade: grades.length > 0 ? Math.max(...grades) : 0,
        gradeDistribution,
        averageAttendance: attendance.length > 0
          ? (attendance.reduce((a, b) => a + b, 0) / attendance.length * 100).toFixed(1)
          : 0,
        publishedCount: classResults.filter(r => r.published).length
      };
    });

    return res.json({
      timestamp: new Date(),
      filters: { year, term },
      totalClasses: classStats.length,
      totalStudents: results.length,
      classStatistics: classStats.sort((a, b) => a.className.localeCompare(b.className))
    });

  } catch (err) {
    console.error("Class statistics error:", err);
    return res.status(500).json({ error: "Failed to get class statistics" });
  }
});

// Subject-Level Analytics
router.get("/admin/analytics/subject-analytics", requireRole('admin'), async (req, res) => {
  try {
    const { year, term, class: className } = req.query;

    let query = { published: true };
    if (year) query.year = parseInt(year);
    if (term) query.term = term;

    let results = await Result.find(query)
      .populate('studentId', 'class stream name')
      .lean();

    if (className) {
      results = results.filter(r => r.studentId?.class === className);
    }

    // Aggregate by subject
    const subjectMap = {};
    results.forEach(result => {
      if (result.subjects && Array.isArray(result.subjects)) {
        result.subjects.forEach(subject => {
          if (!subjectMap[subject.name]) {
            subjectMap[subject.name] = {
              name: subject.name,
              scores: [],
              grades: [],
              studentCount: 0
            };
          }
          if (subject.score !== null && subject.score !== undefined) {
            subjectMap[subject.name].scores.push(subject.score);
            subjectMap[subject.name].grades.push(subject.grade);
          }
        });
      }
    });

    // Calculate subject statistics
    const subjectStats = Object.values(subjectMap)
      .map(subject => {
        const scores = subject.scores.sort((a, b) => a - b);
        const mean = scores.length > 0 
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
          : 0;

        const gradeCount = {
          'A': subject.grades.filter(g => g === 'A').length,
          'B': subject.grades.filter(g => g === 'B').length,
          'C': subject.grades.filter(g => g === 'C').length,
          'D': subject.grades.filter(g => g === 'D').length,
          'E': subject.grades.filter(g => g === 'E').length
        };

        return {
          name: subject.name,
          studentCount: scores.length,
          meanScore: parseFloat(mean),
          medianScore: scores[Math.floor(scores.length / 2)] || 0,
          minScore: Math.min(...scores),
          maxScore: Math.max(...scores),
          standardDeviation: scores.length > 1 
            ? Math.sqrt(scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scores.length).toFixed(2)
            : 0,
          gradeDistribution: gradeCount,
          passRate: (((gradeCount.A + gradeCount.B + gradeCount.C) / scores.length) * 100).toFixed(1)
        };
      })
      .sort((a, b) => b.meanScore - a.meanScore);

    return res.json({
      timestamp: new Date(),
      filters: { year, term, class: className },
      totalSubjects: subjectStats.length,
      totalStudents: results.length,
      subjectAnalytics: subjectStats
    });

  } catch (err) {
    console.error("Subject analytics error:", err);
    return res.status(500).json({ error: "Failed to get subject analytics" });
  }
});

// Risk Register - Identify at-risk students
router.get("/admin/analytics/risk-register", requireRole('admin'), async (req, res) => {
  try {
    const { year } = req.query;

    let query = { published: true };
    if (year) query.year = parseInt(year);

    const results = await Result.find(query)
      .populate('studentId', 'admissionNumber name class stream')
      .lean();

    const atRiskStudents = [];

    results.forEach(result => {
      const riskFactors = [];
      let riskScore = 0;

      // Check academic performance
      if (result.grades?.average && result.grades.average < 4) {
        riskFactors.push('Low overall grade (< 4)');
        riskScore += 30;
      }

      // Check for D/E grades in multiple subjects
      const weakSubjects = (result.subjects || [])
        .filter(s => s.grade === 'D' || s.grade === 'E');
      if (weakSubjects.length >= 3) {
        riskFactors.push(`Failed ${weakSubjects.length} subjects`);
        riskScore += 25;
      }

      // Check attendance
      if (result.attendance) {
        const attendanceRate = result.attendance.daysPresent / result.attendance.totalDays;
        if (attendanceRate < 0.75) {
          riskFactors.push(`Low attendance (${(attendanceRate * 100).toFixed(0)}%)`);
          riskScore += 20;
        }
      }

      // Check position in class
      if (result.position && result.outOf) {
        const percentile = (result.position / result.outOf) * 100;
        if (percentile > 80) {
          riskFactors.push(`Bottom performer (Position ${result.position}/${result.outOf})`);
          riskScore += 15;
        }
      }

      // Check for any F grade
      const failingSubjects = (result.subjects || []).filter(s => s.grade === 'F');
      if (failingSubjects.length > 0) {
        riskFactors.push(`${failingSubjects.length} failing grade(s)`);
        riskScore += 10;
      }

      // Add to at-risk list if has any risk factors
      if (riskFactors.length > 0) {
        atRiskStudents.push({
          studentId: result.studentId?._id,
          admissionNumber: result.studentId?.admissionNumber,
          name: result.studentId?.name,
          class: result.studentId?.class,
          stream: result.studentId?.stream,
          overallGrade: result.grades?.average || 0,
          position: result.position || null,
          classSize: result.outOf || null,
          attendance: result.attendance ? {
            daysPresent: result.attendance.daysPresent,
            totalDays: result.attendance.totalDays,
            rate: ((result.attendance.daysPresent / result.attendance.totalDays) * 100).toFixed(1)
          } : null,
          riskFactors,
          riskScore,
          riskLevel: riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
          year: result.year,
          term: result.term
        });
      }
    });

    return res.json({
      timestamp: new Date(),
      filters: { year },
      totalStudents: results.length,
      atRiskCount: atRiskStudents.length,
      highRisk: atRiskStudents.filter(s => s.riskLevel === 'HIGH').length,
      mediumRisk: atRiskStudents.filter(s => s.riskLevel === 'MEDIUM').length,
      atRiskStudents: atRiskStudents.sort((a, b) => b.riskScore - a.riskScore)
    });

  } catch (err) {
    console.error("Risk register error:", err);
    return res.status(500).json({ error: "Failed to get risk register" });
  }
});

// Year-over-Year Trending
router.get("/admin/analytics/year-over-year", requireRole('admin'), async (req, res) => {
  try {
    const { class: className } = req.query;

    let query = { published: true };
    const results = await Result.find(query)
      .populate('studentId', 'class stream name')
      .lean();

    let filteredResults = results;
    if (className) {
      filteredResults = results.filter(r => r.studentId?.class === className);
    }

    // Group by year and term
    const yearMap = {};
    filteredResults.forEach(result => {
      const yearKey = result.year || 'Unknown';
      if (!yearMap[yearKey]) {
        yearMap[yearKey] = {
          year: yearKey,
          terms: {}
        };
      }

      const termKey = result.term || 'Unknown';
      if (!yearMap[yearKey].terms[termKey]) {
        yearMap[yearKey].terms[termKey] = [];
      }
      yearMap[yearKey].terms[termKey].push(result);
    });

    // Calculate trends
    const trends = Object.entries(yearMap)
      .map(([year, yearData]) => {
        const termStats = Object.entries(yearData.terms).map(([term, termResults]) => {
          const grades = termResults
            .filter(r => r.grades?.average)
            .map(r => r.grades.average);

          const mean = grades.length > 0 
            ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)
            : 0;

          const gradeA = termResults.filter(r => r.grades?.grade === 'A').length;
          const gradeE = termResults.filter(r => r.grades?.grade === 'E').length;

          return {
            term,
            studentCount: termResults.length,
            meanGrade: parseFloat(mean),
            gradeACount: gradeA,
            gradeECount: gradeE,
            publishedCount: termResults.filter(r => r.published).length
          };
        });

        return {
          year,
          terms: termStats.sort((a, b) => {
            const termOrder = ['Term 1', 'Term 2', 'Term 3'];
            return termOrder.indexOf(a.term) - termOrder.indexOf(b.term);
          }),
          overallMean: (termStats.reduce((sum, t) => sum + t.meanGrade, 0) / termStats.length).toFixed(2)
        };
      })
      .sort((a, b) => {
        const aYear = parseInt(a.year);
        const bYear = parseInt(b.year);
        return aYear - bYear;
      });

    // Calculate improvement/decline trend
    let improvement = null;
    if (trends.length >= 2) {
      const firstYear = trends[0];
      const lastYear = trends[trends.length - 1];
      const firstAvg = parseFloat(firstYear.overallMean);
      const lastAvg = parseFloat(lastYear.overallMean);
      improvement = {
        from: firstYear.year,
        to: lastYear.year,
        fromAverage: firstAvg,
        toAverage: lastAvg,
        change: (lastAvg - firstAvg).toFixed(2),
        percentChange: ((((lastAvg - firstAvg) / firstAvg) * 100).toFixed(2))
      };
    }

    return res.json({
      timestamp: new Date(),
      filters: { class: className },
      totalYears: trends.length,
      yearTrends: trends,
      overallImprovement: improvement,
      trendSummary: trends.length > 0 
        ? `Data available from ${trends[0].year} to ${trends[trends.length - 1].year}`
        : 'No data available'
    });

  } catch (err) {
    console.error("Year-over-year error:", err);
    return res.status(500).json({ error: "Failed to get year-over-year trends" });
  }
});

export default router;
