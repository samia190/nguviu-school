// routes/parentPortal.js
// Parent Portal System - Email-based access to student results
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// ===== PARENT PORTAL MANAGEMENT =====

// Generate parent access link (ADMIN generates for parent)
router.post("/admin/generate-parent-link", requireRole('admin'), async (req, res) => {
  try {
    const { studentId, parentEmail } = req.body;

    if (!studentId || !parentEmail) {
      return res.status(400).json({ error: "Student ID and parent email required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Generate unique parent access token — SHA-256 is instant and secure enough
    // for a link-delivered token (never typed by a human, no brute-force risk)
    const accessToken = crypto.randomBytes(32).toString('hex');
    const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    // Check if parent record exists, if not create it
    let parentUser = await User.findOne({ 
      email: parentEmail.toLowerCase(),
      role: 'parent'
    });

    if (!parentUser) {
      // Use a fixed placeholder hash — parent authenticates via token link, not password
      const placeholderPasswordHash = crypto.createHash('sha256').update('parent-no-password-' + parentEmail).digest('hex');
      parentUser = new User({
        email: parentEmail.toLowerCase(),
        name: `Parent of ${student.name}`,
        passwordHash: placeholderPasswordHash,
        role: 'parent',
        accessTokenHash,
        accessTokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        linkedStudents: [studentId]
      });
    } else {
      // Add student to parent's linked students if not already there
      if (!parentUser.linkedStudents.includes(studentId)) {
        parentUser.linkedStudents.push(studentId);
      }
      parentUser.accessTokenHash = accessTokenHash;
      parentUser.accessTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await parentUser.save();

    // Create access link — use hash fragment so Render CDN always sees /parent-login
    // and never caches a 404 for the unique token URL
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const accessLink = `${frontendBase}/parent-login#token=${accessToken}&email=${encodeURIComponent(parentEmail)}`;

    // Send email to parent
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">📊 Access Your Child's Results</h2>
        <p>Hello,</p>
        <p>You have been given access to view <strong>${student.name}</strong>'s academic results and performance on the KANGARU GIRLS portal.</p>
        <p>Click the link below to access the parent portal:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${accessLink}" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
          ">Access Parent Portal</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 30 days.</p>
        <p style="color: #64748b; font-size: 14px;">You can view:</p>
        <ul style="color: #64748b; font-size: 14px;">
          <li>Current and historical academic results</li>
          <li>Performance trends and analytics</li>
          <li>Subject-wise performance</li>
          <li>Attendance records</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If you did not request this access, please contact the school administration.</p>
      </div>
    `;

    // Try email with a 6s timeout — fast enough to include result in response
    let emailSent = false;
    let emailError = null;
    try {
      await Promise.race([
        sendEmail(
          parentEmail,
          `Your Child's Results Access - KANGARU GIRLS`,
          `You have been given access to ${student.name}'s results. Click this link to access: ${accessLink}`,
          emailHtml
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout after 6s")), 6000))
      ]);
      emailSent = true;
    } catch (err) {
      emailError = err.message;
      console.error("[email] Failed to send parent access link:", err.message);
    }

    // Always return the link so admin can share it manually if email fails
    return res.json({
      message: emailSent
        ? "Parent access link generated and sent to email"
        : "Parent access link generated (email delivery failed — share link manually)",
      parentEmail: parentEmail.toLowerCase(),
      student: student.name,
      accessLink,
      emailSent,
      emailError: emailError || undefined,
      expiresIn: "30 days"
    });

  } catch (err) {
    console.error("Generate parent link error:", err);
    return res.status(500).json({ error: "Failed to generate parent link" });
  }
});

// Parent login with token
router.post("/parent-login", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: "Email and token required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is not set" });
    }

    const parent = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'parent'
    }).populate('linkedStudents');

    if (!parent || !parent.accessTokenHash || !parent.accessTokenExpires) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    // Check if token is expired
    if (new Date() > parent.accessTokenExpires) {
      return res.status(401).json({ error: "Access token has expired" });
    }

    // Verify token — SHA-256 comparison (matches generation above)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenValid = tokenHash === parent.accessTokenHash;
    if (!tokenValid) {
      return res.status(401).json({ error: "Invalid access token" });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { 
        id: parent._id, 
        email: parent.email, 
        name: parent.name,
        role: 'parent',
        linkedStudents: parent.linkedStudents.map(s => s._id)
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        role: 'parent',
        linkedStudents: parent.linkedStudents
      },
      token: jwtToken
    });

  } catch (err) {
    console.error("Parent login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Get student results for parent
router.get("/student/:studentId/results", requireAuth, async (req, res) => {
  try {
    const parent = req.user;
    const { studentId } = req.params;

    // Verify parent has access to this student
    if (!parent.linkedStudents || !parent.linkedStudents.includes(studentId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const results = await Result.find({
      studentId: studentId,
      published: true
    }).sort({ year: -1, term: -1 }).lean();

    if (results.length === 0) {
      return res.json({ results: [] });
    }

    const student = await Student.findById(studentId).lean();

    return res.json({
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        stream: student.stream,
        admissionNumber: student.admissionNumber
      },
      results: results.map(r => ({
        id: r._id,
        year: r.year,
        term: r.term,
        grade: r.grades?.grade,
        average: r.grades?.average,
        position: r.position,
        outOf: r.outOf,
        attendance: r.attendance,
        subjectCount: r.subjects?.length || 0,
        subjects: r.subjects?.map(s => ({
          name: s.name,
          score: s.score,
          grade: s.grade
        })) || [],
        remarks: r.remarks,
        publishedDate: r.publishedDate
      }))
    });

  } catch (err) {
    console.error("Get parent results error:", err);
    return res.status(500).json({ error: "Failed to get results" });
  }
});

// Get student performance comparison (parent can monitor progress)
router.get("/student/:studentId/comparison", requireAuth, async (req, res) => {
  try {
    const parent = req.user;
    const { studentId } = req.params;

    // Verify parent has access
    if (!parent.linkedStudents || !parent.linkedStudents.includes(studentId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const results = await Result.find({
      studentId: studentId,
      published: true
    }).sort({ year: 1, term: 1 }).lean();

    if (results.length === 0) {
      return res.json({ 
        message: "No results available yet",
        comparison: [] 
      });
    }

    // Group by term and calculate trends
    const comparison = results.map(result => {
      const weakSubjects = (result.subjects || [])
        .filter(s => s.grade === 'D' || s.grade === 'E')
        .map(s => s.name);

      const strongSubjects = (result.subjects || [])
        .filter(s => s.grade === 'A' || s.grade === 'B')
        .map(s => s.name);

      return {
        term: `${result.term} ${result.year}`,
        year: result.year,
        termName: result.term,
        grade: result.grades?.grade,
        average: result.grades?.average,
        position: result.position,
        classSize: result.outOf,
        percentile: result.position && result.outOf ? Math.round((result.position / result.outOf) * 100) : null,
        attendance: result.attendance ? {
          present: result.attendance.daysPresent,
          total: result.attendance.totalDays,
          rate: Math.round((result.attendance.daysPresent / result.attendance.totalDays) * 100)
        } : null,
        subjects: result.subjects?.length || 0,
        strongSubjects: strongSubjects,
        weakSubjects: weakSubjects,
        remarks: result.remarks
      };
    });

    // Calculate improvement/decline
    let trend = null;
    if (comparison.length >= 2) {
      const firstResult = comparison[0];
      const lastResult = comparison[comparison.length - 1];
      const avgChange = (lastResult.average - firstResult.average).toFixed(2);
      const positionImprovement = firstResult.position - lastResult.position;
      
      trend = {
        overallChange: avgChange,
        positionChange: positionImprovement,
        status: avgChange >= 0 ? 'improving' : 'declining',
        summary: avgChange >= 0 
          ? `Performance improving! Average increased by ${avgChange}`
          : `Performance declined slightly. Average decreased by ${Math.abs(avgChange)}`
      };
    }

    return res.json({
      student: { name: results[0].studentName },
      comparison: comparison,
      trend: trend
    });

  } catch (err) {
    console.error("Comparison error:", err);
    return res.status(500).json({ error: "Failed to get comparison" });
  }
});

// Get personalized recommendations for student
router.get("/student/:studentId/recommendations", requireAuth, async (req, res) => {
  try {
    const parent = req.user;
    const { studentId } = req.params;

    if (!parent.linkedStudents || !parent.linkedStudents.includes(studentId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const latestResult = await Result.findOne({
      studentId: studentId,
      published: true
    }).sort({ year: -1, term: -1 }).lean();

    if (!latestResult) {
      return res.json({ recommendations: [] });
    }

    const recommendations = [];

    // Analyze grade
    if (latestResult.grades?.average) {
      if (latestResult.grades.average < 4) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Academic Performance',
          title: 'Significant Support Needed',
          message: `Overall grade is ${latestResult.grades.average.toFixed(1)}/10. Consider requesting additional tutoring support.`,
          action: 'Contact school for support programs'
        });
      } else if (latestResult.grades.average < 6) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Academic Performance',
          title: 'Improvement Opportunities',
          message: `Current average is ${latestResult.grades.average.toFixed(1)}/10. Focus on weak areas.`,
          action: 'Review weak subjects'
        });
      } else if (latestResult.grades.average >= 8) {
        recommendations.push({
          priority: 'LOW',
          category: 'Academic Performance',
          title: 'Excellent Performance',
          message: `Average of ${latestResult.grades.average.toFixed(1)}/10 shows strong academic progress. Continue the good work!`,
          action: 'Maintain current study habits'
        });
      }
    }

    // Analyze weak subjects
    const weakSubjects = (latestResult.subjects || [])
      .filter(s => s.grade === 'D' || s.grade === 'E')
      .slice(0, 3);

    if (weakSubjects.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Subject Focus',
        title: `${weakSubjects.length} Subject(s) Need Attention`,
        message: `${weakSubjects.map(s => s.name).join(', ')} require focused effort.`,
        action: 'Request extra tutoring in weak subjects'
      });
    }

    // Analyze strong subjects
    const strongSubjects = (latestResult.subjects || [])
      .filter(s => s.grade === 'A' || s.grade === 'B')
      .slice(0, 3);

    if (strongSubjects.length > 2) {
      recommendations.push({
        priority: 'LOW',
        category: 'Subject Strength',
        title: `Strengths in ${strongSubjects.map(s => s.name).join(', ')}`,
        message: `Your child shows strong ability in these subjects. Explore advanced topics.`,
        action: 'Encourage further exploration'
      });
    }

    // Analyze attendance
    if (latestResult.attendance) {
      const attendanceRate = (latestResult.attendance.daysPresent / latestResult.attendance.totalDays) * 100;
      if (attendanceRate < 80) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Attendance',
          title: 'Low Attendance Rate',
          message: `Attendance is ${attendanceRate.toFixed(0)}%. Regular attendance is crucial for success.`,
          action: 'Ensure consistent school attendance'
        });
      }
    }

    // Analyze position
    if (latestResult.position && latestResult.outOf) {
      const percentile = (latestResult.position / latestResult.outOf) * 100;
      if (percentile > 80) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Class Ranking',
          title: 'Bottom Performer in Class',
          message: `Position is ${latestResult.position}/${latestResult.outOf}. Additional support needed.`,
          action: 'Discuss with teachers for targeted support'
        });
      }
    }

    // Sort by priority
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return res.json({
      studentName: latestResult.studentName,
      term: `${latestResult.term} ${latestResult.year}`,
      recommendations: recommendations.slice(0, 6),
      nextReview: 'Check back after next term for updated recommendations'
    });

  } catch (err) {
    console.error("Recommendations error:", err);
    return res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// Get all active parent accounts (ADMIN)
router.get("/admin/active-parents", requireRole('admin'), async (req, res) => {
  try {
    const parents = await User.find({
      role: 'parent',
      linkedStudents: { $exists: true, $not: { $size: 0 } }
    })
      .populate('linkedStudents', 'name admissionNumber class')
      .select('email name linkedStudents accessTokenExpires')
      .lean();

    return res.json(parents);
  } catch (err) {
    console.error("Get active parents error:", err);
    return res.status(500).json({ error: "Failed to get active parents" });
  }
});

// Revoke parent access (ADMIN)
router.post("/admin/revoke-parent-access", requireRole('admin'), async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({ error: "Parent ID and student ID required" });
    }

    const parent = await User.findOne({ 
      _id: parentId,
      role: 'parent'
    });

    if (!parent) {
      return res.status(404).json({ error: "Parent not found" });
    }

    // Remove student from parent's linked students
    parent.linkedStudents = parent.linkedStudents.filter(id => id.toString() !== studentId);

    // If no more students, clear access token
    if (parent.linkedStudents.length === 0) {
      parent.accessTokenHash = undefined;
      parent.accessTokenExpires = undefined;
    }

    await parent.save();

    return res.json({ 
      message: "Parent access revoked",
      remainingStudents: parent.linkedStudents.length
    });

  } catch (err) {
    console.error("Revoke access error:", err);
    return res.status(500).json({ error: "Failed to revoke access" });
  }
});

export default router;
