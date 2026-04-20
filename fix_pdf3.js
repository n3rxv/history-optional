const fs = require('fs');

['app/chat/page.tsx', 'app/evaluate/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Remove all italic — replace with normal
  c = c.replace(/doc\.setFont\('LibreBaskerville', 'italic'\)/g, "doc.setFont('LibreBaskerville', 'normal')");

  // Fix question box — use narrower width and bigger line height for box calc
  c = c.replace(
    /const qLines = doc\.splitTextToSize\(.*?, contentW - \d+\) as string\[\];/g,
    "const qLines = doc.splitTextToSize(clean ? clean(question) : strip(questionText!), contentW - 14) as string[];"
  );
  c = c.replace(
    /const qH = qLines\.length \* 7\.2 \+ 12;/g,
    'const qH = qLines.length * 7.5 + 14;'
  );
  c = c.replace(
    /const qH = qLines\.length \* 6\.8 \+ 12;/g,
    'const qH = qLines.length * 7.5 + 14;'
  );
  c = c.replace(
    /qLines\.forEach\(\(l: string, i: number\) => \{ doc\.text\(l, M \+ 6, y \+ 7 \+ i \* 6\.8\); \}\);/g,
    'qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 8 + i * 7.5); });'
  );

  fs.writeFileSync(file, c);
  console.log(file, 'done');
});
