// Simple script to create placeholder icon files
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple placeholder SVG for each size
sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="white"/>
  
  <!-- Glass container -->
  <rect x="${size * 0.125}" y="${size * 0.125}" width="${size * 0.75}" height="${size * 0.75}" rx="${size * 0.125}" fill="rgba(255,255,255,0.7)" stroke="#A67C00" stroke-width="${size * 0.01}" opacity="0.5"/>
  
  <!-- Letter D -->
  <text x="${size * 0.5}" y="${size * 0.58}" font-family="Inter, sans-serif" font-size="${size * 0.4}" font-weight="bold" text-anchor="middle" fill="#262659">D</text>
  
  <!-- Gold dot -->
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.04}" fill="#A67C00"/>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

// Create shortcut icons
const shortcuts = [
  { name: 'add', symbol: '+' },
  { name: 'dashboard', symbol: '◉' }
];

shortcuts.forEach(({ name, symbol }) => {
  const svg = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="white"/>
  <rect x="24" y="24" width="144" height="144" rx="24" fill="rgba(255,255,255,0.7)" stroke="#A67C00" stroke-width="2" opacity="0.5"/>
  <text x="96" y="110" font-family="Inter, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="#A67C00">${symbol}</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `${name}-shortcut.svg`), svg);
  console.log(`Created ${name}-shortcut.svg`);
});

console.log('\nNote: These are SVG placeholders. For production, convert to PNG using a tool like:');
console.log('- ImageMagick: convert icon.svg icon.png');
console.log('- Online tools: svgtopng.com');
console.log('- Or use a proper icon generation library'); 