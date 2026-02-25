#!/usr/bin/env node
/**
 * Verify Content Addition
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const schema = new mongoose.Schema({}, { strict: false });

// Check deputies
const Staff = mongoose.model('Staff', schema, 'staffs');
const deputies = await Staff.find({ type: 'deputy_principal' }).lean();
console.log(`\n✅ Deputy Principals: ${deputies.length}`);
deputies.forEach((d) => console.log(`   - ${d.fullName} (${d.title})`));

// Check performance
const SchoolPerformance = mongoose.model('SchoolPerformance', schema, 'schoolperformances');
const perf = await SchoolPerformance.find({}).sort({ year: 1 }).lean();
console.log(`\n✅ Performance Records: ${perf.length}`);
perf.forEach((p) => console.log(`   - ${p.year}: ${p.meanScore} (${p.grade})`));

// Check contact
const Content = mongoose.model('Content', schema, 'contents');
const contact = await Content.findOne({ type: 'contact' }).lean();
if (contact) {
  console.log(`\n✅ Contact Details Added`);
  console.log(`   Title: ${contact.title}`);
} else {
  console.log(`\n⚠️  Contact Details: Not found`);
}

await mongoose.disconnect();
console.log('\n✨ Verification complete!\n');
