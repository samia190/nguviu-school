#!/usr/bin/env node
/**
 * Update Database URLs to Cloudinary
 * 
 * The files are already in Cloudinary, but database still references /uploads/
 * This script maps the old /uploads/ URLs to Cloudinary URLs
 * 
 * Usage:
 *   node update-db-urls-to-cloudinary.mjs --dry-run   # Preview changes
 *   node update-db-urls-to-cloudinary.mjs             # Apply changes
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function log(message, level = 'info') {
  const time = new Date().toISOString();
  console.log(`[${time}] [${level.toUpperCase()}] ${message}`);
}

async function fetchCloudinaryFiles() {
  log('Fetching Cloudinary files to build mapping...');

  const files = new Map(); // public_id → full URL
  let cursor = null;
  let count = 0;

  try {
    do {
      const response = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: cursor,
        type: 'upload',
      });

      response.resources?.forEach((resource) => {
        const filename = resource.public_id.split('/').pop();
        files.set(filename, resource.secure_url);
        count++;
      });

      cursor = response.next_cursor;
    } while (cursor);

    log(`✅ Loaded ${count} Cloudinary files`);
    return files;
  } catch (error) {
    log(`❌ Failed to fetch Cloudinary files: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    log('✅ Connected to MongoDB');
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    log('✅ Disconnected from MongoDB');
  } catch (error) {
    log(`❌ Disconnect error: ${error.message}`, 'error');
  }
}

async function updateGalleryURLs(cloudinaryFiles) {
  const schema = new mongoose.Schema({}, { strict: false });
  const GalleryItem = mongoose.model('GalleryItem', schema, 'galleryitems');

  const items = await GalleryItem.find({}).lean();

  log(`\n📊 Processing ${items.length} gallery items...\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const item of items) {
    if (!item.attachments || !Array.isArray(item.attachments)) {
      continue;
    }

    let itemUpdated = false;

    const updatedAttachments = item.attachments.map((att) => {
      // Skip if already Cloudinary URL
      if (att.url && att.url.includes('cloudinary.com')) {
        return att;
      }

      // Skip if not /uploads/
      if (!att.url || !att.url.includes('/uploads/')) {
        return att;
      }

      // Extract filename from /uploads/ URL
      const urlParts = att.url.split('/');
      const oldFilename = urlParts[urlParts.length - 1];

      // Try to find corresponding Cloudinary file
      let cloudinaryUrl = null;

      // Exact match
      if (cloudinaryFiles.has(oldFilename)) {
        cloudinaryUrl = cloudinaryFiles.get(oldFilename);
      } else {
        // Try variations (in case filename was modified)
        for (const [key, value] of cloudinaryFiles) {
          // Match by file extension and partial name
          const oldBase = oldFilename.split('.')[0].toLowerCase();
          const cloudBase = key.split('.')[0].toLowerCase();

          if (oldBase === cloudBase) {
            cloudinaryUrl = value;
            break;
          }

          // Also try matching by numeric ID if filename has pattern like "gallery-123456-filename"
          if (
            oldFilename.includes('gallery-') &&
            oldBase.includes(cloudBase.split('-').pop())
          ) {
            cloudinaryUrl = value;
            break;
          }
        }
      }

      if (cloudinaryUrl) {
        log(`  ✅ Mapped: ${oldFilename} → ${cloudinaryUrl.split('/').pop()}`, 'debug');
        itemUpdated = true;
        totalUpdated++;

        return {
          ...att,
          url: cloudinaryUrl,
          updatedAt: new Date().toISOString(),
          migrationNote: 'Mapped from /uploads/ to Cloudinary',
        };
      } else {
        log(`  ❌ No mapping found for: ${oldFilename}`, 'warning');
        totalErrors++;
        return att;
      }
    });

    // Save if updated
    if (itemUpdated) {
      if (!DRY_RUN) {
        try {
          await GalleryItem.updateOne({ _id: item._id }, { $set: { attachments: updatedAttachments } });
          log(`💾 Updated gallery: "${item.name}" (${item.attachments.length} attachments)`);
        } catch (error) {
          log(`❌ Failed to update "${item.name}": ${error.message}`, 'error');
          totalErrors++;
        }
      } else {
        log(`[DRY RUN] Would update: "${item.name}" (${item.attachments.length} attachments)`);
      }
    } else {
      log(`⊘ Skipped: "${item.name}" (no /uploads/ URLs)`);
      totalSkipped++;
    }
  }

  return { totalUpdated, totalSkipped, totalErrors };
}

async function main() {
  console.log('\n🚀 Starting Database URL Update...\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const startTime = Date.now();

  try {
    // Step 1: Get Cloudinary files
    const cloudinaryFiles = await fetchCloudinaryFiles();

    // Step 2: Connect to database
    await connectDB();

    // Step 3: Update gallery URLs
    const results = await updateGalleryURLs(cloudinaryFiles);

    // Step 4: Disconnect
    await disconnectDB();

    // Report
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    DATABASE URL UPDATE REPORT                             ║
╚════════════════════════════════════════════════════════════════════════════╝

⏱️  Duration: ${duration}s
Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}

📊 Results:
   URLs Updated:  ${results.totalUpdated}
   Items Skipped: ${results.totalSkipped}
   Errors:        ${results.totalErrors}

${
  results.totalErrors === 0
    ? `✨ SUCCESS! All URLs updated to Cloudinary\n`
    : `⚠️  ${results.totalErrors} errors occurred. Please review above.\n`
}
`);

    process.exit(results.totalErrors === 0 ? 0 : 1);
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

main();
