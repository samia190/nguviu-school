import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "../models/Event.js";
import StudentLife from "../models/StudentLife.js";
import GalleryItem from "../models/GalleryItem.js";
import HeroContent from "../models/HeroContent.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ksc:***@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority";

// Available images from /public/images
const availableImages = [
  "DSC_5353.jpg",
  "DSC_5364.jpg",
  "DSC_5364 (1).jpg",
  "DSC_5372.jpg",
  "DSC_5377.jpg",
  "DSC_5379.jpg",
  "DSC_5384.jpg",
  "DSC_5389.jpg",
  "DSC_5391.jpg",
  "DSC_5392.jpg",
  "DSC_5400.jpg",
  "DSC_5401.jpg",
  "DSC_5402.jpg",
  "DSC_5403.jpg",
  "DSC_5404.jpg",
  "DSC_5406.jpg",
  "DSC_5410.jpg",
  "DSC_5411.jpg",
  "DSC_5413.jpg",
  "DSC_5415.jpg",
  "DSC_5418.jpg",
  "DSC_5420.jpg",
  "DSC_5424.jpg",
  "DSC_5427.jpg",
  "DSC_5428.jpg",
  "DSC_5432.jpg",
  "DSC_5434.jpg",
  "DSC_5435.jpg",
  "DSC_5440.jpg",
  "DSC_5441.jpg",
  "DSC_5443.jpg",
  "DSC_5446.jpg",
  "DSC_5447.jpg",
  "DSC_5450.jpg",
  "DSC_5454.jpg",
  "DSC_5455.jpg",
  "DSC_5456.jpg",
  "DSC_5457.jpg",
  "DSC_5458.jpg",
  "DSC_5462.jpg",
  "DSC_5463.jpg",
  "DSC_5472.jpg",
  "DSC_5473.jpg",
  "DSC_5475.jpg",
  "DSC_5489.jpg",
  "DSC_5490.jpg",
  "DSC_5493.jpg",
  "DSC_5500.jpg",
  "DSC_5501.jpg",
  "DSC_5502.jpg",
  "DSC_5512.jpg",
  "DSC_5515.jpg",
  "DSC_5533.jpg",
  "DSC_5534.jpg",
  "DSC_5535.jpg",
  "DSC_5537.jpg",
  "DSC_5541.jpg",
  "DSC_5545.jpg",
  "DSC_5548.jpg",
  "DSC_5581.jpg",
  "DSC_5613.jpg",
  "DSC_5614.jpg",
  "DSC_5615.jpg",
  "DSC_5625.jpg",
  "DSC_5626.jpg",
  "DSC_5631.jpg",
  "DSC_5712.jpg",
  "DSC_5721.jpg",
  "DSC_5725.jpg",
  "DSC_5726.jpg",
  "DSC_5728.jpg",
  "DSC_5735.jpg",
  "DSC_5739.jpg",
  "DSC_5766.jpg",
  "DSC_5781.jpg",
  "DSC_5797.jpg",
  "DSC_5820.jpg",
  "DSC_5824.jpg",
  "DSC_5830.jpg",
  "DSC_5833.jpg",
  "DSC_5836.jpg",
  "DSC_5837.jpg",
  "DSC_5839.jpg",
  "DSC_5840.jpg",
  "DSC_5882.jpg",
  "DSC_5886.jpg",
  "DSC_5892.jpg",
  "Principal.PNG"
];

const eventTitles = [
  "Annual Science Fair",
  "Sports Day 2026",
  "Cultural Festival",
  "Graduation Ceremony",
  "Academic Excellence Awards",
  "Student Leadership Summit",
  "Environmental Awareness Day",
  "Career Guidance Fair"
];

const studentLifeCategories = {
  sports: ["Athletics Team", "Netball Squad", "Swimming Team", "Volleyball Championship"],
  clubs: ["Debate Club", "Science Club", "Drama Society", "Music Ensemble"],
  activities: ["Classroom Activities", "Outdoor Adventures", "Lab Work", "Project Showcase"],
  traditions: ["School Assembly", "Prize Giving", "School Anthem", "Founder's Day"]
};

async function seedDistributedContent() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log(`📍 URI: ${MONGO_URI.replace(/:[^:]*@/, ":***@")}`);
    
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB successfully\n");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Event.deleteMany({});
    await StudentLife.deleteMany({});
    await GalleryItem.deleteMany({});
    await HeroContent.deleteMany({});
    console.log("✅ Cleared existing collections\n");

    let imageIndex = 0;

    // ==================== DISTRIBUTE TO HERO CONTENT ====================
    console.log("📸 Creating Hero Content (3 images)...");
    const heroImages = availableImages.slice(imageIndex, imageIndex + 3);
    imageIndex += 3;

    for (let i = 0; i < heroImages.length; i++) {
      await HeroContent.create({
        type: "image",
        page: "home",
        title: `Hero Slide ${i + 1}`,
        description: `Beautiful school moment captured on slide ${i + 1}`,
        url: `/images/${heroImages[i]}`,
        displayOrder: i,
        active: true,
        originalName: heroImages[i]
      });
    }
    console.log(`✅ Created ${heroImages.length} hero content items\n`);

    // ==================== DISTRIBUTE TO EVENTS ====================
    console.log("📅 Creating Events (8 events)...");
    const eventsImages = availableImages.slice(imageIndex, imageIndex + 8);
    imageIndex += 8;

    for (let i = 0; i < eventTitles.length; i++) {
      await Event.create({
        title: eventTitles[i],
        description: `Join us for ${eventTitles[i]}. This is a major event in our school calendar showcasing student talents and achievements.`,
        date: new Date(Date.now() + (Math.random() * 180 * 24 * 60 * 60 * 1000)), // Random date within 6 months
        location: "KANGARU GIRLS SCHOOL",
        imageUrl: `/images/${eventsImages[i]}`,
        imageAlt: eventTitles[i],
        featured: i < 2, // First 2 are featured
        displayOrder: i,
        originalName: eventsImages[i]
      });
    }
    console.log(`✅ Created ${eventTitles.length} events\n`);

    // ==================== DISTRIBUTE TO STUDENT LIFE ====================
    console.log("🎓 Creating Student Life Items (12 items)...");
    const studentLifeImages = availableImages.slice(imageIndex, imageIndex + 12);
    imageIndex += 12;

    let itemIndex = 0;
    for (const [category, titles] of Object.entries(studentLifeCategories)) {
      for (let i = 0; i < titles.length; i++) {
        if (itemIndex < studentLifeImages.length) {
          await StudentLife.create({
            title: titles[i],
            description: `Students engaged in ${titles[i].toLowerCase()}. This showcases the vibrant student life at our institution.`,
            category,
            imageUrl: `/images/${studentLifeImages[itemIndex]}`,
            imageAlt: titles[i],
            featured: itemIndex === 0 || itemIndex === 1,
            displayOrder: itemIndex,
            originalName: studentLifeImages[itemIndex]
          });
          itemIndex++;
        }
      }
    }
    console.log(`✅ Created ${itemIndex} student life items\n`);

    // ==================== DISTRIBUTE TO GALLERY ====================
    console.log("🗂️  Creating Gallery Items (remaining images as one multi-image gallery)...");
    const galleryImages = availableImages.slice(imageIndex);

    const galleryAttachments = galleryImages.map(img => ({
      originalName: img,
      filename: img,
      url: `/images/${img}`,
      mimetype: "image/jpeg",
      size: 0,
      uploadedAt: new Date()
    }));

    await GalleryItem.create({
      title: "School Memories & Moments",
      body: "A collection of beautiful moments from the school year - academic activities, special events, campus life, and student achievements.",
      attachments: galleryAttachments
    });
    console.log(`✅ Created gallery with ${galleryImages.length} images\n`);

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log("✨ DISTRIBUTION COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📊 Total Images Distributed: ${availableImages.length}`);
    console.log(`   - Hero Content: 3 images`);
    console.log(`   - Events: 8 images`);
    console.log(`   - Student Life: 12 images`);
    console.log(`   - Gallery: ${galleryImages.length} images`);
    console.log("\n📋 Collections Created:");
    console.log(`   - ${heroImages.length + 3} Hero slides (editable via Hero Content Manager)`);
    console.log(`   - ${eventTitles.length} Events (editable via Events Manager)`);
    console.log(`   - ${itemIndex} Student Life items (editable via Student Life Manager)`);
    console.log(`   - 1 Gallery with ${galleryImages.length} images (editable via Gallery Manager)`);
    console.log("\n✅ All content is now manageable from the Admin Dashboard!");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    process.exit(1);
  }
}

seedDistributedContent();
