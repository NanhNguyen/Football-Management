const fs = require('fs');
const code = fs.readFileSync('/Users/namanhnguyen/Nanh/IT/Football Management/frontend/app/quan-tri/components/RefereeTab.tsx', 'utf8');

let stack = [];
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  if (char === '(' || char === '{' || char === '[') {
    stack.push({ char, pos: i });
  } else if (char === ')' || char === '}' || char === ']') {
    if (stack.length === 0) {
      console.log(`Unmatched closing char: ${char} at pos ${i}`);
      continue;
    }
    const last = stack.pop();
    if (
      (char === ')' && last.char !== '(') ||
      (char === '}' && last.char !== '{') ||
      (char === ']' && last.char !== '[')
    ) {
      console.log(`Mismatched: opened ${last.char} at pos ${last.pos} but closed ${char} at pos ${i}`);
    }
  }
}
if (stack.length > 0) {
  console.log(`Unclosed:`, stack.map(s => `${s.char} at pos ${s.pos}`));
} else {
  console.log("All clean!");
}
