/**
 * Upload Frontend Images to Gallery
 * 
 * Reads all images from kscfrontend/public/images and uploads them to the gallery
 * Makes them available on the public gallery page and manageable in admin panel
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import GalleryItem from '../models/GalleryItem.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Navigate from backend/scripts to frontend/public/images
const frontendImagesDir = path.join(__dirname, '../../kscfrontend/public/images');
const backenduploadsDir = path.join(__dirname, '../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(backenduploadsDir)) {
  fs.mkdirSync(backenduploadsDir, { recursive: true });
}

async function uploadFrontendImagesToGallery() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kangaru_girls:Kangaru%40123@kangaru-girls-db.8uvh2.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB!');

    console.log('\n📂 Reading images from:', frontendImagesDir);
    
    if (!fs.existsSync(frontendImagesDir)) {
      console.error('❌ Images directory not found:', frontendImagesDir);
      process.exit(1);
    }

    const imageFiles = fs.readdirSync(frontendImagesDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.PNG', '.webp', '.gif'].includes(ext);
    });

    console.log(`📸 Found ${imageFiles.length} images`);

    if (imageFiles.length === 0) {
      console.log('⚠️  No images found to upload');
      process.exit(0);
    }

    // Create a new gallery item
    console.log('\n📝 Creating gallery item...');
    const galleryItem = new GalleryItem({
      title: 'School Gallery',
      body: 'Gallery of school events, activities, and campus life',
      attachments: []
    });

    // Process each image
    console.log('\n📤 Uploading images...');
    let uploadedCount = 0;
    let skippedCount = 0;

    for (const imageFile of imageFiles) {
      const sourcePath = path.join(frontendImagesDir, imageFile);
      const destFilename = `gallery-${Date.now()}-${imageFile}`;
      const destPath = path.join(backenduploadsDir, destFilename);

      try {
        // Copy file to uploads folder
        fs.copyFileSync(sourcePath, destPath);

        // Get file size
        const stat = fs.statSync(destPath);

        // Add to attachments
        galleryItem.attachments.push({
          originalName: imageFile,
          filename: destFilename,
          url: `/uploads/${destFilename}`,
          mimetype: getMimeType(imageFile),
          size: stat.size,
          uploadedAt: new Date()
        });

        uploadedCount++;
        process.stdout.write(`\r   ✅ Uploaded: ${uploadedCount}/${imageFiles.length}`);
      } catch (err) {
        console.error(`\n   ❌ Failed to upload ${imageFile}:`, err.message);
        skippedCount++;
      }
    }

    console.log(`\n\n💾 Saving gallery item to database...`);
    await galleryItem.save();
    console.log('✅ Gallery item saved!');

    console.log('\n' + '='.repeat(60));
    console.log('✨ UPLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total images processed: ${imageFiles.length}`);
    console.log(`✅ Uploaded: ${uploadedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`\n📸 Gallery ID: ${galleryItem._id}`);
    console.log(`🎥 Total attachments: ${galleryItem.attachments.length}`);
    console.log('\n🌐 Access the gallery at:');
    console.log('   📖 Public: http://localhost:5174/gallery');
    console.log('   🔧 Admin: http://localhost:5174/admin (Gallery Management)');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.PNG': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

uploadFrontendImagesToGallery();
