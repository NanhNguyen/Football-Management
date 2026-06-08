const fs = require('fs');
const path = require('path');

// Regex for emojis (handling standard emojis, symbols, and shapes like stars)
const EMOJI_REGEX = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|⭐|★|☆|🔴|🔵|🏆|⚽|📅|📊|👥|⚙️|⏱️|⚔️|🆚|🪈|📣|👮|ℹ️|⚠️|👑|🟨|🟥|📝|✏️|🗑️|💾|➕|🔒|🔑|👤|🧤|🎯|🏃|⬇️|⬅️|➡️|🔥|✨|🔄|📅|📁|📈|⚡|🔔)/g;

const DIRS_TO_SCAN = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components')
];

const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.css'];

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(filePath));
    } else {
      const ext = path.extname(filePath).toLowerCase();
      if (IGNORE_EXTENSIONS.includes(ext)) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(EMOJI_REGEX);
        if (matches) {
          matches.forEach(emoji => {
            // Filter out characters that are just ordinary characters (e.g. em dash, etc)
            if (emoji === '—' || emoji === '–') return;
            results.push({
              file: path.relative(path.join(__dirname, '..'), filePath),
              line: index + 1,
              char: emoji,
              content: line.trim()
            });
          });
        }
      });
    }
  }
  return results;
}

console.log('Scanning directories...');
const allResults = [];
DIRS_TO_SCAN.forEach(dir => {
  allResults.push(...scanDir(dir));
});

// Save to scratch/emojis_found.json
const destPath = path.join(__dirname, 'emojis_found.json');
fs.writeFileSync(destPath, JSON.stringify(allResults, null, 2));

console.log(`Saved results to ${destPath}`);
console.log(`Total occurrences found: ${allResults.length}`);

// Print summary of unique characters
const summary = {};
allResults.forEach(r => {
  summary[r.char] = (summary[r.char] || 0) + 1;
});
console.log('Unique characters found:', summary);
