#!/usr/bin/env node
/**
 * Script to add Principal Ms Margret M. Mbogo to the database
 * Usage: npm run add:principal
 * Make sure principal image exists at: public/images/principal.jpg or principal.png
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Staff from "../models/Staff.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const PRINCIPAL_DATA = {
  fullName: "Ms Margret M. Mbogo",
  title: "Principal",
  type: "principal",
  remarks: "At Kangaru Girls' Senior School, we are committed to nurturing young women of excellence who will become tomorrow's leaders. Our holistic educational approach combines academic rigor with character development, ensuring every student discovers her potential and contributes meaningfully to society. We believe in creating a supportive environment where creativity, critical thinking, and compassion flourish. Together, we build confident, capable individuals ready to meet the world's challenges. Welcome to our community of excellence.",
  displayOrder: 0,
  active: true
};

async function addPrincipal() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check for existing principal
    const existingPrincipal = await Staff.findOne({ type: "principal" });
    if (existingPrincipal) {
      console.log("⚠️  Principal already exists in database");
      console.log(`   Name: ${existingPrincipal.fullName}`);
      console.log(`   ID: ${existingPrincipal._id}`);
      
      // Option to update or skip
      console.log("\nℹ️  To update the existing principal, edit via Admin Dashboard");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Look for principal image
    const backendPath = path.join(__dirname, "..");
    const imagePaths = [
      path.join(backendPath, "public", "images", "principal.jpg"),
      path.join(backendPath, "public", "images", "principal.png"),
      path.join(backendPath, "public", "images", "principal.jpeg"),
    ];

    let principalPhotoPath = null;
    for (const imagePath of imagePaths) {
      if (fs.existsSync(imagePath)) {
        principalPhotoPath = imagePath;
        console.log(`📷 Found principal image: ${imagePath}`);
        break;
      }
    }

    let photoUrl = null;
    
    if (principalPhotoPath) {
      // Copy image to uploads folder
      const uploadsDir = path.join(backendPath, "public", "uploads", "staff");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(principalPhotoPath);
      const fileName = `principal-margret-mbogo-${Date.now()}${ext}`;
      const destPath = path.join(uploadsDir, fileName);

      fs.copyFileSync(principalPhotoPath, destPath);
      photoUrl = `/uploads/staff/${fileName}`;
      console.log(`✅ Image copied to: ${photoUrl}`);
    } else {
      console.log("⚠️  No principal image found. Add image at:");
      console.log("   - public/images/principal.jpg");
      console.log("   - public/images/principal.png");
      console.log("   - public/images/principal.jpeg");
      console.log("\n   Continuing without image...");
    }

    // Create staff entry
    const principal = new Staff({
      ...PRINCIPAL_DATA,
      photoUrl
    });

    await principal.save();
    console.log("\n✅ Principal added successfully!");
    console.log(`   Name: ${principal.fullName}`);
    console.log(`   Title: ${principal.title}`);
    console.log(`   Type: ${principal.type}`);
    console.log(`   Photo: ${photoUrl || "None"}`);
    console.log(`   ID: ${principal._id}`);
    console.log("\n🎉 You can now see her on the About page!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

addPrincipal();
