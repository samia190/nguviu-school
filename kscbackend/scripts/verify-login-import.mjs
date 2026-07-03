#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import User from '../models/User.js';
import db from '../services/dbConnection.js';

const loginFilePath = path.join(process.cwd(), 'login.json');

async function loadLoginEmails() {
  const raw = await fs.readFile(loginFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries
    .map((item) => item.email && String(item.email).toLowerCase().trim())
    .filter(Boolean);
}

async function main() {
  console.log('🔎 Verifying imported logins');

  const connected = await db.connectToDatabase();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Aborting.');
    process.exit(1);
  }

  const emails = await loadLoginEmails();
  console.log('Checking login emails:', emails.join(', '));

  for (const email of emails) {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.error('❌ User not found:', email);
      continue;
    }
    console.log('✅ Found user:', email);
    console.log('   name:', user.name);
    console.log('   role:', user.role);
    console.log('   passwordHash exists:', !!user.passwordHash);
    console.log('   createdAt:', user.createdAt);
  }

  const count = await User.countDocuments();
  console.log('Total users in database:', count);

  await db.disconnectFromDatabase();
}

main().catch((err) => {
  console.error('Verification error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
