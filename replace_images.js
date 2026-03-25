const fs = require('fs');
const path = require('path');

const replacements = {
  'https://picsum.photos/600/600?random=1': '/images/products/cordy_powder.png',
  'https://picsum.photos/600/600?random=2': '/images/products/cordy_capsules.png',
  'https://picsum.photos/600/600?random=3': '/images/products/cordy_tincture.png',
  'https://picsum.photos/600/600?random=4': '/images/products/cordy_tea.png',
  'https%3A%2F%2Fpicsum.photos%2F600%2F600%3Frandom%3D1': '%2Fimages%2Fproducts%2Fcordy_powder.png',
  'https%3A%2F%2Fpicsum.photos%2F600%2F600%3Frandom%3D2': '%2Fimages%2Fproducts%2Fcordy_capsules.png',
  'https%3A%2F%2Fpicsum.photos%2F600%2F600%3Frandom%3D3': '%2Fimages%2Fproducts%2Fcordy_tincture.png',
  'https%3A%2F%2Fpicsum.photos%2F600%2F600%3Frandom%3D4': '%2Fimages%2Fproducts%2Fcordy_tea.png'
};

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
walkSync(dir, (filePath) => {
  if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.txt')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    for (const [key, value] of Object.entries(replacements)) {
      if (content.includes(key)) {
        content = content.split(key).join(value);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
console.log('Replacement complete.');
