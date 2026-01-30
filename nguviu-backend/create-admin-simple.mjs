import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

const MONGO_URI = "mongodb+srv://nguviu-girls:nguviu95@nguviugirlsseniourschoo.kba6ls1.mongodb.net/?appName=nguviugirlsseniourschool";
const DB_NAME = "test"; // or your database name
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "System Administrator";

async function createAdmin() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected!");
    
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    
    // Check if admin exists
    const existing = await users.findOne({ email: ADMIN_EMAIL });
    
    if (existing) {
      console.log(`📝 Admin ${ADMIN_EMAIL} already exists`);
      console.log(`   Current role: ${existing.role}`);
      
      // Update to admin if not already
      if (existing.role !== 'admin') {
        await users.updateOne(
          { email: ADMIN_EMAIL },
          { $set: { role: 'admin', requestedRole: 'admin' } }
        );
        console.log("✅ Updated to admin role!");
      }
    } else {
      // Create new admin
      console.log("🔐 Creating new admin user...");
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      await users.insertOne({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: passwordHash,
        role: 'admin',
        requestedRole: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("✅ Admin created successfully!");
    }
    
    console.log("\n📋 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role: admin`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  Change password after first login!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    console.log("\n✅ Done!");
  }
}

createAdmin();
