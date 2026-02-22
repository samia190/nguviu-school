#!/usr/bin/env node
/**
 * Distribute Hero Content Images to Gallery
 * Scans HeroContent collection and copies all images to Gallery
 * This allows hero images to be searchable and viewable in the public gallery
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import HeroContent from '../models/HeroContent.js';
import GalleryItem from '../models/GalleryItem.js';

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://kangach:kangach19@19@cluster0.7bmfdr8.mongodb.net/?appName=Cluster0';

async function distributeHeroToGallery() {
  try {
    await mongoose.connect(mongoUri, {});
    console.log('🔗 Connected to MongoDB');

    // Get all active hero images (not videos)
    const heroImages = await HeroContent.find({
      active: true,
      type: { $in: ['image', 'slide'] }
    });

    console.log(`\n📸 Found ${heroImages.length} active hero images/slides`);

    if (heroImages.length === 0) {
      console.log('✅ No hero images to distribute');
      await mongoose.disconnect();
      return;
    }

    // Create or update gallery items for each hero image
    let created = 0;
    let updated = 0;

    for (const hero of heroImages) {
      try {
        // Check if gallery item already exists for this hero
        const existing = await GalleryItem.findOne({
          title: hero.title || `Hero - ${hero.page}`,
          attachments: { $elemMatch: { url: hero.url } }
        });

        if (existing) {
          updated++;
          console.log(`  ✓ Gallery item already exists: ${hero.title || hero.page}`);
        } else {
          // Create new gallery item with this hero image as attachment
          const galleryItem = new GalleryItem({
            title: hero.title || `${hero.page.charAt(0).toUpperCase() + hero.page.slice(1)} Hero Image`,
            body: hero.description || `Hero image from ${hero.page} page`,
            attachments: [
              {
                url: hero.url,
                downloadUrl: hero.url,
                originalName: hero.originalName || `hero-${hero.page}.jpg`,
                title: hero.title || `Hero - ${hero.page}`,
                description: hero.description || '',
                mimetype: hero.mimetype || 'image/jpeg',
                size: hero.size || 0
              }
            ],
            category: 'heroes'
          });

          await galleryItem.save();
          created++;
          console.log(`  ✨ Created gallery item: ${galleryItem.title}`);
        }
      } catch (err) {
        console.error(`  ✗ Error processing hero "${hero.title}":`, err.message);
      }
    }

    console.log(`\n✅ Distribution Complete!`);
    console.log(`   📊 Created: ${created} new gallery items`);
    console.log(`   📊 Already existed: ${updated} gallery items`);
    console.log(`   📊 Total hero images: ${heroImages.length}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

distributeHeroToGallery().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
