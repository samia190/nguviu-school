#!/usr/bin/env node

/**
 * COMPREHENSIVE DIAGNOSTIC: Check all image URLs in database
 * Purpose: Identify exact URL formats stored for each image type
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const colors = {
  section: (text) => chalk.cyan.bold(`\n${'='.repeat(60)}\n${text}\n${'='.repeat(60)}\n`),
  good: (text) => chalk.green(`✓ ${text}`),
  bad: (text) => chalk.red(`✗ ${text}`),
  warn: (text) => chalk.yellow(`⚠ ${text}`),
  info: (text) => chalk.blue(`ℹ ${text}`),
};

async function diagnose() {
  console.log(colors.section('IMAGE URL DIAGNOSTIC REPORT'));
  
  try {
    // Import all models
    const { default: GalleryItem } = await import('./kscbackend/models/GalleryItem.js');
    const { default: StudentLife } = await import('./kscbackend/models/StudentLife.js');
    const { default: Event } = await import('./kscbackend/models/Event.js');
    const { default: Staff } = await import('./kscbackend/models/Staff.js');
    const { default: HomeNews } = await import('./kscbackend/models/HomeNews.js');
    
    // Test Gallery
    console.log(colors.info('Scanning Gallery attachments...'));
    const galleryItems = await GalleryItem.find().limit(2);
    let galleryUrls = { relative: 0, absolute: 0, images: 0, other: 0 };
    let galleryExamples = [];
    
    galleryItems.forEach(item => {
      item.attachments.forEach(att => {
        const url = att.url;
        if (url.startsWith('/uploads/')) {
          galleryUrls.relative++;
        } else if (url.startsWith('/images/')) {
          galleryUrls.images++;
          galleryExamples.push({ section: 'Gallery', url });
        } else if (url.startsWith('http')) {
          galleryUrls.absolute++;
          galleryExamples.push({ section: 'Gallery', url });
        } else {
          galleryUrls.other++;
          galleryExamples.push({ section: 'Gallery', url });
        }
      });
    });
    console.table(galleryUrls);
    
    // Test StudentLife
    console.log(colors.info('Scanning StudentLife items...'));
    const studentLifeItems = await StudentLife.find().limit(5);
    let slUrls = { relative: 0, absolute: 0, images: 0, other: 0 };
    let slExamples = [];
    
    studentLifeItems.forEach(item => {
      const url = item.imageUrl;
      if (url.startsWith('/uploads/')) {
        slUrls.relative++;
      } else if (url.startsWith('/images/')) {
        slUrls.images++;
        slExamples.push({ section: 'StudentLife', title: item.title, url });
      } else if (url.startsWith('http')) {
        slUrls.absolute++;
        slExamples.push({ section: 'StudentLife', title: item.title, url });
      } else {
        slUrls.other++;
        slExamples.push({ section: 'StudentLife', title: item.title, url });
      }
    });
    console.table(slUrls);
    
    // Test Events
    console.log(colors.info('Scanning Events...'));
    const events = await Event.find().limit(5);
    let eventUrls = { relative: 0, absolute: 0, images: 0, other: 0 };
    let eventExamples = [];
    
    events.forEach(event => {
      const url = event.imageUrl;
      if (url.startsWith('/uploads/')) {
        eventUrls.relative++;
      } else if (url.startsWith('/images/')) {
        eventUrls.images++;
        eventExamples.push({ section: 'Events', title: event.title, url });
      } else if (url.startsWith('http')) {
        eventUrls.absolute++;
        eventExamples.push({ section: 'Events', title: event.title, url });
      } else {
        eventUrls.other++;
        eventExamples.push({ section: 'Events', title: event.title, url });
      }
    });
    console.table(eventUrls);
    
    // Test Staff
    console.log(colors.info('Scanning Staff...'));
    const staffList = await Staff.find().limit(5);
    let staffUrls = { relative: 0, absolute: 0, images: 0, other: 0 };
    let staffExamples = [];
    
    staffList.forEach(staff => {
      const url = staff.photoUrl;
      if (url.startsWith('/uploads/')) {
        staffUrls.relative++;
      } else if (url.startsWith('/images/')) {
        staffUrls.images++;
        staffExamples.push({ section: 'Staff', name: staff.name, url });
      } else if (url.startsWith('http')) {
        staffUrls.absolute++;
        staffExamples.push({ section: 'Staff', name: staff.name, url });
      } else {
        staffUrls.other++;
        staffExamples.push({ section: 'Staff', name: staff.name, url });
      }
    });
    console.table(staffUrls);
    
    // Test HomeNews
    console.log(colors.info('Scanning HomeNews...'));
    const news = await HomeNews.find().limit(5);
    let newsUrls = { relative: 0, absolute: 0, images: 0, other: 0 };
    let newsExamples = [];
    
    news.forEach(newsItem => {
      const url = newsItem.imageUrl;
      if (url.startsWith('/uploads/')) {
        newsUrls.relative++;
      } else if (url.startsWith('/images/')) {
        newsUrls.images++;
        newsExamples.push({ section: 'HomeNews', title: newsItem.title, url });
      } else if (url.startsWith('http')) {
        newsUrls.absolute++;
        newsExamples.push({ section: 'HomeNews', title: newsItem.title, url });
      } else {
        newsUrls.other++;
        newsExamples.push({ section: 'HomeNews', title: newsItem.title, url });
      }
    });
    console.table(newsUrls);
    
    // Summary
    console.log(colors.section('SUMMARY'));
    console.log(colors.info('Collections Status:'));
    console.table({
      'Gallery': `${galleryUrls.relative} rel, ${galleryUrls.absolute} abs, ${galleryUrls.images} /images/`,
      'StudentLife': `${slUrls.relative} rel, ${slUrls.absolute} abs, ${slUrls.images} /images/`,
      'Events': `${eventUrls.relative} rel, ${eventUrls.absolute} abs, ${eventUrls.images} /images/`,
      'Staff': `${staffUrls.relative} rel, ${staffUrls.absolute} abs, ${staffUrls.images} /images/`,
      'HomeNews': `${newsUrls.relative} rel, ${newsUrls.absolute} abs, ${newsUrls.images} /images/`,
    });
    
    // Show bad examples
    if (galleryExamples.length > 0 || slExamples.length > 0 || eventExamples.length > 0) {
      console.log(colors.section('PROBLEM EXAMPLES'));
      [...galleryExamples, ...slExamples, ...eventExamples].slice(0, 5).forEach(ex => {
        console.log(`${colors.bad(`${ex.section}: ${ex.url}`)}`);
      });
    } else {
      console.log(colors.good('All URLs are in correct format /uploads/'));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error(colors.bad(`Database error: ${error.message}`));
    process.exit(1);
  }
}

diagnose();
