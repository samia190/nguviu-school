// processors/videoProcessor.js
// Handles video optimization using FFmpeg
// - Limits resolution to 720p
// - Reduces bitrate for low-network users
// - Converts to MP4 (H.264)
// - Generates thumbnail image

import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

/**
 * Video optimization configuration
 */
const VIDEO_CONFIG = {
  maxHeight: 720,           // Maximum height (720p)
  videoBitrate: "1500k",    // Video bitrate for low-network
  audioBitrate: "128k",     // Audio bitrate
  format: "mp4",            // Output format
  videoCodec: "libx264",    // H.264 codec
  audioCodec: "aac",        // AAC audio
  preset: "medium",         // Encoding speed/quality tradeoff
  thumbnailTime: "00:00:01", // Time to capture thumbnail
};

/**
 * Check if mimetype is a supported video type
 * @param {string} mimetype - The file mimetype
 * @returns {boolean}
 */
export function isVideo(mimetype) {
  const supportedTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/webm",
    "video/x-matroska",
    "video/avi",
    "video/mov",
  ];
  return supportedTypes.includes(mimetype?.toLowerCase());
}

/**
 * Check if FFmpeg is available on the system
 * @returns {Promise<boolean>}
 */
export async function isFFmpegAvailable() {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err);
    });
  });
}

/**
 * Optimize a video buffer
 * - Resize to max 720p (maintaining aspect ratio)
 * - Reduce bitrate
 * - Convert to MP4 (H.264)
 * - Generate thumbnail
 * 
 * @param {Buffer} inputBuffer - Original video buffer
 * @param {string} originalName - Original filename
 * @returns {Promise<{buffer: Buffer, mimetype: string, extension: string, thumbnail: Buffer|null}>}
 */
export async function optimizeVideo(inputBuffer, originalName = "video") {
  // Create temp files for processing
  const tempId = randomUUID();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${tempId}${path.extname(originalName) || ".mp4"}`);
  const outputPath = path.join(tempDir, `output-${tempId}.mp4`);
  const thumbnailPath = path.join(tempDir, `thumb-${tempId}.jpg`);

  try {
    // Write input buffer to temp file
    fs.writeFileSync(inputPath, inputBuffer);
    
    // Check if FFmpeg is available
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      console.warn("[VideoProcessor] FFmpeg not available, returning original video");
      // Return original if FFmpeg is not installed
      return {
        buffer: inputBuffer,
        mimetype: "video/mp4",
        extension: ".mp4",
        thumbnail: null,
      };
    }

    // Process video
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=-2:${VIDEO_CONFIG.maxHeight}`,  // Scale to max height, maintain aspect ratio
          `-c:v ${VIDEO_CONFIG.videoCodec}`,          // H.264 codec
          `-preset ${VIDEO_CONFIG.preset}`,           // Encoding preset
          `-b:v ${VIDEO_CONFIG.videoBitrate}`,        // Video bitrate
          `-c:a ${VIDEO_CONFIG.audioCodec}`,          // AAC audio
          `-b:a ${VIDEO_CONFIG.audioBitrate}`,        // Audio bitrate
          "-movflags +faststart",                     // Web optimization
        ])
        .output(outputPath)
        .on("end", resolve)
        .on("error", (err) => {
          console.error("[VideoProcessor] FFmpeg error:", err.message);
          reject(err);
        })
        .run();
    });

    // Generate thumbnail
    let thumbnailBuffer = null;
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: [VIDEO_CONFIG.thumbnailTime],
            filename: `thumb-${tempId}.jpg`,
            folder: tempDir,
            size: "320x?", // 320px width, auto height
          })
          .on("end", resolve)
          .on("error", reject);
      });
      
      if (fs.existsSync(thumbnailPath)) {
        thumbnailBuffer = fs.readFileSync(thumbnailPath);
      }
    } catch (thumbErr) {
      console.warn("[VideoProcessor] Thumbnail generation failed:", thumbErr.message);
    }

    // Read optimized video
    const optimizedBuffer = fs.readFileSync(outputPath);

    console.log(
      `[VideoProcessor] Optimized "${originalName}": ${inputBuffer.length} -> ${optimizedBuffer.length} bytes`
    );

    return {
      buffer: optimizedBuffer,
      mimetype: "video/mp4",
      extension: ".mp4",
      thumbnail: thumbnailBuffer,
    };
  } catch (err) {
    console.error(`[VideoProcessor] Failed to optimize "${originalName}":`, err.message);
    throw new Error(`Video optimization failed: ${err.message}`);
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    } catch (cleanupErr) {
      console.warn("[VideoProcessor] Cleanup failed:", cleanupErr.message);
    }
  }
}

/**
 * Get new filename with .mp4 extension
 * @param {string} originalName - Original filename
 * @returns {string} New filename with .mp4 extension
 */
export function getOptimizedVideoName(originalName) {
  const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
  return `${baseName}.mp4`;
}

/**
 * Get thumbnail filename
 * @param {string} originalName - Original video filename
 * @returns {string} Thumbnail filename
 */
export function getThumbnailName(originalName) {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  return `${baseName}-thumb.jpg`;
}

export default {
  isVideo,
  isFFmpegAvailable,
  optimizeVideo,
  getOptimizedVideoName,
  getThumbnailName,
  VIDEO_CONFIG,
};
