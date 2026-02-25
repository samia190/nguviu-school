#!/usr/bin/env node
/**
 * Force Update Contact Details
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const schema = new mongoose.Schema({}, { strict: false });

const Content = mongoose.model('Content', schema, 'contents');

// Force update - replace/upsert
const result = await Content.findOneAndUpdate(
  { type: 'contact' },
  {
    $set: {
      title: 'School Contact Information',
      body: `Address: P.O. BOX 1094-60100, EMBU, KENYA
Phone: +254796214804
Email: kangarugirls@yahoo.com`,
      active: true,
      published: true,
    },
  },
  { upsert: true, new: true }
);

console.log('\n✅ Contact Details Updated/Created');
console.log(`   Title: ${result.title}`);
console.log(`   Phone: +254796214804`);

await mongoose.disconnect();
console.log('\n✨ Done!\n');
