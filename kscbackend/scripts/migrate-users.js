// scripts/migrate-users.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to mongo for migration");

    const file = path.join(process.cwd(), "data", "users.json");
    if (!fs.existsSync(file)) {
      console.error("No data/users.json found");
      process.exit(1);
    }

    const raw = fs.readFileSync(file, "utf8");
    const list = JSON.parse(raw || "[]");

    for (const u of list) {
      try {
        const email = String(u.email).toLowerCase();
        const existing = await User.findOne({ email });
        if (existing) {
          console.log("skip existing:", email);
          continue;
        }

        const doc = new User({
          legacyId: u.id,
          name: u.name || "Unknown",
          email,
          passwordHash: u.passwordHash,
          role: u.role || "pending",
          requestedRole: u.requestedRole || "user",
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        });
        await doc.save();
        console.log("imported:", email);
      } catch (err) {
        console.error("failed to import user", u.email, err);
      }
    }
    console.log("migration complete");
    process.exit(0);
  } catch (err) {
    console.error("migration error:", err);
    process.exit(1);
  }
})();
