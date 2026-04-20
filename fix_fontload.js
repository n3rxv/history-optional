const fs = require('fs');

const newFontLoader = `
  const [lbReg, lbBold, lbItal] = await Promise.all([
    fetch('/LB-Regular.ttf').then(r => r.arrayBuffer()).then(b => btoa(String.fromCharCode(...new Uint8Array(b)))),
    fetch('/LB-Bold.ttf').then(r => r.arrayBuffer()).then(b => btoa(String.fromCharCode(...new Uint8Array(b)))),
    fetch('/LB-Italic.ttf').then(r => r.arrayBuffer()).then(b => btoa(String.fromCharCode(...new Uint8Array(b)))),
  ]);
  doc.addFileToVFS('LB-Regular.ttf', lbReg);
  doc.addFileToVFS('LB-Bold.ttf', lbBold);
  doc.addFileToVFS('LB-Italic.ttf', lbItal);
  doc.addFont('LB-Regular.ttf', 'LibreBaskerville', 'normal');
  doc.addFont('LB-Bold.ttf', 'LibreBaskerville', 'bold');
  doc.addFont('LB-Italic.ttf', 'LibreBaskerville', 'italic');
`;

['app/chat/page.tsx', 'app/evaluate/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(
    /\/\/ Embed Libre Baskerville[\s\S]*?doc\.addFont\('LB-Italic\.ttf', 'LibreBaskerville', 'italic'\);\n/,
    newFontLoader.trim() + '\n'
  );
  fs.writeFileSync(file, c);
  console.log(file, 'done');
});
