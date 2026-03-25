const fs = require('fs');
const path = require('path');

const CSS_TAG = '<link rel="stylesheet" href="/enhancements.css" />';
const JS_TAG = '<script src="/enhancements.js" defer></script>';

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(name => {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) callback(filePath);
    else if (stat.isDirectory()) walkSync(filePath, callback);
  });
}

const outDir = path.join(__dirname, 'out');
let count = 0;

walkSync(outDir, filePath => {
  if (!filePath.endsWith('.html')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // Inject CSS before </head> if not already injected
  if (!modified.includes('enhancements.css')) {
    modified = modified.replace('</head>', CSS_TAG + '</head>');
  }

  // Inject JS before </body> if not already injected
  if (!modified.includes('enhancements.js')) {
    modified = modified.replace('</body>', JS_TAG + '</body>');
  }

  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
    count++;
    console.log(`Injected enhancements into: ${path.relative(outDir, filePath)}`);
  }
});

console.log(`\nDone! Injected into ${count} HTML files.`);
