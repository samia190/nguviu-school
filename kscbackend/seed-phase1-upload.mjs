/**
 * PHASE 1: Upload all images to Cloudinary
 * 
 * This runs offline — no MongoDB or backend API needed.
 * Images are uploaded via HTTPS (port 443) to Cloudinary CDN.
 * Results saved to cloudinary-urls.json for Phase 2 (DB seeding).
 * 
 * Run: node seed-phase1-upload.mjs
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const FRONTEND_IMAGES = path.join(process.cwd(), "..", "kscfrontend", "public", "images");
const OUTPUT_FILE = path.join(process.cwd(), "cloudinary-urls.json");
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "kangaru";

// ── Validate ────────────────────────────────────────────────
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Missing Cloudinary credentials in .env");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Get image files ─────────────────────────────────────────
function getImageFiles() {
  return fs.readdirSync(FRONTEND_IMAGES)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .filter(f => !f.includes(" (1)"))
    .sort();
}

// ── Upload one image ────────────────────────────────────────
async function upload(filename) {
  const filePath = path.join(FRONTEND_IMAGES, filename);
  const safeName = filename.replace(/\s+/g, "_").replace(/\.[^.]+$/, "");

  const result = await cloudinary.uploader.upload(filePath, {
    folder: CLOUDINARY_FOLDER,
    public_id: safeName,
    overwrite: true,
    resource_type: "image",
  });

  return {
    originalName: filename,
    url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    mimetype: `image/${result.format}`,
  };
}

// ── Distribute images to sections ───────────────────────────
function distribute(images) {
  const total = images.length;

  const heroIndices = [0, 10, 20, 35, 50].filter(i => i < total);
  const eventIndices = [2, 8, 15, 22, 30, 40, 55, 60].filter(i => i < total);
  const slIndices = [3, 5, 7, 12, 14, 18, 25, 28, 33, 38, 45, 48].filter(i => i < total);

  return {
    hero: heroIndices.map(i => images[i]),
    events: eventIndices.map(i => images[i]),
    studentLife: slIndices.map(i => images[i]),
    gallery: images, // all images
  };
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Phase 1: Upload Images to Cloudinary");
  console.log("═══════════════════════════════════════════════");

  // Check source folder
  if (!fs.existsSync(FRONTEND_IMAGES)) {
    console.error(`❌ Source folder not found: ${FRONTEND_IMAGES}`);
    process.exit(1);
  }

  const allFiles = getImageFiles();
  console.log(`\n📸 Found ${allFiles.length} unique images in kscfrontend/public/images/`);

  if (allFiles.length === 0) {
    console.error("❌ No images found!");
    process.exit(1);
  }

  // Test Cloudinary
  console.log("\n☁️  Testing Cloudinary connection...");
  try {
    const ping = await cloudinary.api.ping();
    console.log(`  ✅ Connected to cloud: ${process.env.CLOUDINARY_CLOUD_NAME} (${ping.status})`);
  } catch (err) {
    console.error(`  ❌ Cloudinary failed: ${err.message}`);
    process.exit(1);
  }

  // Check for existing upload results (resume support)
  let uploaded = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
      if (existing.images) {
        uploaded = Object.fromEntries(existing.images.map(img => [img.originalName, img]));
        console.log(`\n📋 Found ${Object.keys(uploaded).length} previously uploaded images (will skip)`);
      }
    } catch (e) {
      console.warn("⚠️  Could not parse existing cloudinary-urls.json, starting fresh");
    }
  }

  // Upload all images
  console.log(`\n☁️  Uploading ${allFiles.length} images to Cloudinary...\n`);
  const results = [];
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const filename = allFiles[i];

    // Skip already uploaded
    if (uploaded[filename]) {
      results.push(uploaded[filename]);
      skipped++;
      console.log(`  ⏭️  ${i + 1}/${allFiles.length}: ${filename} (already uploaded)`);
      continue;
    }

    try {
      const result = await upload(filename);
      results.push(result);
      console.log(`  📤 ${i + 1}/${allFiles.length}: ${filename} → ${result.url.split('/').pop()}`);

      // Save progress every 5 images (resume support)
      if ((i + 1) % 5 === 0) {
        saveResults(results, allFiles);
      }
    } catch (err) {
      console.error(`  ❌ ${i + 1}/${allFiles.length}: ${filename} — ${err.message}`);
      failed++;
    }
  }

  // Save final results
  saveResults(results, allFiles);

  // Summary
  console.log("\n═══════════════════════════════════════════════");
  console.log(`  ✅ Phase 1 Complete!`);
  console.log(`  📤 Uploaded: ${results.length - skipped} new`);
  if (skipped > 0) console.log(`  ⏭️  Skipped:  ${skipped} (already uploaded)`);
  if (failed > 0) console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  📁 Total:    ${results.length} images in Cloudinary`);
  console.log(`  💾 URLs saved to: cloudinary-urls.json`);
  console.log("═══════════════════════════════════════════════");

  // Distribution preview
  const dist = distribute(results);
  console.log("\n📊 Distribution plan for Phase 2:");
  console.log(`   Hero slides:   ${dist.hero.length}`);
  console.log(`   Events:        ${dist.events.length}`);
  console.log(`   Student Life:  ${dist.studentLife.length}`);
  console.log(`   Gallery:       ${dist.gallery.length} (all images)`);

  console.log("\n📋 Next step:");
  console.log("   Run Phase 2 when backend API is available:");
  console.log("   node seed-phase2-db.mjs");
  console.log("");
}

function saveResults(results, allFiles) {
  const dist = distribute(results);

  const output = {
    uploadedAt: new Date().toISOString(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: CLOUDINARY_FOLDER,
    totalImages: results.length,
    images: results,
    distribution: {
      hero: dist.hero.map(img => img.url),
      events: dist.events.map(img => img.url),
      studentLife: dist.studentLife.map(img => img.url),
      gallery: dist.gallery.map(img => img.url),
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
