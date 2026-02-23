import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Staff from "./models/Staff.js";

async function checkStaff() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    const staff = await Staff.find({}).lean();
    console.log("Staff records:");
    staff.forEach(s => {
      console.log(`Name: ${s.fullName}`);
      console.log(`Photo URL: ${s.photoUrl}`);
      console.log("---");
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkStaff();
