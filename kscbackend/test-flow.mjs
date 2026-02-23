import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

import HomeNews from "./models/HomeNews.js";

async function testImageFlow() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Check what ImageURLs are stored in database
    console.log("Step 1️⃣  - Checking HomeNews collection:");
    const news = await HomeNews.find({}).select("title imageUrl").lean();
    console.log(`Found ${news.length} news records\n`);
    
    news.forEach(item => {
      console.log(`📰 ${item.title}`);
      console.log(`   URL: ${item.imageUrl}`);
      console.log(`   Starts with http?: ${String(item.imageUrl).startsWith("http")}`);
      console.log(`   Length: ${String(item.imageUrl).length} chars\n`);
    });

    // Step 2: Check if files exist on disk
    console.log("\nStep 2️⃣  - Checking if files exist on disk:");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    for (const item of news) {
      let filePath;
      
      // Extract filename from URL
      if (item.imageUrl.includes("localhost")) {
        // Absolute URL like http://localhost:4000/uploads/news/...
        const match = item.imageUrl.match(/\/uploads\/(.*)/);
        if (match) {
          filePath = path.join(uploadsDir, match[1]);
        }
      } else if (item.imageUrl.startsWith("/uploads/")) {
        // Relative URL like /uploads/news/...
        filePath = path.join(uploadsDir, item.imageUrl.replace("/uploads/", ""));
      }
      
      if (filePath && fs.existsSync(filePath)) {
        console.log(`✅ ${item.title}: File EXISTS`);
        console.log(`   Path: ${filePath}`);
      } else {
        console.log(`❌ ${item.title}: File MISSING`);
        console.log(`   Expected: ${filePath}`);
      }
    }

    // Step 3: Simulate the toAbsoluteUrl conversion
    console.log("\nStep 3️⃣  - Simulating backend toAbsoluteUrl conversion:");
    
    function toAbsoluteUrl(relativePath) {
      if (!relativePath) return relativePath;
      if (String(relativePath).startsWith("http")) return relativePath;
      // Simulating localhost backend
      return `http://localhost:4000${relativePath}`;
    }
    
    for (const item of news) {
      const converted = toAbsoluteUrl(item.imageUrl);
      console.log(`\n${item.title}`);
      console.log(`   Original: ${item.imageUrl}`);
      console.log(`   Converted: ${converted}`);
      console.log(`   Match: ${item.imageUrl === converted ? "✅ WOULD BE RETURNED AS-IS" : "❌ Would be modified"}`);
    }

    // Step 4: Check for common issues
    console.log("\n\nStep 4️⃣  - Checking for common issues:");
    let issues = 0;
    
    for (const item of news) {
      if (!item.imageUrl) {
        console.log(`❌ ${item.title}: imageUrl is EMPTY`);
        issues++;
      } else if (item.imageUrl.includes("onrender.com")) {
        console.log(`⚠️  ${item.title}: imageUrl points to PRODUCTION server`);
        console.log(`   This won't work in development!`);
        issues++;
      } else if (!item.imageUrl.startsWith("http") && !item.imageUrl.startsWith("/uploads/")) {
        console.log(`❌ ${item.title}: imageUrl FORMAT INVALID`);
        console.log(`   URL: ${item.imageUrl}`);
        issues++;
      }
    }
    
    if (issues === 0) {
      console.log("✅ No obvious issues found!");
    }

    // Step 5: Recommendations
    console.log("\n\n✨ WHAT SHOULD HAPPEN:");
    console.log("1. Admin uploads image to /api/files/upload");
    console.log("   └─ Should receive: http://localhost:4000/uploads/...");
    console.log("2. Admin posts to /api/home-news with imageUrl");
    console.log("   └─ Backend saves imageUrl to database (exactly as received)");
    console.log("3. Frontend GETs /api/home-news");
    console.log("   └─ Backend applies toAbsoluteUrl (recognizes it's already absolute)");
    console.log("   └─ Returns: http://localhost:4000/uploads/...");
    console.log("4. Frontend displays image in src attribute");
    console.log("   └─ Browser loads from http://localhost:4000/uploads/...");
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testImageFlow();
