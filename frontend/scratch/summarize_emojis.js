const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'emojis_found.json'), 'utf-8'));

const grouped = {};
data.forEach(item => {
  if (!grouped[item.file]) {
    grouped[item.file] = [];
  }
  grouped[item.file].push({
    line: item.line,
    char: item.char,
    content: item.content
  });
});

console.log('Grouped Emojis by File:');
for (const [file, items] of Object.entries(grouped)) {
  console.log(`\nFile: ${file} (${items.length} occurrences)`);
  // Group by character within this file
  const chars = {};
  items.forEach(it => {
    if (!chars[it.char]) chars[it.char] = [];
    chars[it.char].push(`Line ${it.line}: ${it.content}`);
  });
  for (const [char, lines] of Object.entries(chars)) {
    console.log(`  Char '${char}' (${lines.length} times):`);
    lines.slice(0, 5).forEach(l => console.log(`    ${l}`));
    if (lines.length > 5) console.log(`    ... and ${lines.length - 5} more`);
  }
}
