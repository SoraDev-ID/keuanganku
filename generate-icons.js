const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const WALLET_PATH = "M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM416 336c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z";

function getSVG(size, isMaskable = false) {
  const bg = isMaskable
    ? `<rect width="512" height="512" fill="url(#brandGrad)" />`
    : `<rect width="512" height="512" rx="125" ry="125" fill="url(#brandGrad)" />`;
  
  const scale = isMaskable ? 0.44 : 0.52;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>
  ${bg}
  <g transform="translate(256, 256) scale(${scale}) translate(-256, -256)">
    <path fill="#ffffff" d="${WALLET_PATH}"/>
  </g>
</svg>`;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write the canonical icon.svg (512x512 squircle)
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), getSVG(512, false), 'utf8');

const targets = [
  { name: 'icon-72.png', size: 72, maskable: false },
  { name: 'icon-96.png', size: 96, maskable: false },
  { name: 'icon-128.png', size: 128, maskable: false },
  { name: 'icon-144.png', size: 144, maskable: false },
  { name: 'icon-152.png', size: 152, maskable: false },
  { name: 'icon-180.png', size: 180, maskable: false },
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-384.png', size: 384, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon.png', size: 64, maskable: false }
];

for (const target of targets) {
  const filePath = path.join(iconsDir, target.name);
  console.log(`Generating ${target.name} (${target.size}x${target.size})...`);
  const svg = getSVG(target.size, target.maskable);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: target.size
    }
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(filePath, pngBuffer);
}

console.log('All brand-matched icons generated successfully!');
