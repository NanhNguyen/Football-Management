const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    }
    else {
      if (file.endsWith('.module.css')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const frontendDir = path.resolve(__dirname, '..');
const cssFiles = walkSync(frontendDir);

cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Remove backdrop-filter lines completely
  content = content.replace(/.*backdrop-filter:.*[\r\n]+/g, '');

  // Replace background: rgba(255, 255, 255, X) with var(--color-surface)
  content = content.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*[0-9.]+\)/g, 'background: var(--color-surface)');
  content = content.replace(/background-color:\s*rgba\(255,\s*255,\s*255,\s*[0-9.]+\)/g, 'background-color: var(--color-surface)');

  // Replace border: Xpx solid rgba(255, 255, 255, X) with var(--color-border)
  content = content.replace(/border:\s*(.*?)\s*rgba\(255,\s*255,\s*255,\s*[0-9.]+\)/g, 'border: $1 var(--color-border)');
  content = content.replace(/border-color:\s*rgba\(255,\s*255,\s*255,\s*[0-9.]+\)/g, 'border-color: var(--color-border)');

  // Replace shadows based on primary color
  content = content.replace(/box-shadow:\s*.*?rgba\(15,\s*74,\s*78,\s*[0-9.]+\)/g, 'box-shadow: var(--shadow-sm)');
  content = content.replace(/box-shadow:\s*.*?rgba\(0,\s*0,\s*0,\s*[0-9.]+\)/g, 'box-shadow: var(--shadow-sm)');

  // Some specific rgba(15, 74, 78) for backgrounds
  content = content.replace(/background:\s*rgba\(15,\s*74,\s*78,\s*[0-9.]+\)/g, 'background: var(--color-primary-light, #E0F2F1)');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file.replace(frontendDir, '')}`);
  }
});

console.log('CSS Migration completed.');
