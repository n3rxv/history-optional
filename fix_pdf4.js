const fs = require('fs');

// Fix evaluate qH
let ev = fs.readFileSync('app/evaluate/page.tsx', 'utf8');
ev = ev.replace(
  'const qH = qLines.length * 5.3 + 9;',
  'const qH = qLines.length * 7.5 + 14;'
);
ev = ev.replace(
  "qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 6 + i * 6.8); });",
  "qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 8 + i * 7.5); });"
);
fs.writeFileSync('app/evaluate/page.tsx', ev);
console.log('evaluate qH fixed');
