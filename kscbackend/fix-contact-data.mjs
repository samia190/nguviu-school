import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/ksc";

async function updateContactData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Find and delete existing contact document if it exists
    const existing = await Content.findOne({ type: "contact" });
    if (existing) {
      console.log("Deleting existing contact document...");
      await Content.deleteOne({ type: "contact" });
    }

    // Create new contact with proper structure
    const contact = new Content({
      type: "contact",
      title: "Contact Us",
      intro:
        "Get in touch with Kangaru Girls School using the details below.",
      body: "", // Keep body empty for this contact type
      address: "P.O. BOX 1094-60100\nEMBU, KENYA",
      phone: "+254796214804",
      email: "kangarugirls@yahoo.com",
      whatsappNumber: "",
      whatsappLink: "",
      mapEmbed: "",
      active: true,
      published: true,
    });

    const saved = await contact.save();
    console.log("\n✅ Contact created successfully!");
    console.log("\nContact Document (toObject):");
    const obj = saved.toObject();
    console.log(JSON.stringify(obj, null, 2));

    // Also fetch it back from DB to verify it was saved
    console.log("\n✅ Verifying from database...");
    const verified = await Content.findOne({ type: "contact" });
    console.log("Verified Document (raw):");
    console.log(JSON.stringify(verified?.toObject(), null, 2));

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

updateContactData();
