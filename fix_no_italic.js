const fs = require('fs');

['app/chat/page.tsx', 'app/evaluate/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Remove italic font fetch and registration entirely
  c = c.replace(
    /fetch\('\/LB-Italic\.ttf'\)\.then\(r => r\.arrayBuffer\(\)\)\.then\(b => btoa\(String\.fromCharCode\(\.\.\.new Uint8Array\(b\)\)\)\),\n/,
    ''
  );
  c = c.replace(
    /const \[lbReg, lbBold, lbItal\]/,
    'const [lbReg, lbBold]'
  );
  c = c.replace(
    /doc\.addFileToVFS\('LB-Italic\.ttf', lbItal\);\n/,
    ''
  );
  c = c.replace(
    /doc\.addFont\('LB-Italic\.ttf', 'LibreBaskerville', 'italic'\);\n/,
    ''
  );

  fs.writeFileSync(file, c);
  console.log(file, 'done');
});
