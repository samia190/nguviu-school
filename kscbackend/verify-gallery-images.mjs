#!/usr/bin/env node
/**
 * Gallery Image Verification Script
 * 
 * Tests all gallery images to ensure they load correctly after migration
 * 
 * Usage:
 *   node verify-gallery-images.mjs              # Test all images
 *   node verify-gallery-images.mjs --verbose    # Show detailed output
 *   node verify-gallery-images.mjs --cloudinary # Test only Cloudinary URLs
 * 
 * What it does:
 * 1. Connects to MongoDB
 * 2. Fetches all gallery items and attachments
 * 3. Tests each image URL with HTTP HEAD request
 * 4. Reports success/failure for each image
 * 5. Generates summary statistics
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  verbose: process.argv.includes('--verbose'),
  cloudinaryOnly: process.argv.includes('--cloudinary'),
  uploadsOnly: process.argv.includes('--uploads'),
  parallelRequests: 5,
  timeoutMs: 10000,
};

// ============================================================================
// STATE & STATS
// ============================================================================

let stats = {
  totalImages: 0,
  imagesOk: 0,
  imagesFailed: 0,
  imagesCloudinary: 0,
  imagesLocal: 0,
  bypassSSLErrors: 0,
  failures: [],
  startTime: Date.now(),
  endTime: null,
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  if (CONFIG.verbose || level !== 'debug') {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

function getUrlProtocol(url) {
  try {
    return new URL(url).protocol;
  } catch {
    return 'unknown';
  }
}

function isCloudinaryUrl(url) {
  return url && url.includes('cloudinary.com');
}

function isLocalUrl(url) {
  return url && (url.startsWith('/') || url.includes('localhost') || url.includes('127.0.0.1'));
}

// ============================================================================
// HTTP REQUESTS
// ============================================================================

function testImageUrl(url) {
  return new Promise((resolve) => {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      resolve({
        url,
        statusCode: 0,
        statusMessage: 'Invalid URL format',
        ok: false,
      });
      return;
    }

    // Skip local URLs (can't test from server)
    if (isLocalUrl(url)) {
      if (!CONFIG.uploadsOnly) {
        resolve({
          url,
          statusCode: 200,
          statusMessage: 'Local URL (skipped)',
          ok: true,
          skipped: true,
        });
      } else {
        resolve({
          url,
          statusCode: 0,
          statusMessage: 'Local URL',
          ok: false,
        });
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve({
        url,
        statusCode: 0,
        statusMessage: 'Timeout',
        ok: false,
      });
    }, CONFIG.timeoutMs);

    try {
      const protocol = getUrlProtocol(url) === 'https:' ? https : http;
      const request = protocol.head(url, { timeout: CONFIG.timeoutMs }, (res) => {
        clearTimeout(timeoutId);
        const ok = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          url,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          ok,
        });
      });

      request.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          url,
          statusCode: 0,
          statusMessage: error.message,
          ok: false,
        });
      });

      request.end();
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        url,
        statusCode: 0,
        statusMessage: error.message,
        ok: false,
      });
    }
  });
}

async function testImagesInParallel(urls, batchSize = CONFIG.parallelRequests) {
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((url) => testImageUrl(url)));
    results.push(...batchResults);

    // Log progress
    const progress = Math.min(i + batchSize, urls.length);
    log(`Progress: ${progress}/${urls.length} images tested`, 'debug');
  }

  return results;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function connectDatabase() {
  log('Connecting to MongoDB...');

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    log('✅ MongoDB connection established');
  } catch (error) {
    log('❌ MongoDB connection failed: ' + error.message, 'error');
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    log('✅ MongoDB disconnected');
  } catch (error) {
    log('❌ Failed to disconnect: ' + error.message, 'error');
  }
}

async function getGalleryImages() {
  try {
    const galleryItemSchema = new mongoose.Schema({}, { strict: false });
    const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema, 'galleryitems');

    const items = await GalleryItem.find({}).lean();

    const images = [];
    for (const item of items) {
      if (!item.attachments || !Array.isArray(item.attachments)) {
        continue;
      }

      for (const attachment of item.attachments) {
        if (attachment.url) {
          images.push({
            galleryId: item._id,
            galleryName: item.name,
            url: attachment.url,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          });
        }
      }
    }

    return images;
  } catch (error) {
    log('❌ Failed to fetch gallery images: ' + error.message, 'error');
    throw error;
  }
}

// ============================================================================
// VERIFICATION LOGIC
// ============================================================================

async function verifyGalleryImages() {
  log('Fetching gallery images from MongoDB...');

  const images = await getGalleryImages();
  log(`Found ${images.length} images in galleries\n`);

  // Filter by type if specified
  let filteredImages = images;
  if (CONFIG.cloudinaryOnly) {
    filteredImages = images.filter((img) => isCloudinaryUrl(img.url));
    log(`Filtered to ${filteredImages.length} Cloudinary images\n`);
  } else if (CONFIG.uploadsOnly) {
    filteredImages = images.filter((img) => !isCloudinaryUrl(img.url) && !isLocalUrl(img.url));
    log(`Filtered to ${filteredImages.length} non-Cloudinary images\n`);
  }

  if (filteredImages.length === 0) {
    log('No images to test based on filters', 'warning');
    return;
  }

  stats.totalImages = filteredImages.length;

  // Extract URLs
  const urls = filteredImages.map((img) => img.url);

  // Test in parallel
  log(`Testing ${urls.length} image URLs...\n`);
  const results = await testImagesInParallel(urls);

  // Process results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const image = filteredImages[i];

    if (result.skipped) {
      log(`⊘ SKIP: ${image.url}`, 'debug');
      stats.imagesOk++;
      continue;
    }

    if (result.ok) {
      log(`✅ OK (${result.statusCode}): ${result.url}`, 'debug');

      if (isCloudinaryUrl(image.url)) {
        stats.imagesCloudinary++;
      } else {
        stats.imagesLocal++;
      }

      stats.imagesOk++;
    } else {
      log(`❌ FAIL (${result.statusCode}): ${result.url}`, 'warning');

      stats.imagesFailed++;
      stats.failures.push({
        url: result.url,
        gallery: image.galleryName,
        fileName: image.fileName,
        statusCode: result.statusCode,
        message: result.statusMessage,
      });
    }
  }
}

// ============================================================================
// REPORTING
// ============================================================================

async function generateReport() {
  stats.endTime = Date.now();
  const duration = (stats.endTime - stats.startTime) / 1000;
  const successRate =
    stats.totalImages > 0 ? Math.round((stats.imagesOk / stats.totalImages) * 100) : 0;

  const report = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   GALLERY IMAGE VERIFICATION REPORT                       ║
╚════════════════════════════════════════════════════════════════════════════╝

⏱️  VERIFICATION SUMMARY
────────────────────────────────────────────────────────────────────────────
Duration:         ${Math.round(duration)}s
Timestamp:        ${new Date(stats.startTime).toISOString()}
Filters Applied:  ${CONFIG.cloudinaryOnly ? 'Cloudinary only' : CONFIG.uploadsOnly ? 'Non-Cloudinary only' : 'All images'}

📊 RESULTS
────────────────────────────────────────────────────────────────────────────
Total Images:     ${stats.totalImages}
Images OK:        ${stats.imagesOk} ✅
Images Failed:    ${stats.imagesFailed} ❌
Success Rate:     ${successRate}%

📍 URL BREAKDOWN
────────────────────────────────────────────────────────────────────────────
Cloudinary URLs:  ${stats.imagesCloudinary}
Local/Other URLs: ${stats.imagesLocal}
Skipped (Local):  ${stats.totalImages - stats.imagesCloudinary - stats.imagesLocal}

${
  stats.imagesFailed > 0
    ? `
❌ FAILED IMAGES
────────────────────────────────────────────────────────────────────────────
${stats.failures
  .slice(0, 20)
  .map(
    (f) =>
      `  • ${f.fileName || 'unknown'} (${f.statusCode} ${f.message})\n    Gallery: ${f.gallery}\n    URL: ${f.url}`
  )
  .join('\n\n')}
${stats.failures.length > 20 ? `\n... and ${stats.failures.length - 20} more failures` : ''}
`
    : `
✅ ALL IMAGES VERIFIED
────────────────────────────────────────────────────────────────────────────
All ${stats.totalImages} images loaded successfully!
`
}

🎯 VERIFICATION STATUS
────────────────────────────────────────────────────────────────────────────
${
  stats.imagesFailed === 0 && stats.imagesOk > 0
    ? `✨ VERIFICATION SUCCESSFUL! All images accessible.`
    : stats.imagesFailed === 0
      ? `⚠️  No images to verify.`
      : `❌ Some images failed to load. Review failures above.`
}

📞 NEXT STEPS
────────────────────────────────────────────────────────────────────────────
${
  stats.imagesFailed === 0 && stats.imagesOk > 0
    ? `
1. ✅ Gallery images verified successfully
2. Safe to delete /uploads/ directory backup
3. Monitor Cloudinary bandwidth in coming weeks
`
    : `
1. Review failed images above
2. Check Cloudinary settings and API keys
3. Verify MongoDB URLs were updated correctly
4. Re-run this script after fixing issues
`
}
`;

  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('\n🔍 Starting Gallery Image Verification...\n');

    await connectDatabase();
    await verifyGalleryImages();

    const report = await generateReport();
    console.log(report);

    await disconnectDatabase();

    console.log('\n✅ Verification completed\n');

    process.exit(stats.imagesFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    try {
      await disconnectDatabase();
    } catch {}
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
