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
router.patch("/admin/:section", upload.any(), (req, res) => {
  const section = req.params.section;
  const body = req.body;
  const files = req.files;

  const content = loadContent();

  // handle file uploads
  if (files && files.length > 0) {
    const fileList = files.map(file => ({
      url: "/uploads/" + file.filename,
      name: file.originalname,
      type: file.mimetype
    }));

    // lists (gallery, newsletters, etc.)
    if (Array.isArray(content[section])) {
      content[section].push(...fileList);
    } else {
      // single field text content
      content[section] = fileList[0].url;
    }
  }

  // handle simple text values
  if (body.value) {
    content[section] = body.value;
  }

  saveContent(content);

  res.json({ message: "Updated successfully", content });
});

export default router;
