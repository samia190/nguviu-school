#!/usr/bin/env node
/**
 * Debug script to analyze image mapping issues
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
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.log(`Disconnect error: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 IMAGE MAPPING DEBUG ANALYSIS\n');

  try {
    await connectDB();

    // Fetch Cloudinary files
    console.log('📦 Cloudinary Files:');
    const cloudinaryFiles = new Map();
    let cursor = null;
    let count = 0;

    do {
      const response = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: cursor,
        type: 'upload',
      });

      response.resources?.forEach((resource) => {
        const filename = resource.public_id.split('/').pop();
        cloudinaryFiles.set(filename, resource.secure_url);
        count++;
      });

      cursor = response.next_cursor;
    } while (cursor);

    console.log(`\n✅ Loaded ${count} files from Cloudinary\n`);
    console.log('Sample files (first 10):');
    Array.from(cloudinaryFiles.keys())
      .slice(0, 10)
      .forEach((f) => console.log(`  - ${f}`));
    console.log('');

    // Check Events
    console.log('🎭 EVENTS WITH /uploads/:\n');
    const schema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', schema, 'events');

    const events = await Event.find({ imageUrl: { $regex: /\/uploads\// } }).lean();

    for (const event of events) {
      const filename = event.imageUrl.split('/').pop();
      console.log(`  Event: ${event.title}`);
      console.log(`    Current URL: ${event.imageUrl}`);
      console.log(`    Filename: ${filename}`);

      // Extract base filename (after timestamp if present)
      const baseParts = filename.split('-');
      const baseFilename = baseParts.length > 1 ? baseParts.slice(1).join('-') : filename;
      console.log(`    Base filename: ${baseFilename}`);

      // Check if it exists in Cloudinary
      if (cloudinaryFiles.has(filename)) {
        console.log(`    ✅ EXACT MATCH in Cloudinary`);
      } else if (cloudinaryFiles.has(baseFilename)) {
        console.log(`    ✅ BASE NAME MATCH in Cloudinary`);
        console.log(`    → ${cloudinaryFiles.get(baseFilename)}`);
      } else {
        // Try lowercase
        const lowercaseBase = baseFilename.toLowerCase();
        let found = false;
        for (const [cFile, cUrl] of cloudinaryFiles) {
          if (cFile.toLowerCase() === lowercaseBase) {
            console.log(`    ✅ CASE-INSENSITIVE MATCH in Cloudinary`);
            console.log(`    → ${cUrl}`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`    ❌ NOT FOUND in Cloudinary`);
        }
      }
      console.log('');
    }

    // Check Staff
    console.log('👥 STAFF WITH /uploads/:\n');
    const Staff = mongoose.model('Staff', schema, 'staffs');

    const staffItems = await Staff.find({ photoUrl: { $regex: /\/uploads\// } }).lean();

    for (const item of staffItems) {
      const filename = item.photoUrl.split('/').pop();
      console.log(`  Staff: ${item.fullName}`);
      console.log(`    Current URL: ${item.photoUrl}`);
      console.log(`    Filename: ${filename}`);

      // Extract base filename (after timestamp if present)
      const baseParts = filename.split('-');
      const baseFilename = baseParts.length > 1 ? baseParts.slice(1).join('-') : filename;
      console.log(`    Base filename: ${baseFilename}`);

      if (cloudinaryFiles.has(filename)) {
        console.log(`    ✅ EXACT MATCH in Cloudinary`);
        console.log(`    → ${cloudinaryFiles.get(filename)}`);
      } else if (cloudinaryFiles.has(baseFilename)) {
        console.log(`    ✅ BASE NAME MATCH in Cloudinary`);
        console.log(`    → ${cloudinaryFiles.get(baseFilename)}`);
      } else {
        const lowercaseBase = baseFilename.toLowerCase();
        let found = false;
        for (const [cFile, cUrl] of cloudinaryFiles) {
          if (cFile.toLowerCase() === lowercaseBase) {
            console.log(`    ✅ CASE-INSENSITIVE MATCH in Cloudinary`);
            console.log(`    → ${cUrl}`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`    ❌ NOT FOUND in Cloudinary`);
        }
      }
      console.log('');
    }

    // Check Content
    console.log('📄 CONTENT WITH /uploads/:\n');
    const Content = mongoose.model('Content', schema, 'contents');

    const contentItems = await Content.find({ 'attachments.url': { $regex: /\/uploads\// } }).lean();

    for (const item of contentItems) {
      console.log(`  Content: ${item.title}`);
      if (item.attachments?.length) {
        for (const att of item.attachments) {
          if (att.url?.includes('/uploads/')) {
            const filename = att.url.split('/').pop();
            console.log(`    Attachment filename: ${filename}`);

            const baseParts = filename.split('-');
            const baseFilename = baseParts.length > 1 ? baseParts.slice(1).join('-') : filename;
            console.log(`    Base filename: ${baseFilename}`);

            if (cloudinaryFiles.has(filename)) {
              console.log(`    ✅ EXACT MATCH in Cloudinary`);
            } else if (cloudinaryFiles.has(baseFilename)) {
              console.log(`    ✅ BASE NAME MATCH in Cloudinary`);
              console.log(`    → ${cloudinaryFiles.get(baseFilename)}`);
            } else {
              const lowercaseBase = baseFilename.toLowerCase();
              let found = false;
              for (const [cFile, cUrl] of cloudinaryFiles) {
                if (cFile.toLowerCase() === lowercaseBase) {
                  console.log(`    ✅ CASE-INSENSITIVE MATCH in Cloudinary`);
                  console.log(`    → ${cUrl}`);
                  found = true;
                  break;
                }
              }
              if (!found) {
                console.log(`    ❌ NOT FOUND in Cloudinary`);
              }
            }
          }
        }
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
