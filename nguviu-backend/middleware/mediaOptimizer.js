// middleware/mediaOptimizer.js
// Middleware that optimizes uploaded media files
// - Runs AFTER Multer but BEFORE saving to storage/database
// - Routes images to imageProcessor (resize, compress, WebP)
// - Routes videos to videoProcessor (720p, H.264, thumbnail)

import fs from "fs";
import path from "path";
import {
  isImage,
  optimizeImage,
  getOptimizedImageName,
} from "../processors/imageProcessor.js";
import {
  isVideo,
  optimizeVideo,
  getOptimizedVideoName,
  getThumbnailName,
} from "../processors/videoProcessor.js";

/**
 * File size limits for validation
 */
const SIZE_LIMITS = {
  image: 25 * 1024 * 1024,  // 25MB for images
  video: 100 * 1024 * 1024, // 100MB for videos
};

/**
 * Allowed mimetypes for upload validation
 */
const ALLOWED_TYPES = {
  images: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ],
  videos: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ],
};

/**
 * Check if file type is allowed
 * @param {string} mimetype 
 * @returns {boolean}
 */
function isAllowedType(mimetype) {
  const allAllowed = [
    ...ALLOWED_TYPES.images,
    ...ALLOWED_TYPES.videos,
    ...ALLOWED_TYPES.documents,
  ];
  return allAllowed.includes(mimetype?.toLowerCase());
}

/**
 * Validate file size based on type
 * @param {object} file - Multer file object
 * @returns {{valid: boolean, error?: string}}
 */
function validateFileSize(file) {
  const size = file.size || (file.buffer ? file.buffer.length : 0);
  
  if (isImage(file.mimetype) && size > SIZE_LIMITS.image) {
    return { valid: false, error: `Image exceeds ${SIZE_LIMITS.image / 1024 / 1024}MB limit` };
  }
  
  if (isVideo(file.mimetype) && size > SIZE_LIMITS.video) {
    return { valid: false, error: `Video exceeds ${SIZE_LIMITS.video / 1024 / 1024}MB limit` };
  }
  
  return { valid: true };
}

/**
 * Process a single file - optimize if image/video
 * Modifies file object in place with optimized data
 * 
 * @param {object} file - Multer file object
 * @param {string} uploadsDir - Directory for disk storage files
 * @returns {Promise<{thumbnail?: Buffer, thumbnailName?: string}>}
 */
async function processFile(file, uploadsDir) {
  const result = {};
  
  // Skip non-media files (documents, etc.)
  if (!isImage(file.mimetype) && !isVideo(file.mimetype)) {
    console.log(`[MediaOptimizer] Skipping non-media file: ${file.originalname}`);
    return result;
  }

  // Get the buffer - either from memory storage or read from disk
  let inputBuffer;
  if (file.buffer) {
    // Memory storage
    inputBuffer = file.buffer;
  } else if (file.path) {
    // Disk storage - read the file
    inputBuffer = fs.readFileSync(file.path);
  } else {
    console.warn(`[MediaOptimizer] No buffer or path for file: ${file.originalname}`);
    return result;
  }

  try {
    if (isImage(file.mimetype)) {
      // ========== OPTIMIZE IMAGE ==========
      const optimized = await optimizeImage(inputBuffer, file.originalname);
      
      // Update file object with optimized data
      file.buffer = optimized.buffer;
      file.mimetype = optimized.mimetype;
      file.size = optimized.buffer.length;
      
      // Update filename to reflect WebP conversion
      const newName = getOptimizedImageName(file.originalname);
      file.originalname = newName;
      
      // If using disk storage, replace the file on disk
      if (file.path) {
        // Delete original file
        fs.unlinkSync(file.path);
        
        // Write optimized file with new name
        const newPath = path.join(path.dirname(file.path), `${Date.now()}-${newName}`);
        fs.writeFileSync(newPath, optimized.buffer);
        
        // Update file object
        file.path = newPath;
        file.filename = path.basename(newPath);
      }
      
      console.log(`[MediaOptimizer] Image optimized: ${file.originalname}`);
      
    } else if (isVideo(file.mimetype)) {
      // ========== OPTIMIZE VIDEO ==========
      const optimized = await optimizeVideo(inputBuffer, file.originalname);
      
      // Update file object with optimized data
      file.buffer = optimized.buffer;
      file.mimetype = optimized.mimetype;
      file.size = optimized.buffer.length;
      
      // Update filename to reflect MP4 conversion
      const newName = getOptimizedVideoName(file.originalname);
      file.originalname = newName;
      
      // If using disk storage, replace the file on disk
      if (file.path) {
        // Delete original file
        fs.unlinkSync(file.path);
        
        // Write optimized file with new name
        const newPath = path.join(path.dirname(file.path), `${Date.now()}-${newName}`);
        fs.writeFileSync(newPath, optimized.buffer);
        
        // Update file object
        file.path = newPath;
        file.filename = path.basename(newPath);
      }
      
      // Store thumbnail info if generated
      if (optimized.thumbnail) {
        result.thumbnail = optimized.thumbnail;
        result.thumbnailName = getThumbnailName(file.originalname);
        // Attach thumbnail to file object for later use
        file._thumbnail = {
          buffer: optimized.thumbnail,
          name: result.thumbnailName,
          mimetype: "image/jpeg",
        };
      }
      
      console.log(`[MediaOptimizer] Video optimized: ${file.originalname}`);
    }
  } catch (err) {
    console.error(`[MediaOptimizer] Failed to process ${file.originalname}:`, err.message);
    // Don't throw - allow original file to be used (graceful degradation)
  }
  
  return result;
}

/**
 * Middleware factory for optimizing uploaded media
 * 
 * Usage: router.post('/upload', upload.array('files'), optimizeMedia(), (req, res) => {...})
 * 
 * Options:
 *  - validateTypes: boolean - Whether to validate file types (default: true)
 *  - validateSize: boolean - Whether to validate file sizes (default: true)
 *  - skipOptimization: boolean - Skip optimization, only validate (default: false)
 * 
 * @param {object} options - Configuration options
 * @returns {function} Express middleware function
 */
export function optimizeMedia(options = {}) {
  const {
    validateTypes = true,
    validateSize = true,
    skipOptimization = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Get all files from request (supports both single and array uploads)
      const files = [];
      
      if (req.file) {
        files.push(req.file);
      }
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          // req.files is an object (from upload.fields())
          Object.values(req.files).forEach((fieldFiles) => {
            files.push(...fieldFiles);
          });
        }
      }

      if (files.length === 0) {
        return next();
      }

      // Get uploads directory for disk storage processing
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      // Process each file
      for (const file of files) {
        // ========== VALIDATION ==========
        
        // Type validation
        if (validateTypes && !isAllowedType(file.mimetype)) {
          console.warn(`[MediaOptimizer] Rejected file type: ${file.mimetype}`);
          return res.status(400).json({
            error: `File type not allowed: ${file.mimetype}`,
            allowed: [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.videos, ...ALLOWED_TYPES.documents],
          });
        }

        // Size validation
        if (validateSize) {
          const sizeCheck = validateFileSize(file);
          if (!sizeCheck.valid) {
            console.warn(`[MediaOptimizer] File too large: ${file.originalname}`);
            return res.status(400).json({ error: sizeCheck.error });
          }
        }

        // ========== OPTIMIZATION ==========
        if (!skipOptimization) {
          await processFile(file, uploadsDir);
        }
      }

      next();
    } catch (err) {
      console.error("[MediaOptimizer] Middleware error:", err);
      next(err);
    }
  };
}

/**
 * Multer file filter for validating upload types
 * Use with multer({ fileFilter: mediaFileFilter })
 */
export function mediaFileFilter(req, file, cb) {
  if (isAllowedType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
}

/**
 * Export configuration for external use
 */
export { SIZE_LIMITS, ALLOWED_TYPES };

export default {
  optimizeMedia,
  mediaFileFilter,
  SIZE_LIMITS,
  ALLOWED_TYPES,
};
