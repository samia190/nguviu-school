#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import db from '../services/dbConnection.js';

const SALT_ROUNDS = 10;

const loginFileArg = process.argv[2];
const loginFilePath = loginFileArg
  ? path.resolve(process.cwd(), loginFileArg)
  : path.join(process.cwd(), 'login.json');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizeName(email) {
  const user = String(email).split('@')[0];
  return user.charAt(0).toUpperCase() + user.slice(1).replace(/[-._]/g, ' ');
}

async function loadLoginFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object') {
    return [parsed];
  }

  throw new Error('Login file must contain a JSON object or array of objects');
}

async function main() {
  console.log('🔐 Importing login data into MongoDB');
  console.log('📄 Login file:', loginFilePath);

  const connected = await db.connectToDatabase();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Aborting.');
    process.exit(1);
  }

  const logins = await loadLoginFile(loginFilePath);
  if (logins.length === 0) {
    console.warn('⚠️  No login records found in file');
    await db.disconnectFromDatabase();
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const login of logins) {
    const email = login.email ? normalizeEmail(login.email) : null;
    const password = login.password ? String(login.password) : null;

    if (!email || !password) {
      console.warn('⚠️  Skipping entry without email/password:', JSON.stringify(login));
      skipped += 1;
      continue;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const existing = await User.findOne({ email });

    if (existing) {
      existing.passwordHash = passwordHash;
      if (!existing.name) existing.name = normalizeName(email);
      if (!existing.role || existing.role === 'pending') existing.role = 'admin';
      await existing.save();
      console.log(`✅ Updated login for ${email}`);
      updated += 1;
    } else {
      const newUser = new User({
        name: login.name || normalizeName(email),
        email,
        passwordHash,
        role: login.role || 'admin',
        isActive: true,
      });
      await newUser.save();
      console.log(`✅ Created user ${email}`);
      created += 1;
    }
  }

  console.log(`\nSummary: created=${created}, updated=${updated}, skipped=${skipped}`);
  await db.disconnectFromDatabase();
}

main().catch((error) => {
  console.error('❌ Import failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
