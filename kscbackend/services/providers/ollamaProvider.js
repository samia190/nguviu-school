import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const DEFAULT_CHAT_MODEL = process.env.AI_GUEST_MODEL || process.env.AI_MODEL || "qwen-3-4b-instruct";
const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "bge-m3";

const client = axios.create({
  baseURL: OLLAMA_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
  },
});

async function request(path, payload) {
  const response = await client.post(path, payload);
  if (!response?.data) {
    throw new Error("Empty response from Ollama");
  }
  return response.data;
}

export const createChatCompletion = async ({
  model = DEFAULT_CHAT_MODEL,
  messages,
  temperature = 0.7,
  maxTokens = 500,
  topP = 0.9,
}) => {
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
  };

  const data = await request("/v1/chat/completions", body);
  const choice = data?.choices?.[0];
  return {
    content: choice?.message?.content?.trim() || "",
    totalTokens: data?.usage?.total_tokens,
    raw: data,
  };
};

export const createEmbedding = async ({ model = DEFAULT_EMBEDDING_MODEL, input }) => {
  if (!input) {
    throw new Error("Embedding input is required");
  }

  const data = await request("/v1/embeddings", {
    model,
    input,
  });

  return data?.data?.[0]?.embedding || null;
};

export const ping = async () => {
  try {
    const response = await client.get("/v1/models");
    return Array.isArray(response.data);
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