import fs from 'fs';
import path from 'path';

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    if (fs.statSync(full).isDirectory()) res.push(...walk(full));
    else if (/\.(ts|tsx|js|json|compact)$/.test(f)) res.push(full);
  }
  return res;
}

const files = walk('.');
const matches = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const stringRegex = /['"`]([^'"`\n\r]+)['"`]/g;
  let m;
  while ((m = stringRegex.exec(content)) !== null) {
    const s = m[1];
    if (s.length >= 5 && s[4] === 'p') {
      matches.push({ file, s: s.substring(0, 50) });
    }
  }
}
console.log(JSON.stringify(matches, null, 2));
