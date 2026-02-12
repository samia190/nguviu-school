// scripts/create-admin.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123"; // Change this to a secure password
const ADMIN_NAME = "System Administrator";

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      console.error("❌ MongoDB URI not found in environment variables");
      console.error("Please set MONGO_URI, MONGODB_URI, or DATABASE_URL in your .env file");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    console.log("📍 URI:", mongoUri.substring(0, 20) + "..." + mongoUri.substring(mongoUri.length - 20));
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log(`📝 Admin user ${ADMIN_EMAIL} already exists`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update to admin role if not already admin
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Updated existing user to admin role");
      }
    } else {
      // Create new admin user
      console.log(`🔐 Creating admin user: ${ADMIN_EMAIL}`);
      
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash: passwordHash,
        role: "admin",
        requestedRole: "admin",
        isActive: true,
        createdAt: new Date()
      });

      await admin.save();
      console.log("✅ Admin user created successfully!");
    }

    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role: admin`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");

    await mongoose.disconnect();
    console.log("\n✅ Done!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdmin();
