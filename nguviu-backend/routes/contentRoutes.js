import express from "express";
import multer from "multer";
import { loadContent, saveContent } from "../controllers/contentController.js";

const router = express.Router();

// File upload storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ---------------- GET ADMIN CONTENT -------------------
router.get("/admin", (req, res) => {
  const content = loadContent();
  res.json(content);
});

// ---------------- UPDATE A SECTION ---------------------
// Support both single-level and nested section updates, e.g. /admin/staff/leadership
router.patch(["/admin/:section","/admin/:rest(.*)"], upload.any(), (req, res) => {
  // sectionPath will hold the full path after /admin/
  const sectionPath = req.params.section || req.params.rest || "";
  const body = req.body;
  const files = req.files;

  const content = loadContent();

  function setNested(obj, pathParts, value) {
    const last = pathParts.pop();
    let cur = obj;
    for (const p of pathParts) {
      if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
      cur = cur[p];
    }
    cur[last] = value;
  }

  // handle file uploads
  if (files && files.length > 0) {
    const fileList = files.map(file => ({
      url: "/uploads/" + file.filename,
      name: file.originalname,
      type: file.mimetype
    }));

    // if updating a nested list, store as array at that path
    const parts = sectionPath.split("/");
    // attempt to get current value
    let cur = content;
    for (const p of parts) {
      if (cur == null) break;
      cur = cur[p];
    }

    if (Array.isArray(cur)) {
      // append uploaded files
      cur.push(...fileList);
    } else if (parts.length === 1) {
      // single top-level field
      content[parts[0]] = fileList[0].url;
    } else {
      // set nested field to first file url
      setNested(content, [...parts], fileList[0].url);
    }
  }

  // handle simple text values
  if (body.value) {
    const parts = sectionPath.split("/");
    if (parts.length === 1) {
      content[parts[0]] = body.value;
    } else {
      setNested(content, [...parts], body.value);
    }
  }

  saveContent(content);

  res.json({ message: "Updated successfully", content });
});

export default router;
