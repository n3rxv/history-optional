const fs = require('fs');
let c = fs.readFileSync('app/chat/page.tsx', 'utf8');
c = c.replace(
  `        <div className="chat-header">
          <div className="chat-header-icon">⚔</div>
          <div>
            <div className="chat-header-title">AI History Assistant</div>
            <div className="chat-header-sub">UPSC History Optional</div>
          </div>
          <button className="chat-new-btn" onClick={() => setMessages([{
            role: 'assistant',
            content: 'New conversation started. What would you like to study?',
          }])}>+ New Chat</button>
        </div>`,
  `        <div className="chat-header" style={{justifyContent:'flex-end'}}>
          <button className="chat-new-btn" onClick={() => setMessages([{
            role: 'assistant',
            content: 'New conversation started. What would you like to study?',
          }])}>+ New Chat</button>
        </div>`
);
fs.writeFileSync('app/chat/page.tsx', c);
console.log('done');
