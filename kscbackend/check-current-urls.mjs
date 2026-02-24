import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
});

const schema = new mongoose.Schema({}, { strict: false });
const GalleryItem = mongoose.model('GalleryItem', schema, 'galleryitems');

const items = await GalleryItem.find({}).lean();

console.log(`\n📊 GALLERY ITEMS: ${items.length}\n`);

items.forEach((item) => {
  console.log(`📁 ${item.name}`);
  console.log(`   ID: ${item._id}`);
  console.log(`   Attachments: ${item.attachments?.length || 0}`);

  if (item.attachments && item.attachments.length > 0) {
    const uploadURLs = item.attachments.filter((att) => att.url?.includes('/uploads/'));
    const cloudinaryURLs = item.attachments.filter((att) => att.url?.includes('cloudinary'));
    const otherURLs = item.attachments.filter(
      (att) => !att.url?.includes('/uploads/') && !att.url?.includes('cloudinary')
    );

    console.log(`   URLs in /uploads/: ${uploadURLs.length}`);
    console.log(`   URLs in Cloudinary: ${cloudinaryURLs.length}`);
    console.log(`   Other URLs: ${otherURLs.length}`);

    if (uploadURLs.length > 0) {
      console.log(`\n   Sample /uploads/ URLs (first 3):`);
      uploadURLs.slice(0, 3).forEach((att, i) => {
        const filename = att.url?.split('/').pop();
        console.log(`     [${i + 1}] ${filename}`);
      });
    }

    if (cloudinaryURLs.length > 0 && uploadURLs.length === 0) {
      console.log(`   ✅ All URLs already in Cloudinary (already migrated)`);
    }
  }

  console.log();
});

await mongoose.disconnect();
