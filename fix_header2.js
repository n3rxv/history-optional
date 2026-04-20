const fs = require('fs');
let c = fs.readFileSync('app/chat/page.tsx', 'utf8');
c = c.replace(
  /        <div className="chat-header"[^>]*>[\s\S]*?<\/div>/,
  ''
);
fs.writeFileSync('app/chat/page.tsx', c);
console.log('done');
