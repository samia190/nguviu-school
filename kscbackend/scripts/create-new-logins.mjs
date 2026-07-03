#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { promises as dnsPromises } from 'dns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import User model
import User from '../models/User.js';

// Connection URI
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

// Configure DNS with fallback
async function setupDNS() {
  try {
    const localResolvers = ['127.0.0.1', '::1'];
    const currentServers = dns.getServers();
    const isLocal = currentServers.some(s => localResolvers.includes(s));
    
    if (isLocal) {
      console.log('⚠️  Detected local DNS resolver (127.0.0.1/::1). Falling back to public DNS for Atlas SRV queries.');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      console.log('🔎 DNS servers now:', dns.getServers());
    }
  } catch (err) {
    console.warn('⚠️  DNS configuration warning:', err.message);
  }
}

// Generate secure random password
function generateSecurePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*_+-=[]{}|;:,.<>?';
  
  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)]
  ];
  
  const allChars = uppercase + lowercase + numbers + special;
  while (password.length < 16) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  return password.sort(() => Math.random() - 0.5).join('');
}

async function main() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 CREATING NEW LOGIN CREDENTIALS');
    console.log('='.repeat(80));
    
    // Setup DNS
    await setupDNS();
    
    // Connect to MongoDB
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    console.log('✅ Connected to MongoDB');
    console.log(`📍 URI: ${MONGO_URI.replace(/:[^:]*@/, ':***@')}`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName || 'kangaru_girls_db'}`);
    console.log(`🖥️  Connected: ${mongoose.connection.readyState === 1 ? 'Yes' : 'No'}`);
    
    // Delete all existing users
    console.log('\n🗑️  Deleting all existing users...');
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`);
    
    // Create new credentials
    const credentials = [];
    
    // 1. SUPERADMIN
    console.log('\n📝 Creating new users...\n');
    
    const superadminPassword = generateSecurePassword();
    const superadminHash = await bcrypt.hash(superadminPassword, 10);
    const superadmin = new User({
      name: 'System Superadmin',
      email: 'superadmin@kangaru-girls.ac.ke',
      passwordHash: superadminHash,
      role: 'superadmin',
      requestedRole: 'superadmin',
      isActive: true
    });
    await superadmin.save();
    credentials.push({
      type: 'SUPERADMIN',
      email: 'superadmin@kangaru-girls.ac.ke',
      password: superadminPassword,
      role: 'superadmin',
      access: 'Full access to all system features and sensitive information'
    });
    console.log('✅ Superadmin created: superadmin@kangaru-girls.ac.ke');
    
    // 2. ADMIN
    const adminPassword = generateSecurePassword();
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@kangaru-girls.ac.ke',
      passwordHash: adminHash,
      role: 'admin',
      requestedRole: 'admin',
      isActive: true
    });
    await admin.save();
    credentials.push({
      type: 'ADMIN',
      email: 'admin@kangaru-girls.ac.ke',
      password: adminPassword,
      role: 'admin',
      access: 'Limited administrative access, excludes sensitive system information'
    });
    console.log('✅ Admin created: admin@kangaru-girls.ac.ke');
    
    // 3. TEACHER
    const teacherPassword = generateSecurePassword();
    const teacherHash = await bcrypt.hash(teacherPassword, 10);
    const teacher = new User({
      name: 'Test Teacher',
      email: 'teacher@kangaru-girls.ac.ke',
      passwordHash: teacherHash,
      role: 'teacher',
      requestedRole: 'teacher',
      isActive: true
    });
    await teacher.save();
    credentials.push({
      type: 'TEACHER',
      email: 'teacher@kangaru-girls.ac.ke',
      password: teacherPassword,
      role: 'teacher',
      access: 'Can manage homework, view results, and interact with students'
    });
    console.log('✅ Teacher created: teacher@kangaru-girls.ac.ke');
    
    // 4. STUDENT
    const studentPassword = generateSecurePassword();
    const studentHash = await bcrypt.hash(studentPassword, 10);
    const student = new User({
      name: 'Test Student',
      email: 'student@kangaru-girls.ac.ke',
      passwordHash: studentHash,
      role: 'student',
      requestedRole: 'student',
      admissionNumber: 'TST001',
      isActive: true
    });
    await student.save();
    credentials.push({
      type: 'STUDENT',
      email: 'student@kangaru-girls.ac.ke',
      password: studentPassword,
      role: 'student',
      access: 'Can view results, submit homework, and access student portal'
    });
    console.log('✅ Student created: student@kangaru-girls.ac.ke');
    
    // Save credentials to file
    console.log('\n💾 Saving credentials to file...');
    const credentialsFile = path.join(__dirname, '..', 'NEW_LOGINS.json');
    fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
    console.log(`✅ Credentials saved to: ${credentialsFile}`);
    
    // Also save human-readable format
    const readableFile = path.join(__dirname, '..', 'NEW_LOGINS.md');
    let markdown = `# New Login Credentials\n\n**Created:** ${new Date().toISOString()}\n\n`;
    markdown += `⚠️ **IMPORTANT**: These credentials are for testing purposes. Store them securely!\n\n`;
    
    credentials.forEach((cred, index) => {
      markdown += `## ${index + 1}. ${cred.type}\n\n`;
      markdown += `- **Email:** \`${cred.email}\`\n`;
      markdown += `- **Password:** \`${cred.password}\`\n`;
      markdown += `- **Role:** ${cred.role}\n`;
      markdown += `- **Access:** ${cred.access}\n\n`;
    });
    
    fs.writeFileSync(readableFile, markdown);
    console.log(`✅ Human-readable format saved to: ${readableFile}`);
    
    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ NEW LOGIN CREDENTIALS CREATED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:\n');
    credentials.forEach((cred, index) => {
      console.log(`${index + 1}. ${cred.type}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      console.log(`   Role: ${cred.role}`);
      console.log(`   Access: ${cred.access}\n`);
    });
    
    console.log('='.repeat(80));
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('='.repeat(80));
    console.log('1. Store these credentials in a secure location');
    console.log('2. Change passwords after first login');
    console.log('3. Do NOT commit credentials to version control');
    console.log('4. All previous user accounts have been deleted');
    console.log('5. Credentials saved in: NEW_LOGINS.json and NEW_LOGINS.md\n');
    
    // Verify in database
    const userCount = await User.countDocuments();
    console.log(`✅ Database verification: ${userCount} users in database\n`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
