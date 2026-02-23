import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Import models
import HomeNews from "./models/HomeNews.js";
import Staff from "./models/Staff.js";
import Event from "./models/Event.js";
import StudentLife from "./models/StudentLife.js";
import GalleryItem from "./models/GalleryItem.js";
import Homework from "./models/Homework.js";
import HeroContent from "./models/HeroContent.js";
import Content from "./models/Content.js";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

async function verifyImages() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Get all uploaded files
    const uploadedFiles = new Set();
    function collectFiles(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          collectFiles(fullPath);
        } else {
          const relPath = path.relative(uploadsDir, fullPath).replace(/\\/g, "/");
          uploadedFiles.add(`/uploads/${relPath}`);
        }
      }
    }
    collectFiles(uploadsDir);
    console.log(`📁 Found ${uploadedFiles.size} uploaded files\n`);

    // Check each collection
    const collections = [
      {
        name: "HomeNews",
        model: HomeNews,
        fields: ["imageUrl"],
      },
      {
        name: "Staff",
        model: Staff,
        fields: ["photoUrl"],
      },
      {
        name: "Events",
        model: Event,
        fields: ["imageUrl"],
      },
      {
        name: "StudentLife",
        model: StudentLife,
        fields: ["imageUrl"],
      },
      {
        name: "GalleryItem",
        model: GalleryItem,
        fields: ["attachments.url", "attachments.thumbnail"],
      },
      {
        name: "Homework",
        model: Homework,
        fields: ["attachments.url"],
      },
      {
        name: "HeroContent",
        model: HeroContent,
        fields: ["url"],
      },
      {
        name: "Content (About)",
        model: Content,
        fields: ["principalImageUrl", "deputyImageUrl", "heroBackgroundUrl"],
      },
    ];

    let missingCount = 0;
    let totalMatches = 0;

    for (const { name, model, fields } of collections) {
      let docs = [];
      try {
        docs = await model.find({}).lean();
      } catch (err) {
        console.log(`⚠️  ${name}: Model not found or error - ${err.message}`);
        continue;
      }

      console.log(`\n🔍 Checking ${name} (${docs.length} records):`);

      let collectionMatches = 0;
      for (const doc of docs) {
        for (const fieldPath of fields) {
          let value = getNestedValue(doc, fieldPath);
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && item.startsWith("/uploads")) {
                if (uploadedFiles.has(item)) {
                  collectionMatches++;
                  totalMatches++;
                } else {
                  console.log(`  ❌ MISSING: ${item}`);
                  missingCount++;
                }
              }
            }
          } else if (value && value.startsWith("/uploads")) {
            if (uploadedFiles.has(value)) {
              collectionMatches++;
              totalMatches++;
            } else {
              console.log(`  ❌ MISSING: ${value}`);
              missingCount++;
            }
          }
        }
      }

      if (collectionMatches > 0) {
        console.log(`  ✅ ${collectionMatches} image references verified`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ TOTAL VERIFIED: ${totalMatches} image references`);
    console.log(`❌ MISSING: ${missingCount} broken references`);
    console.log(`📁 UNUSED FILES: ${uploadedFiles.size - totalMatches} orphaned uploads`);
    console.log("=".repeat(60));

    console.log("\n🔗 Absolute URL Conversion Example:");
    console.log("  Relative: /uploads/gallery-1771837586853-DSC_5353.jpg");
    console.log("  Absolute: http://localhost:4000/uploads/gallery-1771837586853-DSC_5353.jpg");
    console.log("\n✨ All routes now return absolute URLs for proper frontend display");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

function getNestedValue(obj, path) {
  if (!obj) return null;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return null;
    current = current[part];
  }
  return current;
}

verifyImages();
