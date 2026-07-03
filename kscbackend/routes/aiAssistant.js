// routes/aiAssistant.js (ESM)
import express from "express";
import { requireRole } from "../middleware/requireAuth.js";
import {
  createConversation,
  getUserConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  archiveConversation,
  updateConversationTitle,
  getAIConfigs,
  createAIConfig,
  pinConversation,
  toggleMessageFavorite,
  guestChat,
  authenticatedChat,
  ingestKnowledgeDocument,
  ingestKnowledgeDirectory,
} from "../controllers/aiController.js";

const router = express.Router();

// Public guest chat endpoint (no authentication required)
router.post("/chat/guest", guestChat);

// Authenticated chat endpoint
router.post("/chat", requireRole(["user", "student", "teacher", "admin", "superadmin", "staff", "parent"]), authenticatedChat);

// All remaining routes require authentication
router.use(requireRole(["user", "student", "teacher", "admin", "superadmin", "staff", "parent"]));

// Conversation routes
router.post("/conversations", createConversation);
router.get("/conversations", getUserConversations);
router.get("/conversations/:conversationId", getConversation);
router.delete("/conversations/:conversationId", deleteConversation);
router.patch("/conversations/:conversationId/archive", archiveConversation);
router.patch("/conversations/:conversationId/title", updateConversationTitle);
router.patch("/conversations/:conversationId/pin", pinConversation);

// Message routes
router.post("/conversations/:conversationId/messages", sendMessage);
router.patch("/messages/:messageId/favorite", toggleMessageFavorite);

// Knowledge ingestion routes (admin only)
router.post("/knowledge/ingest/document", requireRole(["admin", "superadmin"]), ingestKnowledgeDocument);
router.post("/knowledge/ingest/directory", requireRole(["admin", "superadmin"]), ingestKnowledgeDirectory);

// Configuration routes (admin and superadmin only)
router.get("/configs", getAIConfigs);
router.post("/configs", requireRole(["admin", "superadmin"]), createAIConfig);

export default router;

