const fs = require('fs');

['app/chat/page.tsx', 'app/evaluate/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  
  // Remove all font loading code
  c = c.replace(/const \{ LB_REGULAR.*?doc\.addFont\('LB-Bold\.ttf', 'LibreBaskerville', 'bold'\);\n/s, '');
  c = c.replace(/doc\.addFileToVFS.*?\n/g, '');
  c = c.replace(/doc\.addFont.*?\n/g, '');
  
  // Replace font references
  c = c.replace(/doc\.setFont\('LB', 'normal'\)/g, "doc.setFont('times', 'normal')");
  c = c.replace(/doc\.setFont\('LB', 'bold'\)/g, "doc.setFont('times', 'bold')");
  c = c.replace(/doc\.setFont\('LibreBaskerville', 'normal'\)/g, "doc.setFont('times', 'normal')");
  c = c.replace(/doc\.setFont\('LibreBaskerville', 'bold'\)/g, "doc.setFont('times', 'bold')");

  fs.writeFileSync(file, c);
  console.log(file, 'done');
});
