#!/usr/bin/env node
/**
 * Force Update Contact Details - Remove old ones first
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const schema = new mongoose.Schema({}, { strict: false });

const Content = mongoose.model('Content', schema, 'contents');

// Delete all contact records
await Content.deleteMany({ type: 'contact' });
console.log('✅ Deleted old contact records');

// Create new one
const newContact = await Content.create({
  type: 'contact',
  page: 'contact',
  title: 'School Contact Information',
  body: `Address: P.O. BOX 1094-60100, EMBU, KENYA
Phone: +254796214804
Email: kangarugirls@yahoo.com`,
  active: true,
  published: true,
});

console.log('✅ Contact Details Created');
console.log(`   Title: ${newContact.title}`);
console.log(`   Phone: +254796214804`);

await mongoose.disconnect();
console.log('\n✨ All content successfully added!\n');
