import fs from "fs";
import path from "path";

// Optional AWS S3 integration (uses @aws-sdk/client-s3)
let s3Client = null;
let S3Client, PutObjectCommand, DeleteObjectCommand;

function isS3Enabled() {
  return !!process.env.S3_BUCKET;
}

if (isS3Enabled()) {
  try {
    // dynamic import so running without the package still works for local dev
    // eslint-disable-next-line import/no-extraneous-dependencies
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

function saveBufferToDisk(buffer, filename, uploadsDir) {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
  const dest = path.join(uploadsDir, safeName);
  fs.writeFileSync(dest, buffer);
  return { filename: safeName, url: `/uploads/${safeName}` };
}

export { isS3Enabled, uploadBufferToS3, saveBufferToDisk };

async function deleteFromS3Key(key) {
  if (!s3Client) throw new Error("S3 client not configured");
  const cmd = new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  await s3Client.send(cmd);
}

function deleteFileFromDisk(urlOrPath, uploadsDir = path.join(process.cwd(), "public", "uploads")) {
  try {
    if (!urlOrPath) return false;
    // urlOrPath may be '/uploads/filename' or absolute path
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

async function deleteFile(urlOrKey) {
  if (!urlOrKey) return false;
  // If S3 is enabled and urlOrKey looks like an S3 key or URL, try S3
  if (isS3Enabled()) {
    try {
      // If it's a full S3 url, extract key after bucket
      const str = String(urlOrKey);
      if (str.startsWith("http")) {
        const parts = str.split("/");
        // key is everything after the bucket name
        const idx = parts.findIndex((p) => p.includes(process.env.S3_BUCKET));
        if (idx >= 0) {
          const key = parts.slice(idx + 1).join("/");
          await deleteFromS3Key(key);
          return true;
        }
        // fallback: attempt to use full path after domain
        const possibleKey = parts.slice(3).join("/");
        await deleteFromS3Key(possibleKey);
        return true;
      } else {
        // If string contains key prefix (uploads/...), use as key
        const key = String(urlOrKey).replace(/^\//, "");
        await deleteFromS3Key(key);
        return true;
      }
    } catch (err) {
      console.warn("S3 delete failed:", err.message);
      // fallthrough to disk delete attempt
    }
  }

  // Try disk delete
  return deleteFileFromDisk(urlOrKey);
}

export { deleteFile };
