// Script to generate PWA icons
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - clean white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Glass container background
  const padding = size * 0.15;
  const glassSize = size - (padding * 2);
  
  // Create glass effect
  const gradient = ctx.createLinearGradient(padding, padding, padding + glassSize, padding + glassSize);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
  
  // Draw glass container
  ctx.fillStyle = gradient;
  ctx.strokeStyle = 'rgba(166, 124, 0, 0.3)'; // Gold border
  ctx.lineWidth = size * 0.02;
  
  const radius = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(padding + radius, padding);
  ctx.lineTo(padding + glassSize - radius, padding);
  ctx.quadraticCurveTo(padding + glassSize, padding, padding + glassSize, padding + radius);
  ctx.lineTo(padding + glassSize, padding + glassSize - radius);
  ctx.quadraticCurveTo(padding + glassSize, padding + glassSize, padding + glassSize - radius, padding + glassSize);
  ctx.lineTo(padding + radius, padding + glassSize);
  ctx.quadraticCurveTo(padding, padding + glassSize, padding, padding + glassSize - radius);
  ctx.lineTo(padding, padding + radius);
  ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw "D" logo in the center
  const centerX = size / 2;
  const centerY = size / 2;
  const fontSize = size * 0.4;
  
  ctx.font = `bold ${fontSize}px Inter, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add shadow to text
  ctx.shadowColor = 'rgba(38, 38, 89, 0.1)';
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = size * 0.01;
  
  // Primary color text
  ctx.fillStyle = '#262659';
  ctx.fillText('D', centerX, centerY);
  
  // Add gold accent dot
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#A67C00';
  ctx.beginPath();
  ctx.arc(centerX + fontSize * 0.35, centerY + fontSize * 0.35, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  
  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated icon-${size}x${size}.png`);
}

// Generate all icons
console.log('Generating PWA icons...');
sizes.forEach(size => generateIcon(size));

// Generate special icons for shortcuts
function generateShortcutIcon(name, symbol) {
  const size = 192;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Glass effect
  const padding = size * 0.1;
  const glassSize = size - (padding * 2);
  
  const gradient = ctx.createLinearGradient(padding, padding, padding + glassSize, padding + glassSize);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
  
  ctx.fillStyle = gradient;
  ctx.strokeStyle = 'rgba(166, 124, 0, 0.5)';
  ctx.lineWidth = 3;
  
  const radius = 20;
  ctx.beginPath();
  ctx.moveTo(padding + radius, padding);
  ctx.lineTo(padding + glassSize - radius, padding);
  ctx.quadraticCurveTo(padding + glassSize, padding, padding + glassSize, padding + radius);
  ctx.lineTo(padding + glassSize, padding + glassSize - radius);
  ctx.quadraticCurveTo(padding + glassSize, padding + glassSize, padding + glassSize - radius, padding + glassSize);
  ctx.lineTo(padding + radius, padding + glassSize);
  ctx.quadraticCurveTo(padding, padding + glassSize, padding, padding + glassSize - radius);
  ctx.lineTo(padding, padding + radius);
  ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw symbol
  ctx.font = 'bold 80px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#A67C00';
  ctx.fillText(symbol, size / 2, size / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `${name}-shortcut.png`), buffer);
  console.log(`Generated ${name}-shortcut.png`);
}

// Generate shortcut icons
generateShortcutIcon('add', '+');
generateShortcutIcon('dashboard', '◉');

console.log('All icons generated successfully!'); 