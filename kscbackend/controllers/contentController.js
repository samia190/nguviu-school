import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/content.json");
const defaultContent = {
  gallery: [],
  admissions: [],
  feeStructure: [],
  newsletters: [],
  legal: [],
  about: "",
  contact: "",
  curriculum: "",
  performance: "",
  policies: "",
  parents: "",
  students: "",
  staff: "",
  title: "Welcome, Admin",
  intro: "You have access to manage school content, upload files, and oversee key settings.",
  formHeading: "Post New Content",
  data: {}
};

export function loadContent() {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️  content.json not found, using default content");
      return defaultContent;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error loading content:", err.message);
    return defaultContent;
  }
}

export function saveContent(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Error saving content:", err.message);
  }
}

