#!/usr/bin/env node
/**
 * Fix Contact Details - Update existing record
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.log(`Disconnect error: ${error.message}`);
  }
}

async function main() {
  console.log('\n🔧 FIXING CONTACT DETAILS\n');

  try {
    await connectDB();

    const schema = new mongoose.Schema({}, { strict: false });
    const Content = mongoose.model('Content', schema, 'contents');

    // Check existing contact records
    const existingContact = await Content.findOne({ type: 'contact' });

    if (existingContact) {
      console.log('📝 Found existing contact record, updating...');
      // Update the existing one
      await Content.updateOne(
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
        }
      );
      console.log('  ✅ Updated: Contact Details');
    } else {
      // Try to find by other patterns
      const all = await Content.find({}).limit(5);
      console.log('Existing Content records:');
      all.forEach((c, i) => {
        console.log(`  ${i + 1}. type: "${c.type}", title: "${c.title}"`);
      });

      // Create new contact record
      const newContact = new Content({
        type: 'contact',
        title: 'School Contact Information',
        body: `Address: P.O. BOX 1094-60100, EMBU, KENYA
Phone: +254796214804
Email: kangarugirls@yahoo.com`,
        active: true,
        published: true,
      });

      await newContact.save();
      console.log('  ✅ Created: Contact Details');
    }

    await disconnectDB();

    console.log('\n✨ Contact Details updated successfully!');
    process.exit(0);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

main();
