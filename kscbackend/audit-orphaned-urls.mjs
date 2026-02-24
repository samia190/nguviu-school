#!/usr/bin/env node
/**
 * Migration Script: Identify orphaned /uploads/ URLs
 * 
 * This script identifies gallery items pointing to /uploads/ paths
 * that are ephemeral on Render (deleted on dyno restart).
 * 
 * Output: Lists all orphaned URLs for manual recovery
 * 
 * Actions to take after this script:
 * 1. Check Cloudinary for re-uploaded versions
 * 2. Update URLs to permanent Cloudinary paths
 * 3. OR: Re-upload images and get new Cloudinary URLs
 * 
 * Usage:
 * node audit-orphaned-urls.mjs > orphaned-urls-report.txt
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

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kangaru_girls_db');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function auditOrphanedUrls() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 Auditing Orphaned /uploads/ URLs');
  console.log('='.repeat(70) + '\n');

  try {
    const items = await GalleryItem.find();
    
    const orphaned = [];
    const cloudinary = [];
    const other = [];

    for (const item of items) {
      for (const attachment of item.attachments) {
        const url = attachment.url || '';
        
        const record = {
          galleryId: item._id,
          galleryTitle: item.title,
          attachmentUrl: url,
          originalName: attachment.originalName,
          mimetype: attachment.mimetype,
          uploadedAt: attachment.uploadedAt,
          size: attachment.size
        };

        if (url.startsWith('/uploads/')) {
          orphaned.push(record);
        } else if (url.includes('cloudinary.com')) {
          cloudinary.push(record);
        } else {
          other.push(record);
        }
      }
    }

    // Report
    console.log(`📊 URL Distribution:`);
    console.log(`   • Orphaned (/uploads/): ${orphaned.length}`);
    console.log(`   • Cloudinary: ${cloudinary.length}`);
    console.log(`   • Other sources: ${other.length}`);
    console.log(`   • Total: ${orphaned.length + cloudinary.length + other.length}\n`);

    if (orphaned.length > 0) {
      console.log('⚠️  ORPHANED URLS (/uploads/ - ephemeral on Render):\n');
      console.log('-'.repeat(70));
      
      orphaned.forEach((record, index) => {
        console.log(`\n${index + 1}. Gallery Item: "${record.galleryTitle}" (ID: ${record.galleryId})`);
        console.log(`   URL: ${record.attachmentUrl}`);
        console.log(`   Filename: ${record.originalName}`);
        console.log(`   MIME Type: ${record.mimetype}`);
        console.log(`   Size: ${record.size ? (record.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`);
        console.log(`   Uploaded: ${new Date(record.uploadedAt).toLocaleDateString()}`);
      });

      console.log('\n' + '-'.repeat(70));
      console.log('\n⚡ REQUIRED ACTIONS:\n');
      console.log('1. ☁️ Check Cloudinary for re-uploaded versions of these images');
      console.log('2. 📝 Update database URLs to permanent Cloudinary paths, OR');
      console.log('3. 📤 Re-upload images to Cloudinary and update database\n');

      console.log('Example migration query to manually update URLs:');
      console.log('  db.galleryitems.updateOne(');
      console.log('    { "attachments.url": "/uploads/..." },');
      console.log('    { $set: { "attachments.$.url": "https://res.cloudinary.com/.../..." }}');
      console.log('  )\n');
    }

    if (cloudinary.length > 0) {
      console.log('✅ CLOUDINARY URLS (Permanent - Safe):\n');
      console.log(`   Count: ${cloudinary.length}`);
      console.log(`   These URLs are permanent and safe.\n`);
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Audit error:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔎 Orphaned URLs Audit Tool');
  console.log('='.repeat(70));
  console.log('Purpose: Identify /uploads/ URLs that may be deleted on Render restart');
  console.log('Context: /uploads is ephemeral; use Cloudinary for production files\n');

  await connectDB();
  await auditOrphanedUrls();

  // Disconnect
  await mongoose.disconnect();
  console.log('✅ Audit complete. Disconnected from MongoDB.\n');
}

// Run audit
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
