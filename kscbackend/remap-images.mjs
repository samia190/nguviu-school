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

async function remapImages() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Get available images by directory
    const newsImages = fs.readdirSync(path.join(uploadsDir, "news")).map(f => `news/${f}`);
    const heroImages = fs.readdirSync(path.join(uploadsDir, "hero")).map(f => `hero/${f}`);
    const staffImages = fs.readdirSync(path.join(uploadsDir, "staff")).map(f => `staff/${f}`);
    const galleryImages = fs.readdirSync(uploadsDir)
      .filter(f => f.startsWith("gallery-"))
      .sort();

    console.log(`📁 Available Images:`);
    console.log(`   News: ${newsImages.length} files`);
    console.log(`   Hero: ${heroImages.length} files`);
    console.log(`   Staff: ${staffImages.length} files`);
    console.log(`   Gallery: ${galleryImages.length} files\n`);

    // Fix HomeNews - change absolute URLs to relative
    console.log("📰 Fixing HomeNews...");
    const homeNews = await HomeNews.find({});
    for (const news of homeNews) {
      if (news.imageUrl && news.imageUrl.includes("onrender.com")) {
        // Extract filename from absolute URL
        const filename = news.imageUrl.split("/").pop();
        news.imageUrl = `/uploads/${filename}`;
        await news.save();
        console.log(`   ✅ ${news.title}: converted to relative URL`);
      }
    }

    // Fix Events - point to actual uploaded news images
    console.log("\n🎉 Fixing Events...");
    const events = await Event.find({});
    const eventsList = events.slice(0, newsImages.length); // Map first N events to news images
    for (let i = 0; i < eventsList.length; i++) {
      const event = eventsList[i];
      const newUrl = `/uploads/${newsImages[i]}`;
      if (event.imageUrl !== newUrl) {
        console.log(`   • ${event.title}`);
        console.log(`     FROM: ${event.imageUrl}`);
        console.log(`     TO:   ${newUrl}`);
        event.imageUrl = newUrl;
        await event.save();
      }
    }
    if (eventsList.length > 0) {
      console.log(`   ✅ Fixed ${eventsList.length} event(s)`);
    }

    // Fix StudentLife - point to actual uploaded gallery images
    console.log("\n🎓 Fixing StudentLife...");
    const studentLife = await StudentLife.find({});
    const slList = studentLife.slice(0, Math.min(galleryImages.length, studentLife.length));
    for (let i = 0; i < slList.length; i++) {
      const sl = slList[i];
      const newUrl = `/uploads/${galleryImages[i]}`;
      if (sl.imageUrl !== newUrl) {
        console.log(`   • ${sl.title}`);
        console.log(`     FROM: ${sl.imageUrl}`);
        console.log(`     TO:   ${newUrl}`);
        sl.imageUrl = newUrl;
        await sl.save();
      }
    }
    if (slList.length > 0) {
      console.log(`   ✅ Fixed ${slList.length} student life record(s)`);
    }

    // Fix GalleryItem - ensure all attachments use correct paths
    console.log("\n🖼️  Checking Gallery Items...");
    const gallery = await GalleryItem.find({});
    let galleryFixed = 0;
    for (const item of gallery) {
      let itemFixed = false;
      if (item.attachments && item.attachments.length > 0) {
        for (const att of item.attachments) {
          if (att.url && att.url.startsWith("/images/")) {
            // Try to find matching uploaded file
            const filename = att.url.split("/").pop();
            const galleryMatch = galleryImages.find(f => f.includes(filename));
            if (galleryMatch) {
              att.url = `/uploads/${galleryMatch}`;
              itemFixed = true;
            }
          }
        }
        if (itemFixed) {
          await item.save();
          galleryFixed++;
          console.log(`   ✅ Fixed attachments in: ${item.title}`);
        }
      }
    }
    if (galleryFixed === 0) {
      console.log(`   ℹ️  All gallery items already have correct paths`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔄 Image Remapping Complete!");
    console.log("=".repeat(60));
    
    console.log("\n✅ All images now use absolute URL pattern:");
    console.log("   Relative URLs stored: /uploads/...");
    console.log("   Frontend receives:    http://localhost:4000/uploads/...");
    console.log("   Production uses:      https://domain/uploads/...");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

remapImages();
