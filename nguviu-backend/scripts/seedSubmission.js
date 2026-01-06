import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import File from '../models/File.js';

async function main(){
  const mongo = process.env.MONGO_URI;
  if(!mongo){
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(mongo);
  console.log('Connected to MongoDB');

  // ensure uploads dir
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // create sample file
  const filename = `sample-submission-${Date.now()}.txt`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, 'This is a sample homework submission file.');

  const relUrl = `/uploads/${filename}`;

  const doc = await File.create({
    originalName: filename,
    filename,
    url: relUrl,
    level: 'Form 2',
    subject: 'Mathematics',
    notes: 'Sample seeded submission',
    studentEmail: 'student1@example.com',
    studentRole: 'student'
  });

  console.log('Created submission with id:', doc._id);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
