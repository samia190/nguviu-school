import axios from "axios";

const VECTOR_DB_PROVIDER = (process.env.VECTOR_DB_PROVIDER || "qdrant").toLowerCase();
const QDRANT_URL = process.env.QDRANT_URL || "http://127.0.0.1:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "kangaru_knowledge";
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || "1024");

const qdrantClient = axios.create({
  baseURL: QDRANT_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    ...(QDRANT_API_KEY ? { Authorization: `Bearer ${QDRANT_API_KEY}` } : {}),
  },
});

const ensureCollection = async () => {
  if (VECTOR_DB_PROVIDER !== "qdrant") {
    throw new Error(`Unsupported vector store provider: ${VECTOR_DB_PROVIDER}`);
  }

  try {
    await qdrantClient.get(`/collections/${COLLECTION_NAME}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      await qdrantClient.put(`/collections/${COLLECTION_NAME}`, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: "Cosine",
        },
      });
      return true;
    }
    throw error;
  }
};

export const upsertPoints = async (points) => {
  if (!Array.isArray(points) || points.length === 0) return null;
  await ensureCollection();
  return qdrantClient.put(`/collections/${COLLECTION_NAME}/points`, {
    points,
  });
};

export const searchVector = async (vector, { limit = 5, filter = null } = {}) => {
  if (!vector || !Array.isArray(vector) || vector.length === 0) {
    throw new Error("searchVector requires a non-empty embedding vector");
  }

  await ensureCollection();
  const body = {
    vector,
    limit,
    with_payload: true,
    with_vectors: false,
  };

  if (filter) {
    body.filter = filter;
  }

  const response = await qdrantClient.post(`/collections/${COLLECTION_NAME}/points/search`, body);
  return response.data?.result || [];
};

export const deletePoints = async (pointIds) => {
  if (!Array.isArray(pointIds) || pointIds.length === 0) return null;
  await ensureCollection();
  return qdrantClient.post(`/collections/${COLLECTION_NAME}/points/delete`, {
    points: pointIds,
  });
};

export const getCollectionInfo = async () => {
  if (VECTOR_DB_PROVIDER !== "qdrant") {
    throw new Error(`Unsupported vector store provider: ${VECTOR_DB_PROVIDER}`);
  }

  await ensureCollection();
  const response = await qdrantClient.get(`/collections/${COLLECTION_NAME}`);
  return response.data;
};

export default {
  upsertPoints,
  searchVector,
  deletePoints,
  getCollectionInfo,
  ensureCollection,
};