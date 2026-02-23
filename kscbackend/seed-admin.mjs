import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://kangach:kangach19%4019@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority";
const DB_NAME = "kangaru_girls_db";
const NEW_ADMIN_EMAIL = "kangarugirls@yahoo.com";
const NEW_ADMIN_PASSWORD = "kangaruAD567MIN@9812";
const NEW_ADMIN_NAME = "System Administrator";

async function seedAdmin() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to " + DB_NAME + "!");
    
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    
    // Step 1: Remove all existing admins
    console.log("\n🗑️  Removing existing admin users...");
    const deleteResult = await users.deleteMany({ role: 'admin' });
    console.log(`✅ Removed ${deleteResult.deletedCount} existing admin user(s)`);
    
    // Step 2: Create new admin
    console.log("\n🔐 Creating new admin user...");
    const passwordHash = await bcrypt.hash(NEW_ADMIN_PASSWORD, 10);
    
    const newAdmin = {
      name: NEW_ADMIN_NAME,
      email: NEW_ADMIN_EMAIL.toLowerCase(),
      passwordHash: passwordHash,
      role: 'admin',
      requestedRole: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(newAdmin);
    console.log("✅ Admin created successfully!");
    console.log(`   Document ID: ${result.insertedId}`);
    
    // Step 3: Display credentials
    console.log("\n📋 New Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:    ${NEW_ADMIN_EMAIL}`);
    console.log(`Password: ${NEW_ADMIN_PASSWORD}`);
    console.log(`Role:     admin`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  Important:");
    console.log("  • All previous admin accounts have been removed");
    console.log("  • These are your new login credentials");
    console.log("  • Consider changing the password after first login for security");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Done!");
    process.exit(0);
  }
}

seedAdmin();
