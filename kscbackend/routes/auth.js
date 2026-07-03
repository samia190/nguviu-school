// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import InviteToken from "../models/InviteToken.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StaffProfile from "../models/StaffProfile.js";
import ParentProfile from "../models/ParentProfile.js";
import { sendEmail } from "../utils/email.js";
import { authLimiter } from "../middleware/rateLimiter.js";

dotenv.config();

const router = express.Router();

// Password strength validation helper
const validatePasswordStrength = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const isValid = requirements.length && requirements.uppercase && requirements.number && requirements.special;
  
  if (!isValid) {
    const errors = [];
    if (!requirements.length) errors.push("at least 8 characters");
    if (!requirements.uppercase) errors.push("one uppercase letter");
    if (!requirements.number) errors.push("one number");
    if (!requirements.special) errors.push("one special character");
    return { isValid: false, message: `Password must contain: ${errors.join(", ")}` };
  }
  
  return { isValid: true, message: "Password is valid" };
};
router.post("/register", authLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      inviteToken,
      // Role-specific profile fields (all optional at signup)
      phone,
      dateOfBirth,
      admissionNumber,
      stream,
      grade,
      form,
      yearOfAdmission,
      guardianName,
      guardianPhone,
      guardianRelation,
      subjects,
      department,
      qualifications,
      staffId,
      position,
      occupation,
      providedAdmissionNumbers,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is not set in .env" });
    }

    // --- Invite token validation (optional — public registration assigns role "user") ---
    let assignedRole = "user";
    let linkType = null;
    let invite = null;

    if (inviteToken) {
      invite = await InviteToken.findOne({ token: inviteToken });
      if (!invite) {
        return res.status(400).json({ error: "Invalid invite link" });
      }
      if (invite.revoked) {
        return res.status(410).json({ error: "This invite link has been revoked" });
      }
      if (invite.expiresAt < new Date()) {
        return res.status(410).json({ error: "This invite link has expired" });
      }
      if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
        return res.status(410).json({ error: "This invite link has reached its usage limit" });
      }
      // Role comes from the invite, never from the request body
      assignedRole = invite.role;
      linkType = invite.linkType;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email: email.toLowerCase().trim(), passwordHash: hash, role: assignedRole });
    await user.save();

    // --- Create role-specific profile (only for invited users with a linkType) ---
    if (linkType === "student-cbc" || linkType === "student-844") {
      const curriculum = linkType === "student-cbc" ? "CBC" : "8-4-4";
      await StudentProfile.create({
        user: user._id,
        curriculum,
        admissionNumber: admissionNumber || undefined,
        stream: stream || undefined,
        yearOfAdmission: yearOfAdmission || undefined,
        grade: grade || undefined,
        form: form || undefined,
        dateOfBirth: dateOfBirth || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined,
        guardianRelation: guardianRelation || undefined,
      });
    } else if (linkType === "teacher") {
      await TeacherProfile.create({
        user: user._id,
        staffId: staffId || undefined,
        subjects: subjects ? (Array.isArray(subjects) ? subjects : [subjects]) : [],
        department: department || undefined,
        qualifications: qualifications || undefined,
        phone: phone || undefined,
      });
    } else if (linkType === "staff") {
      await StaffProfile.create({
        user: user._id,
        staffId: staffId || undefined,
        position: position || undefined,
        department: department || undefined,
        phone: phone || undefined,
      });
    } else if (linkType === "parent") {
      // Option B: always allow signup, store admission numbers for admin to link later
      const admNums = providedAdmissionNumbers
        ? (Array.isArray(providedAdmissionNumbers) ? providedAdmissionNumbers : [providedAdmissionNumbers]).filter(Boolean)
        : [];
      await ParentProfile.create({
        user: user._id,
        phone: phone || undefined,
        occupation: occupation || undefined,
        providedAdmissionNumbers: admNums,
      });
    }

    // --- Record token usage (only for invite-based registrations) ---
    if (invite) {
      invite.useCount += 1;
    invite.usages.push({ userId: user._id, usedAt: new Date() });
    await invite.save();    }
    const jwtToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: jwtToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Login failed: JWT_SECRET is not configured");
      return res.status(500).json({ error: "JWT_SECRET is not set in .env" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.warn(`Login failed: no user found for email=${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      console.warn(`Login failed: incorrect password for email=${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Get current user (simple inline auth)
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is not set in .env" });
    }

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Forgot Password - Send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success message (security best practice - don't reveal if email exists)
    if (!user) {
      return res.json({ 
        message: "If that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    // Set token expiry (1 hour from now)
    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Create reset URL
    if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
      console.error('[Auth] CRITICAL: FRONTEND_URL environment variable is not set. Password reset emails will contain localhost URLs that will not work in production. Set FRONTEND_URL in your deployment environment.');
    }
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${frontendBase}/reset-password#token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const emailText = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset Request</h2>
        <p>You requested a password reset for your KANGARU GIRLS' Senior School account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
          ">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail(
        email,
        "Password Reset Request - KANGARU GIRLS",
        emailText,
        emailHtml
      );
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Continue anyway - don't reveal email send failure to user
    }

    return res.json({ 
      message: "If that email exists, a password reset link has been sent." 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Failed to process request" });
  }
});

// Reset Password - Verify token and update password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "Email, token, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (new Date() > user.resetTokenExpires) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Verify token
    const tokenValid = await bcrypt.compare(token, user.resetTokenHash);
    if (!tokenValid) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    // Hash new password and update user
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
