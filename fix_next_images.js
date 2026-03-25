const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function(name) {
    if (name === 'images') return; // skip images dir
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
  if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.txt')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // match srcSet="..." or srcSet:'...'
    content = content.replace(/srcSet(?:=|:)"[^"]*"/g, 'srcSet=""');
    content = content.replace(/srcSet(?:=|:)'[^']*'/g, "srcSet=''");
    
    content = content.replace(/src(=|:)"\/_next\/image\?url=([^"&]+)[^"]*"/g, (match, sep, url) => {
      return 'src' + sep + '"' + decodeURIComponent(url) + '"';
    });
    
    // sometimes url string is literally "/images/..." not URL encoded if the previous script didn't url-encode it
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
    }
  }
});
console.log(`Fixed next/image URLs in ${count} files.`);
