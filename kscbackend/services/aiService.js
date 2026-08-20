// services/aiService.js (ESM)
import * as knowledgeBaseService from "./knowledgeBaseService.js";
import providerFactory from "./providers/providerFactory.js";
import vectorStoreService from "./vectorStoreService.js";
import { getRolePrompt, KNOWLEDGE_GROUNDING_INSTRUCTION } from "./prompts.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DEFAULT_API_PROVIDER = process.env.AI_PROVIDER || "ollama";
const DEFAULT_CHAT_MODEL = process.env.AI_MODEL || process.env.AI_GUEST_MODEL || "qwen-3-4b-instruct";
const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "bge-m3";

/**
 * Generate AI response using OpenAI API or mock fallback
 * @param {string} message - User message
 * @param {string} role - User role (student, teacher, parent, admin, superadmin, staff, user)
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {string} AI response
 */
export const hasOpenAIKey = () => Boolean(OPENAI_API_KEY && OPENAI_API_KEY.length > 10 && OPENAI_API_KEY !== "sk-test");

const getProvider = (providerName) => providerFactory.getProvider(providerName || DEFAULT_API_PROVIDER);

export const buildMessages = ({ role, conversationHistory = [], config = {}, extraContext, retrievedContext, message, systemPrompt }) => {
  const messages = [
    {
      role: "system",
      content: `${systemPrompt}\n\n${KNOWLEDGE_GROUNDING_INSTRUCTION}`,
    },
  ];

  if (retrievedContext) {
    messages.push({
      role: "system",
      content: `Use the following documents to answer the user's query:\n${retrievedContext}`,
    });
  }

  if (extraContext) {
    messages.push({
      role: "system",
      content: `Additional context:\n${extraContext}`,
    });
  }

  const history = formatHistory(conversationHistory, config?.contextWindow || 8);
  history.forEach((msg) => {
    messages.push({
      role: msg.sender === "assistant" ? "assistant" : "user",
      content: msg.text,
    });
  });

  messages.push({ role: "user", content: message });
  return messages;
};

const getRelevantContext = async (message, provider, limit = 4) => {
  if (!message || !provider || typeof provider.createEmbedding !== "function") {
    return null;
  }

  try {
    const embedding = await provider.createEmbedding({
      input: message,
      model: DEFAULT_EMBEDDING_MODEL,
    });
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return null;
    }

    const results = await vectorStoreService.searchVector(embedding, { limit });
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    return results
      .map((result, index) => {
        const payload = result.payload || {};
        const title = payload.title || payload.source || `document-${index + 1}`;
        const content = payload.content || payload.text || "";
        return `Source ${index + 1}: ${title}\n${content}`;
      })
      .join("\n\n");
  } catch (error) {
    console.error("[AI Service] RAG retrieval error:", error?.message || error);
    return null;
  }
};

const splitModels = (value) => (value || "").split(",").map((model) => model.trim()).filter(Boolean);
const providerCircuit = new Map();
const providerTimeoutMs = Math.min(120_000, Math.max(5_000, Number(process.env.AI_REQUEST_TIMEOUT || 30_000)));
const circuitCooldownMs = Math.min(600_000, Math.max(10_000, Number(process.env.AI_PROVIDER_COOLDOWN_MS || 60_000)));
const maxProviderTokens = Math.min(1_000, Math.max(64, Number(process.env.AI_MAX_TOKENS || 500)));

const circuitKey = (provider, model) => `${provider.source}:${model}`;
const canCallProvider = (key) => {
  const state = providerCircuit.get(key);
  return !state || !state.openUntil || state.openUntil <= Date.now();
};
const recordProviderFailure = (key) => {
  const previous = providerCircuit.get(key) || { failures: 0, openUntil: 0 };
  const failures = previous.failures + 1;
  providerCircuit.set(key, { failures, openUntil: failures >= 3 ? Date.now() + circuitCooldownMs : 0 });
};
const recordProviderSuccess = (key) => providerCircuit.delete(key);

const requestSignalWithTimeout = (parentSignal) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("AI provider request timed out")), providerTimeoutMs);
  const abortParent = () => controller.abort(parentSignal?.reason || new Error("Request aborted"));
  if (parentSignal?.aborted) abortParent();
  else parentSignal?.addEventListener("abort", abortParent, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", abortParent);
    },
  };
};

export const getStreamingProviderCandidates = () => {
  const order = (process.env.AI_PROVIDER_ORDER || "groq,openrouter,nvidia").split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
  const providers = {
    groq: { source: "groq", baseUrl: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY || "", models: splitModels(process.env.GROQ_MODEL) },
    openrouter: { source: "openrouter", baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || "", models: splitModels(process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL) },
    nvidia: { source: "nvidia", baseUrl: process.env.NVIDIA_API_URL || "", apiKey: process.env.NVIDIA_API_KEY || "", models: splitModels(process.env.NVIDIA_MODEL) },
  };
  return order.map((name) => providers[name]).filter((provider) => provider && provider.baseUrl && provider.apiKey && provider.models.length);
};

const consumeSse = async (stream, onToken) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";
    for (const event of events) {
      const line = event.split(/\r?\n/).find((entry) => entry.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const token = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch {
        // Ignore provider keep-alives and non-content events.
      }
    }
  }
};

/** Stream OpenAI-compatible provider output while preserving original role prompts and knowledge fallback. */
export const streamAIResponse = async (message, role = "user", conversationHistory = [], config = {}, onToken, signal) => {
  if (!message || typeof message !== "string" || !message.trim()) throw new Error("Message must be a non-empty string");
  const messages = buildMessages({
    role,
    conversationHistory,
    config,
    extraContext: config?.contextNotes || null,
    message: message.trim(),
    systemPrompt: config?.systemPrompt || getRolePrompt(role),
  });
  const failures = [];

  for (const provider of getStreamingProviderCandidates()) {
    for (const model of provider.models) {
      const key = circuitKey(provider, model);
      if (!canCallProvider(key)) {
        failures.push(`${provider.source}/${model}: circuit open`);
        continue;
      }
      const timedRequest = requestSignalWithTimeout(signal);
      try {
        const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          signal: timedRequest.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
            ...(provider.source === "openrouter" ? { "HTTP-Referer": "https://kangarugirls.sc.ke", "X-Title": "Kangaru Girls Assistant" } : {}),
          },
          body: JSON.stringify({ model, messages, stream: true, temperature: config?.temperature ?? 0.2, max_tokens: Math.min(maxProviderTokens, Number(config?.maxTokens || maxProviderTokens)), top_p: config?.topP ?? 0.9 }),
        });
        if (!response.ok || !response.body) {
          failures.push(`${provider.source}/${model}: ${response.status}`);
          recordProviderFailure(key);
          continue;
        }
        let content = "";
        await consumeSse(response.body, (token) => { content += token; onToken(token); });
        if (content.trim()) {
          recordProviderSuccess(key);
          return { response: content, source: provider.source, model, timestamp: new Date().toISOString() };
        }
        failures.push(`${provider.source}/${model}: empty response`);
        recordProviderFailure(key);
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        failures.push(`${provider.source}/${model}: ${error?.message || "network failure"}`);
        recordProviderFailure(key);
      } finally {
        timedRequest.dispose();
      }
    }
  }

  const fallback = knowledgeBaseService.generateEnhancedResponse(message, role, {
    conversationContext: formatHistory(conversationHistory, config?.contextWindow || 8).map((entry) => `${entry.sender}: ${entry.text}`).join("\n"),
    userId: config?.userId,
    conversationId: config?.conversationId,
  });
  const response = fallback.response || "I am sorry, I could not complete that request right now.";
  onToken(response);
  return { response, source: "knowledge-base", model: "offline-fallback", failures, timestamp: fallback.timestamp || new Date().toISOString() };
};

export const generateAIResponse = async (message, role = "user", conversationHistory = [], config = {}) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message must be a non-empty string");
  }

  const providerName = (config?.provider || DEFAULT_API_PROVIDER).toLowerCase();
  const provider = getProvider(providerName);
  const shouldUseProvider = providerName !== "openai" || hasOpenAIKey();

  const extraContext = config?.contextNotes || null;
  const systemPrompt = config?.systemPrompt || getRolePrompt(role);

  if (shouldUseProvider && provider) {
    const retrievedContext = await getRelevantContext(message, provider, 4);
    const messages = buildMessages({
      role,
      conversationHistory,
      config,
      extraContext,
      retrievedContext,
      message,
      systemPrompt,
    });

    try {
      const chatResult = await provider.createChatCompletion({
        model: config?.model || DEFAULT_CHAT_MODEL,
        messages,
        temperature: config?.temperature ?? 0.2,
        maxTokens: config?.maxTokens ?? 500,
        topP: config?.topP ?? 0.9,
      });

      if (!chatResult || !chatResult.content) {
        throw new Error("Empty response from AI provider");
      }

      return {
        response: chatResult.content,
        model: config?.model || DEFAULT_CHAT_MODEL,
        tokensUsed: chatResult.totalTokens,
        source: providerName,
        confidence: 0.9,
        retrievedContext: Boolean(retrievedContext),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[AI Service] ${providerName} error:`, error?.message || error);
    }
  }

  const fallbackResult = knowledgeBaseService.generateEnhancedResponse(message, role, {
    conversationContext: conversationHistory.map((msg) => `${msg.sender}: ${msg.text}`).join("\n"),
    userId: config?.userId,
    conversationId: config?.conversationId,
  });

  return {
    response: fallbackResult.response,
    domain: fallbackResult.domain,
    confidence: fallbackResult.confidence,
    source: "knowledge-base",
    model: config?.model || "offline-fallback",
    timestamp: fallbackResult.timestamp,
  };
};

/**
 * Generate mock AI response for testing/demo
 * Used when OpenAI API is not available or fails
 */
const generateMockResponse = (message, role) => {
  const mockResponses = {
    student: [
      "That's a great question! Let me help you understand this concept. The key points are: (1) understanding the foundation, (2) applying it to different scenarios, and (3) practicing with examples. Try thinking about it this way - how would this apply to your daily life? Feel free to ask follow-up questions!",
      "I can definitely help you with that! Here are the main steps: First, make sure you understand what's being asked. Second, break it down into smaller parts. Third, work through each part carefully. What specific part would you like me to explain further?",
      "That's an important topic in our curriculum! Let me break it down for you: This concept involves several key elements. The main idea is... If you practice with a few examples, this will become much clearer. Would you like me to walk through an example?",
      "Excellent question - this shows you're thinking deeply about the material! The answer involves understanding both the 'what' and the 'why'. Here's my explanation... Does this make sense? What other questions do you have?",
    ],

    teacher: [
      "Here's a suggested approach for your lesson plan: Consider using a combination of direct instruction and hands-on activities. You might start with an engaging hook, then move to guided practice, and finish with independent work. Including peer discussion increases retention. What grade level are you teaching?",
      "For assessment, I'd recommend using a combination of formative and summative evaluation methods. Formative assessments (quizzes, exit tickets) give you ongoing feedback, while summative assessments (projects, exams) measure overall understanding. This balanced approach helps identify student needs early.",
      "This is a solid teaching strategy. You could enhance it by: (1) Adding collaborative learning elements, (2) Incorporating multiple modalities (visual, auditory, kinesthetic), (3) Including reflection time for students to process learning. Have you considered peer teaching?",
      "Great idea! Here's how you might differentiate this lesson for mixed-ability learners: Provide choice boards, use flexible grouping, and offer extension activities for advanced students while providing scaffolding for struggling students. What's your biggest challenge with differentiation?",
    ],

    parent: [
      "Thank you for your question about your child's progress. Based on our curriculum standards, students at this level are expected to develop foundational skills in [area]. Your child is making good progress! I'd recommend focusing on [specific area] at home. Would you like suggestions for practice activities?",
      "I understand your concern about school policies. The school's approach to [policy area] is designed to [goal/reason]. This benefits students by [specific benefits]. If you have additional concerns, I'd recommend scheduling a meeting with [appropriate staff member].",
      "That's a common question from parents. Here's what we're seeing: [situation assessment]. We recommend supporting your child by [suggestions]. Our teachers are committed to helping every student succeed. Please don't hesitate to reach out if you have concerns.",
      "Congratulations on your child's achievement! This shows their dedication and growing skills in [area]. To continue supporting their progress: (1) Acknowledge their effort, (2) Encourage continued practice, (3) Stay engaged with homework. Is there anything specific you'd like to focus on?",
    ],

    admin: [
      "Regarding your administrative question: Based on best practices in school management, I recommend the following approach: [analysis]. Key metrics to monitor: [metrics]. This should result in [expected outcomes]. What specific aspect would you like to explore further?",
      "For this operational challenge: Consider these factors - (1) Resource allocation, (2) Staff capacity, (3) Student impact, (4) Long-term sustainability. A phased implementation approach often works best. What's your timeline for this initiative?",
      "That's an important decision point. Here's the data to consider: [relevant data points]. The options are: [options with pros/cons]. I'd recommend [suggestion] based on [reasoning]. What are your constraints or priorities?",
      "For this policy matter: Review your current practices against best practices in the field. Consider stakeholder input from students, staff, and parents. A comprehensive review process ensures buy-in. Would you like help developing an implementation timeline?",
    ],

    superadmin: [
      "For this strategic initiative: The educational research supports focusing on [area] because [evidence]. Implementation roadmap: Phase 1 [details], Phase 2 [details], Phase 3 [details]. Success metrics: [KPIs]. Resource requirements: [budget/personnel/time]. This aligns with strategic goals: [alignment]. What's your decision framework?",
      "Regarding institutional planning: Consider these factors in your decision: (1) Long-term sustainability, (2) Staff development needs, (3) Student outcome projections, (4) Community impact, (5) Financial implications. Industry leaders in this space have found that [best practice] produces [results]. What's your vision for the school in 5 years?",
      "This is a significant strategic decision. The data indicates: [analysis]. Comparable institutions have taken these approaches: [examples]. I'd recommend a phased approach: [detailed plan]. Critical success factors: [CSFs]. What are your board priorities for this initiative?",
      "For this long-term planning effort: Strategic alignment is crucial. Consider: (1) Mission and vision alignment, (2) Market positioning, (3) Competitive advantages, (4) Resource optimization. A comprehensive strategic plan should address [key areas]. What's your change management strategy?",
    ],

    staff: [
      "Great question about school operations. Here's the procedure: [step-by-step explanation]. You can find more details in [relevant resource/policy]. If you need clarification, reach out to [appropriate department]. Is there anything else about this process?",
      "For scheduling or procedural questions: The school's approach is [explanation]. This ensures [benefits/outcomes]. To request changes or accommodations, contact [department/person]. What specific situation are you dealing with?",
      "That's an important operational matter. Here's what you need to know: [relevant information]. The contact person for [issue] is [name/department]. Please submit requests through [process/system]. Is this for immediate or future needs?",
      "About school policies and procedures: [Policy explanation]. The rationale is [reasoning]. Questions can be directed to [appropriate person]. Staff resources are available in [location/system]. Do you need assistance with [specific area]?",
    ],

    user: [
      "Thank you for your question! At Kangaru Girls School, we believe in [core value]. To answer your question: [response]. For more information, you can [next steps]. Is there anything else I can help you with?",
      "That's a great question about our school. Here's what you should know: [information]. Our approach is designed to [goal/benefit]. If you'd like to learn more, I recommend [resources/contacts]. What else would you like to know?",
      "I'm here to help! Regarding your inquiry: [response]. This is important because [context]. For additional support, you can reach out to [appropriate person/department]. How else can I assist you?",
      "Excellent question! At our school, we focus on [value/approach]. Here's how that applies to your situation: [explanation]. If you need more specific guidance, please contact [appropriate resource]. Is there more I can help with?",
    ],
  };

  const responses = mockResponses[role] || mockResponses.user;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  // Simulate variation by randomly omitting some sentences occasionally
  if (Math.random() > 0.7) {
    return randomResponse.split(". ").slice(0, -1).join(". ") + ".";
  }

  return randomResponse;
};

/**
 * Validate message before sending to API
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== "string") {
    return { valid: false, error: "Message must be a non-empty string" };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (message.length > 5000) {
    return { valid: false, error: "Message is too long (max 5000 characters)" };
  }

  return { valid: true };
};

/**
 * Format conversation history for API
 */
export const formatHistory = (messages, limit = 10) => {
  if (!Array.isArray(messages)) return [];

  // Return last N messages to stay within context window
  return messages.slice(-limit).map((msg) => ({
    sender: msg.sender || msg.role || "unknown",
    text: msg.text || msg.content || "",
  }));
};

export default {
  generateAIResponse,
  generateMockResponse,
  validateMessage,
  formatHistory,
};
