// Simple script to create basic app icons programmatically
const fs = require('fs');

// Create a simple SVG icon
const svgIcon = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <circle cx="128" cy="128" r="120" fill="#e74c3c" stroke="#c0392b" stroke-width="8"/>
  <circle cx="128" cy="128" r="80" fill="#ffffff" opacity="0.9"/>
  <text x="128" y="140" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#e74c3c">⏱</text>
  <text x="128" y="200" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#2c3e50">Pomodoro</text>
</svg>
`;

fs.writeFileSync('./icon.svg', svgIcon);
console.log('SVG icon created: icon.svg');
console.log('Use online converters or imagemagick to convert to PNG, ICO, ICNS formats');
console.log('For example: convert icon.svg -resize 256x256 icon.png');