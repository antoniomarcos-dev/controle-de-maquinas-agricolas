/**
 * Generate PWA icon PNGs from an SVG template.
 * Uses <canvas> via the `canvas` npm package — run with Node.js.
 * If canvas is not installed, it will create simple placeholder PNGs.
 */
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

// Create a simple SVG icon
function createSVG(size) {
  const pad = Math.round(size * 0.1);
  const iconSize = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const fontSize = Math.round(size * 0.45);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#16a34a"/>
  <text x="${cx}" y="${cy + fontSize * 0.35}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">C</text>
</svg>`;
}

// Write SVG files as fallback (browsers can use SVG icons too)
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSVG(size);
  const svgPath = path.join(outDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created: icon-${size}x${size}.svg`);
});

console.log('\\nIcons generated. For production, convert SVGs to PNGs using an image tool.');
