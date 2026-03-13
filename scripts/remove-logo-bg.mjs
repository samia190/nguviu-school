/**
 * Removes the background from the school logo.
 * Works by sampling the corner pixels to identify the background colour,
 * then marks every pixel within a colour-distance threshold as transparent.
 * Saves the result back over the existing logo.png / favicon.png.
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT  = path.resolve(__dirname, '../kscfrontend/public/header/logo new.PNG');
const OUTPUT_LOGO    = path.resolve(__dirname, '../kscfrontend/public/header/logo.png');
const OUTPUT_FAVICON = path.resolve(__dirname, '../kscfrontend/public/header/favicon.png');

// Colour-distance threshold (0-255). Higher = removes more background detail.
// 50 works well for plain white/off-white backgrounds without eating into the logo.
const THRESHOLD = 50;

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    (r1 - r2) ** 2 +
    (g1 - g2) ** 2 +
    (b1 - b2) ** 2
  );
}

async function removeBg(inputPath, outputPath) {
  const image = sharp(inputPath).ensureAlpha();
  const { width, height } = await image.metadata();

  // Get raw RGBA pixel data
  const { data } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);

  // Sample the four corners to determine background colour (average them)
  function pixelAt(x, y) {
    const i = (y * width + x) * 4;
    return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
  }

  const corners = [
    pixelAt(0, 0),
    pixelAt(width - 1, 0),
    pixelAt(0, height - 1),
    pixelAt(width - 1, height - 1),
  ];

  const bg = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
  };

  console.log(`Detected background colour: rgb(${bg.r}, ${bg.g}, ${bg.b})`);

  // BFS flood-fill from all four corners simultaneously
  const visited = new Uint8Array(width * height);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    const dist = colorDistance(pixels[i], pixels[i + 1], pixels[i + 2], bg.r, bg.g, bg.b);
    if (dist > THRESHOLD) return;
    visited[idx] = 1;
    queue.push([x, y]);
  }

  enqueue(0, 0);
  enqueue(width - 1, 0);
  enqueue(0, height - 1);
  enqueue(width - 1, height - 1);

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const i = (y * width + x) * 4;
    // Make transparent
    pixels[i + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  // Write output as PNG with transparency
  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`Saved: ${outputPath}`);
}

(async () => {
  try {
    await removeBg(INPUT, OUTPUT_LOGO);
    await removeBg(INPUT, OUTPUT_FAVICON);
    console.log('\nDone! Background removed from logo.png and favicon.png');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
