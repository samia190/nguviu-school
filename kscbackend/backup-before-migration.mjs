#!/usr/bin/env node
/**
 * Backup Script for Cloudinary Migration
 * 
 * Creates backups of:
 * 1. /uploads/ directory (all 156 files)
 * 2. MongoDB galleryitems collection
 * 
 * Usage:
 *   node backup-before-migration.mjs
 * 
 * Output:
 *   - uploads-backup-20260224-123456/  (full directory copy)
 *   - galleryitems-backup-20260224-123456.json  (MongoDB export)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_DIR = path.join(__dirname, `uploads-backup-${TIMESTAMP}`);

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function directorySize(dirPath) {
  let size = 0;

  async function sizeOfDirectory(dir) {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        size += await sizeOfDirectory(filePath);
      } else {
        size += stat.size;
      }
    }
  }

  await sizeOfDirectory(dirPath);
  return size;
}

// ============================================================================
// FILE SYSTEM BACKUP
// ============================================================================

async function backupUploadsDirectory() {
  log('Starting /uploads/ directory backup...');

  try {
    // Check if source directory exists
    const stats = await fs.stat(UPLOADS_DIR);
    if (!stats.isDirectory()) {
      throw new Error(`${UPLOADS_DIR} is not a directory`);
    }

    // Count files
    const files = await fs.readdir(UPLOADS_DIR);
    log(`Found ${files.length} files in /uploads/`);

    // Calculate size
    const size = await directorySize(UPLOADS_DIR);
    log(`Total size: ${formatBytes(size)}`);

    // Create backup directory
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);

    // Copy files
    let copied = 0;
    for (const file of files) {
      const source = path.join(UPLOADS_DIR, file);
      const dest = path.join(BACKUP_DIR, file);

      try {
        await fs.copyFile(source, dest);
        copied++;

        if (copied % 20 === 0) {
          log(`Progress: ${copied}/${files.length} files copied...`, 'debug');
        }
      } catch (error) {
        log(`Failed to copy ${file}: ${error.message}`, 'warning');
      }
    }

    log(`✅ Backed up ${copied}/${files.length} files to ${BACKUP_DIR}`);
    return { success: true, fileCount: copied, size };
  } catch (error) {
    log(`❌ File backup failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DATABASE BACKUP
// ============================================================================

async function backupMongoDB() {
  log('Starting MongoDB backup...');

  const backupFile = path.join(__dirname, `galleryitems-backup-${TIMESTAMP}.json`);

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    log('Connected to MongoDB');

    // Get gallery items
    const galleryItemSchema = new mongoose.Schema({}, { strict: false });
    const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema, 'galleryitems');

    const items = await GalleryItem.find({}).lean();
    log(`Found ${items.length} gallery items`);

    // Calculate data size
    const jsonString = JSON.stringify(items, null, 2);
    const dataSize = Buffer.byteLength(jsonString, 'utf8');

    // Write to file
    await fs.writeFile(backupFile, jsonString);
    log(`✅ Backed up MongoDB to ${backupFile} (${formatBytes(dataSize)})`);

    await mongoose.disconnect();
    return { success: true, itemCount: items.length, size: dataSize, file: backupFile };
  } catch (error) {
    log(`❌ MongoDB backup failed: ${error.message}`, 'error');
    try {
      await mongoose.disconnect();
    } catch {}
    return { success: false, error: error.message };
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verifyBackups() {
  log('\nVerifying backups...');

  try {
    // Verify file backup
    const backupFiles = await fs.readdir(BACKUP_DIR);
    log(`File backup contains ${backupFiles.length} files`);

    const backupSize = await directorySize(BACKUP_DIR);
    log(`File backup size: ${formatBytes(backupSize)}`);

    // Verify database backup
    const dbBackupFile = path.join(__dirname, `galleryitems-backup-${TIMESTAMP}.json`);
    const dbBackupStat = await fs.stat(dbBackupFile);

    const dbContent = JSON.parse(
      await fs.readFile(dbBackupFile, 'utf-8')
    );
    log(`Database backup contains ${dbContent.length} items (${formatBytes(dbBackupStat.size)})`);

    return true;
  } catch (error) {
    log(`❌ Backup verification failed: ${error.message}`, 'warning');
    return false;
  }
}

// ============================================================================
// RESTORE INSTRUCTIONS
// ============================================================================

async function printRestoreInstructions() {
  const dbBackupFile = `galleryitems-backup-${TIMESTAMP}.json`;

  const instructions = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    BACKUP RESTORATION INSTRUCTIONS                        ║
╚════════════════════════════════════════════════════════════════════════════╝

📁 FILE BACKUP
────────────────────────────────────────────────────────────────────────────
Location: ${BACKUP_DIR}

To restore:
  cp -r ${BACKUP_DIR}/* kscbackend/public/uploads/

Verify:
  ls kscbackend/public/uploads/ | wc -l


📊 DATABASE BACKUP
────────────────────────────────────────────────────────────────────────────
Location: ${dbBackupFile}

To restore (using mongosh):
  mongosh "MONGO_URI"
  use kangaru_girls_db
  db.galleryitems.deleteMany({})
  db.collection('galleryitems').insertMany([...JSON from backup file...])

To restore (using Node.js):
  node -e "
    const db = require('mongoose');
    const data = require('./${dbBackupFile}');
    db.connect(process.env.MONGO_URI)
      .then(() => db.connection.collection('galleryitems').insertMany(data))
      .then(() => console.log('Restored'))
  "

To restore (using Python):
  python3 -c "
    import json
    import pymongo
    with open('${dbBackupFile}') as f:
        data = json.load(f)
    client = pymongo.MongoClient('MONGO_URI')
    db = client.kangaru_girls_db
    db.galleryitems.delete_many({})
    db.galleryitems.insert_many(data)
    print(f'Restored {len(data)} items')
  "


⚠️  KEEP THESE BACKUPS SAFE
────────────────────────────────────────────────────────────────────────────
- Store in version control (git)
- Upload to cloud storage (Google Drive, OneDrive, etc.)
- Keep for at least 2 weeks after migration completes
- Delete only after verifying all images load correctly

🎯 TIMELINE
────────────────────────────────────────────────────────────────────────────
1. Backups created: $(date)
2. Run migration: Tomorrow or after testing
3. Verify gallery loads: Same day as migration
4. Delete backups: After 1 week of successful operation
`;

  console.log(instructions);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n🔒 Starting Backup Process...\n');

  const startTime = Date.now();

  // Backup files
  const fileBkup = await backupUploadsDirectory();
  console.log();

  // Backup database
  const dbBackup = await backupMongoDB();
  console.log();

  // Verify
  const verified = await verifyBackups();
  console.log();

  // Summary
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n⏱️  Backup completed in ${Math.round(duration)}s\n`);

  if (fileBkup.success && dbBackup.success && verified) {
    console.log('✅ All backups successful!\n');

    // Print restoration guide
    await printRestoreInstructions();

    console.log('\n📌 BACKUP COMPLETE');
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log(`Files:  ${fileBkup.fileCount} files (${formatBytes(fileBkup.size)})`);
    console.log(`Data:   ${dbBackup.itemCount} items (${formatBytes(dbBackup.size)})`);
    console.log('Status: Ready for migration ✨\n');

    process.exit(0);
  } else {
    console.log('❌ Some backups failed. Please review errors above.\n');
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
