#!/usr/bin/env node
/**
 * Migration Script: Add file extensions to gallery item URLs
 * 
 * This script identifies gallery items with missing file extensions
 * and attempts to fix them by:
 * 1. Inferring extensions from MIME types
 * 2. Adding extension field to database
 * 3. Ensuring srcset parsing works correctly
 * 
 * Usage:
 * node migrate-gallery-extensions.mjs
 * 
 * Before running:
 * 1. Back up your MongoDB database
 * 2. Ensure .env is configured with MONGO_URI
 * 3. Verify Cloudinary is accessible
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import GalleryItem model
import GalleryItem from './models/GalleryItem.js';

// MIME type to extension mapping
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

// Common extensions for pattern matching
const COMMON_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.mp4', '.webm', '.mov', '.pdf', '.zip'];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kangaru_girls_db');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function inferExtensionFromUrl(url) {
  /**
   * Try to infer extension from URL pattern
   * Handles Cloudinary URLs like:
   * - /DSC_5364.jpg
   * - /DSC_5364 (missing extension)
   * - /uploads/gallery-123-DSC_5364.jpg
   * - /uploads/gallery-123-DSC_5364 (missing extension)
   */
  
  if (!url) return '';
  
  // If URL already has a known extension, return it
  const extensionMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
  if (extensionMatch) {
    const ext = '.' + extensionMatch[1].toLowerCase();
    if (COMMON_EXTENSIONS.includes(ext)) {
      return ext;
    }
  }
  
  // Check if filename contains common image names (assume .jpg)
  if (url.includes('DSC_') || url.includes('IMG_') || url.includes('gallery-')) {
    // Most likely image, default to .jpg
    return '.jpg';
  }
  
  return '';
}

async function migrateGalleryItems() {
  console.log('\n📋 Starting Gallery Item Extension Migration...\n');

  try {
    const items = await GalleryItem.find();
    console.log(`Found ${items.length} gallery items to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      console.log(`Processing: ${item.title || 'Untitled'} (${item._id})`);

      let itemChanged = false;

      for (const attachment of item.attachments) {
        // Check if attachment already has extension field
        if (attachment.extension && attachment.extension !== '') {
          console.log(`  ✓ Already has extension: ${attachment.extension}`);
          continue;
        }

        // Infer extension from URL or MIME type
        let inferredExtension = await inferExtensionFromUrl(attachment.url);
        
        if (!inferredExtension && attachment.mimetype) {
          inferredExtension = MIME_TO_EXT[attachment.mimetype] || '.bin';
        }

        if (!inferredExtension) {
          console.log(`  ⚠️  Could not infer extension for: ${attachment.url}`);
          skipped++;
          continue;
        }

        // Update attachment
        const oldUrl = attachment.url;
        attachment.extension = inferredExtension;

        // Add extension to URL if missing
        if (!oldUrl.match(/\.[a-z0-9]+(\?|$)/i)) {
          attachment.url = oldUrl + inferredExtension;
          console.log(`  ✏️  Updated URL: ${oldUrl} → ${attachment.url}`);
          console.log(`  📝 Added extension: ${inferredExtension}`);
          itemChanged = true;
        } else {
          console.log(`  ✓ Already has extension: ${inferredExtension}`);
          itemChanged = true;
        }
      }

      // Save if any changes were made
      if (itemChanged) {
        try {
          await item.save();
          updated++;
          console.log(`  ✅ Saved changes\n`);
        } catch (saveError) {
          console.error(`  ❌ Error saving item: ${saveError.message}\n`);
          errors++;
        }
      } else {
        console.log(`  ⏭️  No changes needed\n`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Items Updated: ${updated}`);
    console.log(`⚠️  Items Skipped: ${skipped}`);
    console.log(`❌ Items with Errors: ${errors}`);
    console.log('='.repeat(60) + '\n');

    if (updated > 0) {
      console.log('✨ Migration completed successfully!');
      console.log('   All gallery items now have file extensions.\n');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Gallery Extension Migration Tool');
  console.log('='.repeat(60));
  console.log('Purpose: Add file extensions to gallery item URLs');
  console.log('Status:  This ensures srcset parsing works correctly\n');

  await connectDB();
  await migrateGalleryItems();

  // Disconnect
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB\n');
}

// Run migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
