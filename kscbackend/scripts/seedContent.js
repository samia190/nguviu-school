import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import path from 'path';
import Content from '../models/Content.js';

const mongo = process.env.MONGO_URI || 'mongodb+srv://kangach:kangach19@19@cluster0.7bmfdr8.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(mongo, { });
  console.log('Connected to mongo for seeding');

  // Seed home with KANGARU GIRLS branding
  const homeData = {
    type: 'home',
    title: "WELCOME TO KANGARU GIRLS' SENIOR SCHOOL",
    intro: 'Excellence in Education - Grow in Grace',
    body: 'Welcome to Kangaru Girls Senior School. We are committed to providing quality education with a comprehensive curriculum, dedicated staff, and excellent facilities.',
    attachments: [
      {
        originalName: 'hero-seed.jpg',
        name: 'hero-seed.jpg',
        url: '/images/background images/principle.jpeg',
        downloadUrl: process.env.PUBLIC_ORIGIN ? `${process.env.PUBLIC_ORIGIN}/images/background images/principle.jpeg` : `/images/background images/principle.jpeg`,
        mimetype: 'image/jpeg',
        size: 0,
      },
    ],
  };

  await Content.findOneAndUpdate({ type: 'home' }, homeData, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log(' home content.');

  const aboutData = {
    type: 'about',
    title: "About Kangaru Girls Senior School",
    intro: 'A leading girls\' school offering quality education with comprehensive curriculum and excellent facilities.',
    heroTitle: 'Our Mission',
    heroSubtitle: 'Excellence in Education | Grow in Grace',
    heroBackgroundUrl: '/images/background images/hero.JPG',
    attachments: [
      {
        originalName: 'principal.jpg',
        name: 'principal.jpg',
        url: '/images/background images/principle.jpeg',
        downloadUrl: process.env.PUBLIC_ORIGIN ? `${process.env.PUBLIC_ORIGIN}/images/background images/principle.jpeg` : `/images/background images/principle.jpeg`,
        mimetype: 'image/jpeg',
        size: 0,
      },
    ],
  };

  await Content.findOneAndUpdate({ type: 'about' }, aboutData, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log('Seeded about content.');

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => { console.error(err); process.exit(1); });
