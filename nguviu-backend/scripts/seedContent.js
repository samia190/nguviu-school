import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import path from 'path';
import Content from '../models/Content.js';

const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/nguviu';

async function run() {
  await mongoose.connect(mongo, { });
  console.log('Connected to mongo for seeding');

  // Seed home
  const homeData = {
    type: 'home',
    title: "Welcome to Nguviu Girls' School (Seed)",
    intro: 'This is seeded intro for the home page.',
    body: 'Seeded body content for home page.',
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
  console.log('Seeded home content.');

  const aboutData = {
    type: 'about',
    title: "About Nguviu (Seed)",
    intro: 'About page seeded intro.',
    heroTitle: 'Our Mission (seed)',
    heroSubtitle: 'Seeded subtitle',
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
