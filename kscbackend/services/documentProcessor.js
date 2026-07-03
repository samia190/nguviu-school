import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as pdfParse from "pdf-parse";
import providerFactory from "./providers/providerFactory.js";
import KnowledgeDocument from "../models/KnowledgeDocument.js";
import vectorStoreService from "./vectorStoreService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supportedExtensions = [".md", ".markdown", ".txt", ".pdf", ".docx", ".pptx", ".csv", ".xlsx"];

const readFileText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".md" || ext === ".markdown" || ext === ".txt") {
    return fs.promises.readFile(filePath, "utf-8");
  }
  if (ext === ".pdf") {
    const buffer = await fs.promises.readFile(filePath);
    const data = await pdfParse.default(buffer);
    return data.text || "";
  }
  return "";
};

const normalizeText = (text) => text.replace(/\s+/g, " ").trim();

const chunkText = (text, maxSize = 800, overlap = 100) => {
  const chunks = [];
  let pointer = 0;
  while (pointer < text.length) {
    const chunk = text.slice(pointer, pointer + maxSize);
    if (!chunk.trim()) break;
    chunks.push(chunk.trim());
    pointer += maxSize - overlap;
  }
  return chunks;
};

const buildMetadata = (filePath, source, type, rawText) => ({
  source,
  path: filePath,
  type,
  title: path.basename(filePath),
  length: rawText.length,
  preview: rawText.slice(0, 400),
});

export const processDocument = async ({ filePath, source = "local", visibility = "public" }) => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const extension = path.extname(absolutePath).toLowerCase();

  if (!supportedExtensions.includes(extension)) {
    throw new Error(`Unsupported document extension: ${extension}`);
  }

  const rawText = normalizeText(await readFileText(absolutePath));
  const chunks = chunkText(rawText, 800, 100);
  const type = extension === ".md" || extension === ".markdown" ? "markdown" : "document";

  const doc = await KnowledgeDocument.findOneAndUpdate(
    { path: absolutePath },
    {
      source,
      title: path.basename(absolutePath),
      type,
      visibility,
      status: "pending",
      metadata: buildMetadata(absolutePath, source, type, rawText),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  const provider = providerFactory.getProvider();
  const points = [];

  for (const [index, chunk] of chunks.entries()) {
    const embedding = await provider.createEmbedding({
      input: chunk,
      model: process.env.EMBEDDING_MODEL || "bge-m3",
    });
    if (!Array.isArray(embedding) || embedding.length === 0) continue;

    points.push({
      id: `${doc._id.toString()}-${index}`,
      vector: embedding,
      payload: {
        documentId: doc._id.toString(),
        source,
        path: absolutePath,
        title: doc.title,
        chunkIndex: index,
        content: chunk,
      },
    });
  }

  if (points.length > 0) {
    await vectorStoreService.upsertPoints(points);
    doc.status = "indexed";
    doc.indexedAt = new Date();
    await doc.save();
  } else {
    doc.status = "error";
    await doc.save();
  }

  return doc;
};

export const processDirectory = async ({ directoryPath, source = "local", visibility = "public" }) => {
  const absoluteDir = path.isAbsolute(directoryPath)
    ? directoryPath
    : path.join(process.cwd(), directoryPath);

  const files = await fs.promises.readdir(absoluteDir, { withFileTypes: true });
  const results = [];

  for (const file of files) {
    const filePath = path.join(absoluteDir, file.name);
    if (file.isDirectory()) {
      results.push(...(await processDirectory({ directoryPath: filePath, source, visibility })));
      continue;
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!supportedExtensions.includes(ext)) continue;
    try {
      const doc = await processDocument({ filePath, source, visibility });
      results.push(doc);
    } catch (error) {
      console.error(`Document processing failed for ${filePath}:`, error.message);
    }
  }

  return results;
};

export default {
  processDocument,
  processDirectory,
};