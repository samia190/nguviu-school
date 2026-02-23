import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Staff from "./models/Staff.js";

async function fixStaff() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
    
    const staff = await Staff.findOne({});
    if (staff) {
      console.log(`\nFound staff: ${staff.fullName}`);
      console.log(`Old photoUrl: ${staff.photoUrl}`);
      
      // Update to correct path
      staff.photoUrl = "/uploads/staff/principal.png";
      await staff.save();
      
      console.log(`New photoUrl: ${staff.photoUrl}`);
      console.log("✅ Staff image path updated");
    } else {
      console.log("No staff records found");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

fixStaff();
