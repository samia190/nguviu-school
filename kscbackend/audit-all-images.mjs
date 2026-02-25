#!/usr/bin/env node
/**
 * Audit All Image URLs Across Platform
 * 
 * Checks all collections for image URLs:
 * - Gallery: GalleryItem.attachments[].url
 * - Events: Event.imageUrl
 * - StudentLife: StudentLife.imageUrl
 * - Hero: HeroContent.url
 * - Staff: Staff.photoUrl
 * - Content: Content.heroImage + Content.attachments[].url
 * 
 * Usage:
 *   node audit-all-images.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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

async function auditGalleryImages() {
  log('\n📸 AUDITING GALLERY IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const GalleryItem = mongoose.model('GalleryItem', schema, 'galleryitems');
  
  const items = await GalleryItem.find({}).lean();
  
  let uploadsCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  let totalFiles = 0;
  
  items.forEach((item) => {
    if (item.attachments?.length > 0) {
      item.attachments.forEach((att) => {
        totalFiles++;
        if (att.url?.includes('/uploads/')) uploadsCount++;
        else if (att.url?.includes('cloudinary')) cloudinaryCount++;
        else otherCount++;
      });
    }
  });
  
  log(`  Items: ${items.length}`);
  log(`  Total Files: ${totalFiles}`);
  log(`  URLs in /uploads/: ${uploadsCount} ❌`);
  log(`  URLs in Cloudinary: ${cloudinaryCount} ✅`);
  log(`  Other URLs: ${otherCount}`);
  
  return { uploadsCount, cloudinaryCount, otherCount };
}

async function auditEventImages() {
  log('\n🎭 AUDITING EVENT IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const Event = mongoose.model('Event', schema, 'events');
  
  const items = await Event.find({}).lean();
  
  let uploadsCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  let emptyCount = 0;
  
  items.forEach((item) => {
    if (!item.imageUrl) {
      emptyCount++;
    } else if (item.imageUrl.includes('/uploads/')) {
      uploadsCount++;
    } else if (item.imageUrl.includes('cloudinary')) {
      cloudinaryCount++;
    } else {
      otherCount++;
    }
  });
  
  log(`  Total Events: ${items.length}`);
  log(`  URLs in /uploads/: ${uploadsCount} ❌`);
  log(`  URLs in Cloudinary: ${cloudinaryCount} ✅`);
  log(`  Other URLs: ${otherCount}`);
  log(`  No image: ${emptyCount}`);
  
  return { uploadsCount, cloudinaryCount, otherCount, emptyCount };
}

async function auditStudentLifeImages() {
  log('\n🎨 AUDITING STUDENT LIFE IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const StudentLife = mongoose.model('StudentLife', schema, 'studentlifes');
  
  const items = await StudentLife.find({}).lean();
  
  let uploadsCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  let emptyCount = 0;
  
  items.forEach((item) => {
    if (!item.imageUrl) {
      emptyCount++;
    } else if (item.imageUrl.includes('/uploads/')) {
      uploadsCount++;
    } else if (item.imageUrl.includes('cloudinary')) {
      cloudinaryCount++;
    } else {
      otherCount++;
    }
  });
  
  log(`  Total Items: ${items.length}`);
  log(`  URLs in /uploads/: ${uploadsCount} ❌`);
  log(`  URLs in Cloudinary: ${cloudinaryCount} ✅`);
  log(`  Other URLs: ${otherCount}`);
  log(`  No image: ${emptyCount}`);
  
  return { uploadsCount, cloudinaryCount, otherCount, emptyCount };
}

async function auditHeroImages() {
  log('\n🎬 AUDITING HERO IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const HeroContent = mongoose.model('HeroContent', schema, 'herocontents');
  
  const items = await HeroContent.find({}).lean();
  
  let uploadsCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  const byPage = {};
  
  items.forEach((item) => {
    const page = item.page || 'unknown';
    if (!byPage[page]) byPage[page] = { uploads: 0, cloudinary: 0, other: 0 };
    
    if (item.url.includes('/uploads/')) {
      uploadsCount++;
      byPage[page].uploads++;
    } else if (item.url.includes('cloudinary')) {
      cloudinaryCount++;
      byPage[page].cloudinary++;
    } else {
      otherCount++;
      byPage[page].other++;
    }
  });
  
  log(`  Total Hero Items: ${items.length}`);
  log(`  URLs in /uploads/: ${uploadsCount} ❌`);
  log(`  URLs in Cloudinary: ${cloudinaryCount} ✅`);
  log(`  Other URLs: ${otherCount}`);
  log(`  Breakdown by page:`);
  
  Object.entries(byPage).forEach(([page, counts]) => {
    if (counts.uploads > 0) {
      log(`    ${page}: ${counts.uploads} /uploads/, ${counts.cloudinary} Cloudinary, ${counts.other} other`);
    }
  });
  
  return { uploadsCount, cloudinaryCount, otherCount };
}

async function auditStaffImages() {
  log('\n👥 AUDITING STAFF IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const Staff = mongoose.model('Staff', schema, 'staffs');
  
  const items = await Staff.find({}).lean();
  
  let uploadsCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  let emptyCount = 0;
  
  items.forEach((item) => {
    if (!item.photoUrl) {
      emptyCount++;
    } else if (item.photoUrl.includes('/uploads/')) {
      uploadsCount++;
    } else if (item.photoUrl.includes('cloudinary')) {
      cloudinaryCount++;
    } else {
      otherCount++;
    }
  });
  
  log(`  Total Staff: ${items.length}`);
  log(`  URLs in /uploads/: ${uploadsCount} ❌`);
  log(`  URLs in Cloudinary: ${cloudinaryCount} ✅`);
  log(`  Other URLs: ${otherCount}`);
  log(`  No photo: ${emptyCount}`);
  
  return { uploadsCount, cloudinaryCount, otherCount, emptyCount };
}

async function auditContentImages() {
  log('\n📄 AUDITING CONTENT IMAGES...');
  
  const schema = new mongoose.Schema({}, { strict: false });
  const Content = mongoose.model('Content', schema, 'contents');
  
  const items = await Content.find({}).lean();
  
  let heroUploads = 0;
  let heroCloudinary = 0;
  let attUploads = 0;
  let attCloudinary = 0;
  const byType = {};
  
  items.forEach((item) => {
    const type = item.type || 'unknown';
    if (!byType[type]) byType[type] = { uploads: 0, cloudinary: 0 };
    
    // Hero image
    if (item.heroImage) {
      if (item.heroImage.includes('/uploads/')) {
        heroUploads++;
        byType[type].uploads++;
      } else if (item.heroImage.includes('cloudinary')) {
        heroCloudinary++;
        byType[type].cloudinary++;
      }
    }
    
    // Attachment URLs
    if (item.attachments?.length > 0) {
      item.attachments.forEach((att) => {
        if (att.url.includes('/uploads/')) {
          attUploads++;
          byType[type].uploads++;
        } else if (att.url.includes('cloudinary')) {
          attCloudinary++;
          byType[type].cloudinary++;
        }
      });
    }
  });
  
  log(`  Total Content Items: ${items.length}`);
  log(`  Hero Images in /uploads/: ${heroUploads} ❌`);
  log(`  Hero Images in Cloudinary: ${heroCloudinary} ✅`);
  log(`  Attachment URLs in /uploads/: ${attUploads} ❌`);
  log(`  Attachment URLs in Cloudinary: ${attCloudinary} ✅`);
  log(`  Breakdown by content type:`);
  
  Object.entries(byType).forEach(([type, counts]) => {
    if (counts.uploads > 0 || counts.cloudinary > 0) {
      log(`    ${type}: ${counts.uploads} /uploads/, ${counts.cloudinary} Cloudinary`);
    }
  });
  
  return { heroUploads, heroCloudinary, attUploads, attCloudinary };
}

async function main() {
  console.log('\n🔍 COMPREHENSIVE IMAGE AUDIT - ALL COLLECTIONS\n');
  
  await connectDB();
  
  try {
    const gallery = await auditGalleryImages();
    const events = await auditEventImages();
    const studentLife = await auditStudentLifeImages();
    const hero = await auditHeroImages();
    const staff = await auditStaffImages();
    const content = await auditContentImages();
    
    // Summary
    const totalUploads = 
      gallery.uploadsCount +
      events.uploadsCount +
      studentLife.uploadsCount +
      hero.uploadsCount +
      staff.uploadsCount +
      content.heroUploads +
      content.attUploads;
    
    const totalCloudinary =
      gallery.cloudinaryCount +
      events.cloudinaryCount +
      studentLife.cloudinaryCount +
      hero.cloudinaryCount +
      staff.cloudinaryCount +
      content.heroCloudinary +
      content.attCloudinary;
    
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                        COMPLETE AUDIT SUMMARY                             ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 OVERALL STATISTICS:
────────────────────────────────────────────────────────────────────────────
URLs in /uploads/ (orphaned):     ${totalUploads} ❌
URLs in Cloudinary (permanent):   ${totalCloudinary} ✅

BREAKDOWN BY SECTION:
────────────────────────────────────────────────────────────────────────────
Gallery:        ${gallery.uploadsCount} /uploads/, ${gallery.cloudinaryCount} Cloudinary
Events:         ${events.uploadsCount} /uploads/, ${events.cloudinaryCount} Cloudinary
Student Life:   ${studentLife.uploadsCount} /uploads/, ${studentLife.cloudinaryCount} Cloudinary
Hero Images:    ${hero.uploadsCount} /uploads/, ${hero.cloudinaryCount} Cloudinary
Staff Photos:   ${staff.uploadsCount} /uploads/, ${staff.cloudinaryCount} Cloudinary
Content:        ${content.heroUploads + content.attUploads} /uploads/, ${content.heroCloudinary + content.attCloudinary} Cloudinary

ACTION REQUIRED:
────────────────────────────────────────────────────────────────────────────
${totalUploads === 0 
  ? '✅ All images are in Cloudinary or properly configured!' 
  : `❌ ${totalUploads} image URLs need to be migrated to Cloudinary`}

${totalUploads > 0 ? `
Run the following migrations:
  node migrate-all-images-to-cloudinary.mjs
` : ''}
`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
