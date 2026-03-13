// routes/invites.js
import express from "express";
import crypto from "crypto";
import InviteToken from "../models/InviteToken.js";
import { requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// All invite management endpoints require admin
router.use(requireRole(["admin"]));

// Role mapping from linkType
const LINK_TYPE_ROLE = {
  "student-cbc": "student",
  "student-844": "student",
  "teacher": "teacher",
  "staff": "staff",
  "parent": "parent",
};

// POST /api/admin/invite/generate
// Body: { linkType, label?, maxUses? }
router.post("/generate", async (req, res) => {
  try {
    const { linkType, label = "", maxUses = null } = req.body;

    if (!linkType || !LINK_TYPE_ROLE[linkType]) {
      return res.status(400).json({
        error: `Invalid linkType. Must be one of: ${Object.keys(LINK_TYPE_ROLE).join(", ")}`,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = new InviteToken({
      token,
      linkType,
      role: LINK_TYPE_ROLE[linkType],
      label,
      createdBy: req.user.id,
      expiresAt,
      maxUses: maxUses ? Number(maxUses) : null,
    });

    await invite.save();

    return res.status(201).json({ ok: true, invite: serializeInvite(invite) });
  } catch (err) {
    console.error("Generate invite error:", err);
    return res.status(500).json({ error: "Failed to generate invite link" });
  }
});

// GET /api/admin/invites
// Returns all invite tokens (most-recent first)
router.get("/", async (req, res) => {
  try {
    const invites = await InviteToken.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    return res.json({ ok: true, invites: invites.map(serializeInvite) });
  } catch (err) {
    console.error("List invites error:", err);
    return res.status(500).json({ error: "Failed to list invite links" });
  }
});

// GET /api/admin/invite/validate/:token
// Public endpoint — called by SignUp.jsx on mount to verify the token is still valid
// We intentionally do NOT require admin auth here so the signup page can call it
router.get("/validate/:token", async (req, res, next) => {
  // Skip the admin requireRole middleware by going directly to a handler
  // Note: this route is registered BEFORE router.use(requireRole) for the specific validate path
  // We handle this by overriding the check inline
  // Actually requireRole is applied as router.use above, so we need a workaround.
  // See comment at bottom - we override via a dedicated public router in index.js.
  next();
});

// DELETE /api/admin/invite/:id
// Revoke an invite link immediately
router.delete("/:id", async (req, res) => {
  try {
    const invite = await InviteToken.findById(req.params.id);
    if (!invite) return res.status(404).json({ error: "Invite not found" });

    invite.revoked = true;
    await invite.save();

    return res.json({ ok: true, message: "Invite link revoked" });
  } catch (err) {
    console.error("Revoke invite error:", err);
    return res.status(500).json({ error: "Failed to revoke invite link" });
  }
});

// Helper to serialize an invite for the API response
function serializeInvite(invite) {
  const now = new Date();
  const expired = invite.expiresAt < now;
  const exhausted = invite.maxUses !== null && invite.useCount >= invite.maxUses;

  return {
    id: invite._id,
    token: invite.token,
    linkType: invite.linkType,
    role: invite.role,
    label: invite.label,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    revoked: invite.revoked,
    expired,
    exhausted,
    isValid: !invite.revoked && !expired && !exhausted,
    createdBy: invite.createdBy,
    createdAt: invite.createdAt,
  };
}

export default router;
