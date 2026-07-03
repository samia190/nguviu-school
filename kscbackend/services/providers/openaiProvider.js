import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1";
const DEFAULT_CHAT_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-large";

const client = axios.create({
  baseURL: OPENAI_API_URL,
  timeout: 60000,
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const createChatCompletion = async ({
  model = DEFAULT_CHAT_MODEL,
  messages,
  temperature = 0.7,
  maxTokens = 500,
  topP = 0.9,
}) => {
  const response = await client.post("/chat/completions", {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
  });

  const choice = response?.data?.choices?.[0];
  return {
    content: choice?.message?.content?.trim() || "",
    totalTokens: response?.data?.usage?.total_tokens,
    raw: response.data,
  };
};

export const createEmbedding = async ({ model = DEFAULT_EMBEDDING_MODEL, input }) => {
  if (!input) {
    throw new Error("Embedding input is required");
  }

  const response = await client.post("/embeddings", {
    model,
    input,
  });

  return response?.data?.data?.[0]?.embedding || null;
};

export const ping = async () => {
  try {
    const response = await client.get("/models");
    return Array.isArray(response.data?.data || response.data);
  } catch (error) {
    return false;
  }
};

export const getDefaultChatModel = () => DEFAULT_CHAT_MODEL;
export const getDefaultEmbeddingModel = () => DEFAULT_EMBEDDING_MODEL;

export default {
  createChatCompletion,
  createEmbedding,
  ping,
  getDefaultChatModel,
  getDefaultEmbeddingModel,
};