/**
 * seed-cloudinary.mjs
 * 
 * Uploads images from kscfrontend/public/images/ to Cloudinary,
 * then seeds the deployed backend API with database records for:
 *   - Hero Content (carousel slides)
 *   - Events
 *   - Student Life
 *   - Gallery (all images)
 *
 * This script works from ANY network — no direct MongoDB connection needed.
 * It uses:
 *   1. Cloudinary SDK (HTTPS) to upload images
 *   2. Backend REST API (HTTPS) to create DB records
 *
 * Setup:
 *   1. Create free Cloudinary account: https://cloudinary.com/users/register/free
 *   2. Add to .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   3. Run: node seed-cloudinary.mjs
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// ── Configuration ───────────────────────────────────────────
const API_BASE = process.env.PUBLIC_ORIGIN || "https://kangarugirlsschool.onrender.com";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "kangaruAD567MIN@9812";
const FRONTEND_IMAGES = path.join(process.cwd(), "..", "kscfrontend", "public", "images");
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "kangaru";

// ── Validate Cloudinary config ──────────────────────────────
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Cloudinary credentials not found in .env");
  console.log("\n📋 Add these to your .env file:");
  console.log("   CLOUDINARY_CLOUD_NAME=your_cloud_name");
  console.log("   CLOUDINARY_API_KEY=your_api_key");
  console.log("   CLOUDINARY_API_SECRET=your_api_secret");
  console.log("\n🆓 Get free credentials at: https://cloudinary.com/users/register/free");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Get all unique images ───────────────────────────────────
function getImageFiles() {
  return fs.readdirSync(FRONTEND_IMAGES)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .filter(f => !f.includes(" (1)"))
    .sort();
}

// ── Upload one image to Cloudinary ──────────────────────────
async function uploadToCloudinary(filename) {
  const filePath = path.join(FRONTEND_IMAGES, filename);
  const safeName = filename.replace(/\s+/g, "_").replace(/\.[^.]+$/, "");

  const result = await cloudinary.uploader.upload(filePath, {
    folder: CLOUDINARY_FOLDER,
    public_id: safeName,
    overwrite: true,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    originalName: filename,
    size: result.bytes,
    mimetype: `image/${result.format}`,
  };
}

// ── API helpers ─────────────────────────────────────────────
let authToken = null;

async function apiLogin() {
  console.log(`\n🔐 Logging into API as ${ADMIN_EMAIL}...`);
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  authToken = data.token;
  console.log(`  ✅ Logged in as ${data.user?.name || ADMIN_EMAIL} (${data.user?.role})`);
}

async function apiPost(endpoint, body, useAuth = false) {
  const headers = { "Content-Type": "application/json" };
  if (useAuth && authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`GET ${endpoint} failed (${res.status})`);
  return res.json();
}

async function apiDelete(endpoint) {
  const headers = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE", headers });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠️  DELETE ${endpoint}: ${res.status} ${text}`);
  }
}

// ── Distribute images ───────────────────────────────────────
function distributeImages(images) {
  const total = images.length;
  const heroIndices = [0, 10, 20, 35, 50];
  const hero = heroIndices.filter(i => i < total).map(i => images[i]);
  const eventIndices = [2, 8, 15, 22, 30, 40, 55, 60];
  const events = eventIndices.filter(i => i < total).map(i => images[i]);
  const slIndices = [3, 5, 7, 12, 14, 18, 25, 28, 33, 38, 45, 48];
  const studentLife = slIndices.filter(i => i < total).map(i => images[i]);
  const gallery = images;
  return { hero, events, studentLife, gallery };
}

// ── Upload batch to Cloudinary ──────────────────────────────
async function uploadBatch(filenames, label) {
  console.log(`\n☁️  Uploading ${filenames.length} images for ${label}...`);
  const results = [];
  for (let i = 0; i < filenames.length; i++) {
    try {
      const result = await uploadToCloudinary(filenames[i]);
      results.push(result);
      console.log(`  📤 ${i + 1}/${filenames.length}: ${filenames[i]}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${filenames[i]} — ${err.message}`);
    }
  }
  return results;
}

// ── Seed Hero Content via API ───────────────────────────────
async function seedHero(files) {
  console.log("\n🖼️  Seeding Hero Content...");

  // Delete existing hero content for home page
  try {
    const existing = await apiGet("/api/hero-content?page=home");
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`  🗑️  Removing ${existing.length} existing hero items...`);
      for (const item of existing) {
        await apiDelete(`/api/hero-content/${item._id}`);
      }
    }
  } catch (err) {
    console.warn("  ⚠️  Could not fetch/delete existing hero:", err.message);
  }

  const uploaded = await uploadBatch(files, "Hero");

  const titles = [
    "Welcome to Kangaru Girls School",
    "Excellence in Education",
    "Nurturing Future Leaders",
    "A Community of Achievers",
    "Building Tomorrow Today",
  ];
  const descriptions = [
    "A premier girls' secondary school committed to academic excellence and holistic development.",
    "Empowering young women through quality education, innovation, and character development.",
    "Our students excel in academics, sports, and extracurricular activities.",
    "Join a vibrant community where every girl's potential is unlocked.",
    "Preparing students for the challenges and opportunities of the future.",
  ];

  // Hero POST requires multipart (file upload), but we already have Cloudinary URLs.
  // We need to create records with the Cloudinary URL already set.
  // The heroContent POST requires a file upload, so we'll use a workaround:
  // Upload the file from Cloudinary URL as a buffer, or directly set via API.
  // Since the hero route requires a file, we'll send the image buffer.
  for (let i = 0; i < uploaded.length; i++) {
    const img = uploaded[i];
    const imgPath = path.join(FRONTEND_IMAGES, files[i]);
    const buffer = fs.readFileSync(imgPath);
    const blob = new Blob([buffer], { type: img.mimetype });

    const formData = new FormData();
    formData.append("media", blob, files[i]);
    formData.append("type", "slide");
    formData.append("page", "home");
    formData.append("title", titles[i] || `School Life ${i + 1}`);
    formData.append("description", descriptions[i] || "");
    formData.append("displayOrder", String(i));

    try {
      const res = await fetch(`${API_BASE}/api/hero-content`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`  ❌ Hero slide ${i + 1} failed: ${text}`);
      } else {
        console.log(`  ✨ Hero slide ${i + 1}: "${titles[i]}"`);
      }
    } catch (err) {
      console.error(`  ❌ Hero slide ${i + 1} error: ${err.message}`);
    }
  }

  console.log(`  ✅ ${uploaded.length} hero slides created`);
}

// ── Seed Events via API ─────────────────────────────────────
async function seedEvents(files) {
  console.log("\n📅 Seeding Events...");

  const existing = await apiGet("/api/events");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`  ⏭️  Skipping — ${existing.length} events already exist.`);
    return;
  }

  const uploaded = await uploadBatch(files, "Events");

  const eventData = [
    { title: "Annual Sports Day", description: "An exciting day of athletic competitions, track events, and team sports.", location: "School Grounds", featured: true },
    { title: "Science Fair 2026", description: "Students present innovative science projects and experiments.", location: "School Hall", featured: true },
    { title: "Cultural Day Celebrations", description: "A vibrant celebration of Kenya's diverse cultures through music, dance, and art.", location: "School Amphitheatre", featured: false },
    { title: "Academic Awards Ceremony", description: "Recognizing and celebrating academic excellence with awards and scholarships.", location: "Main Hall", featured: true },
    { title: "Music Festival Preparations", description: "Students rehearse for the regional music festival — choir, instruments, and drama.", location: "Music Room", featured: false },
    { title: "Environmental Day", description: "Tree planting, clean-up activities, and environmental awareness campaigns.", location: "School Campus", featured: false },
    { title: "Career Day", description: "Professionals share career insights and mentor students on future opportunities.", location: "School Hall", featured: true },
    { title: "Open Day & Parents Meeting", description: "Parents visit to meet teachers, view student work, and discuss progress.", location: "Classrooms", featured: false },
  ];

  for (let i = 0; i < uploaded.length && i < eventData.length; i++) {
    const img = uploaded[i];
    const d = eventData[i];

    const date = new Date();
    date.setDate(date.getDate() + (i * 15) + 7);

    try {
      await apiPost("/api/events", {
        title: d.title,
        description: d.description,
        date: date.toISOString(),
        location: d.location,
        imageUrl: img.url,
        imageAlt: d.title,
        featured: d.featured,
        displayOrder: i,
      }, true);
      console.log(`  📌 Event ${i + 1}: "${d.title}"`);
    } catch (err) {
      console.error(`  ❌ Event ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`  ✅ ${Math.min(uploaded.length, eventData.length)} events created`);
}

// ── Seed Student Life via API ───────────────────────────────
async function seedStudentLife(files) {
  console.log("\n🎓 Seeding Student Life...");

  const existing = await apiGet("/api/student-life");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`  ⏭️  Skipping — ${existing.length} student life items already exist.`);
    return;
  }

  const uploaded = await uploadBatch(files, "Student Life");

  const slData = [
    { title: "Athletics & Track", description: "Our athletes compete at regional and national levels.", category: "sports", featured: true },
    { title: "Basketball Team", description: "The basketball team trains and competes in inter-school tournaments.", category: "sports", featured: false },
    { title: "Volleyball League", description: "Volleyball players demonstrate teamwork in county leagues.", category: "sports", featured: true },
    { title: "Science Club", description: "Students explore STEM through hands-on experiments and robotics.", category: "clubs", featured: true },
    { title: "Drama & Theatre", description: "The drama club performs plays, skits, and poetry recitals.", category: "clubs", featured: false },
    { title: "Debate Society", description: "Students sharpen public speaking and critical thinking skills.", category: "clubs", featured: true },
    { title: "Community Service", description: "Students engage in outreach programs and support local communities.", category: "activities", featured: false },
    { title: "Library & Reading Culture", description: "Our library fosters reading with book clubs and challenges.", category: "activities", featured: false },
    { title: "Art & Craft Workshop", description: "Creative arts exploring painting, sculpture, and digital design.", category: "activities", featured: true },
    { title: "Founders Day Celebration", description: "Annual tradition celebrating the school's founding with alumni.", category: "traditions", featured: true },
    { title: "Prize Giving Day", description: "A tradition recognizing academic and co-curricular achievements.", category: "traditions", featured: false },
    { title: "Mentorship Programme", description: "Senior students mentor Form 1 newcomers into school life.", category: "traditions", featured: false },
  ];

  for (let i = 0; i < uploaded.length && i < slData.length; i++) {
    const img = uploaded[i];
    const d = slData[i];

    try {
      await apiPost("/api/student-life", {
        title: d.title,
        description: d.description,
        category: d.category,
        imageUrl: img.url,
        imageAlt: d.title,
        featured: d.featured,
        displayOrder: i,
      }, true);
      console.log(`  🏷️  ${d.category}: "${d.title}"`);
    } catch (err) {
      console.error(`  ❌ ${d.title} failed: ${err.message}`);
    }
  }

  console.log(`  ✅ ${Math.min(uploaded.length, slData.length)} student life items created`);
}

// ── Seed Gallery via API ────────────────────────────────────
async function seedGallery(files) {
  console.log("\n🖼️  Seeding Gallery...");

  const existing = await apiGet("/api/content/gallery");
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`  ⏭️  Skipping — ${existing.length} gallery items already exist.`);
    return;
  }

  const sections = [
    { title: "School Facilities & Campus", body: "A tour of our beautiful campus, modern classrooms, and serene grounds." },
    { title: "Academic Activities", body: "Students engaged in learning — classrooms, laboratories, and competitions." },
    { title: "Sports & Athletics", body: "Highlights from sports events, athletic competitions, and PE activities." },
    { title: "Cultural Events & Celebrations", body: "Moments from cultural days, music festivals, and school celebrations." },
    { title: "School Community", body: "The heart of Kangaru Girls School — students, staff, and community." },
    { title: "Co-curricular Activities", body: "Clubs, societies, community service, and enrichment activities." },
  ];

  const chunkSize = Math.ceil(files.length / sections.length);

  for (let s = 0; s < sections.length; s++) {
    const sectionFiles = files.slice(s * chunkSize, (s + 1) * chunkSize);
    if (sectionFiles.length === 0) continue;

    // Step 1: Create the gallery item
    let galleryItem;
    try {
      const result = await apiPost("/api/content/gallery", {
        title: sections[s].title,
        body: sections[s].body,
      });
      galleryItem = result.item || result;
    } catch (err) {
      console.error(`  ❌ Gallery section "${sections[s].title}" failed: ${err.message}`);
      continue;
    }

    // Step 2: Upload images as attachments
    console.log(`  📂 Gallery: "${sections[s].title}" — uploading ${sectionFiles.length} images...`);
    
    // Upload to Cloudinary first, then PATCH the gallery item with attachment data
    const attachments = [];
    for (const filename of sectionFiles) {
      try {
        const img = await uploadToCloudinary(filename);
        attachments.push({
          originalName: img.originalName,
          filename: img.public_id,
          url: img.url,
          mimetype: img.mimetype,
          size: img.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`    ❌ ${filename}: ${err.message}`);
      }
    }

    // PATCH the gallery item to set attachments directly
    if (attachments.length > 0) {
      try {
        const headers = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        const res = await fetch(`${API_BASE}/api/content/gallery/${galleryItem._id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ attachments }),
        });
        if (!res.ok) {
          console.error(`    ❌ PATCH failed: ${await res.text()}`);
        } else {
          console.log(`    ✅ ${attachments.length} images added`);
        }
      } catch (err) {
        console.error(`    ❌ PATCH error: ${err.message}`);
      }
    }
  }

  console.log(`  ✅ ${sections.length} gallery sections created`);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Kangaru Girls School — Cloudinary Seeder");
  console.log("═══════════════════════════════════════════");

  // Check source folder
  if (!fs.existsSync(FRONTEND_IMAGES)) {
    console.error(`❌ Source folder not found: ${FRONTEND_IMAGES}`);
    process.exit(1);
  }

  const allFiles = getImageFiles();
  console.log(`\n📸 Found ${allFiles.length} unique images`);

  if (allFiles.length === 0) {
    console.error("❌ No images found!");
    process.exit(1);
  }

  // Test Cloudinary connection
  console.log("\n☁️  Testing Cloudinary connection...");
  try {
    const pingResult = await cloudinary.api.ping();
    console.log("  ✅ Cloudinary connected:", pingResult.status);
  } catch (err) {
    console.error("  ❌ Cloudinary connection failed:", err.message);
    process.exit(1);
  }

  // Test API connection
  console.log(`\n🌐 Testing API at ${API_BASE}...`);
  try {
    const res = await fetch(`${API_BASE}/api/hero-content?page=home`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("  ✅ API reachable");
  } catch (err) {
    console.error(`  ❌ API unreachable: ${err.message}`);
    console.log("  💡 Make sure the backend is deployed and running on Render");
    process.exit(1);
  }

  // Login for auth-protected routes (events, student-life)
  await apiLogin();

  // Distribute images
  const dist = distributeImages(allFiles);
  console.log(`\n📊 Distribution plan:`);
  console.log(`   Hero slides:   ${dist.hero.length} images`);
  console.log(`   Events:        ${dist.events.length} images`);
  console.log(`   Student Life:  ${dist.studentLife.length} images`);
  console.log(`   Gallery:       ${dist.gallery.length} images (all)`);

  // Seed each section
  await seedHero(dist.hero);
  await seedEvents(dist.events);
  await seedStudentLife(dist.studentLife);
  await seedGallery(dist.gallery);

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ Seeding complete!");
  console.log("═══════════════════════════════════════════");
  console.log("\n📋 Benefits of Cloudinary storage:");
  console.log("   ✅ Images persist forever (survive Render redeployments)");
  console.log("   ✅ Admin panel uploads also go to Cloudinary");
  console.log("   ✅ Automatic image optimization & CDN delivery");
  console.log("   ✅ No more image loss!");
  console.log("\n📋 Next steps:");
  console.log("   1. Visit your site to verify images display correctly");
  console.log("   2. Use admin dashboard to manage all content");
  console.log("   3. Add CLOUDINARY_* vars to Render environment too!");
  console.log("      (Settings → Environment → add the 3 Cloudinary vars)\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
