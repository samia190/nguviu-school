import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://kscadmin:Ksc098765@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority";

// Define Content schema inline to avoid import issues
const contentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Content = mongoose.model("Content", contentSchema);

const DEFAULT_ABOUT = {
  missionHeading: "MISSION",
  mission: "Nurture excellence in a well-integrated person in line with Vision 2030",
  visionHeading: "VISION",
  vision: "Holistically Developed Person",
  mottoHeading: "MOTTO",
  motto: "Excellence, Our Choice",
  promiseHeading: "Our Promise",
  promise: "Excellence, Our Choice",
  coreValues: "Responsibility\nAccountability & Transparency\nHonesty\nIntegrity\nRespect\nTeam Work\nHumility\nProfessionalism\nSelf & Emotional Awareness\nCreativity & Innovation",
  aboutHeading: "About KANGARU GIRLS SCHOOL",
  aboutContent: "Welcome to Kangaru Girls School, a leading educational institution dedicated to nurturing excellence through comprehensive curriculum, dedicated staff, and excellent facilities."
};

async function seedAboutContent() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log(`📍 URI: ${MONGO_URI.replace(/:[^:]*@/, ":***@")}`);
    
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB successfully");
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);

    // Check if About document exists
    let aboutDoc = await Content.findOne({ page: "about" });

    if (aboutDoc) {
      console.log("📄 About document already exists");
      console.log(`   Current content: ${JSON.stringify(aboutDoc.data).substring(0, 100)}...`);
    } else {
      console.log("📝 Creating About content document...");
      aboutDoc = await Content.create({
        page: "about",
        data: DEFAULT_ABOUT
      });
      console.log("✅ About content created successfully!");
      console.log(`   ID: ${aboutDoc._id}`);
      console.log(`   Page: ${aboutDoc.page}`);
      console.log(`   Fields: ${Object.keys(aboutDoc.data).join(", ")}`);
    }

    console.log("\n✨ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    process.exit(1);
  }
}

seedAboutContent();
