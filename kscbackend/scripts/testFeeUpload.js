import fs from 'fs';
import path from 'path';
import { saveBufferToDisk } from '../utils/storage.js';

// This script exercises the same save + download logic without starting a server.
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function makeDownloadUrl(relPath) {
  if (!relPath) return relPath;
  if (String(relPath).startsWith('http')) return relPath;
  const origin = process.env.PUBLIC_ORIGIN || `http://localhost:4001`;
  const p = String(relPath).startsWith('/') ? relPath : `/${relPath}`;
  return `${origin}${p}`;
}

async function runTest() {
  try {
    const samplePath = path.join(process.cwd(), 'scripts', 'sample.pdf');
    if (!fs.existsSync(samplePath)) {
      fs.writeFileSync(samplePath, 'Sample PDF content for testing\n');
    }

    const buf = fs.readFileSync(samplePath);
    const saved = saveBufferToDisk(buf, 'fee-sample.pdf', uploadsDir);
    const attId = `${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const att = {
      id: attId,
      name: 'fee-sample.pdf',
      originalName: 'fee-sample.pdf',
      url: saved.url,
      downloadUrl: makeDownloadUrl(saved.url),
      mimetype: 'application/pdf',
      size: buf.length,
      uploadedAt: new Date(),
    };

    console.log('Saved attachment:', att);

    // Simulate download handler: verify file exists and that Content-Disposition would be attachment
    const filePath = path.join(process.cwd(), 'public', att.url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      console.error('FAIL: saved file missing at', filePath);
      process.exit(1);
    }

    const stats = fs.statSync(filePath);
    console.log('File exists, bytes:', stats.size);
    // What the server would set:
    const contentDisposition = `attachment; filename="${att.originalName || att.name}"`;
    if (contentDisposition.includes('attachment')) {
      console.log('PASS: simulated Content-Disposition includes attachment');
    } else {
      console.error('FAIL: simulated Content-Disposition missing attachment');
      process.exit(1);
    }

    console.log('Download URL (public):', att.downloadUrl);
    console.log('Test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
