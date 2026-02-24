/**
 * seed-images.mjs
 * 
 * Copies images from kscfrontend/public/images/ → kscbackend/public/uploads/
 * then seeds MongoDB with records for:
 *   - Hero Content (carousel slides)
 *   - Events
 *   - Student Life
 *   - Gallery (all images)
 *
 * Run: node seed-images.mjs
 * 
 * All images are stored as relative paths (/uploads/<filename>).
 * The backend's toAbsoluteUrl() will convert them for API responses.
 * Everything is manageable via admin dashboards after seeding.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// ── Models ──────────────────────────────────────────────────
import HeroContent from "./models/HeroContent.js";
import Event from "./models/Event.js";
import StudentLife from "./models/StudentLife.js";
import GalleryItem from "./models/GalleryItem.js";

// ── Paths ───────────────────────────────────────────────────
const FRONTEND_IMAGES = path.join(process.cwd(), "..", "kscfrontend", "public", "images");
const BACKEND_UPLOADS = path.join(process.cwd(), "public", "uploads");

// Ensure uploads dir exists
if (!fs.existsSync(BACKEND_UPLOADS)) fs.mkdirSync(BACKEND_UPLOADS, { recursive: true });

// ── Get all unique jpg/png images (skip duplicates with " (1)" in name) ─
function getImageFiles() {
  const files = fs.readdirSync(FRONTEND_IMAGES)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .filter(f => !f.includes(" (1)")) // skip duplicate copies
    .sort();
  return files;
}

// ── Copy image to backend uploads and return relative URL ──
function copyImage(filename) {
  const src = path.join(FRONTEND_IMAGES, filename);
  // Sanitize filename: replace spaces with hyphens
  const safe = filename.replace(/\s+/g, "-");
  const dest = path.join(BACKEND_UPLOADS, safe);
  
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`  📁 Copied: ${filename} → uploads/${safe}`);
  } else {
    console.log(`  ✅ Exists: uploads/${safe}`);
  }
  
  return {
    url: `/uploads/${safe}`,
    filename: safe,
    originalName: filename,
    size: fs.statSync(src).size,
    mimetype: filename.endsWith(".PNG") ? "image/png" : "image/jpeg",
  };
}

// ── Assign images to categories based on order ──
// We'll distribute the unique images across sections meaningfully
function distributeImages(images) {
  // Pick specific images for each section based on the set
  const total = images.length;
  
  // Hero slides: 5 strong/varied images
  const heroIndices = [0, 10, 20, 35, 50];
  const hero = heroIndices
    .filter(i => i < total)
    .map(i => images[i]);
  
  // Events: 8 images
  const eventIndices = [2, 8, 15, 22, 30, 40, 55, 60];
  const events = eventIndices
    .filter(i => i < total)
    .map(i => images[i]);
  
  // Student Life: 12 images across categories  
  const slIndices = [3, 5, 7, 12, 14, 18, 25, 28, 33, 38, 45, 48];
  const studentLife = slIndices
    .filter(i => i < total)
    .map(i => images[i]);
  
  // Gallery: ALL images
  const gallery = images;
  
  return { hero, events, studentLife, gallery };
}

// ── Seed Hero Content ───────────────────────────────────────
async function seedHero(images) {
  console.log("\n🖼️  Seeding Hero Content...");
  
  // Clear existing hero content for home page
  await HeroContent.deleteMany({ page: "home" });
  
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
  
  for (let i = 0; i < images.length; i++) {
    const img = copyImage(images[i]);
    await HeroContent.create({
      type: "slide",
      page: "home",
      title: titles[i] || `School Life ${i + 1}`,
      description: descriptions[i] || "",
      url: img.url,
      displayOrder: i,
      active: true,
      originalName: img.originalName,
      size: img.size,
      mimetype: img.mimetype,
    });
    console.log(`  ✨ Hero slide ${i + 1}: "${titles[i]}"`);
  }
  
  console.log(`  ✅ ${images.length} hero slides created`);
}

// ── Seed Events ─────────────────────────────────────────────
async function seedEvents(images) {
  console.log("\n📅 Seeding Events...");
  
  // Don't delete existing — let admin manage. Only add if empty.
  const existing = await Event.countDocuments();
  if (existing > 0) {
    console.log(`  ⏭️  Skipping — ${existing} events already exist. Manage via admin dashboard.`);
    return;
  }
  
  const eventData = [
    { title: "Annual Sports Day", description: "An exciting day of athletic competitions, track events, and team sports. Students showcase their sporting talents and school spirit.", location: "School Grounds", featured: true },
    { title: "Science Fair 2026", description: "Students present innovative science projects and experiments. A celebration of curiosity, research, and scientific discovery.", location: "School Hall", featured: true },
    { title: "Cultural Day Celebrations", description: "A vibrant celebration of Kenya's diverse cultures through music, dance, traditional food, and art exhibitions.", location: "School Amphitheatre", featured: false },
    { title: "Academic Awards Ceremony", description: "Recognizing and celebrating academic excellence. Top students receive awards and scholarships for outstanding performance.", location: "Main Hall", featured: true },
    { title: "Music Festival Preparations", description: "Students rehearse and prepare for the regional music festival, showcasing choir, instrumental, and drama performances.", location: "Music Room", featured: false },
    { title: "Environmental Day", description: "Tree planting, clean-up activities, and environmental awareness campaigns led by our eco-club members.", location: "School Campus", featured: false },
    { title: "Career Day", description: "Professionals from various fields share career insights and mentor students on future career paths and opportunities.", location: "School Hall", featured: true },
    { title: "Open Day & Parents Meeting", description: "Parents visit the school to meet teachers, view student work, and discuss academic progress and school developments.", location: "Classrooms", featured: false },
  ];
  
  for (let i = 0; i < images.length && i < eventData.length; i++) {
    const img = copyImage(images[i]);
    const d = eventData[i];
    
    // Create dates spread over the next few months
    const date = new Date();
    date.setDate(date.getDate() + (i * 15) + 7); // space events ~15 days apart
    
    await Event.create({
      title: d.title,
      description: d.description,
      date,
      location: d.location,
      imageUrl: img.url,
      imageAlt: d.title,
      featured: d.featured,
      displayOrder: i,
      active: true,
      originalName: img.originalName,
    });
    console.log(`  📌 Event ${i + 1}: "${d.title}"`);
  }
  
  console.log(`  ✅ ${Math.min(images.length, eventData.length)} events created`);
}

// ── Seed Student Life ───────────────────────────────────────
async function seedStudentLife(images) {
  console.log("\n🎓 Seeding Student Life...");
  
  const existing = await StudentLife.countDocuments();
  if (existing > 0) {
    console.log(`  ⏭️  Skipping — ${existing} student life items already exist. Manage via admin dashboard.`);
    return;
  }
  
  const slData = [
    { title: "Athletics & Track", description: "Our athletes compete at regional and national levels in track and field events, bringing pride to the school.", category: "sports", featured: true },
    { title: "Basketball Team", description: "The school basketball team trains regularly and participates in inter-school tournaments.", category: "sports", featured: false },
    { title: "Volleyball League", description: "Our volleyball players demonstrate teamwork and skill in competitive county leagues.", category: "sports", featured: true },
    { title: "Science Club", description: "Students explore STEM through hands-on experiments, robotics, and innovative projects.", category: "clubs", featured: true },
    { title: "Drama & Theatre", description: "The drama club performs plays, skits, and poetry recitals. A space for creative expression.", category: "clubs", featured: false },
    { title: "Debate Society", description: "Students sharpen public speaking, critical thinking, and argumentation skills through regular debates.", category: "clubs", featured: true },
    { title: "Community Service", description: "Students engage in outreach programs, mentoring younger students, and supporting local communities.", category: "activities", featured: false },
    { title: "Library & Reading Culture", description: "Our well-stocked library fosters a love for reading. Book clubs and reading challenges are held regularly.", category: "activities", featured: false },
    { title: "Art & Craft Workshop", description: "Creative arts sessions where students explore painting, sculpture, textile art, and digital design.", category: "activities", featured: true },
    { title: "Founders Day Celebration", description: "An annual tradition celebrating the school's founding, with alumni speeches, performances, and fellowship.", category: "traditions", featured: true },
    { title: "Prize Giving Day", description: "A cherished tradition where academic and co-curricular achievements are recognized and celebrated.", category: "traditions", featured: false },
    { title: "Mentorship Programme", description: "Senior students mentor Form 1 newcomers, helping them settle into school life and academics.", category: "traditions", featured: false },
  ];
  
  for (let i = 0; i < images.length && i < slData.length; i++) {
    const img = copyImage(images[i]);
    const d = slData[i];
    
    await StudentLife.create({
      title: d.title,
      description: d.description,
      category: d.category,
      imageUrl: img.url,
      imageAlt: d.title,
      featured: d.featured,
      displayOrder: i,
      active: true,
      originalName: img.originalName,
    });
    console.log(`  🏷️  ${d.category}: "${d.title}"`);
  }
  
  console.log(`  ✅ ${Math.min(images.length, slData.length)} student life items created`);
}

// ── Seed Gallery ────────────────────────────────────────────
async function seedGallery(images) {
  console.log("\n🖼️  Seeding Gallery...");
  
  const existing = await GalleryItem.countDocuments();
  if (existing > 0) {
    console.log(`  ⏭️  Skipping — ${existing} gallery items already exist. Manage via admin dashboard.`);
    return;
  }
  
  // Organize into gallery sections of ~8-12 images each
  const sections = [
    { title: "School Facilities & Campus", body: "A tour of our beautiful campus, modern classrooms, well-equipped laboratories, and serene grounds." },
    { title: "Academic Activities", body: "Students engaged in learning — classrooms, laboratories, library sessions, and academic competitions." },
    { title: "Sports & Athletics", body: "Highlights from sports events, athletic competitions, and physical education activities." },
    { title: "Cultural Events & Celebrations", body: "Moments from cultural days, music festivals, drama performances, and school celebrations." },
    { title: "School Community", body: "The heart of Kangaru Girls School — students, staff, and the vibrant community that makes us special." },
    { title: "Co-curricular Activities", body: "Clubs, societies, community service, and all the activities that enrich the student experience." },
  ];
  
  const chunkSize = Math.ceil(images.length / sections.length);
  
  for (let s = 0; s < sections.length; s++) {
    const sectionImages = images.slice(s * chunkSize, (s + 1) * chunkSize);
    if (sectionImages.length === 0) continue;
    
    // Copy images and build attachments
    const attachments = sectionImages.map(imgFile => {
      const img = copyImage(imgFile);
      return {
        originalName: img.originalName,
        filename: img.filename,
        url: img.url,
        mimetype: img.mimetype,
        size: img.size,
        uploadedAt: new Date(),
      };
    });
    
    await GalleryItem.create({
      title: sections[s].title,
      body: sections[s].body,
      attachments,
    });
    
    console.log(`  📂 Gallery section: "${sections[s].title}" (${attachments.length} images)`);
  }
  
  console.log(`  ✅ ${sections.length} gallery sections with ${images.length} total images created`);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Kangaru Girls School — Image Seeder");
  console.log("═══════════════════════════════════════════");
  
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
  
  // Connect to MongoDB
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI not set in .env");
    process.exit(1);
  }
  
  console.log("\n🔗 Connecting to MongoDB...");
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("\n💡 Make sure your IP is whitelisted in MongoDB Atlas:");
    console.log("   https://cloud.mongodb.com → Network Access → Add IP Address");
    process.exit(1);
  }
  
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
  console.log("\n📋 Next steps:");
  console.log("   1. Start backend: cd kscbackend && npm run dev");
  console.log("   2. Start frontend: cd kscfrontend && npm run dev");
  console.log("   3. Visit admin dashboard to manage all content");
  console.log("   4. Hero slides, events, student life items,");
  console.log("      and gallery sections are all editable/deletable");
  console.log("      from the admin panel.\n");
  
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
