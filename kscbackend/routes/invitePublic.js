// routes/invitePublic.js
// Public endpoint — no auth required.
// Only exposes minimal safe info to let the signup form know if a token is valid.
import express from "express";
import InviteToken from "../models/InviteToken.js";

const router = express.Router();

// GET /api/invite/validate/:token
router.get("/validate/:token", async (req, res) => {
  try {
    const invite = await InviteToken.findOne({ token: req.params.token });
    if (!invite) {
      return res.status(404).json({ valid: false, error: "Invalid invite link" });
    }

    const now = new Date();
    if (invite.revoked) {
      return res.status(410).json({ valid: false, error: "This invite link has been revoked" });
    }
    if (invite.expiresAt < now) {
      return res.status(410).json({ valid: false, error: "This invite link has expired" });
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return res.status(410).json({ valid: false, error: "This invite link has reached its usage limit" });
    }

    // Return only what the frontend needs — do NOT expose admin metadata
    return res.json({
      valid: true,
      linkType: invite.linkType,
      role: invite.role,
      label: invite.label,
    });
  } catch (err) {
    console.error("Validate invite error:", err);
    return res.status(500).json({ valid: false, error: "Could not validate invite link" });
  }
});

export default router;
