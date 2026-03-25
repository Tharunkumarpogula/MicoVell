const fs = require('fs');
const path = require('path');

// Map of picsum URLs to local replacements (both HTML and JS content)
const replacements = [
  { from: 'https://picsum.photos/600/500', to: '/images/hero-mushroom.webp' }, // About
  { from: 'https://picsum.photos/600/400', to: '/images/hero-mushroom.webp' }, // Contact
  { from: 'https://picsum.photos/1200/400', to: '/images/hero-mushroom.webp' }, // Education
  // Also encoded versions
  { from: encodeURIComponent('https://picsum.photos/600/500'), to: encodeURIComponent('/images/hero-mushroom.webp') },
  { from: encodeURIComponent('https://picsum.photos/600/400'), to: encodeURIComponent('/images/hero-mushroom.webp') },
  { from: encodeURIComponent('https://picsum.photos/1200/400'), to: encodeURIComponent('/images/hero-mushroom.webp') },
];

const outDir = path.join(__dirname, 'out');

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(name => {
    // Skip images directory
    if (name === 'images') return;
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) callback(filePath);
    else if (stat.isDirectory()) walkSync(filePath, callback);
  });
}

let count = 0;
walkSync(outDir, filePath => {
  if (!filePath.endsWith('.html') && !filePath.endsWith('.js')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  for (const r of replacements) {
    if (modified.includes(r.from)) {
      modified = modified.split(r.from).join(r.to);
    }
  }

  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
    count++;
    console.log(`Fixed images in: ${path.relative(outDir, filePath)}`);
  }
});

console.log(`\nDone! Fixed ${count} files.`);
