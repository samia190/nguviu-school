const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  aiProvider: process.env.AI_PROVIDER || "ollama",
  ollamaUrl: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
  qdrantUrl: process.env.QDRANT_URL || "http://127.0.0.1:6333",
  qdrantCollectionName: process.env.QDRANT_COLLECTION_NAME || "kangaru_knowledge",
  embeddingModel: process.env.EMBEDDING_MODEL || "bge-m3",
  chatModel: process.env.AI_MODEL || process.env.AI_GUEST_MODEL || "qwen-3-4b-instruct",
};

export default config;
