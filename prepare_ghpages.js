/**
 * Prepares the out/ directory for GitHub Pages deployment.
 * GitHub Pages serves MicoVell from https://tharunkumarpogula.github.io/MicoVell/
 * So all absolute paths must be prefixed with /MicoVell
 */
const fs = require('fs');
const path = require('path');

const BASE = '/MicoVell';
const outDir = path.join(__dirname, 'out');

// Assets/paths that need the base prefix
const PREFIXES = [
  '"/images/',
  "'/images/",
  '"/enhancements.css',
  "'/enhancements.css",
  '"/enhancements.js',
  "'/enhancements.js",
  '"/favicon.',
  "'/favicon.",
  '"/_next/',
  "'/_next/",
  '"/shop"',  "'/shop'",  '"/shop/',  "'/shop/",
  '"/cart"',  "'/cart'",  '"/checkout"', "'/checkout'",
  '"/about"', "'/about'", '"/contact"',  "'/contact'",
  '"/education"', "'/education'", '"/login"', "'/login'",
  '"/privacy-policy"', "'/privacy-policy'",
  '"/terms-conditions"', "'/terms-conditions'",
  '="/shop', "='/shop",  '="/cart', "='/cart",
  '="/checkout', "='/checkout", '="/about', "='/about",
  '="/contact', "='/contact", '="/education', "='/education",
  '="/login', "='/login", '="/privacy', "='/privacy",
  '="/terms', "='/terms", '="/"', "='/'",
  // href=/
  'href="/', "href='/",
  // src=/
  'src="/', "src='/",
  // action=/
  'action="/', "action='/",
];

function fixBasePath(content) {
  let result = content;

  // Generic: href="/ and src="/ prefixes - replace all absolute paths
  result = result.replace(/(href|src|action)="\//g, `$1="${BASE}/`);
  result = result.replace(/(href|src|action)='\//g, `$1='${BASE}/`);

  // JSON-encoded paths in Next.js RSC payloads
  result = result.replace(/\\\"(\/images\/)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/_next\/)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/shop)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/cart)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/about)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/contact)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/education)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/checkout)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/login)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/favicon)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/enhancements)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/privacy-policy)/g, `\\"${BASE}$1`);
  result = result.replace(/\\\"(\/terms-conditions)/g, `\\"${BASE}$1`);

  // Fix any double-prefixed paths from re-runs
  const dbl = new RegExp(`${BASE}${BASE}`, 'g');
  result = result.replace(dbl, BASE);

  return result;
}

// Copy out/ to out-gh/ and fix paths
const ghDir = path.join(__dirname, 'out-gh');
if (fs.existsSync(ghDir)) fs.rmSync(ghDir, { recursive: true });
fs.mkdirSync(ghDir, { recursive: true });

function copyAndFix(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyAndFix(srcPath, destPath);
    } else {
      if (['.html', '.js', '.css', '.txt', '.json'].some(ext => name.endsWith(ext))) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = fixBasePath(content);
        fs.writeFileSync(destPath, content, 'utf8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

console.log('Copying and fixing base paths...');
copyAndFix(outDir, ghDir);

// Add .nojekyll so GH Pages doesn't skip _next folder
fs.writeFileSync(path.join(ghDir, '.nojekyll'), '', 'utf8');

// Add 404.html as a copy of index.html for SPA-like routing support
const indexPath = path.join(ghDir, 'index.html');
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, path.join(ghDir, '404.html'));
}

console.log(`Done! out-gh/ is ready for GitHub Pages. Total files: ${countFiles(ghDir)}`);

function countFiles(dir) {
  let c = 0;
  fs.readdirSync(dir).forEach(n => {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) c += countFiles(p);
    else c++;
  });
  return c;
}
