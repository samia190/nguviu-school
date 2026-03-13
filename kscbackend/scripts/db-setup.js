#!/usr/bin/env node

/**
 * Database Setup & Initialization Script
 * 
 * Usage:
 *   npm run db:setup        - Full setup (connect + create admin)
 *   node scripts/db-setup.js --connect-only  - Only test connection
 *   node scripts/db-setup.js --admin-only    - Only create admin user
 * 
 * This script is safe to run multiple times - it won't duplicate data
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Setup paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from "../models/User.js";

// Parse command line arguments
const args = process.argv.slice(2);
const connectOnly = args.includes('--connect-only');
const adminOnly = args.includes('--admin-only');
const verbose = args.includes('--verbose') || args.includes('-v');

// ==========================================
// CONFIGURATION
// ==========================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL env var is required");
  process.exit(1);
}
const ADMIN_NAME = "System Administrator";

// Admin password - defaults to a secure random password
function getAdminPassword() {
  // Option 1: Use environment variable
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }
  
  // Option 2: Generate random password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ==========================================
// LOGGING UTILITIES
// ==========================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  debug: (msg) => verbose && console.log(`🐛 ${msg}`),
  divider: () => console.log('─'.repeat(50)),
};

// ==========================================
// DATABASE CONNECTION
// ==========================================

async function connectToDatabase() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    log.error("MongoDB URI not found in environment variables");
    log.info("Add one of these to your .env file:");
    log.info("  MONGO_URI=...");
    log.info("  MONGODB_URI=...");
    log.info("  DATABASE_URL=...");
    return false;
  }

  try {
    // Mask credentials in logs
    const maskedUri = mongoUri.replace(/([^:]+):([^@]+)@/, '$1:***@');
    log.info("Connecting to MongoDB...");
    log.debug(`URI: ${maskedUri}`);

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    log.success("Connected to MongoDB");
    log.debug(`Database: ${mongoose.connection.db.name}`);
    log.debug(`Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    return true;
  } catch (error) {
    log.error("Failed to connect to MongoDB");
    log.error(`Reason: ${error.message}`);

    if (error.message.includes("authentication failed")) {
      log.info("💡 Check your credentials in MONGO_URI");
    } else if (error.message.includes("connect")) {
      log.info("💡 Verify MongoDB Atlas is running or connection string is correct");
    }

    return false;
  }
}

// ==========================================
// ADMIN USER CREATION
// ==========================================

async function createAdminUser() {
  try {
    log.divider();
    log.info("Setting up Admin User...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      log.info(`Admin user "${ADMIN_EMAIL}" already exists`);
      log.debug(`Current role: ${existingAdmin.role}`);

      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        existingAdmin.requestedRole = "admin";
        await existingAdmin.save();
        log.success("Updated user to admin role");
      } else {
        log.warning("User already has admin role");
      }

      log.divider();
      return true;
    }

    // Create new admin user
    log.info(`Creating new admin user: ${ADMIN_EMAIL}`);

    const adminPassword = getAdminPassword();
    const passwordHash = await bcrypt.hash(adminPassword, 10);

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
    log.success("Admin user created successfully!");

    log.divider();
    log.info("📋 Admin Credentials");
    log.divider();
    log.info(`Email: ${ADMIN_EMAIL}`);
    log.info(`Password: ${adminPassword}`);
    log.info(`Role: admin`);
    log.divider();
    log.warning("⚠️  IMPORTANT: Change password after first login!");
    log.warning("⚠️  Store these credentials securely!");
    log.divider();

    return true;
  } catch (error) {
    log.error("Failed to create admin user");
    log.error(`Reason: ${error.message}`);
    return false;
  }
}

// ==========================================
// INITIALIZE DATABASE INDEXES
// ==========================================

async function initializeIndexes() {
  try {
    log.info("Initializing database indexes...");
    
    // Build indexes for all models
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ admissionNumber: 1 }, { sparse: true });
    
    log.success("Database indexes created");
    return true;
  } catch (error) {
    if (error.message.includes("already exists")) {
      log.info("Indexes already created");
      return true;
    }
    log.warning(`Index creation warning: ${error.message}`);
    return true; // Don't fail if indexes already exist
  }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  try {
    log.divider();
    log.info("Database Setup & Initialization");
    log.divider();

    // Step 1: Connect to database
    if (!connectOnly && !adminOnly) {
      log.divider();
    }

    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }

    // Stop if only checking connection
    if (connectOnly) {
      log.divider();
      log.success("Connection test successful!");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Step 2: Initialize indexes
    if (!adminOnly) {
      await initializeIndexes();
      log.divider();
    }

    // Step 3: Create admin user
    const adminCreated = await createAdminUser();
    if (!adminCreated) {
      process.exit(1);
    }

    // Success!
    log.divider();
    log.success("Database setup complete!");
    log.info("You can now:");
    log.info("  1. Log in with your admin credentials");
    log.info("  2. Change your admin password");
    log.info("  3. Invite other users");
    log.divider();

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    log.error("Unexpected error");
    log.error(error.message);
    process.exit(1);
  }
}

// Run setup
main();
