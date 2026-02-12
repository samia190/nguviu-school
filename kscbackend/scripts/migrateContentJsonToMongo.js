const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Content = require('./models/Content'); // Adjust path if needed

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name';

// Path to your existing content JSON file
const CONTENT_JSON_PATH = path.join(__dirname, 'data', 'content.json');

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Read the JSON file
    const rawData = fs.readFileSync(CONTENT_JSON_PATH, 'utf-8');
    const contents = JSON.parse(rawData);

    if (!Array.isArray(contents)) {
      console.error('Content JSON data is not an array!');
      process.exit(1);
    }

    // Optionally clear existing collection (be careful!)
    await Content.deleteMany({});
    console.log('Cleared existing Content collection');

    // Insert all content entries into MongoDB
    await Content.insertMany(contents);
    console.log(`Successfully imported ${contents.length} content items`);

    // Close connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
