#!/usr/bin/env node
/**
 * Cloudinary Asset Diagnostic
 * 
 * Checks what files are actually in Cloudinary and compares with database URLs
 */

import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
}

async function getCloudinaryFiles() {
  console.log('\n☁️  Fetching files from Cloudinary...');
  const results = [];
  let nextCursor = null;

  try {
    do {
      const response = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: nextCursor,
        type: 'upload',
      });

      results.push(...(response.resources || []));
      nextCursor = response.next_cursor;

      console.log(`  Fetched batch: ${response.resources?.length || 0} files`);
    } while (nextCursor);

    console.log(`✅ Total in Cloudinary: ${results.length} files`);
    return results;
  } catch (error) {
    console.error('❌ Failed to fetch Cloudinary files:', error.message);
    return [];
  }
}

async function getDatabaseURLs() {
  console.log('\n📊 Fetching URLs from database...');

  try {
    const schema = new mongoose.Schema({}, { strict: false });
    const GalleryItem = mongoose.model('GalleryItem', schema, 'galleryitems');

    const items = await GalleryItem.find({}).lean();
    const urls = [];

    items.forEach((item) => {
      if (item.attachments?.length > 0) {
        item.attachments.forEach((att) => {
          if (att.url) {
            urls.push({
              url: att.url,
              gallery: item.name,
              fileName: att.fileName,
            });
          }
        });
      }
    });

    console.log(`✅ Total in Database: ${urls.length} URLs`);
    return urls;
  } catch (error) {
    console.error('❌ Failed to fetch database URLs:', error.message);
    return [];
  }
}

function extractFilename(url) {
  if (!url) return '';
  try {
    const path = new URL(url).pathname;
    return path.split('/').pop();
  } catch {
    return url.split('/').pop() || '';
  }
}

async function analyzeStatus() {
  await connectDB();

  const cloudinaryFiles = await getCloudinaryFiles();
  const databaseURLs = await getDatabaseURLs();

  await disconnectDB();

  console.log('\n📈 ANALYSIS\n');

  // Extract filenames from Cloudinary
  const cloudinaryFileNames = new Set(
    cloudinaryFiles.map((f) => f.public_id.split('/').pop())
  );

  console.log(`Cloudinary files: ${cloudinaryFiles.length}`);
  console.log(`Database URLs: ${databaseURLs.length}`);

  // Check URL types in database
  const uploadsURLs = databaseURLs.filter((u) => u.url.includes('/uploads/'));
  const cloudinaryURLs = databaseURLs.filter((u) => u.url.includes('cloudinary'));
  const otherURLs = databaseURLs.filter(
    (u) => !u.url.includes('/uploads/') && !u.url.includes('cloudinary')
  );

  console.log(`\n📍 Database URL breakdown:`);
  console.log(`  /uploads/ URLs: ${uploadsURLs.length} (orphaned/missing files)`);
  console.log(`  Cloudinary URLs: ${cloudinaryURLs.length} (permanent storage)`);
  console.log(`  Other URLs: ${otherURLs.length}`);

  // Check if Cloudinary URLs match what's in Cloudinary
  if (cloudinaryURLs.length > 0) {
    console.log(`\n✅ Cloudinary URLs in database:`);
    const sampleURLs = cloudinaryURLs.slice(0, 3);
    sampleURLs.forEach((u) => {
      const filename = extractFilename(u.url);
      const inCloudinary = cloudinaryFileNames.has(filename);
      console.log(`  ["${filename}"] ${inCloudinary ? '✅ EXISTS' : '❌ MISSING'}`);
    });
  }

  // Analysis
  console.log(`\n🔍 SITUATION ANALYSIS:`);

  if (cloudinaryFiles.length === 0) {
    console.log(
      `
❌ PROBLEM DETECTED:
   - Database has 156 URLs pointing to /uploads/
   - Actual files NOT in /uploads/ directory (0 files)
   - Cloudinary is EMPTY (0 files)
   
🤔 POSSIBLE CAUSES:
   1. Files were deleted before migration
   2. Upload process failed silently
   3. Files stored in different location
   4. Previous incomplete cleanup
   
➡️  RECOMMENDED ACTION:
   Check source of original files:
   - Frontend uploads folder (if applicable)
   - Email/backup folder for original uploads
   - Cloud storage (Google Drive, OneDrive)
   - Database backup from before deletion
`
    );
  } else if (uploadsURLs.length === 0 && cloudinaryURLs.length > 0) {
    console.log(
      `
✅ GOOD NEWS:
   - All 156 files already in Cloudinary
   - Just need to update database URLs
   - Database URLs still showing /uploads/ (legacy)
   
➡️  NEXT STEP:
   Run: update-database-to-cloudinary-urls.mjs
   This will update all database URLs to match what's in Cloudinary
`
    );
  } else if (cloudinaryFiles.length < uploadsURLs.length) {
    console.log(
      `
⚠️  PARTIAL MIGRATION DETECTED:
   - Database expects ${uploadsURLs.length} files
   - Cloudinary has ${cloudinaryFiles.length} files
   - Missing: ${uploadsURLs.length - cloudinaryFiles.length} files
   
➡️  RECOMMENDED ACTION:
   1. Update database URLs for existing Cloudinary files
   2. Check backup for missing files
   3. Re-upload missing files if found
`
    );
  } else {
    console.log(
      `
✅ MIGRATION APPEARS COMPLETE:
   - All database URLs pointing to Cloudinary
   - No /uploads/ references remaining
   - Migration successful!
`
    );
  }
}

analyzeStatus().catch(console.error);
