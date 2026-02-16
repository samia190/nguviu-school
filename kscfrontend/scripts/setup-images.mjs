import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicImagesDir = path.join(__dirname, '../public/images');
const optimizedImagesDir = path.join(__dirname, '../public/.optimized/images');

// Ensure public/images directory exists
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log('✅ Created public/images directory');
}

// Function to recursively copy files
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source directory not found: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  let copiedCount = 0;

  files.forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      // Skip .sha1 files and hiddens
      if (!file.startsWith('.')) {
        copyDir(srcFile, destFile);
      }
    } else {
      // Skip .sha1 files
      if (!file.endsWith('.sha1')) {
        fs.copyFileSync(srcFile, destFile);
        copiedCount++;
      }
    }
  });

  if (copiedCount > 0) {
    console.log(`✅ Copied ${copiedCount} files from ${path.relative(__dirname, src)}`);
  }
}

// Copy optimized images
console.log('📦 Setting up optimized images for deployment...');
copyDir(optimizedImagesDir, publicImagesDir);
console.log('✅ Image setup complete!');
