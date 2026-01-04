import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/content.json");

export function loadContent() {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

export function saveContent(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
