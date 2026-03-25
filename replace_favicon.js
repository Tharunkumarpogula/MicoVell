const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function(name) {
    if (name === 'images') return;
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
        callback(filePath, stat);
    } else if (stat.isDirectory()) {
        walkSync(filePath, callback);
    }
  });
}

const dir = path.join(__dirname, 'out');
let count = 0;
walkSync(dir, (filePath) => {
  if (filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace the existing favicon link with the new SVG logo
    content = content.replace(/<link[^>]+rel="icon"[^>]*>/i, '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
    
    // Since there might be multiple (like shortcut icon), let's just make sure we do a global replace or similar.
    // In shop.html: <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16"/>
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
    }
  }
});
console.log(`Updated favicon link in ${count} files.`);
