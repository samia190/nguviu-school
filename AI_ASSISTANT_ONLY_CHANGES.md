# Targeted Kangaru Scholar Integration

This copy preserves the supplied Kangaru website as-is. The only changed runtime files are the existing floating assistant component and its dedicated AI backend route/service files.

| Original file | Targeted change |
| --- | --- |
| `kscfrontend/src/components/UnifiedAIAssistant.jsx` | Keeps the original launcher, panel placement, colours, and layout; replaces inactive tRPC calls with streamed calls to the existing Kangaru AI route and stores the current browser-session context. |
| `kscbackend/index.js` | Enables the already-present `/api/ai` route mount. |
| `kscbackend/routes/aiAssistant.js` | Adds streamed guest and authenticated assistant endpoints. |
| `kscbackend/controllers/aiController.js` | Adds streaming request handling while retaining the existing endpoints, authentication rules, models, and conversation code. |
| `kscbackend/services/aiService.js` | Adds Groq, OpenRouter, and NVIDIA-compatible ordered streaming fallback while preserving original role prompts and knowledge-base fallback. |

No original school page, navigation component, footer, route selection logic, or non-AI API route is changed.
