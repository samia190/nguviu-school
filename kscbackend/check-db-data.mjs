import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import models
import HomeNews from "./models/HomeNews.js";
import Staff from "./models/Staff.js";
import Event from "./models/Event.js";
import StudentLife from "./models/StudentLife.js";
import GalleryItem from "./models/GalleryItem.js";

async function checkData() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Check HomeNews
    console.log("📰 HomeNews Records:");
    const homeNews = await HomeNews.find({}).select("title imageUrl").lean();
    console.log(JSON.stringify(homeNews, null, 2));

    // Check Staff
    console.log("\n👥 Staff Records:");
    const staff = await Staff.find({}).select("fullName photoUrl").lean();
    console.log(JSON.stringify(staff, null, 2));

    // Check Events
    console.log("\n🎉 Events Records:");
    const events = await Event.find({}).select("title imageUrl").lean();
    console.log(JSON.stringify(events, null, 2));

    // Check StudentLife
    console.log("\n🎓 StudentLife Records:");
    const studentLife = await StudentLife.find({}).select("title imageUrl").lean();
    console.log(JSON.stringify(studentLife, null, 2));

    // Check GalleryItem
    console.log("\n🖼️  GalleryItem Records:");
    const gallery = await GalleryItem.find({}).select("title attachments").lean();
    console.log(JSON.stringify(gallery, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkData();
