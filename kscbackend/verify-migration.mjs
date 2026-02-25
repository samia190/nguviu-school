#!/usr/bin/env node
/**
 * Verify all /uploads/ URLs have been migrated
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const schema = new mongoose.Schema({}, { strict: false });

console.log('🔍 VERIFICATION - Remaining /uploads/ URLs\n');

// Check each collection
const collections = [
  { name: 'Events', Model: 'Event', field: 'imageUrl' },
  { name: 'Staff', Model: 'Staff', field: 'photoUrl' },
  { name: 'Gallery', Model: 'Gallery', field: 'attachments.url' },
];

let totalRemaining = 0;

for (const col of collections) {
  const Model = mongoose.model(col.Model, schema, 
    col.Model === 'Gallery' ? 'galleries' : 
    col.Model === 'Staff' ? 'staffs' : 'events');
  
  let count = 0;
  if (col.field === 'attachments.url') {
    count = await Model.countDocuments({ [col.field]: { $regex: /\/uploads\// } });
  } else {
    count = await Model.countDocuments({ [col.field]: { $regex: /\/uploads\// } });
  }
  
  console.log(`${col.name}: ${count} remaining /uploads/ URLs`);
  totalRemaining += count;
}

// Check Content
const Content = mongoose.model('Content', schema, 'contents');
const contentCount = await Content.countDocuments({ 'attachments.url': { $regex: /\/uploads\// } });
console.log(`Content: ${contentCount} remaining /uploads/ URLs`);
totalRemaining += contentCount;

console.log(`\n${totalRemaining === 0 ? '✅ SUCCESS' : '❌ REMAINING'}: ${totalRemaining} total /uploads/ URLs remain`);

await mongoose.disconnect();
process.exit(totalRemaining === 0 ? 0 : 1);
