#!/usr/bin/env node
/**
 * Enhanced Debug - Check Cloudinary files with extension handling
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
  } catch (error) {}
}

async function main() {
  console.log('🔍 ENHANCED IMAGE MAPPING DEBUG\n');

  try {
    await connectDB();

    // Fetch Cloudinary files with full details
    console.log('📦 Fetching Cloudinary files with full details...');
    const cloudinaryMap = new Map(); // public_id → secure_url

    let cursor = null;
    let count = 0;

    do {
      const response = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: cursor,
        type: 'upload',
      });

      response.resources?.forEach((resource) => {
        cloudinaryMap.set(resource.public_id, resource.secure_url);
        count++;
      });

      cursor = response.next_cursor;
    } while (cursor);

    console.log(`✅ Loaded ${count} files from Cloudinary\n`);

    // Show all DSC files (the ones we need)
    console.log('🖼️  All DSC files in Cloudinary:');
    const dscFiles = Array.from(cloudinaryMap.keys())
      .filter((key) => key.includes('DSC'))
      .sort();

    dscFiles.forEach((key) => {
      console.log(`  - ${key}`);
    });
    console.log('');

    // Check Events
    console.log('🎯 MATCHING LOGIC TEST:\n');
    const schema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', schema, 'events');

    const events = await Event.find({ imageUrl: { $regex: /\/uploads\// } }).lean();

    for (const event of events) {
      const fullFilename = event.imageUrl.split('/').pop();
      const baseParts = fullFilename.split('-');
      const baseFilename = baseParts.length > 1 ? baseParts.slice(1).join('-') : fullFilename;
      const filenameWithoutExt = baseFilename.substring(0, baseFilename.lastIndexOf('.'));
      const timestamp = baseParts[0];

      console.log(`Event: ${event.title}`);
      console.log(`  Full: ${fullFilename}`);
      console.log(`  Base: ${baseFilename}`);
      console.log(`  Without ext: ${filenameWithoutExt}`);
      console.log(`  Timestamp: ${timestamp}`);

      // Try different matching strategies
      let found = null;

      // Strategy 1: Exact match with timestamp + base
      const exactKey = timestamp + '-' + filenameWithoutExt;
      if (cloudinaryMap.has(exactKey)) {
        found = exactKey;
        console.log(`  ✅ MATCH (exact): ${exactKey}`);
      } else {
        // Strategy 2: Just base filename (no timestamp)
        if (cloudinaryMap.has(filenameWithoutExt)) {
          found = filenameWithoutExt;
          console.log(`  ✅ MATCH (base): ${filenameWithoutExt}`);
        } else {
          // Strategy 3: Any file containing the photo number
          const photoNum = filenameWithoutExt.match(/DSC_\d+/)?.[0];
          if (photoNum) {
            for (const [key, url] of cloudinaryMap) {
              if (key.includes(photoNum)) {
                found = key;
                console.log(
                  `  ✅ MATCH (by photo num): ${key} (${cloudinaryMap.get(key).split('/').pop()})`
                );
                break;
              }
            }
          }
        }
      }

      if (!found) {
        console.log(`  ❌ NO MATCH FOUND`);
      } else {
        console.log(`  → URL: ${cloudinaryMap.get(found)}`);
      }

      console.log('');
    }

    await disconnectDB();
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

main();
