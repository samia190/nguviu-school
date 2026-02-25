#!/usr/bin/env node
/**
 * Migrate Remaining Images to Cloudinary
 * 
 * Migrates 6 remaining /uploads/ URLs from:
 * - Events (4 URLs)
 * - Staff photos (1 URL)
 * - Content attachments (1 URL)
 * 
 * Usage:
 *   node migrate-all-images-to-cloudinary.mjs --dry-run
 *   node migrate-all-images-to-cloudinary.mjs
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

async function fetchCloudinaryFiles() {
  log('Fetching Cloudinary files for mapping...');

  const files = new Map(); // filename → URL
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

async function migrateEventImages(cloudinaryFiles) {
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
    const urlParts = item.imageUrl.split('/');
    const oldFilename = urlParts[urlParts.length - 1];

    // Try to find in Cloudinary
    let cloudinaryUrl = null;

    // Exact match
    if (cloudinaryFiles.has(oldFilename)) {
      cloudinaryUrl = cloudinaryFiles.get(oldFilename);
    } else {
      // Try variations
      for (const [key, value] of cloudinaryFiles) {
        const oldBase = oldFilename.split('.')[0].toLowerCase();
        const cloudBase = key.split('.')[0].toLowerCase();

        if (oldBase === cloudBase) {
          cloudinaryUrl = value;
          break;
        }
      }
    }

    if (cloudinaryUrl) {
      log(`  ✅ Found mapping for: ${oldFilename} → ${cloudinaryUrl.split('/').pop()}`);

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
      log(`  ❌ No mapping found for: ${oldFilename}`, 'warning');
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

async function migrateStaffPhotos(cloudinaryFiles) {
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
    const urlParts = item.photoUrl.split('/');
    const oldFilename = urlParts[urlParts.length - 1];

    // Try to find in Cloudinary
    let cloudinaryUrl = null;

    if (cloudinaryFiles.has(oldFilename)) {
      cloudinaryUrl = cloudinaryFiles.get(oldFilename);
    } else {
      for (const [key, value] of cloudinaryFiles) {
        const oldBase = oldFilename.split('.')[0].toLowerCase();
        const cloudBase = key.split('.')[0].toLowerCase();

        if (oldBase === cloudBase) {
          cloudinaryUrl = value;
          break;
        }

        // Try matching by person name
        if (item.fullName && key.toLowerCase().includes(item.fullName.split(' ')[0].toLowerCase())) {
          cloudinaryUrl = value;
          break;
        }
      }
    }

    if (cloudinaryUrl) {
      log(`  ✅ Found mapping for: ${oldFilename} → ${cloudinaryUrl.split('/').pop()}`);

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
      log(`  ❌ No mapping found for: ${oldFilename}`, 'warning');
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

async function migrateContentImages(cloudinaryFiles) {
  log('\n📄 MIGRATING CONTENT IMAGES...');

  const schema = new mongoose.Schema({}, { strict: false });
  const Content = mongoose.model('Content', schema, 'contents');

  const items = await Content.find({ 'attachments.url': { $regex: /\/uploads\// } }).lean();

  if (items.length === 0) {
    log('⊘ No content images to migrate');
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.attachments?.length) continue;

    const updatedAttachments = item.attachments.map((att) => {
      if (!att.url?.includes('/uploads/')) return att;

      const urlParts = att.url.split('/');
      const oldFilename = urlParts[urlParts.length - 1];

      // Try to find in Cloudinary
      let cloudinaryUrl = null;

      if (cloudinaryFiles.has(oldFilename)) {
        cloudinaryUrl = cloudinaryFiles.get(oldFilename);
      } else {
        for (const [key, value] of cloudinaryFiles) {
          const oldBase = oldFilename.split('.')[0].toLowerCase();
          const cloudBase = key.split('.')[0].toLowerCase();

          if (oldBase === cloudBase) {
            cloudinaryUrl = value;
            break;
          }
        }
      }

      if (cloudinaryUrl) {
        log(`  ✅ Found mapping for: ${oldFilename} → ${cloudinaryUrl.split('/').pop()}`);
        updated++;
        return { ...att, url: cloudinaryUrl };
      } else {
        log(`  ❌ No mapping found for: ${oldFilename}`, 'warning');
        failed++;
        return att;
      }
    });

    if (!DRY_RUN) {
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
  console.log('\n🚀 COMPREHENSIVE IMAGE MIGRATION - ALL REMAINING IMAGES\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const startTime = Date.now();

  try {
    await connectDB();

    const cloudinaryFiles = await fetchCloudinaryFiles();

    const events = await migrateEventImages(cloudinaryFiles);
    const staff = await migrateStaffPhotos(cloudinaryFiles);
    const content = await migrateContentImages(cloudinaryFiles);

    await disconnectDB();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalUpdated = events.updated + staff.updated + content.updated;
    const totalFailed = events.failed + staff.failed + content.failed;

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  IMAGE MIGRATION REPORT                                   ║
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
    : `⚠️  ${totalFailed} images failed. Review above for details.\n`
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
