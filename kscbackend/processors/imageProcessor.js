// processors/imageProcessor.js
// Handles image optimization using Sharp
// - Resizes images to max 1600px width
// - Compresses with quality 80
// - Converts to WebP format

import sharp from "sharp";

/**
 * Image optimization configuration
 */
const IMAGE_CONFIG = {
  maxWidth: 1600,      // Maximum width in pixels
  quality: 80,         // WebP quality (0-100)
  format: "webp",      // Output format
};

/**
 * Check if mimetype is a supported image type
 * @param {string} mimetype - The file mimetype
 * @returns {boolean}
 */
export function isImage(mimetype) {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];
  return supportedTypes.includes(mimetype?.toLowerCase());
}

/**
 * Optimize an image buffer
 * - Resize to max width (maintaining aspect ratio)
 * - Compress and convert to WebP
 * 
 * @param {Buffer} inputBuffer - Original image buffer
 * @param {string} originalName - Original filename (for logging)
 * @returns {Promise<{buffer: Buffer, mimetype: string, extension: string}>}
 */
export async function optimizeImage(inputBuffer, originalName = "image") {
  try {
    // Get metadata to check dimensions
    const metadata = await sharp(inputBuffer).metadata();
    
    // Create sharp pipeline
    let pipeline = sharp(inputBuffer);
    
    // Only resize if image is wider than max width
    if (metadata.width && metadata.width > IMAGE_CONFIG.maxWidth) {
      pipeline = pipeline.resize(IMAGE_CONFIG.maxWidth, null, {
        fit: "inside",           // Maintain aspect ratio
        withoutEnlargement: true // Never upscale
      });
    }
    
    // Convert to WebP with compression
    const optimizedBuffer = await pipeline
      .webp({ quality: IMAGE_CONFIG.quality })
      .toBuffer();
    
    console.log(`[ImageProcessor] Optimized "${originalName}": ${inputBuffer.length} -> ${optimizedBuffer.length} bytes`);
    
    return {
      buffer: optimizedBuffer,
      mimetype: "image/webp",
      extension: ".webp",
    };
  } catch (err) {
    console.error(`[ImageProcessor] Failed to optimize "${originalName}":`, err.message);
    // Return original on failure (graceful degradation)
    throw new Error(`Image optimization failed: ${err.message}`);
  }
}

/**
 * Get new filename with .webp extension
 * @param {string} originalName - Original filename
 * @returns {string} New filename with .webp extension
 */
export function getOptimizedImageName(originalName) {
  const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
  return `${baseName}.webp`;
}

export default {
  isImage,
  optimizeImage,
  getOptimizedImageName,
  IMAGE_CONFIG,
};
