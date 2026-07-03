// routes/links.js (ESM)
import express from "express";
import { requireRole } from "../middleware/requireAuth.js";
import {
  createLink,
  getUserLinks,
  resolveLinkByCode,
  updateLink,
  deleteLink,
  getLinkAnalytics,
  getTopLinks,
  toggleLinkStatus,
} from "../controllers/linkController.js";

const router = express.Router();

// Public link resolution (no auth required)
router.get("/s/:shortCode", resolveLinkByCode);
router.post("/s/:shortCode/verify", resolveLinkByCode);

// User authenticated routes
router.post("/", requireRole(["admin", "teacher"]), createLink);
router.get("/", requireRole(["admin", "teacher"]), getUserLinks);
router.put("/:linkId", requireRole(["admin", "teacher"]), updateLink);
router.delete("/:linkId", requireRole(["admin", "teacher"]), deleteLink);
router.patch("/:linkId/toggle", requireRole(["admin", "teacher"]), toggleLinkStatus);

// Analytics routes
router.get("/:linkId/analytics", requireRole(["admin", "teacher"]), getLinkAnalytics);
router.get("/top/links", requireRole(["admin", "teacher"]), getTopLinks);

export default router;

