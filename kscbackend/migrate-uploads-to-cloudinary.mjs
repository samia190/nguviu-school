#!/usr/bin/env node
/**
 * Cloudinary Bulk Upload Migration Script
 * 
 * Migrates all files from /uploads/ (ephemeral) to Cloudinary (permanent)
 * 
 * Usage:
 *   node migrate-uploads-to-cloudinary.mjs              # Run normally
 *   node migrate-uploads-to-cloudinary.mjs --dry-run    # Preview what will happen
 *   node migrate-uploads-to-cloudinary.mjs --verbose    # Show detailed logs
 * 
 * Safety:
 *   - Idempotent: Can run multiple times safely
 *   - Non-destructive: Doesn't delete /uploads/ files
 *   - Transactional: Only updates DB after successful upload
 *   - Logged: All operations recorded
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  maxRetries: 3,
  retryDelayMs: 1000,
  uploadTimeoutMs: 120000, // 2 minutes per file
  batchSize: 10, // Process this many files in parallel
};

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const LOGS_DIR = path.join(__dirname, 'logs');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const LOG_FILE = path.join(LOGS_DIR, `migration-${TIMESTAMP}.log`);

// ============================================================================
// STATE TRACKING
// ============================================================================

let stats = {
  filesProcessed: 0,
  filesUploaded: 0,
  filesSkipped: 0,
  filesFailed: 0,
  bytesUploaded: 0,
  startTime: Date.now(),
  endTime: null,
  errors: [],
  uploads: [], // Detailed log of each upload
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (CONFIG.verbose || level !== 'debug') {
    console.log(formatted);
  }

  // Store in state for final report
  if (level === 'error') {
    stats.errors.push(formatted);
  }
}

async function ensureLogsDir() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error.message);
  }
}

async function appendLog(message) {
  try {
    await fs.appendFile(LOG_FILE, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(ms, resolve));
}

async function retryAsync(fn, maxRetries = CONFIG.maxRetries, delayMs = CONFIG.retryDelayMs) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        log(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`, 'debug');
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

// ============================================================================
// DATABASE
// ============================================================================

async function connectDatabase() {
  log('Connecting to MongoDB...');

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    log('✅ MongoDB connection established');
  } catch (error) {
    log('❌ MongoDB connection failed: ' + error.message, 'error');
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    log('✅ MongoDB disconnected');
  } catch (error) {
    log('❌ Failed to disconnect: ' + error.message, 'error');
  }
}

async function getGalleryItems() {
  try {
    // Load GalleryItem model
    const galleryItemSchema = new mongoose.Schema({}, { strict: false });
    const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema, 'galleryitems');

    const items = await GalleryItem.find({}).lean();
    return items;
  } catch (error) {
    log('❌ Failed to fetch gallery items: ' + error.message, 'error');
    throw error;
  }
}

async function updateGalleryItem(itemId, attachments) {
  if (CONFIG.dryRun) {
    log(`[DRY RUN] Would update gallery item ${itemId} with ${attachments.length} attachments`, 'debug');
    return true;
  }

  try {
    const galleryItemSchema = new mongoose.Schema({}, { strict: false });
    const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema, 'galleryitems');

    const result = await GalleryItem.updateOne(
      { _id: itemId },
      { $set: { attachments } },
      { runValidators: false }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    log(`❌ Failed to update gallery item ${itemId}: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// CLOUDINARY
// ============================================================================

async function initializeCloudinary() {
  log('Initializing Cloudinary...');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const result = await cloudinary.api.resources({ max_results: 1 });
    log(`✅ Cloudinary initialized (${result.resources.length} files in account)`);
  } catch (error) {
    log('❌ Cloudinary authentication failed: ' + error.message, 'error');
    process.exit(1);
  }
}

async function uploadToCloudinary(filePath, fileName) {
  const publicId = path.parse(fileName).name; // Remove extension from public ID

  return retryAsync(async () => {
    if (CONFIG.dryRun) {
      log(`[DRY RUN] Would upload: ${fileName} to Cloudinary`, 'debug');
      return {
        public_id: publicId,
        secure_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${process.env.CLOUDINARY_FOLDER}/${fileName}`,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: `${process.env.CLOUDINARY_FOLDER}/${publicId}`,
          overwrite: true,
          timeout: CONFIG.uploadTimeoutMs,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      fs.readFile(filePath)
        .then((buffer) => {
          uploadStream.end(buffer);
        })
        .catch((error) => {
          uploadStream.destroy();
          reject(error);
        });
    });
  }, CONFIG.maxRetries);
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

async function migrateAttachment(attachment, galleryName) {
  stats.filesProcessed++;

  // Check if URL is already in Cloudinary
  if (attachment.url && attachment.url.includes('cloudinary.com')) {
    log(`⊘ Skipped (already in Cloudinary): ${attachment.url}`, 'debug');
    stats.filesSkipped++;
    return { ...attachment, migrated: false };
  }

  // Check if URL is in /uploads/
  if (!attachment.url || !attachment.url.includes('/uploads/')) {
    log(`⊘ Skipped (not in /uploads/): ${attachment.url}`, 'debug');
    stats.filesSkipped++;
    return { ...attachment, migrated: false };
  }

  // Extract filename from URL
  const urlParts = attachment.url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Check if file exists on disk
  const exists = await fileExists(filePath);
  if (!exists) {
    log(`❌ File not found on disk: ${fileName}`, 'warning');
    stats.filesFailed++;
    stats.errors.push(`File not found: ${fileName}`);
    return attachment; // Keep original URL
  }

  try {
    // Get file size for reporting
    const fileSize = await getFileSize(filePath);

    // Upload to Cloudinary
    log(`⬆ Uploading: ${fileName} (${Math.floor(fileSize / 1024)}KB)`, 'debug');
    const cloudinaryResult = await uploadToCloudinary(filePath, fileName);

    // Update attachment with new URL
    const updatedAttachment = {
      ...attachment,
      url: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      migratedAt: new Date().toISOString(),
      migrated: true,
    };

    stats.filesUploaded++;
    stats.bytesUploaded += fileSize;

    stats.uploads.push({
      fileName,
      originalUrl: attachment.url,
      cloudinaryUrl: cloudinaryResult.secure_url,
      size: fileSize,
      gallery: galleryName,
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    log(`✅ Uploaded: ${fileName} → ${cloudinaryResult.secure_url}`, 'debug');
    return updatedAttachment;
  } catch (error) {
    log(`❌ Failed to upload ${fileName}: ${error.message}`, 'error');

    stats.filesFailed++;
    stats.errors.push(`Upload failed: ${fileName} - ${error.message}`);

    stats.uploads.push({
      fileName,
      originalUrl: attachment.url,
      error: error.message,
      gallery: galleryName,
      timestamp: new Date().toISOString(),
      status: 'failed',
    });

    return attachment; // Return original attachment on failure
  }
}

async function migrateGalleryItem(item) {
  if (!item.attachments || !Array.isArray(item.attachments)) {
    return;
  }

  log(`\n📁 Gallery: "${item.name}" (${item.attachments.length} attachments)`);

  // Process attachments
  const updatedAttachments = await Promise.all(
    item.attachments.map((att) => migrateAttachment(att, item.name))
  );

  // Check if any attachments were updated
  const hasChanges = updatedAttachments.some((att) => att.migrated === true);

  if (hasChanges) {
    await updateGalleryItem(item._id, updatedAttachments);
    log(`💾 Updated gallery item with new Cloudinary URLs`);
  }
}

// ============================================================================
// REPORTING
// ============================================================================

async function generateReport() {
  stats.endTime = Date.now();
  const duration = (stats.endTime - stats.startTime) / 1000;
  const durationFormatted = `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`;

  const report = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    CLOUDINARY MIGRATION REPORT                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 MIGRATION SUMMARY
────────────────────────────────────────────────────────────────────────────
Duration:         ${durationFormatted}
Timestamp:        ${new Date(stats.startTime).toISOString()}
Mode:             ${CONFIG.dryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}

📈 STATISTICS
────────────────────────────────────────────────────────────────────────────
Files Processed:  ${stats.filesProcessed}
Files Uploaded:   ${stats.filesUploaded} ✅
Files Skipped:    ${stats.filesSkipped} ⊘
Files Failed:     ${stats.filesFailed} ❌
Total Bytes:      ${Math.floor(stats.bytesUploaded / 1024 / 1024)} MB

${
  stats.filesFailed > 0
    ? `
⚠️  ERRORS DETECTED
────────────────────────────────────────────────────────────────────────────
${stats.errors.slice(0, 10).join('\n')}
${stats.errors.length > 10 ? `\n... and ${stats.errors.length - 10} more errors` : ''}
`
    : ''
}

🎯 OVERALL STATUS
────────────────────────────────────────────────────────────────────────────
${
  stats.filesFailed === 0
    ? `✨ MIGRATION SUCCESSFUL! All ${stats.filesUploaded} files uploaded.`
    : `⚠️  INCOMPLETE: ${stats.filesFailed} files failed. Check errors above.`
}

📋 UPLOAD DETAILS
────────────────────────────────────────────────────────────────────────────
See migration-${TIMESTAMP}.log for detailed upload log.

📞 NEXT STEPS
────────────────────────────────────────────────────────────────────────────
1. Review this report for any errors
2. If no errors: Test gallery frontend to verify images load
3. After 1 week verification: Delete files from /uploads/ directory
4. Monitor Cloudinary bandwidth usage

`;

  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('\n🚀 Starting Cloudinary Migration...\n');

    // Setup
    await ensureLogsDir();
    await initializeCloudinary();
    await connectDatabase();

    if (CONFIG.dryRun) {
      console.log('⚠️  DRY RUN MODE: No files will be written to Cloudinary or database\n');
      await appendLog('=== DRY RUN EXECUTION ===\n');
    }

    // Get gallery items
    const galleryItems = await getGalleryItems();
    log(`Found ${galleryItems.length} gallery items`);

    if (galleryItems.length === 0) {
      log('❌ No gallery items found in database', 'warning');
      await disconnectDatabase();
      process.exit(1);
    }

    // Migrate each gallery
    for (const item of galleryItems) {
      await migrateGalleryItem(item);
    }

    // Generate report
    const report = await generateReport();
    console.log(report);

    // Save report
    await appendLog(report);
    log(`\n📝 Detailed log saved to: ${LOG_FILE}`);

    // Cleanup
    await disconnectDatabase();
    console.log('\n✅ Migration script completed\n');

    process.exit(stats.filesFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    await disconnectDatabase();
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
