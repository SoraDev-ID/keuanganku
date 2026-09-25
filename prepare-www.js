const fs = require('fs');
const path = require('path');

// 1. Prepare www directory for Capacitor
const wwwDir = path.join(__dirname, 'www');
if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest'
];

for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(wwwDir, file));
  }
}

const iconsSrc = path.join(__dirname, 'icons');
const iconsDest = path.join(wwwDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  fs.cpSync(iconsSrc, iconsDest, { recursive: true });
}

const vendorSrc = path.join(__dirname, 'vendor');
const vendorDest = path.join(wwwDir, 'vendor');
if (fs.existsSync(vendorSrc)) {
  fs.cpSync(vendorSrc, vendorDest, { recursive: true });
}

const jsSrc = path.join(__dirname, 'js');
const jsDest = path.join(wwwDir, 'js');
if (fs.existsSync(jsSrc)) {
  fs.cpSync(jsSrc, jsDest, { recursive: true });
}

// 2. Sync Android Launcher Icons if android project exists
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
if (fs.existsSync(resDir)) {
  const mipmaps = [
    { dir: 'mipmap-mdpi', src: 'icon-72.png' },
    { dir: 'mipmap-hdpi', src: 'icon-72.png' },
    { dir: 'mipmap-xhdpi', src: 'icon-96.png' },
    { dir: 'mipmap-xxhdpi', src: 'icon-144.png' },
    { dir: 'mipmap-xxxhdpi', src: 'icon-192.png' }
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.dir);
    const sourceIcon = path.join(iconsSrc, m.src);
    if (fs.existsSync(targetDir) && fs.existsSync(sourceIcon)) {
      fs.copyFileSync(sourceIcon, path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(sourceIcon, path.join(targetDir, 'ic_launcher_round.png'));
      fs.copyFileSync(sourceIcon, path.join(targetDir, 'ic_launcher_foreground.png'));
    }
  }
  console.log('Synchronized Android launcher icons!');
}

console.log('Successfully prepared www directory for Capacitor!');
