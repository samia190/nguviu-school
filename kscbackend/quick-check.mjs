#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const schema = new mongoose.Schema({}, { strict: false });

// Check Staff
const Staff = mongoose.model('Staff', schema, 'staffs');
const staff = await Staff.findOne({ photoUrl: { $regex: /\/uploads\// } });
if (staff) {
  console.log('Staff with /uploads/:');
  console.log('Name:', staff.fullName);
  console.log('URL:', staff.photoUrl);
}

// Check Content
const Content = mongoose.model('Content', schema, 'contents');
const content = await Content.findOne({ 'attachments.url': { $regex: /\/uploads\// } });
if (content) {
  console.log('\nContent with /uploads/:');
  console.log('Title:', content.title);
  const att = content.attachments.find((a) => a.url?.includes('/uploads/'));
  if (att) console.log('Attachment URL:', att.url);
}

await mongoose.disconnect();
