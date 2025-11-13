/*
 * Simple SVG → PNG converter using sharp
 * Usage:
 *   node scripts/convert-svg-to-png.js <input.svg> <output.png> [width] [height]
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const [, , inputPath, outputPath, widthArg, heightArg] = process.argv;

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/convert-svg-to-png.js <input.svg> <output.png> [width] [height]');
    process.exit(1);
  }

  const width = widthArg ? parseInt(widthArg, 10) : 1200;
  const height = heightArg ? parseInt(heightArg, 10) : 800;

  // Lazy import to avoid requiring sharp when not running the script
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Missing dependency: sharp. Install with "npm i -D sharp" in mobile-app.');
    process.exit(1);
  }

  try {
    const svgBuffer = fs.readFileSync(path.resolve(inputPath));
    await sharp(svgBuffer)
      .resize(width, height, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(path.resolve(outputPath));
    console.log(`PNG generated: ${outputPath} (${width}x${height})`);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

main();