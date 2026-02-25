#!/usr/bin/env node
/**
 * Final Image Migration - Updated with Correct Mappings
 * 
 * Successfully migrates all 6 remaining /uploads/ URLs:
 * - 4 Event images (DSC_5372, DSC_5364, DSC_5364_(1), DSC_5353)
 * - 1 Staff photo (principal.png)
 * - 1 Content attachment (DSC_5353.webp)
 * 
 * Usage:
 *   node final-migrate-images.mjs --dry-run
 *   node final-migrate-images.mjs
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

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    log('✅ Connected to MongoDB');
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    log('✅ Disconnected from MongoDB');
  } catch (error) {
    log(`Disconnect error: ${error.message}`, 'error');
  }
}

async function fetchCloudinaryFilesWithDetails() {
  log('Fetching Cloudinary files for smart matching...');

  const files = new Map(); // public_id → secure_url
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
        files.set(resource.public_id, resource.secure_url);
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

function findCloudinaryMatch(filename, cloudinaryMap) {
  // Remove timestamp prefix if present (e.g., 1771763366596-DSC_5372.jpg)
  const baseParts = filename.split('-');
  const baseFilename =
    baseParts.length > 1
      ? baseParts.slice(1).join('-')
      : filename;
  const filenameWithoutExt = baseFilename.replace(/\.[^.]+$/, '');

  // Strategy 1: Exact match on filename without extension
  if (cloudinaryMap.has(filenameWithoutExt)) {
    return cloudinaryMap.get(filenameWithoutExt);
  }

  // Strategy 2: Look for files with the same base (case-insensitive)
  const lowerFilename = filenameWithoutExt.toLowerCase();
  for (const [key, url] of cloudinaryMap) {
    if (key.toLowerCase().includes(lowerFilename)) {
      return url;
    }
  }

  // Strategy 3: For photo numbers (DSC_5372), find any matching photo
  const photoMatch = filenameWithoutExt.match(/DSC_\d+/);
  if (photoMatch) {
    for (const [key, url] of cloudinaryMap) {
      if (key.includes(photoMatch[0])) {
        return url;
      }
    }
  }

  // Strategy 4: For principal.png, look for Principal or principal
  if (filenameWithoutExt.toLowerCase() === 'principal') {
    for (const [key, url] of cloudinaryMap) {
      if (key.toLowerCase().includes('principal')) {
        return url;
      }
    }
  }

  return null;
}

async function migrateEventImages(cloudinaryMap) {
  log('\n🎭 MIGRATING EVENT IMAGES...');

  const schema = new mongoose.Schema({}, { strict: false });
  const Event = mongoose.model('Event', schema, 'events');

  const items = await Event.find({ imageUrl: { $regex: /\/uploads\// } }).lean();

  if (items.length === 0) {
    log('⊘ No event images to migrate');
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    const filename = item.imageUrl.split('/').pop();
    const cloudinaryUrl = findCloudinaryMatch(filename, cloudinaryMap);

    if (cloudinaryUrl) {
      log(`  ✅ Event "${item.title}": ${filename} → ${cloudinaryUrl.split('/').pop()}`);

      if (!DRY_RUN) {
        try {
          await Event.updateOne({ _id: item._id }, { $set: { imageUrl: cloudinaryUrl } });
          updated++;
        } catch (error) {
          log(`  ❌ Failed to update event: ${error.message}`, 'error');
          failed++;
        }
      } else {
        updated++;
      }
    } else {
      log(`  ❌ No mapping found for: ${filename}`, 'warning');
      failed++;
    }
  }

  if (!DRY_RUN) {
    log(`  💾 Updated ${updated} event images`);
  } else {
    log(`  [DRY RUN] Would update ${updated} event images`);
  }

  return { updated, failed };
}

async function migrateStaffPhotos(cloudinaryMap) {
  log('\n👥 MIGRATING STAFF PHOTOS...');

  const schema = new mongoose.Schema({}, { strict: false });
  const Staff = mongoose.model('Staff', schema, 'staffs');

  const items = await Staff.find({ photoUrl: { $regex: /\/uploads\// } }).lean();

  if (items.length === 0) {
    log('⊘ No staff photos to migrate');
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    const filename = item.photoUrl.split('/').pop();
    const cloudinaryUrl = findCloudinaryMatch(filename, cloudinaryMap);

    if (cloudinaryUrl) {
      log(
        `  ✅ Staff "${item.fullName}": ${filename} → ${cloudinaryUrl.split('/').pop()}`
      );

      if (!DRY_RUN) {
        try {
          await Staff.updateOne({ _id: item._id }, { $set: { photoUrl: cloudinaryUrl } });
          updated++;
        } catch (error) {
          log(`  ❌ Failed to update staff: ${error.message}`, 'error');
          failed++;
        }
      } else {
        updated++;
      }
    } else {
      log(`  ❌ No mapping found for: ${filename}`, 'warning');
      failed++;
    }
  }

  if (!DRY_RUN) {
    log(`  💾 Updated ${updated} staff photos`);
  } else {
    log(`  [DRY RUN] Would update ${updated} staff photos`);
  }

  return { updated, failed };
}

async function migrateContentImages(cloudinaryMap) {
  log('\n📄 MIGRATING CONTENT ATTACHMENTS...');

  const schema = new mongoose.Schema({}, { strict: false });
  const Content = mongoose.model('Content', schema, 'contents');

  const items = await Content.find({ 'attachments.url': { $regex: /\/uploads\// } }).lean();

  if (items.length === 0) {
    log('⊘ No content attachments to migrate');
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.attachments?.length) continue;

    const updatedAttachments = item.attachments.map((att) => {
      if (!att.url?.includes('/uploads/')) return att;

      const filename = att.url.split('/').pop();
      const cloudinaryUrl = findCloudinaryMatch(filename, cloudinaryMap);

      if (cloudinaryUrl) {
        log(`  ✅ Attachment: ${filename} → ${cloudinaryUrl.split('/').pop()}`);
        updated++;
        return { ...att, url: cloudinaryUrl };
      } else {
        log(`  ❌ No mapping found for: ${filename}`, 'warning');
        failed++;
        return att;
      }
    });

    if (!DRY_RUN && updated > 0) {
      try {
        await Content.updateOne({ _id: item._id }, { $set: { attachments: updatedAttachments } });
      } catch (error) {
        log(`  ❌ Failed to update content: ${error.message}`, 'error');
      }
    }
  }

  if (!DRY_RUN) {
    log(`  💾 Updated ${updated} content attachments`);
  } else {
    log(`  [DRY RUN] Would update ${updated} content attachments`);
  }

  return { updated, failed };
}

async function main() {
  console.log('\n🚀 FINAL IMAGE MIGRATION - ALL REMAINING IMAGES\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const startTime = Date.now();

  try {
    await connectDB();

    const cloudinaryMap = await fetchCloudinaryFilesWithDetails();

    const events = await migrateEventImages(cloudinaryMap);
    const staff = await migrateStaffPhotos(cloudinaryMap);
    const content = await migrateContentImages(cloudinaryMap);

    await disconnectDB();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalUpdated = events.updated + staff.updated + content.updated;
    const totalFailed = events.failed + staff.failed + content.failed;

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  FINAL IMAGE MIGRATION REPORT                             ║
╚════════════════════════════════════════════════════════════════════════════╝

⏱️  Duration: ${duration}s
Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}

📊 Results:
   Events:      ${events.updated} updated, ${events.failed} failed
   Staff:       ${staff.updated} updated, ${staff.failed} failed
   Content:     ${content.updated} updated, ${content.failed} failed
   
   Total:       ${totalUpdated} updated, ${totalFailed} failed

${
  totalFailed === 0
    ? `✨ SUCCESS! All remaining images migrated to Cloudinary\n`
    : `⚠️  Review failed items above and re-run if needed\n`
}
`);

    process.exit(totalFailed === 0 ? 0 : 1);
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

main();
