const fs = require('fs');
const path = require('path');

// 1. Copy image for hero background
const srcImage = path.join(__dirname, 'istockphoto-615078692-612x612.webp');
const destImage = path.join(__dirname, 'out', 'images', 'hero-mushroom.webp');
if (!fs.existsSync(path.dirname(destImage))) {
    fs.mkdirSync(path.dirname(destImage), { recursive: true });
}
fs.copyFileSync(srcImage, destImage);

// 2. Walk dir to replace picsum hero image
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
walkSync(dir, (filePath) => {
  if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.txt')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const u1 = "https://picsum.photos/1920/1080";
    const u1enc = encodeURIComponent(u1);
    
    let modified = content;
    modified = modified.split(u1).join('/images/hero-mushroom.webp');
    modified = modified.split(u1enc).join(encodeURIComponent('/images/hero-mushroom.webp'));
    
    // Also patch any remaining 600/600 picsum images that were not replaced properly in the JS chunks
    for (let i = 1; i <= 4; i++) {
        const pUrl = `https://picsum.photos/600/600?random=${i}`;
        const pEnc = encodeURIComponent(pUrl);
        const map = {
            1: '/images/products/cordy_powder.png',
            2: '/images/products/cordy_capsules.png',
            3: '/images/products/cordy_tincture.png',
            4: '/images/products/cordy_tea.png',
        };
        modified = modified.split(pUrl).join(map[i]);
        modified = modified.split(pEnc).join(encodeURIComponent(map[i]));
    }
    
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`Updated hero/product image paths in: ${filePath}`);
    }
  }
});

// 3. Patch Next.js image loader chunk to return plain URLs
// Because when the React app hydrates or does client-side transitions,
// next/image runs its loader to generate /_next/image?url=...
const chunkPath = path.join(__dirname, 'out', '_next', 'static', 'chunks', '63-0cbb5ec51e569e0d.js');
if (fs.existsSync(chunkPath)) {
    let chunkContent = fs.readFileSync(chunkPath, 'utf8');
    const targetCode = 'return r.path+"?url="+encodeURIComponent(n)+"\\x26w="+i+"\\x26q="+l+(n.startsWith("/_next/static/media/"),"")';
    if (chunkContent.includes(targetCode)) {
        chunkContent = chunkContent.replace(targetCode, 'return n');
        fs.writeFileSync(chunkPath, chunkContent, 'utf8');
        console.log('Patched Next.js default image loader to serve direct image URLs client-side!');
    } else {
        console.log('Could not find the target code in chunk 63. Perhaps already patched.');
    }
}

console.log('All updates complete.');
