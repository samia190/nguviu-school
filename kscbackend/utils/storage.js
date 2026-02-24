import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// ══════════════════════════════════════════════════════════════
// Cloudinary integration — preferred cloud storage
// Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
// ══════════════════════════════════════════════════════════════
function isCloudinaryEnabled() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("[Storage] ☁️  Cloudinary enabled —", process.env.CLOUDINARY_CLOUD_NAME);
}

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} filename - original filename (used for public_id)
 * @param {string} mimetype
 * @returns {Promise<{url: string, public_id: string, filename: string}>}
 */
async function uploadToCloudinary(buffer, filename, mimetype) {
  const safeName = filename.replace(/\s+/g, "_").replace(/\.[^.]+$/, "");
  const folder = process.env.CLOUDINARY_FOLDER || "kangaru";
  const resourceType = mimetype?.startsWith("video/") ? "video" : "image";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${safeName}`,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          filename: result.public_id.split("/").pop(),
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public_id or URL
 * @param {string} publicIdOrUrl
 * @returns {Promise<boolean>}
 */
async function deleteFromCloudinary(publicIdOrUrl) {
  try {
    let publicId = publicIdOrUrl;
    // If it's a full Cloudinary URL, extract the public_id
    if (publicId?.startsWith("http") && publicId.includes("cloudinary")) {
      // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<id>.<ext>
      const parts = publicId.split("/upload/");
      if (parts[1]) {
        // Remove version and extension
        publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
      }
    }
    if (!publicId) return false;
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (err) {
    console.warn("[Storage] Cloudinary delete failed:", err.message);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// Optional AWS S3 integration (uses @aws-sdk/client-s3)
// ══════════════════════════════════════════════════════════════
let s3Client = null;
let S3Client, PutObjectCommand, DeleteObjectCommand;

function isS3Enabled() {
  return !!process.env.S3_BUCKET;
}

if (isS3Enabled()) {
  try {
    ({ S3Client, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3"));
    const region = process.env.AWS_REGION || "us-east-1";
    const clientConfig = { region };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    s3Client = new S3Client(clientConfig);
  } catch (err) {
    console.warn("S3 is enabled but @aws-sdk/client-s3 could not be loaded:", err.message);
    s3Client = null;
  }
}

async function uploadBufferToS3(buffer, filename, contentType) {
  if (!s3Client) throw new Error("S3 client not configured");
  const bucket = process.env.S3_BUCKET;
  const keyPrefix = process.env.S3_KEY_PREFIX ? `${process.env.S3_KEY_PREFIX.replace(/\/+$/,'')}/` : "";
  const key = `${keyPrefix}uploads/${Date.now()}-${filename.replace(/\s+/g, "_")}`;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: process.env.S3_PUBLIC === "false" ? undefined : "public-read",
  });

  await s3Client.send(cmd);

  const baseUrl = process.env.S3_BASE_URL || `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`;
  return { key, url: `${baseUrl}/${key}` };
}

// ══════════════════════════════════════════════════════════════
// Disk storage fallback (local development)
// ══════════════════════════════════════════════════════════════
function saveBufferToDisk(buffer, filename, uploadsDir) {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
  const dest = path.join(uploadsDir, safeName);
  fs.writeFileSync(dest, buffer);
  return { filename: safeName, url: `/uploads/${safeName}` };
}

// ══════════════════════════════════════════════════════════════
// Unified upload function: Cloudinary > S3 > Disk
// All routes should use this for consistent behaviour
// PRODUCTION CONSTRAINT: Cloudinary is required on Render (disk is ephemeral)
// ══════════════════════════════════════════════════════════════
/**
 * Upload a buffer to the best available storage backend.
 * Priority: Cloudinary → S3 → Disk (development only)
 * @param {Buffer} buffer
 * @param {string} filename - original filename
 * @param {string} mimetype
 * @param {string} [uploadsDir] - disk fallback dir (default: public/uploads)
 * @returns {Promise<{url: string, filename: string, public_id?: string, key?: string}>}
 */
async function uploadBuffer(buffer, filename, mimetype, uploadsDir) {
  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(buffer, filename, mimetype);
  }
  
  if (isS3Enabled()) {
    return uploadBufferToS3(buffer, filename, mimetype);
  }

  // PRODUCTION SAFETY: Render environment requires Cloudinary or S3
  // Local disk storage is ephemeral on Render (deleted on dyno restart)
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ FILE UPLOAD FAILED: Cloudinary or S3 not configured.\n" +
      "On Render (production), file storage must use Cloudinary or S3.\n" +
      "Local disk storage (/uploads/) is NOT persistent on Render.\n\n" +
      "FIX: Set these environment variables in Render Dashboard:\n" +
      "  CLOUDINARY_CLOUD_NAME\n" +
      "  CLOUDINARY_API_KEY\n" +
      "  CLOUDINARY_API_SECRET\n\n" +
      "Get them from: https://console.cloudinary.com/settings/api"
    );
  }

  // Development-only: fallback to disk
  const dir = uploadsDir || path.join(process.cwd(), "public", "uploads");
  return saveBufferToDisk(buffer, filename, dir);
}

// ========== Helper to save video thumbnails ==========
/**
 * Save a video thumbnail to storage (Cloudinary > S3 > Disk)
 * Production uses Cloudinary or S3 only.
 * @param {Buffer} thumbnailBuffer
 * @param {string} thumbnailName
 * @param {string} uploadsDir
 * @returns {Promise<{url: string, filename?: string}>}
 */
async function saveThumbnail(thumbnailBuffer, thumbnailName, uploadsDir) {
  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(thumbnailBuffer, thumbnailName, "image/jpeg");
  }
  if (isS3Enabled()) {
    return uploadBufferToS3(thumbnailBuffer, thumbnailName, "image/jpeg");
  }
  
  // Production safety check
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ THUMBNAIL UPLOAD FAILED: Cloudinary or S3 not configured.\n" +
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Render environment."
    );
  }
  
  return saveBufferToDisk(thumbnailBuffer, thumbnailName, uploadsDir);
}

export {
  isCloudinaryEnabled,
  uploadToCloudinary,
  deleteFromCloudinary,
  isS3Enabled,
  uploadBufferToS3,
  saveBufferToDisk,
  uploadBuffer,
  saveThumbnail,
};

async function deleteFromS3Key(key) {
  if (!s3Client) throw new Error("S3 client not configured");
  const cmd = new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  await s3Client.send(cmd);
}

function deleteFileFromDisk(urlOrPath, uploadsDir = path.join(process.cwd(), "public", "uploads")) {
  try {
    if (!urlOrPath) return false;
    const basename = path.basename(String(urlOrPath));
    const filePath = path.join(uploadsDir, basename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("deleteFileFromDisk failed:", err.message);
    return false;
  }
}

/**
 * Delete a file from the best available storage backend.
 * Priority: Cloudinary (if URL contains cloudinary) → S3 → Disk
 */
async function deleteFile(urlOrKey) {
  if (!urlOrKey) return false;
  const str = String(urlOrKey);

  // Cloudinary URLs
  if (str.includes("cloudinary")) {
    return deleteFromCloudinary(str);
  }

  // S3
  if (isS3Enabled()) {
    try {
      if (str.startsWith("http")) {
        const parts = str.split("/");
        const idx = parts.findIndex((p) => p.includes(process.env.S3_BUCKET));
        if (idx >= 0) {
          const key = parts.slice(idx + 1).join("/");
          await deleteFromS3Key(key);
          return true;
        }
        const possibleKey = parts.slice(3).join("/");
        await deleteFromS3Key(possibleKey);
        return true;
      } else {
        const key = String(urlOrKey).replace(/^\//, "");
        await deleteFromS3Key(key);
        return true;
      }
    } catch (err) {
      console.warn("S3 delete failed:", err.message);
    }
  }

  // Disk fallback
  return deleteFileFromDisk(urlOrKey);
}

export { deleteFile };
