# Kangaru Girls School AI System Documentation

## Purpose
This document collects all Kangaru Girls School content and AI assistant model definitions currently present in the repository. It is intended as a single reference for the next implementation or review step.

---

## 1. Knowledge Base Data Sources

### Primary AI knowledge file
- `MAIN/kscbackend/data/kangaruGirlsKnowledgeBase.js`
  - Contains the full guest-facing instruction set and knowledge base for the Kangaru Girls AI Assistant.
  - Provides topic-based matching with `keywords`, `trainingPhrases`, `response`, and `requiresLogin` flags.
  - Includes core categories such as `about`, `history`, `timeline`, `location`, `contact`, `admissions`, `fees`, `academics`, `performance`, `facilities`, `studentLife`, `discipline`, and many more.
  - Supports fallback responses when no topic matches.

### Structured and supporting knowledge documents
- `knowledge based upgrade/`
  - Contains extensive school-specific markdown files, including:
    - `admission_requirements.md`
    - `alumni_association_info.md`
    - `amalgamation_1973.md`
    - `attendance_policy.md`
    - `cbc_transition_details.md`
    - `contact_details_extended.md`
    - `discipline_policy.md`
    - `embu_girls_secondary_school_1962.md`
    - `facilities_overview.md`
    - `first_girls_admission_1949.md`
    - `kangaru_school_rebuild_1947.md`
    - `kcse_2019_report.md`
    - `kcse_2020_report.md`
    - `kcse_2025_report.md`
    - `principal_removal_feb_2026.md`
    - `timeline_detailed.md`
    - `student_unrest_march_2026.md`
    - and many more.
  - These files provide the archive-level material for the knowledge base and can be used to expand responses or train future semantic search.

### AI assistant configuration guidance
- `knowledge based upgrade/AI Assistant Configuration and Persona Guidelines for Kangaru Girls School Intelligence Platform.md`
  - Describes the assistant persona, tone, role-based behavior, intent mapping, and RAG workflow.
  - Defines role-based response styling for Student, Parent, Teacher, Admin, Superadmin, Staff, and Visitor.
  - Documents handling of information gaps and privacy-sensitive behavior.

---

## 2. AI Assistant Backend Architecture

### Core AI model service
- `MAIN/kscbackend/services/aiService.js`
  - Wraps OpenAI ChatCompletions via axios.
  - Uses environment variables:
    - `OPENAI_API_KEY`
    - `OPENAI_MODEL` (default: `gpt-4o-mini`)
    - `OPENAI_API_URL` (default: `https://api.openai.com/v1/chat/completions`)
    - `AI_PROVIDER` (default: `openai`)
  - Defines role-based system prompts in `ROLE_PROMPTS` for:
    - `student`
    - `teacher`
    - `parent`
    - `admin`
    - `superadmin`
    - `staff`
    - `user`
  - Builds chat messages from conversation history and current user input.
  - Falls back to `knowledgeBaseService.generateEnhancedResponse()` when OpenAI is unavailable or returns an error.
  - Returns response metadata including `source`, `model`, `tokensUsed`, `confidence`, and `timestamp`.

### Knowledge-base response service
- `MAIN/kscbackend/services/knowledgeBaseService.js`
  - Maintains role-based persona prompts for enhanced context.
  - Defines `knowledgeDomains` for semantic topic matching, such as:
    - `admissions`
    - `academics`
    - `fees`
    - `performance`
    - `facilities`
    - `studentLife`
    - `contact`
    - `history`
    - `discipline`
  - Provides utilities:
    - `semanticMatch(query, domain)`
    - `detectKnowledgeDomain(query)`
    - `getContextualResponse(userRole, domain, query)`
    - `generateEnhancedResponse(userQuery, userRole, knownContext)`
    - `formatAIResponse(enhancedResponse, requiresLogin)`
  - Adds conversation context if available, improving follow-up answers.
  - Returns a structured object containing:
    - `response`
    - `domain`
    - `confidence`
    - `userRole`
    - `hasContext`
    - `timestamp`

### Controller and API logic
- `MAIN/kscbackend/controllers/aiController.js`
  - Implements AI frontend logic and business rules.
  - Uses data models:
    - `AIAssistantConversation`
    - `AIAssistantMessage`
    - `AIAssistantConfig`
  - Key endpoints:
    - `guestChat` — public endpoint for unauthenticated users.
      - Calls `aiService.generateAIResponse(..., "guest", [])`.
      - Truncates longer responses unless the user explicitly asks for details.
      - Returns fields: `response`, `domain`, `mode`, `confidence`, `source`, `model`, `truncated`, `details`, `timestamp`.
    - `authenticatedChat` — protected endpoint for logged-in users.
      - Builds recent conversation history from `AIAssistantMessage`.
      - Calls `aiService.generateAIResponse(message, userRole, conversationHistory, config)`.
      - Saves user and assistant messages to conversation history when `conversationId` is provided.
      - Tracks `messageCount`, `tokenCount`, and `lastMessageAt`.
      - Returns fields: `response`, `domain`, `confidence`, `source`, `model`, `tokensUsed`, `conversationSaved`, `timestamp`.
  - Also includes conversation CRUD and metadata endpoints:
    - `createConversation`, `getUserConversations`, `getConversation`, `deleteConversation`, `archiveConversation`, `updateConversationTitle`, `pinConversation`, `toggleMessageFavorite`.

### API routes
- `MAIN/kscbackend/routes/aiAssistant.js`
  - `POST /api/ai/chat/guest` → `guestChat`
  - `POST /api/ai/chat` → `authenticatedChat` (requires role auth)
  - `POST /api/ai/conversations` → create a new persisted conversation
  - `GET /api/ai/conversations` → fetch user conversations
  - `GET /api/ai/conversations/:conversationId` → fetch a full conversation
  - `DELETE /api/ai/conversations/:conversationId`
  - `PATCH /api/ai/conversations/:conversationId/archive`
  - `PATCH /api/ai/conversations/:conversationId/title`
  - `PATCH /api/ai/conversations/:conversationId/pin`
  - `POST /api/ai/conversations/:conversationId/messages` → `sendMessage`
  - `PATCH /api/ai/messages/:messageId/favorite`
  - `GET /api/ai/configs`, `POST /api/ai/configs` (admin only)

---

## 3. AI Assistant Data Models

### `AIAssistantConfig`
- File: `MAIN/kscbackend/models/AIAssistantConfig.js`
- Fields:
  - `name`, `description`
  - `model`, `systemPrompt`
  - `temperature`, `maxTokens`, `topP`, `frequencyPenalty`, `presencePenalty`
  - `contextWindow`
  - `isActive`, `isPublic`, `allowedRoles`, `createdBy`, `allowedUsers`
  - `usageCount`, `totalTokensUsed`, `tags`, `version`
  - `createdAt`, `updatedAt`
- Purpose: store AI model settings, prompts, and access rules.

### `AIAssistantConversation`
- File: `MAIN/kscbackend/models/AIAssistantConversation.js`
- Fields:
  - `userId`, `title`, `model`, `configId`
  - `isArchived`, `isPinned`
  - `messageCount`, `tokenCount`
  - `startedAt`, `lastMessageAt`
- Purpose: represent a persisted AI chat session for a user.

### `AIAssistantMessage`
- File: `MAIN/kscbackend/models/AIAssistantMessage.js`
- Fields:
  - `conversationId`, `userId`, `role`, `content`
  - `tokenCount`, `model`, `contentType`
  - `attachments`, `isFavorite`, `feedback`
  - `timestamp`, `editedAt`
- Purpose: store each chat message in a conversation.

---

## 4. Frontend AI Integration

### Main components
- `MAIN/kscfrontend/src/components/UnifiedAIAssistant.jsx`
  - Floating assistant component for both guest and authenticated users.
  - Chooses endpoint based on auth state:
    - guest → `/api/ai/chat/guest`
    - authenticated → `/api/ai/chat`
  - Displays category suggestions, message history, and simple chat UI.

- `MAIN/kscfrontend/src/components/AIAssistant.jsx`
  - Full-page AI assistant for authenticated users.
  - Manages conversation creation, retrieval, and message history.
  - Uses `/api/ai/conversations` for conversation management and `/api/ai/chat` for sending messages.
  - Supports role-aware system prompts in the UI.

- `MAIN/kscfrontend/src/components/FloatingAIChat.jsx`
  - Legacy floating chat widget.
  - Also calls `/api/ai/chat/guest` for guests and `/api/ai/chat` for authenticated users.
  - Overlaps with `UnifiedAIAssistant` and appears redundant.

### Page integration
- `MAIN/kscfrontend/src/App.jsx`
  - Mounts `UnifiedAIAssistant` globally.
  - Contains route mapping for `ai` page to `AIAssistant` component.
  - Uses `user` object decoded from JWT stored in localStorage/sessionStorage.

---

## 5. Operational Behavior

### Guest interaction
- Public guest user can ask general school questions.
- Uses knowledge-base fallback when OpenAI is unavailable.
- Returns concise answers by default.
- Expands when the user asks for "more", "details", "explain", or "tell me more".
- Sensitive topics such as fees and admissions are flagged with `requiresLogin`.

### Authenticated interaction
- Authenticated chat builds contextual history from recent messages.
- Uses role-based prompts to shape answers for `student`, `teacher`, `parent`, `admin`, `superadmin`, and `staff`.
- Persists messages and conversation metadata to MongoDB.
- Acts as the production-ready AI endpoint for logged-in users.

### AI fallback and source tracking
- If `OPENAI_API_KEY` is missing or invalid, or if `AI_PROVIDER` is not `openai`, the system falls back to the knowledge-base generator.
- If OpenAI API fails, the fallback is still used with a `knowledge-base-fallback` source.
- Responses include metadata such as:
  - `source` (`openai`, `knowledge-base`, `knowledge-base-fallback`)
  - `model`
  - `tokensUsed`
  - `confidence`
  - `timestamp`

---

## 6. Deployment & Environment

### Key environment settings
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_API_URL` (default: `https://api.openai.com/v1/chat/completions`)
- `AI_PROVIDER` (default: `openai`)

### Notes
- Backend routes are mounted under `/api/ai`
- Frontend chat components call those routes directly
- Roles are enforced by `requireRole` middleware in `kscbackend/routes/aiAssistant.js`

---

## 7. Existing Documentation References

- `MAIN/AI_KNOWLEDGE_BASE_IMPLEMENTATION.md`
- `MAIN/KNOWLEDGE_BASE_QUICK_REFERENCE.md`
- `knowledge based upgrade/AI Assistant Configuration and Persona Guidelines for Kangaru Girls School Intelligence Platform.md`
- `MAIN/AI_ASSISTANT_AUDIT_REPORT.md`
- `MAIN/INTEGRATION_SPECIFICATION.md`

---

## 8. Recommended Next Step

1. Review `MAIN/KANGARU_GIRLS_AI_SYSTEM_DOCUMENTATION.md` for accuracy.
2. Decide whether to:
   - fully consolidate guest/auth assistants into a single UI component,
   - improve role-specific response routing and access gating,
   - expand the knowledge base with missing school archives from `knowledge based upgrade/`.
3. If desired, add a `README` section to document how to update the knowledge base and AI model prompts.
