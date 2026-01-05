// routes/downloads.js (ESM)
import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

function toAbsoluteUrl(req, relativePath) {
  const origin =
    process.env.PUBLIC_ORIGIN ||
    `${req.protocol}://${req.get("host")}`; // e.g. http://
  return `${origin}${relativePath}`;
}

// GET /api/downloads -> list files
router.get("/", async (req, res) => {
  try {
    const files = await fs.promises.readdir(downloadsDir);

    const items = files.map((name) => {
      const safeName = path.basename(name); // prevents weird paths
      const rel = `/downloads/${encodeURIComponent(safeName)}`;
      return {
        name: safeName,
        url: rel, // relative (stored)
        downloadUrl: toAbsoluteUrl(req, rel), // absolute (frontend safe)
      };
    });

    return res.json(items);
  } catch (err) {
    console.error("Error listing downloads:", err);
    return res.status(500).json({ error: "Failed to list downloads" });
  }
});

// GET /api/downloads/:filename -> download a single file
router.get("/:filename", (req, res) => {
  try {
    const safeName = path.basename(req.params.filename); // blocks ../ tricks
    const filePath = path.join(downloadsDir, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    return res.download(filePath, safeName, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) return res.status(500).json({ error: "Failed to download file" });
      }
    });
  } catch (err) {
    console.error("Error serving download:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
