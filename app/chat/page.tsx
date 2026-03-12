'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED = [
  'What was Ashoka\'s concept of Dhamma? How was it different from Buddhism?',
  'Compare the revenue systems under Permanent Settlement vs Ryotwari Settlement.',
  'What were the causes and consequences of the Revolt of 1857?',
  'Explain the Mandala theory from the Arthashastra.',
  'How did the French Revolution influence the rise of nationalism in Europe?',
  'Critically analyse the nature of the Mughal state under Aurangzeb.',
];

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialTopic = searchParams.get('topic') || '';

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialTopic
        ? `Hello! You're studying **${initialTopic}**. I can help you understand key concepts, important points for UPSC answers, and how to structure your responses. What would you like to know?`
        : `Hello! I'm your History Optional AI assistant. I can help you with:\n\n• **Concept explanations** — deep dives into any topic\n• **Answer structuring** — UPSC-style answer frameworks\n• **PYQ analysis** — model answers and key points\n• **Comparisons** — between rulers, movements, periods\n• **Mnemonics** — to memorise dates, lists and sequences\n\nWhat would you like to explore?`,
    }
  ]);
  const [input, setInput] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an expert UPSC History Optional tutor. You have deep knowledge of Indian history (Ancient, Medieval, Modern) and World History as per the UPSC syllabus.

When answering:
- Structure answers clearly with headings where appropriate
- Include key dates, names and events
- Highlight what's important for UPSC mains answers
- Suggest relevant PYQs if applicable
- Keep answers focused and exam-relevant
- Use **bold** for important terms and names
- If asked to write a model answer, follow UPSC format: Introduction, Body (with subheadings), Conclusion

Always be accurate with historical facts.`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^#{1,3} (.+)$/gm, (_, t) => `<div style="font-family:var(--font-display);font-size:1rem;font-weight:600;color:var(--accent);margin:1rem 0 0.25rem">${t}</div>`)
      .replace(/^• (.+)$/gm, '<div style="padding-left:1rem;margin:0.2rem 0">• $1</div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: 'var(--bg)',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', fontWeight: 600 }}>
            AI History Assistant
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Powered by Claude — UPSC History Optional specialist</p>
        </div>
        <button onClick={() => setMessages([{
          role: 'assistant',
          content: 'New conversation started. What would you like to study?',
        }])} style={{
          marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
          color: 'var(--text3)', cursor: 'pointer', padding: '0.35rem 0.75rem',
          borderRadius: 4, fontSize: '0.78rem',
        }}>New Chat</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '88%',
                background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--bg2)',
                border: `1px solid ${msg.role === 'user' ? 'var(--accent2)' : 'var(--border)'}`,
                borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                padding: '0.85rem 1.1rem',
                color: 'var(--text)',
                fontSize: '0.9rem',
                lineHeight: 1.65,
              }}>
                {msg.role === 'user' ? (
                  <span style={{ color: 'var(--text)' }}>{msg.content}</span>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                )}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.7rem', marginTop: '0.3rem', padding: '0 4px' }}>
                {msg.role === 'user' ? 'You' : '🤖 AI Assistant'}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                    animation: 'pulse 1.2s ease infinite',
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0.5,
                  }} />
                ))}
              </div>
              Thinking...
            </div>
          )}

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Suggested questions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '0.65rem 1rem', textAlign: 'left',
                    color: 'var(--text2)', cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything about History Optional... (Enter to send, Shift+Enter for newline)"
            rows={2}
            style={{
              flex: 1,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 8, padding: '0.75rem 1rem',
              color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              outline: 'none', resize: 'none', lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent2)'; }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--border2)'; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg3)',
              color: input.trim() && !loading ? '#0f0e0c' : 'var(--text3)',
              border: 'none', borderRadius: 8, padding: '0.75rem 1.25rem',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '0.875rem',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >Send →</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text2)' }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
