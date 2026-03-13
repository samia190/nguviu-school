// routes/engagement.js
// Email Notifications & Engagement System
import express from "express";
import Result from "../models/Result.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { sendEmail } from "../utils/email.js";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// ===== EMAIL NOTIFICATION SYSTEM =====

// Send at-risk alerts to parents (ADMIN triggers)
router.post("/admin/send-risk-alerts", requireRole('admin'), async (req, res) => {
  try {
    const { year } = req.body;

    let query = { published: true };
    if (year) query.year = parseInt(year);

    const results = await Result.find(query)
      .populate('studentId', 'name admissionNumber');

    const atRiskStudents = [];
    const alertsSent = [];
    let emailsSent = 0;

    // Identify at-risk students
    results.forEach(result => {
      let riskScore = 0;

      if (result.grades?.average && result.grades.average < 4) {
        riskScore += 30;
      }

      const weakSubjects = (result.subjects || [])
        .filter(s => s.grade === 'D' || s.grade === 'E');
      if (weakSubjects.length >= 3) {
        riskScore += 25;
      }

      if (result.attendance) {
        const attendanceRate = result.attendance.daysPresent / result.attendance.totalDays;
        if (attendanceRate < 0.75) {
          riskScore += 20;
        }
      }

      if (riskScore >= 30) {
        atRiskStudents.push({
          ...result.toObject(),
          riskScore
        });
      }
    });

    // Send emails to parents
    for (const atRiskResult of atRiskStudents) {
      try {
        const student = atRiskResult.studentId;
        
        // Find parents associated with this student
        const parents = await User.find({
          linkedStudents: student._id,
          role: 'parent'
        });

        for (const parent of parents) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">⚠️ Academic Support Alert</h2>
                <p style="margin: 5px 0; opacity: 0.9;">Action may be needed for your child</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                <p>Dear Parent,</p>
                <p>We are writing to inform you that <strong>${student.name}</strong> (Admission: ${student.admissionNumber}) may benefit from additional academic support.</p>
                
                <h3 style="color: #f5576c; margin-top: 20px;">Current Performance:</h3>
                <ul style="background: #f9f9f9; padding: 15px 20px; border-radius: 6px; border-left: 4px solid #f5576c;">
                  <li><strong>Overall Grade:</strong> ${atRiskResult.grades?.average?.toFixed(1) || 'N/A'}/10</li>
                  <li><strong>Position:</strong> ${atRiskResult.position}/${atRiskResult.outOf}</li>
                  <li><strong>Term:</strong> ${atRiskResult.term} ${atRiskResult.year}</li>
                </ul>

                <h3 style="color: #666; margin-top: 20px;">Recommendations:</h3>
                <ul>
                  <li>💬 Schedule a meeting with class teacher to discuss support strategies</li>
                  <li>📚 Consider tutoring in areas of difficulty</li>
                  <li>📅 Monitor attendance and ensure regular school participation</li>
                  <li>🎯 Set realistic academic goals for the next term</li>
                </ul>

                <p style="margin-top: 20px; background: #e8f4f8; padding: 15px; border-radius: 6px; color: #0066cc;">
                  <strong>Log in to the parent portal</strong> to view detailed performance analysis and personalized recommendations.
                </p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                  If you have any questions, please contact the school administration at kangarugirls@yahoo.com or +254796214804.
                </p>
              </div>
            </div>
          `;

          await sendEmail(
            parent.email,
            `Academic Support Alert for ${student.name} - KANGARU GIRLS`,
            `Your child ${student.name} may benefit from additional academic support. Log in to the parent portal for details.`,
            emailHtml
          );

          emailsSent++;
          alertsSent.push({
            studentName: student.name,
            parentEmail: parent.email,
            riskScore: atRiskResult.riskScore
          });
        }
      } catch (emailErr) {
        console.error("Error sending alert email:", emailErr);
      }
    }

    return res.json({
      message: `At-risk alerts sent successfully`,
      atRiskStudentsIdentified: atRiskStudents.length,
      emailsSent: emailsSent,
      alerts: alertsSent
    });

  } catch (err) {
    console.error("Send risk alerts error:", err);
    return res.status(500).json({ error: "Failed to send alerts" });
  }
});

// Send result publication notification to parents
router.post("/admin/notify-result-published", requireRole('admin'), async (req, res) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({ error: "Result ID required" });
    }

    const result = await Result.findById(resultId)
      .populate('studentId', 'name admissionNumber');

    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    // Find parents
    const parents = await User.find({
      linkedStudents: result.studentId._id,
      role: 'parent'
    });

    let emailsSent = 0;

    for (const parent of parents) {
      try {
        const grade = result.grades?.grade || 'N/A';
        const average = result.grades?.average?.toFixed(1) || 'N/A';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">📋 Results Published</h2>
              <p style="margin: 5px 0; opacity: 0.9;">New term results are available</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p>Dear Parent,</p>
              <p>The ${result.term} ${result.year} results for <strong>${result.studentId.name}</strong> have been published.</p>
              
              <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 0; color: #666; font-size: 12px;">Overall Grade</p>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #667eea;">${grade}</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #666; font-size: 12px;">Average Score</p>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #667eea;">${average}/10</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #666; font-size: 12px;">Position</p>
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${result.position}/${result.outOf}</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #666; font-size: 12px;">Subjects</p>
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${result.subjects?.length || 0} subjects</p>
                  </div>
                </div>
              </div>

              <p style="margin: 15px 0; background: #e8f4f8; padding: 15px; border-radius: 6px; color: #0066cc;">
                <strong>View Full Results</strong> in the parent portal for detailed subject breakdown and performance analysis.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        `;

        await sendEmail(
          parent.email,
          `${result.term} Results Published - ${result.studentId.name}`,
          `Results for ${result.studentId.name} have been published. Grade: ${grade}, Average: ${average}`,
          emailHtml
        );

        emailsSent++;
      } catch (emailErr) {
        console.error("Error sending result email:", emailErr);
      }
    }

    return res.json({
      message: "Result publication emails sent",
      emailsSent: emailsSent
    });

  } catch (err) {
    console.error("Notify result error:", err);
    return res.status(500).json({ error: "Failed to send notifications" });
  }
});

// Send improvement celebration emails
router.post("/admin/send-improvement-alerts", requireRole('admin'), async (req, res) => {
  try {
    const { year } = req.body;

    let query = { published: true };
    if (year) query.year = parseInt(year);

    const currentResults = await Result.find(query)
      .populate('studentId', 'name admissionNumber');

    // Find previous term/year results for comparison
    const improvementCases = [];
    let emailsSent = 0;

    for (const current of currentResults) {
      try {
        const previous = await Result.findOne({
          studentId: current.studentId._id,
          published: true,
          _id: { $ne: current._id }
        }).sort({ year: -1, term: -1 });

        if (previous) {
          const improvement = current.grades?.average - previous.grades?.average;
          
          // If improved by 0.5 or more
          if (improvement && improvement >= 0.5) {
            improvementCases.push({
              studentId: current.studentId._id,
              studentName: current.studentId.name,
              improvement: improvement.toFixed(2),
              previousGrade: previous.grades?.average?.toFixed(1),
              currentGrade: current.grades?.average?.toFixed(1)
            });

            // Send email to parents
            const parents = await User.find({
              linkedStudents: current.studentId._id,
              role: 'parent'
            });

            for (const parent of parents) {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">🎉 Great Progress!</h2>
                    <p style="margin: 5px 0; opacity: 0.9;">Your child's performance has improved</p>
                  </div>
                  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
                    <p>Dear Parent,</p>
                    <p>We are delighted to inform you that <strong>${current.studentId.name}</strong> has shown significant academic improvement!</p>
                    
                    <div style="background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                      <p style="margin: 0; font-size: 14px; color: #666;">Overall Progress</p>
                      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #28a745;">
                        +${improvement.toFixed(2)} improvement
                      </p>
                      <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                        Average increased from ${previous.grades?.average?.toFixed(1)}/10 to ${current.grades?.average?.toFixed(1)}/10
                      </p>
                    </div>

                    <p>This improvement is the result of consistent effort and dedication. Please reinforce these positive behaviors and encourage your child to maintain this momentum!</p>

                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                      Keep up the good work! 🌟
                    </p>
                  </div>
                </div>
              `;

              await sendEmail(
                parent.email,
                `🎉 Great Progress - ${current.studentId.name} is Improving!`,
                `${current.studentId.name} has improved by ${improvement.toFixed(2)} points from ${previous.grades?.average?.toFixed(1)} to ${current.grades?.average?.toFixed(1)}`,
                emailHtml
              );

              emailsSent++;
            }
          }
        }
      } catch (err) {
        console.error("Error processing improvement:", err);
      }
    }

    return res.json({
      message: "Improvement alerts processed",
      improvementCasesFound: improvementCases.length,
      emailsSent: emailsSent
    });

  } catch (err) {
    console.error("Send improvement alerts error:", err);
    return res.status(500).json({ error: "Failed to send improvement alerts" });
  }
});

export default router;
