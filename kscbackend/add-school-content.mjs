#!/usr/bin/env node
/**
 * Add School Content to Database
 * - Contact Details
 * - Deputy Principals
 * - Performance Data
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
  console.log('\n🚀 ADDING SCHOOL CONTENT TO DATABASE\n');

  try {
    await connectDB();

    const schema = new mongoose.Schema({}, { strict: false });

    // 1. ADD DEPUTY PRINCIPALS
    console.log('👥 ADDING DEPUTY PRINCIPALS...');
    const Staff = mongoose.model('Staff', schema, 'staffs');

    const deputies = [
      {
        type: 'deputy_principal',
        fullName: 'Mss Purity Wamboi Wachira',
        title: 'Administration Deputy Principal',
        photoUrl:
          'https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/DSC_5372.jpg',
        remarks:
          'Leading administration with dedication and excellence. Committed to fostering an environment where every student is supported to achieve their full potential through systematic management and inclusive leadership.',
        email: '',
        phone: '',
        qualifications: [],
        active: true,
      },
      {
        type: 'deputy_principal',
        fullName: 'Easter Wanjiru Nyaga',
        title: 'Academic Deputy Principal',
        photoUrl:
          'https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/DSC_5364.jpg',
        remarks:
          'Driving academic excellence and innovation. Passionate about developing challenging curricula that inspire students to think critically and achieve academic success in a competitive global landscape.',
        email: '',
        phone: '',
        qualifications: [],
        active: true,
      },
    ];

    for (const deputy of deputies) {
      try {
        // Try to find existing
        const existing = await Staff.findOne({ fullName: deputy.fullName });
        if (existing) {
          // Update
          await Staff.updateOne({ fullName: deputy.fullName }, { $set: deputy });
          console.log(`  ✅ Updated: ${deputy.fullName}`);
        } else {
          // Create new
          await Staff.create(deputy);
          console.log(`  ✅ Created: ${deputy.fullName}`);
        }
      } catch (error) {
        console.log(`  ❌ Error with ${deputy.fullName}: ${error.message}`);
      }
    }

    // 2. ADD CONTACT DETAILS
    console.log('\n📞 ADDING CONTACT DETAILS...');
    const Content = mongoose.model('Content', schema, 'contents');

    const contactData = {
      type: 'contact',
      title: 'School Contact Information',
      body: `
Address: P.O. BOX 1094-60100, EMBU, KENYA
Phone: +254796214804
Email: kangarugirls@yahoo.com
      `,
      heroImage: '',
      attachments: [],
      published: true,
      active: true,
    };

    try {
      const existing = await Content.findOne({ type: 'contact' });
      if (existing) {
        await Content.updateOne({ type: 'contact' }, { $set: contactData });
        console.log('  ✅ Updated: Contact Details');
      } else {
        await Content.create(contactData);
        console.log('  ✅ Created: Contact Details');
      }
    } catch (error) {
      console.log(`  ❌ Error updating contact: ${error.message}`);
    }

    // 3. ADD PERFORMANCE DATA
    console.log('\n📊 ADDING PERFORMANCE DATA...');
    const SchoolPerformance = mongoose.model('SchoolPerformance', schema, 'schoolperformances');

    const performanceRecords = [
      { year: 2017, meanScore: 6.731, grade: 'C+', published: true, active: true },
      { year: 2018, meanScore: 7.303, grade: 'C+', published: true, active: true },
      { year: 2019, meanScore: 8.032, grade: 'B-', published: true, active: true },
      { year: 2020, meanScore: 7.995, grade: 'B-', published: true, active: true },
      { year: 2021, meanScore: 7.53, grade: 'B-', published: true, active: true },
      { year: 2022, meanScore: 6.8054, grade: 'C+', published: true, active: true },
      { year: 2023, meanScore: 6.9961, grade: 'C+', published: true, active: true },
      { year: 2024, meanScore: 7.2993, grade: 'C+', published: true, active: true },
    ];

    for (const record of performanceRecords) {
      try {
        const existing = await SchoolPerformance.findOne({ year: record.year });
        if (existing) {
          await SchoolPerformance.updateOne({ year: record.year }, { $set: record });
          console.log(`  ✅ Updated: ${record.year} (${record.grade})`);
        } else {
          await SchoolPerformance.create(record);
          console.log(`  ✅ Created: ${record.year} (${record.grade})`);
        }
      } catch (error) {
        console.log(`  ❌ Error with ${record.year}: ${error.message}`);
      }
    }

    await disconnectDB();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              CONTENT ADDITION COMPLETE                         ║
╚════════════════════════════════════════════════════════════════╝

✅ Added/Updated:
   • 2 Deputy Principals
   • 1 Contact Details Record
   • 8 Performance Records (2017-2024)

All content is now available on the website.
`);

    process.exit(0);
  } catch (error) {
    console.log(`❌ Fatal error: ${error.message}`);
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

main();
