// controllers/aiController.js (ESM)
import AIAssistantConversation from "../models/AIAssistantConversation.js";
import AIAssistantMessage from "../models/AIAssistantMessage.js";
import AIAssistantConfig from "../models/AIAssistantConfig.js";
import User from "../models/User.js";
import Content from "../models/Content.js";
import { guestResponses } from "../data/kangaruGirlsKnowledgeBase.js";
import * as knowledgeBaseService from "../services/knowledgeBaseService.js";
import * as aiService from "../services/aiService.js";
import * as documentProcessor from "../services/documentProcessor.js";
import { buildStudentSupportContext, getStudentPublishedResultsContext } from "../services/studentResultsContext.js";
import Fuse from "fuse.js";

// Normalizes user input: lowercases, removes punctuation, collapses spaces
function normalize(text) {
  return (
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
  );
}

// Build searchable index from guestResponses
function buildSearchableTopics() {
  return Object.entries(guestResponses).map(([id, topic]) => ({
    id,
    title: id,
    keywords: (topic.keywords || []).join(" "),
    trainingPhrases: (topic.trainingPhrases || []).join(" "),
    text: [ (topic.chatResponse || ""), topic.response || "" ].join(" "),
    requiresLogin: !!topic.requiresLogin,
    topic,
  }));
}

const searchable = buildSearchableTopics();
const fuse = new Fuse(searchable, { keys: ["keywords", "trainingPhrases", "text"], threshold: 0.4, includeScore: true });

// Utility: escape regex and whole-word contains
function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(normalizedMessage, phrase) {
  if (!phrase || !normalizedMessage) return false;
  const p = normalize(phrase);
  const regex = new RegExp("\\b" + escapeRegex(p) + "\\b", "i");
  return regex.test(normalizedMessage);
}

// Score-based matching: use whole-word checks for keywords & training phrases
function scoreMatch(normalizedMessage, topic) {
  let score = 0;
  const kws = topic.keywords || [];
  const tps = topic.trainingPhrases || [];

  kws.forEach((kw) => {
    if (!kw) return;
    const wc = kw.split(/\s+/).filter(Boolean).length || 1;
    if (containsKeyword(normalizedMessage, kw)) score += Math.max(1, wc);
  });

  tps.forEach((tp) => {
    if (!tp) return;
    const wc = tp.split(/\s+/).filter(Boolean).length || 1;
    if (containsKeyword(normalizedMessage, tp)) score += Math.max(2, wc * 2);
  });

  return score;
}

function extractTextFromData(data) {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  if (Array.isArray(data)) return data.map(extractTextFromData).join(" ");
  if (typeof data === "object") {
    return Object.values(data)
      .map(extractTextFromData)
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

async function loadPageContentDocs() {
  try {
    const docs = await Content.find({}).lean();
    return docs.map((doc) => {
      const textParts = [doc.title, doc.intro, doc.body, extractTextFromData(doc.data)].filter(Boolean);
      return {
        id: doc._id?.toString() || doc.type || "unknown",
        type: doc.type || "unknown",
        title: doc.title || "",
        intro: doc.intro || "",
        body: doc.body || "",
        dataText: extractTextFromData(doc.data),
        text: textParts.join(" "),
        doc,
      };
    });
  } catch (err) {
    console.error("Error loading page content docs:", err);
    return [];
  }
}

const pageContentCache = {
  docs: [],
  fuse: null,
  createdAt: 0,
};
const PAGE_CONTENT_TTL = 1000 * 60 * 5;

async function refreshPageContentCache() {
  const docs = await loadPageContentDocs();
  const fuseIndex = new Fuse(docs, {
    keys: ["title", "type", "text"],
    threshold: 0.35,
    includeScore: true,
  });
  pageContentCache.docs = docs;
  pageContentCache.fuse = fuseIndex;
  pageContentCache.createdAt = Date.now();
}

async function getPageContentFuse() {
  if (!pageContentCache.fuse || Date.now() - pageContentCache.createdAt > PAGE_CONTENT_TTL) {
    await refreshPageContentCache();
  }
  return pageContentCache.fuse;
}

async function findBestPageContentMatch(message) {
  const normalized = normalize(message);
  const docs = pageContentCache.docs.length > 0 && Date.now() - pageContentCache.createdAt <= PAGE_CONTENT_TTL
    ? pageContentCache.docs
    : await loadPageContentDocs();

  if (!docs.length) return null;

  let bestPageMatch = null;
  for (const page of docs) {
    let score = 0;
    if (containsKeyword(normalized, page.type)) score += 3;
    if (containsKeyword(normalized, page.title)) score += 2;
    if (containsKeyword(normalized, page.intro)) score += 2;
    if (containsKeyword(normalized, page.body)) score += 2;

    if (!bestPageMatch || score > bestPageMatch.score) {
      bestPageMatch = { page, score };
    }
  }

  const fuse = await getPageContentFuse();
  if (fuse) {
    const fuseResults = fuse.search(normalized);
    if (fuseResults && fuseResults.length > 0) {
      const top = fuseResults[0];
      const score = Math.max(1, Math.floor((1 - (top.score || 1)) * 10));
      if (!bestPageMatch || score > bestPageMatch.score) {
        bestPageMatch = { page: top.item, score };
      }
    }
  }

  return bestPageMatch;
}

async function findBestMatch(message) {
  const normalized = normalize(message);

  // Topic priority - search more specific topics first
  const topicPriority = [
    "contact",
    "admissions",
    "fees",
    "curriculum",
    "academics",
    "performance",
    "facilities",
    "boarding",
    "studentLife",
    "history",
    "timeline",
    "location",
    "about",
  ];

  let best = { topic: null, score: 0, key: null };

  // Check priority list first
  for (const key of topicPriority) {
    if (!guestResponses[key]) continue;
    const topic = guestResponses[key];
    const s = scoreMatch(normalized, topic);
    if (s > best.score) best = { topic, score: s, key };
  }

  // Check remaining topics not in priority
  for (const [key, topic] of Object.entries(guestResponses)) {
    if (topicPriority.includes(key)) continue;
    const s = scoreMatch(normalized, topic);
    if (s > best.score) best = { topic, score: s, key };
  }

  const MIN_SCORE = 2;
  const pageMatch = await findBestPageContentMatch(message);
  if (pageMatch && pageMatch.score >= 3) {
    if (pageMatch.score > best.score || best.score < MIN_SCORE) {
      return {
        source: "pageContent",
        pageDoc: pageMatch.page,
        score: pageMatch.score,
        key: pageMatch.page.type || pageMatch.page.id,
      };
    }
  }

  if (best.score >= MIN_SCORE) return { source: "knowledgeBase", topic: best.topic, score: best.score, key: best.key };

  // Use fuzzy search as fallback
  const fuseResults = fuse.search(normalized);
  if (fuseResults && fuseResults.length > 0) {
    const top = fuseResults[0];
    return {
      source: "knowledgeBase",
      topic: top.item.topic,
      score: Math.max(1, Math.floor((1 - (top.score || 1)) * 10)),
      key: top.item.id,
    };
  }

  return { source: "knowledgeBase", topic: guestResponses.fallback, score: 0, key: "fallback" };
}

// Create a new conversation
export const createConversation = async (req, res) => {
  try {
    const { title, configId } = req.body;

    const conversation = new AIAssistantConversation({
      userId: req.user.id,
      title: title || "New Conversation",
      configId,
      messageCount: 0,
      tokenCount: 0,
    });

    await conversation.save();

    res.status(201).json({ ok: true, conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get user conversations
export const getUserConversations = async (req, res) => {
  try {
    const { page = 1, limit = 10, archived = false } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await AIAssistantConversation.find({
      userId: req.user.id,
      isArchived: archived === "true",
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ lastMessageAt: -1 })
      .populate("configId", "name model");

    const total = await AIAssistantConversation.countDocuments({
      userId: req.user.id,
      isArchived: archived === "true",
    });

    res.json({
      ok: true,
      conversations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get conversation with messages
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await AIAssistantConversation.findById(conversationId).populate(
      "configId"
    );

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    const messages = await AIAssistantMessage.find({ conversationId }).sort({
      timestamp: 1,
    });

    res.json({ ok: true, conversation, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

async function getConversationContext(conversationId, limit = 12) {
  if (!conversationId) return [];
  const historyMessages = await AIAssistantMessage.find({ conversationId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();

  return historyMessages.map((message) => ({
    sender: message.role === "assistant" ? "assistant" : "user",
    text: message.content,
  }));
}

// Send message to conversation
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, contentType = "text" } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ ok: false, error: "Message content is required" });
    }

    const conversation = await AIAssistantConversation.findById(conversationId).populate(
      "configId"
    );

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    const userMessage = new AIAssistantMessage({
      conversationId,
      userId: req.user.id,
      role: "user",
      content,
      contentType,
      timestamp: new Date(),
      model: conversation.configId?.model,
    });
    await userMessage.save();

    const conversationHistory = await getConversationContext(conversationId, 12);
    const aiResult = await aiService.generateAIResponse(
      content,
      req.user?.role || "user",
      conversationHistory,
      {
        ...conversation.configId?.toObject(),
        userId: req.user.id,
        conversationId,
      }
    );

    const assistantMessage = new AIAssistantMessage({
      conversationId,
      userId: req.user.id,
      role: "assistant",
      content: aiResult.response,
      contentType: "text",
      timestamp: new Date(),
      model: conversation.configId?.model,
    });
    await assistantMessage.save();

    const estimatedTokens = aiResult.tokensUsed || Math.ceil((content.length + aiResult.response.length) / 4);
    conversation.messageCount += 2;
    conversation.tokenCount += estimatedTokens;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      ok: true,
      userMessage,
      assistantMessage,
      source: aiResult.source,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await AIAssistantConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    // Delete messages
    await AIAssistantMessage.deleteMany({ conversationId });
    await AIAssistantConversation.findByIdAndDelete(conversationId);

    res.json({ ok: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Archive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await AIAssistantConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    conversation.isArchived = !conversation.isArchived;
    await conversation.save();

    res.json({ ok: true, conversation });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Update conversation title
export const updateConversationTitle = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    const conversation = await AIAssistantConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    conversation.title = title;
    await conversation.save();

    res.json({ ok: true, conversation });
  } catch (error) {
    console.error("Error updating conversation title:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get AI configurations
export const getAIConfigs = async (req, res) => {
  try {
    const configs = await AIAssistantConfig.find({
      $or: [{ isPublic: true }, { createdBy: req.user.id }],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ ok: true, configs });
  } catch (error) {
    console.error("Error fetching configs:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const ingestKnowledgeDocument = async (req, res) => {
  try {
    const { filePath, source = "local", visibility = "public" } = req.body;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ ok: false, error: "filePath is required" });
    }

    const document = await documentProcessor.processDocument({ filePath, source, visibility });
    res.status(201).json({ ok: true, document });
  } catch (error) {
    console.error("Error ingesting document:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const ingestKnowledgeDirectory = async (req, res) => {
  try {
    const { directoryPath, source = "local", visibility = "public" } = req.body;

    if (!directoryPath || typeof directoryPath !== "string") {
      return res.status(400).json({ ok: false, error: "directoryPath is required" });
    }

    const documents = await documentProcessor.processDirectory({ directoryPath, source, visibility });
    res.status(201).json({ ok: true, documents });
  } catch (error) {
    console.error("Error ingesting directory:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Create AI configuration (admin only)
export const createAIConfig = async (req, res) => {
  try {
    const {
      name,
      description,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      contextWindow,
      isPublic,
      allowedRoles,
    } = req.body;

    const config = new AIAssistantConfig({
      name,
      description,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      contextWindow,
      isActive: true,
      isPublic,
      allowedRoles,
      createdBy: req.user.id,
    });

    await config.save();

    res.status(201).json({ ok: true, config });
  } catch (error) {
    console.error("Error creating config:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Pin conversation
export const pinConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await AIAssistantConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    conversation.isPinned = !conversation.isPinned;
    await conversation.save();

    res.json({ ok: true, conversation });
  } catch (error) {
    console.error("Error pinning conversation:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Mark message as favorite
export const toggleMessageFavorite = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await AIAssistantMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ ok: false, error: "Message not found" });
    }

    if (message.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    message.isFavorite = !message.isFavorite;
    await message.save();

    res.json({ ok: true, message });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Guest chat endpoint - public, limited information
export const guestChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    const aiResult = await aiService.generateAIResponse(message, "guest", [], {
      userId: null,
      conversationId: null,
    });

    const wantsFull = /\b(more|details|full|explain|tell me more)\b/.test(message.toLowerCase());

    const makeShort = (text) => {
      if (!text || typeof text !== "string") return text;
      const parts = text.split(/\n|(?<=\.|\!|\?)\s+/).filter(Boolean);
      if (parts.length <= 2) return parts.join(" ");
      return parts.slice(0, 2).join(" ") + "\n(Ask for details or 'tell me more' for the full answer)";
    };

    const finalResponse = wantsFull ? aiResult.response : makeShort(aiResult.response);
    const isTruncated = finalResponse !== aiResult.response;

    res.json({
      ok: true,
      response: finalResponse,
      domain: aiResult.domain,
      mode: "guest",
      confidence: aiResult.confidence,
      source: aiResult.source,
      model: aiResult.model,
      truncated: isTruncated,
      details: isTruncated ? aiResult.response : undefined,
      timestamp: aiResult.timestamp,
    });
  } catch (error) {
    console.error("Error in guest chat:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Authenticated user chat endpoint - full features with conversation context
export const authenticatedChat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    let conversationHistory = [];
    if (conversationId) {
      try {
        const historyMessages = await AIAssistantMessage.find({ conversationId })
          .sort({ timestamp: 1 })
          .limit(12)
          .lean();

        conversationHistory = historyMessages.map((msg) => ({
          sender: msg.role === "assistant" ? "assistant" : "user",
          text: msg.content,
        }));
      } catch (contextError) {
        console.error("Error fetching conversation context:", contextError);
      }
    }

    const aiResult = await aiService.generateAIResponse(
      message,
      req.user?.role || "student",
      conversationHistory,
      {
        userId: req.user.id,
        conversationId: conversationId || undefined,
      }
    );

    let saved = false;
    if (conversationId) {
      try {
        const conversation = await AIAssistantConversation.findById(conversationId).populate(
          "configId"
        );
        if (conversation && conversation.userId.toString() === req.user.id.toString()) {
          const userMsg = new AIAssistantMessage({
            conversationId,
            userId: req.user.id,
            role: "user",
            content: message,
            contentType: "text",
            timestamp: new Date(),
            model: conversation.configId?.model,
          });
          await userMsg.save();

          const assistantMsg = new AIAssistantMessage({
            conversationId,
            userId: req.user.id,
            role: "assistant",
            content: aiResult.response,
            contentType: "text",
            timestamp: new Date(),
            model: conversation.configId?.model,
          });
          await assistantMsg.save();

          const estimatedTokens = aiResult.tokensUsed || Math.ceil((message.length + aiResult.response.length) / 4);
          conversation.messageCount = (conversation.messageCount || 0) + 2;
          conversation.tokenCount = (conversation.tokenCount || 0) + estimatedTokens;
          conversation.lastMessageAt = new Date();
          await conversation.save();
          saved = true;
        }
      } catch (dbError) {
        console.error("Error saving authenticated chat messages:", dbError);
      }
    }

    res.json({
      ok: true,
      response: aiResult.response,
      domain: aiResult.domain,
      confidence: aiResult.confidence,
      source: aiResult.source,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      mode: "authenticated",
      userRole: req.user?.role || "student",
      conversationSaved: saved,
      timestamp: aiResult.timestamp,
    });
  } catch (error) {
    console.error("Error in authenticated chat:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

const MAX_STREAM_MESSAGE_LENGTH = 5000;
const MAX_STREAM_HISTORY = 12;

const normalizeStreamHistory = (history) => Array.isArray(history)
  ? history.filter((entry) => entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.content === "string" && entry.content.trim()).slice(-MAX_STREAM_HISTORY).map((entry) => ({ sender: entry.role, text: entry.content.trim() }))
  : [];

const writeSse = (res, payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

const streamResponse = async (req, res, role, overrides = {}) => {
  const { message, history = [], conversationId } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim() || message.length > MAX_STREAM_MESSAGE_LENGTH) {
    return res.status(400).json({ ok: false, error: "Message must be between 1 and 5000 characters." });
  }

  let conversationHistory = normalizeStreamHistory(history);
  if (conversationId && req.user) {
    const conversation = await AIAssistantConversation.findById(conversationId).lean();
    if (conversation && conversation.userId?.toString() === req.user.id?.toString()) {
      const stored = await AIAssistantMessage.find({ conversationId }).sort({ timestamp: 1 }).limit(MAX_STREAM_HISTORY).lean();
      conversationHistory = stored.map((entry) => ({ sender: entry.role, text: entry.content }));
    }
  }

  const controller = new AbortController();
  let completed = false;
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.on("close", () => { if (!completed) controller.abort(); });

  try {
    const result = await aiService.streamAIResponse(message, role, conversationHistory, {
      userId: req.user?.id,
      conversationId,
      contextNotes: overrides.contextNotes || null,
      systemPrompt: overrides.systemPrompt || null,
      maxTokens: overrides.maxTokens || 450,
      temperature: overrides.temperature ?? 0.2,
    }, (token) => writeSse(res, { type: "token", token }), controller.signal);
    writeSse(res, { type: "done", source: result.source, model: result.model });
  } catch (error) {
    if (!controller.signal.aborted) {
      console.error("AI stream error:", error?.message || error);
      writeSse(res, { type: "error", message: "The assistant could not respond right now. Please try again." });
    }
  } finally {
    completed = true;
    res.end();
  }
};

export const streamGuestChat = (req, res) => streamResponse(req, res, "guest");
export const streamAuthenticatedChat = (req, res) => streamResponse(req, res, req.user?.role || "user");

// This endpoint deliberately ignores any result data supplied by the browser.
// It derives a minimal published-results context from the authenticated student.
export const streamStudentResultsSupport = async (req, res) => {
  try {
    const resultContext = await getStudentPublishedResultsContext(req.user.id);
    const supportPrompt = [
      "You are Kangaru Scholar's student results support assistant.",
      "Give encouraging, practical study guidance based only on the server-provided published results context.",
      "State uncertainty clearly. Do not diagnose health or wellbeing, predict a student's future as certain, compare the student to named peers, give disciplinary advice, or make decisions for staff.",
      "For serious concerns, encourage the student to speak with a trusted teacher, counsellor, or guardian.",
      "Never reveal private data or information about any other student.",
    ].join(" ");
    return streamResponse(req, res, "student", {
      contextNotes: buildStudentSupportContext(resultContext),
      systemPrompt: supportPrompt,
      maxTokens: 420,
      temperature: 0.15,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ ok: false, error: "Unable to prepare results support" });
  }
};
