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
import DirectoryIdentity from "../models/DirectoryIdentity.js";
import Student from "../models/Student.js";
import { SCHOOL_ROLES, canActivateDirectoryIdentity, canUseDirectoryRecovery, canUseSchoolAccount, matchesActivationIdentifier } from "../services/directoryAccountPolicy.js";
import { getOptionalIdentityProviderStatus } from "../services/optionalIdentityProviders.js";
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

const normalizeIdentifier = (value) => String(value || "").trim().toLowerCase();

async function findDirectoryIdentity(identifier) {
  const raw = String(identifier || "").trim();
  const value = normalizeIdentifier(raw);
  if (!value) return null;
  return DirectoryIdentity.findOne({ $or: [{ email: value }, { admissionNumber: raw }, { staffId: raw }, { phone: raw }] });
}

function invalidSchoolAccess(res) {
  return res.status(401).json({ error: "Invalid credentials or this school account is not active. Contact the school administration if you need assistance." });
}

router.post("/eligibility", authLimiter, async (req, res) => {
  try {
    const identity = await findDirectoryIdentity(req.body?.identifier);
    if (!identity || identity.registrationLocked || identity.accountStatus === "blocked") return res.status(404).json({ eligible: false, message: "We could not confirm an active school record. Please contact the school administration." });
    if (identity.accountStatus === "active") return res.json({ eligible: false, message: "This school record already has an active account. Please sign in or reset the password." });
    return res.json({ eligible: true, message: "Your school record is available. Use the one-time activation link issued by the school office to create your account." });
  } catch (error) { return res.status(500).json({ error: "Unable to check the school record right now." }); }
});
router.get("/providers", (req, res) => res.json(getOptionalIdentityProviderStatus()));
router.post("/register", authLimiter, async (req, res) => {
  let createdUser = null;
  let linkedIdentity = null;
  try {
    const {
      name,
      email,
      identifier,
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

    const activationIdentifier = identifier || email;
    if (!name || !activationIdentifier || !password) {
      return res.status(400).json({ error: "Name, school email/admission number/staff ID, and password are required" });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is not set in .env" });
    }

    // School accounts can only be claimed through a single-use activation link bound to a verified directory record.
    let assignedRole = null;
    let linkType = null;
    let invite = null;
    if (!inviteToken) return res.status(403).json({ error: "School accounts can only be created from a one-time activation link issued by the school administration." });
    invite = await InviteToken.findOne({ token: inviteToken }).populate("directoryIdentity");
    if (!invite || !invite.directoryIdentity) return res.status(400).json({ error: "Invalid activation link" });
    if (invite.revoked || invite.expiresAt < new Date() || (invite.maxUses !== null && invite.useCount >= invite.maxUses)) return res.status(410).json({ error: "This activation link is no longer available." });
    const identity = invite.directoryIdentity;
    linkedIdentity = identity;
    if (!canActivateDirectoryIdentity(identity, invite)) return res.status(403).json({ error: "This school record cannot be activated. Please contact the school administration." });
    if (!matchesActivationIdentifier(identity, activationIdentifier)) return res.status(403).json({ error: "Use the school email, student admission number, or staff ID registered by the school office for this activation link." });
    assignedRole = invite.role;
    linkType = invite.linkType;
    const verifiedStudent = identity.student ? await Student.findById(identity.student).lean() : null;
    if (assignedRole === "student" && !verifiedStudent) return res.status(403).json({ error: "The linked student directory record is unavailable. Please contact the school administration." });

    const existing = await User.findOne({ email: identity.email });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const hash = await bcrypt.hash(password, 12);
    const user = new User({ name: identity.name, email: identity.email, passwordHash: hash, role: assignedRole, isActive: true, admissionNumber: identity.admissionNumber || undefined, dateOfBirth: verifiedStudent?.dateOfBirth ? new Date(verifiedStudent.dateOfBirth).toISOString().slice(0, 10) : undefined, phone: identity.phone || undefined, stream: identity.stream || undefined });
    createdUser = user;
    await user.save();

    // Profiles copy only school-verified directory data; browser-supplied class, role, and staff identifiers are ignored.
    if (linkType === "student-CBE" || linkType === "student-844") {
      const curriculum = linkType === "student-CBE" ? "CBE" : "8-4-4";
      await StudentProfile.create({
        user: user._id,
        curriculum,
        admissionNumber: identity.admissionNumber,
        stream: identity.stream || undefined,
        yearOfAdmission: verifiedStudent?.yearOfAdmission || undefined,
        grade: identity.grade || undefined,
        form: identity.form || undefined,
        dateOfBirth: verifiedStudent?.dateOfBirth ? new Date(verifiedStudent.dateOfBirth).toISOString().slice(0, 10) : undefined,
      });
    } else if (linkType === "teacher") {
      await TeacherProfile.create({
        user: user._id,
        staffId: identity.staffId || undefined,
        subjects: identity.subjects || [],
        department: identity.department || undefined,
        phone: identity.phone || undefined,
      });
    } else if (linkType === "staff") {
      await StaffProfile.create({
        user: user._id,
        staffId: identity.staffId || undefined,
        position: identity.position || undefined,
        department: identity.department || undefined,
        phone: identity.phone || undefined,
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
    identity.accountUser = user._id;
    identity.accountStatus = "active";
    identity.activatedAt = new Date();
    await identity.save();
    if (identity.student) await Student.findByIdAndUpdate(identity.student, { accountUser: user._id, accountStatus: "active" });
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
    if (createdUser?._id) {
      await Promise.allSettled([
        StudentProfile.deleteMany({ user: createdUser._id }),
        TeacherProfile.deleteMany({ user: createdUser._id }),
        StaffProfile.deleteMany({ user: createdUser._id }),
        ParentProfile.deleteMany({ user: createdUser._id }),
        User.deleteOne({ _id: createdUser._id }),
      ]);
      if (linkedIdentity?.accountUser && String(linkedIdentity.accountUser) === String(createdUser._id)) {
        linkedIdentity.accountUser = undefined; linkedIdentity.accountStatus = "invited"; linkedIdentity.activatedAt = undefined;
        await linkedIdentity.save().catch(() => {});
        if (linkedIdentity.student) await Student.findByIdAndUpdate(linkedIdentity.student, { $unset: { accountUser: 1 }, $set: { accountStatus: "invited" } }).catch(() => {});
      }
    }
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const suppliedIdentifier = identifier || email;
    const normalizedEmail = normalizeIdentifier(suppliedIdentifier);

    if (!normalizedEmail || !password || typeof password !== "string") {
      return res.status(400).json({ error: "Email address, admission number, or staff ID and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Login failed: JWT_SECRET is not configured");
      return res.status(500).json({ error: "JWT_SECRET is not set in .env" });
    }

    const identity = await findDirectoryIdentity(suppliedIdentifier);
    const user = identity?.accountUser ? await User.findById(identity.accountUser) : await User.findOne({ $or: [{ email: normalizedEmail }, { admissionNumber: String(suppliedIdentifier).trim() }] });
    if (!canUseSchoolAccount(user, identity)) return invalidSchoolAccess(res);

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      console.warn(`Login failed: incorrect password for email=${normalizedEmail}`);
      return invalidSchoolAccess(res);
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
    if (!user || !user.isActive) return res.status(401).json({ error: "User account is not active" });

    return res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Forgot Password - Send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const suppliedIdentifier = identifier || email;

    if (!suppliedIdentifier) {
      return res.status(400).json({ error: "Enter your registered email address, admission number, staff ID, or phone number." });
    }

    const identity = await findDirectoryIdentity(suppliedIdentifier);
    const user = identity?.accountUser ? await User.findById(identity.accountUser) : await User.findOne({ $or: [{ email: normalizeIdentifier(suppliedIdentifier) }, { admissionNumber: String(suppliedIdentifier).trim() }] });
    
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
    const resetUrl = `${frontendBase}/reset-password#token=${resetToken}&email=${encodeURIComponent(user.email)}`;

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
        user.email,
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

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) return res.status(400).json({ error: passwordValidation.message });

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    const identity = SCHOOL_ROLES.has(user.role) ? await DirectoryIdentity.findOne({ accountUser: user._id }) : null;
    if (!canUseDirectoryRecovery(user, identity)) return res.status(400).json({ error: "Invalid or expired reset token" });

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
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
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
