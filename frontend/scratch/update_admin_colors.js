const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const quanTriDir = path.resolve(__dirname, '../app/quan-tri');
let files = walkSync(quanTriDir);
files.push(path.resolve(__dirname, '../components/AdminOnboardingTour.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/#D71920/g, '#0F766E')
    .replace(/rgba\(215,\s*25,\s*32/g, 'rgba(15, 118, 110');
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
