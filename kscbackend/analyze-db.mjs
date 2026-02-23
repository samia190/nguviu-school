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

async function analyzeData() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
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

    // Check HomeNews
    const homeNews = await HomeNews.find({}).lean();
    console.log(`📰 HomeNews: ${homeNews.length} records`);
    let newsWithUrl = homeNews.filter(n => n.imageUrl).length;
    console.log(`   - With imageUrl: ${newsWithUrl}`);
    homeNews.filter(n => n.imageUrl).slice(0, 3).forEach(n => {
      console.log(`     • ${n.title}: ${n.imageUrl}`);
    });

    // Check Staff
    const staff = await Staff.find({}).lean();
    console.log(`\n👥 Staff: ${staff.length} records`);
    let staffWithUrl = staff.filter(s => s.photoUrl).length;
    console.log(`   - With photoUrl: ${staffWithUrl}`);
    staff.filter(s => s.photoUrl).forEach(s => {
      console.log(`     • ${s.fullName}: ${s.photoUrl}`);
    });

    // Check Events
    const events = await Event.find({}).lean();
    console.log(`\n🎉 Events: ${events.length} records`);
    let eventsWithUrl = events.filter(e => e.imageUrl).length;
    console.log(`   - With imageUrl: ${eventsWithUrl}`);
    events.filter(e => e.imageUrl).slice(0, 3).forEach(e => {
      console.log(`     • ${e.title}: ${e.imageUrl}`);
    });

    // Check StudentLife
    const studentLife = await StudentLife.find({}).lean();
    console.log(`\n🎓 StudentLife: ${studentLife.length} records`);
    let slWithUrl = studentLife.filter(s => s.imageUrl).length;
    console.log(`   - With imageUrl: ${slWithUrl}`);
    studentLife.filter(s => s.imageUrl).slice(0, 3).forEach(s => {
      console.log(`     • ${s.title}: ${s.imageUrl}`);
    });

    // Check GalleryItem
    const gallery = await GalleryItem.find({}).lean();
    console.log(`\n🖼️  Gallery: ${gallery.length} records`);
    let galleryWithAtts = gallery.filter(g => g.attachments && g.attachments.length > 0).length;
    console.log(`   - With attachments: ${galleryWithAtts}`);
    gallery.filter(g => g.attachments && g.attachments.length > 0).forEach(g => {
      console.log(`     • ${g.title}: ${g.attachments.length} files`);
      g.attachments.slice(0, 2).forEach(a => {
        console.log(`       - ${a.url}`);
      });
    });

    console.log(`\n📁 Total uploaded files: ${uploadedFiles.size}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

analyzeData();
