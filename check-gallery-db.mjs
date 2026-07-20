#!/usr/bin/env node

/**
 * Check what URL formats are actually stored in gallery attachments
 * This helps understand the OpaqueResponseBlocking errors
 */

import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function checkGalleryDatabase() {
  console.log(chalk.cyan.bold("\n🔍 CHECKING GALLERY DATABASE URLS\n"));

  try {
    // Import models
    const { default: GalleryItem } = await import('./kscbackend/models/GalleryItem.js');
    
    const items = await GalleryItem.find().limit(5);
    
    console.log(chalk.yellow(`Found ${items.length} gallery items in database\n`));
    
    let totalAttachments = 0;
    let relativeUrls = 0;
    let absoluteUrls = 0;
    let imagesUrls = 0;
    let malformedUrls = 0;
    
    items.forEach((item, idx) => {
      console.log(chalk.blue(`\n📁 Gallery Item ${idx + 1}: "${item.title}"`));
      console.log(chalk.gray(`   ID: ${item._id}`));
      console.log(chalk.gray(`   Attachments: ${item.attachments.length}`));
      
      item.attachments.slice(0, 3).forEach((att, aidx) => {
        totalAttachments++;
        const url = att.url;
        
        // Classify URL type
        let urlType = '❓';
        let color = chalk.gray;
        
        if (url.startsWith('/uploads/')) {
          urlType = '✅ RELATIVE /uploads/';
          relativeUrls++;
          color = chalk.green;
        } else if (url.startsWith('/images/')) {
          urlType = '⚠️  RELATIVE /images/ (OLD)';
          imagesUrls++;
          color = chalk.yellow;
        } else if (url.startsWith('http')) {
          urlType = '❌ ABSOLUTE ' + url.split('/')[2];
          absoluteUrls++;
          color = chalk.red;
        } else {
          urlType = '❌ MALFORMED';
          malformedUrls++;
          color = chalk.red;
        }
        
        console.log(color(`   [${aidx + 1}] ${urlType}`));
        console.log(chalk.gray(`      Filename: ${att.filename}`));
        console.log(chalk.gray(`      Full URL: ${url}`));
      });
      
      if (item.attachments.length > 3) {
        console.log(chalk.gray(`   ... and ${item.attachments.length - 3} more attachments`));
      }
    });
    
    console.log(chalk.cyan.bold("\n📊 SUMMARY:\n"));
    console.table({
      'Total Attachments': totalAttachments,
      'Relative /uploads/': relativeUrls,
      'Relative /images/': imagesUrls,
      'Absolute URLs': absoluteUrls,
      'Malformed': malformedUrls,
    });
    
    // Diagnosis
    console.log(chalk.cyan.bold("\n🔧 DIAGNOSIS:\n"));
    
    if (absoluteUrls > 0) {
      console.log(chalk.red.bold("❌ PROBLEM FOUND: Database has absolute URLs!"));
      console.log(chalk.yellow("   This causes OpaqueResponseBlocking errors when:"));
      console.log(chalk.yellow("   - Running frontend on localhost:5173"));
      console.log(chalk.yellow("   - Gallery tries to fetch from https://kangarugirls.sc.ke"));
      console.log(chalk.yellow("   - Triggers CORS/security blocks\n"));
    }
    
    if (imagesUrls > 0) {
      console.log(chalk.red.bold("❌ PROBLEM FOUND: Database has /images/ URLs (old location)!"));
      console.log(chalk.yellow("   Images moved to /uploads/ but DB still points to /images/\n"));
    }
    
    if (relativeUrls > 0) {
      console.log(chalk.green.bold("✓ GOOD: Database has relative /uploads/ URLs"));
      console.log(chalk.green("  These should work correctly when converted to absolute\n"));
    }
    
    // Recommendations

    console.log(chalk.cyan.bold("✨ NEXT STEPS:\n"));
    if (absoluteUrls > 0 || imagesUrls > 0) {
      console.log(chalk.yellow("1. Run: node kscbackend/fix-gallery-urls.mjs"));
      console.log(chalk.yellow("   (Will convert all URLs to relative format)\n"));
    }
    console.log(chalk.yellow("2. Verify Gallery.jsx converts relative to absolute correctly\n"));
    console.log(chalk.yellow("3. Check StudentLife and Events for same issue\n"));
    
  } catch (error) {
    console.log(chalk.red.bold("\n❌ ERROR:\n"));
    console.error(error);
    process.exit(1);
  }
}

checkGalleryDatabase();
 