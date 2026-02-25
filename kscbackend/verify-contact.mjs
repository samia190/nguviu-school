import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/ksc";

async function verifyContactData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB\n");

    // Fetch contact as it would be returned by the API
    const contact = await Content.findOne({ type: "contact" });

    if (!contact) {
      console.log("❌ No contact data found!");
      process.exit(1);
    }

    const data = contact.toObject();

    console.log("📋 Contact Data Retrieved:");
    console.log("================================");

    // Check each field that Contact.jsx expects
    const expectedFields = [
      "title",
      "intro",
      "address",
      "phone",
      "email",
      "whatsappNumber",
      "whatsappLink",
      "mapEmbed",
    ];

    let missingFields = [];
    expectedFields.forEach((field) => {
      const value = data[field];
      const status =
        value === undefined || value === null ? "❌ MISSING" : "✅ Present";
      console.log(`  ${field}: ${status}`);
      if (value === undefined || value === null) {
        missingFields.push(field);
      }
    });

    console.log("\n📦 Full Data Object (for debugging):");
    console.log("================================");
    console.log(JSON.stringify(data, null, 2));

    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing fields: ${missingFields.join(", ")}`);
      console.log("Contact.jsx may not display all information.");
    } else {
      console.log(
        "\n✅ All fields present! Contact.jsx should render correctly."
      );
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

verifyContactData();
