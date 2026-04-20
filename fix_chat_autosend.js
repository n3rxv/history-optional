const fs = require('fs');
let c = fs.readFileSync('app/chat/page.tsx', 'utf8');

// Add useSearchParams import if not present
if (!c.includes('useSearchParams')) {
  c = c.replace("'use client';", "'use client';\nimport { useSearchParams } from 'next/navigation';");
}

// Add auto-send logic inside the component, after useState declarations
// Find the pattern where messages state is declared
const insertAfter = "const [messages, setMessages] = useState";
const insertIdx = c.indexOf(insertAfter);
const lineEnd = c.indexOf('\n', insertIdx);

const autoSendCode = `
  // Auto-send model answer request from Daily Answer Writing
  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    const marks = searchParams.get('marks');
    const isModel = searchParams.get('model');
    if (q && isModel) {
      const prompt = \`Write a model UPSC Mains answer for the following \${marks ? marks + '-mark' : ''} History Optional question. Structure it with an introduction, well-organised body paragraphs with relevant facts, historiography, and a conclusion. Question: \${q}\`;
      // Trigger send after a short delay to let the component mount
      setTimeout(() => {
        setInput(prompt);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);`;

// Only insert if not already there
if (!c.includes('Auto-send model answer')) {
  c = c.slice(0, lineEnd + 1) + autoSendCode + c.slice(lineEnd + 1);
}

fs.writeFileSync('app/chat/page.tsx', c);
console.log('done');
