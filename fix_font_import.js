const fs = require('fs');

['app/chat/page.tsx', 'app/evaluate/page.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Replace fetch-based font loading with static import
  c = c.replace(
    /const \[lbReg, lbBold, lbItal\] = await Promise\.all\(\[[\s\S]*?\]\);/,
    `const { LB_REGULAR: lbReg, LB_BOLD: lbBold, LB_ITALIC: lbItal } = await import('@/lib/lb-fonts');`
  );

  fs.writeFileSync(file, c);
  console.log(file, 'done');
});
