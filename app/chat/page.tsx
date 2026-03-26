'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

// ─── PDF Download Helper ──────────────────────────────────────────────────────
async function downloadAnswerAsPDF(markdownText: string, questionText?: string) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ── Watermark on current page ──
  const addWatermark = () => {
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(80, 60, 20);
    const text = 'history-optional.vercel.app';
    for (let y = 30; y < pageH; y += 50) {
      doc.text(text, pageW / 2, y, { align: 'center', angle: 35 });
    }
    doc.restoreGraphicsState();
  };

  // ── Header ──
  const drawHeader = () => {
    doc.setFillColor(245, 240, 225);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 30);
    doc.text('HISTORY OPTIONAL — Model Answer', margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 130, 60);
    doc.text('history-optional.vercel.app', pageW - margin, 11, { align: 'right' });
    doc.setDrawColor(200, 170, 80);
    doc.setLineWidth(0.4);
    doc.line(0, 18, pageW, 18);
  };

  // ── Footer ──
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 130, 60);
    doc.setDrawColor(200, 170, 80);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.text('history-optional.vercel.app', margin, pageH - 7);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageW - margin, pageH - 7, { align: 'right' });
  };

  // ── Strip markdown bold/italic ──
  const strip = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');

  // ── Parse lines ──
  const lines: Array<{ type: 'heading' | 'bullet' | 'body' | 'blank'; text: string }> = [];
  for (const raw of markdownText.split('\n')) {
    const trimmed = raw.trim();
    if (!trimmed) { lines.push({ type: 'blank', text: '' }); continue; }
    if (/^#{1,3}\s/.test(trimmed)) {
      lines.push({ type: 'heading', text: trimmed.replace(/^#{1,3}\s*/, '') });
    } else if (/^[•\-\*]\s/.test(trimmed)) {
      lines.push({ type: 'bullet', text: trimmed.replace(/^[•\-\*]\s*/, '') });
    } else {
      lines.push({ type: 'body', text: trimmed });
    }
  }

  const topY = 24;
  const bottomY = pageH - 16;
  let curPage = 1;
  let y = topY;

  addWatermark();
  drawHeader();

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomY) {
      doc.addPage();
      curPage++;
      addWatermark();
      drawHeader();
      y = topY;
    }
  };

  // ── Question box ──
  if (questionText) {
    const qText = strip(questionText);
    const qLines = doc.splitTextToSize(`Q: ${qText}`, contentW - 8);
    const qBoxH = qLines.length * 5.5 + 6;
    doc.setFillColor(250, 245, 225);
    doc.setDrawColor(200, 170, 80);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, qBoxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 70, 20);
    doc.text(qLines, margin + 4, y + 5.5);
    y += qBoxH + 6;
  }

  // ── Render lines ──
  for (const line of lines) {
    if (line.type === 'blank') { y += 3; continue; }

    const txt = strip(line.text);

    if (line.type === 'heading') {
      const wrapped = doc.splitTextToSize(txt, contentW);
      ensureSpace(wrapped.length * 6.5 + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(120, 80, 10);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6.5;
      doc.setDrawColor(200, 160, 60);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, margin + Math.min(contentW, txt.length * 2.8), y - 1);
      y += 3;
    } else if (line.type === 'bullet') {
      const wrapped = doc.splitTextToSize(txt, contentW - 6);
      ensureSpace(wrapped.length * 5.5 + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 30, 10);
      doc.text('•', margin + 1, y);
      doc.text(wrapped, margin + 6, y);
      y += wrapped.length * 5.5 + 1;
    } else {
      const wrapped = doc.splitTextToSize(txt, contentW);
      ensureSpace(wrapped.length * 5.5 + 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 30, 10);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5.5 + 1;
    }
  }

  // ── Footers on all pages ──
  const totalPages = curPage;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  const slug = markdownText.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'answer';
  doc.save(`${slug}.pdf`);
}

// ─── Download Button ──────────────────────────────────────────────────────────
function DownloadPDFButton({ content, question }: { content: string; question?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    try {
      await downloadAnswerAsPDF(content, question);
    } catch (e) {
      alert('PDF generation failed. Ensure jsPDF is installed: npm install jspdf');
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pdf-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, #c8a84b 0%, #e8c96a 50%, #c8a84b 100%);
          background-size: 200% 200%;
          border: none; border-radius: 20px;
          padding: 0.38rem 0.9rem;
          color: #1a1200;
          cursor: pointer; font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.02em;
          font-family: var(--font-body);
          box-shadow: 0 1px 4px rgba(200,168,75,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
          transition: all 0.2s ease;
          position: relative; overflow: hidden;
        }
        .pdf-btn:hover {
          background-position: right center;
          box-shadow: 0 3px 10px rgba(200,168,75,0.4), inset 0 1px 0 rgba(255,255,255,0.35);
          transform: translateY(-1px);
        }
        .pdf-btn:active { transform: translateY(0); box-shadow: 0 1px 3px rgba(200,168,75,0.3); }
        .pdf-btn:disabled { opacity: 0.65; cursor: wait; transform: none; }
        .pdf-btn .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
      <button
        onClick={handleClick}
        disabled={downloading}
        title="Download model answer as PDF"
        className="pdf-btn"
      >
        {downloading ? (
          <>
            <svg className="spin-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            Save as PDF
          </>
        )}
      </button>
    </>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
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
    if (q.length > 2000) { alert('Message too long. Max 2000 characters.'); return; }

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are an expert UPSC History Optional tutor. You have deep knowledge of Indian history (Ancient, Medieval, Modern) and World History as per the UPSC History Optional syllabus.

When answering:
- Structure answers clearly with headings where appropriate
- Include key dates, names and events
- Highlight what's important for UPSC mains answers
- Suggest relevant PYQs if applicable
- Keep answers focused and exam-relevant
- Use **bold** for important terms and names
- If asked to write a model answer, follow UPSC format: Introduction, Body (with subheadings), Conclusion
- Always use historiography and incorporate them in answers
- A. PROTOCOL ALPHA: DESCRIPTIVE EXECUTION
- Activate this protocol for factual subject matter (e.g., "Discuss the features of Mughal architecture")
- Axiomatic Acceptance: Treat the given statement as a settled matter of fact; do not challenge the premise
- Linear Elaboration: Focus exclusively on explaining and clarifying. "Explain, explain, and explain" is the primary objective
- Constraint on Complexity: While historiography is a general requirement, keep it minimal in this mode to ensure the answer remains focused on descriptive facts
- B. PROTOCOL BETA: ARGUMENTATIVE SYNTHESIS
- Activate this protocol for debate-oriented subject matter (e.g., "The Khilji Revolution was no true revolution")
- Multi-Perspective Analysis: Identify and address the two, three, or four sides of the historical debate
- Weighted Stance: Adopt a clear stance. You are granted the freedom to adjust the proportion of pro/con arguments (e.g., 50:50, 70:30, or 25:75) based on the strength of the historical evidence
- Historiographical Integration: This mode requires heavy use of historiography to support the various sides of the argument
- II. CONTENT & FORMATTING CONSTRAINTS For every output, regardless of the protocol activated, the AI must adhere to these rigid formatting standards:
- UPSC Standard Format: Always use a formal structure—Introduction, Body (with subheadings), and Conclusion.
- Entity Dense Output: Ensure the inclusion of specific key dates, names, and events to provide empirical weight to the answer.
- Visual Emphasis: Use bold for all critical terms, names of historians, and pivotal events.
- Strategic Highlighting: Explicitly point out what is most important for UPSC Mains within the response to guide the student's revision.
- Historiographical Mandate: Incorporate the views of relevant historians. Note: For Mode Beta (Argumentative), these must be the core of the response; for Mode Alpha (Descriptive), they serve as supporting context
- PYQ Integration: At the conclusion of the response, suggest relevant Previous Year Questions (PYQs) that align with the subject matter discussed.
- III. SYSTEM LOGIC FOR AMBIGUITY ("THE BLUR POTENCY") When encountering "blur" words like "Discuss" or "Comment", the AI must not change its structure based on the word alone. It must determine the mode based on the subject matter and length of the question
- Fact-based subject? Execute Mode Alpha (Descriptive)
- Debate-based subject? Execute Mode Beta (Argumentative)
- FINAL COMMAND: Maintain structural stability. Do not alter the core answer architecture for minor variations in directive words. If it is a fact, describe it; if it is a debate, argue it
- Always be accurate with historical facts.`,
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

  function sanitize(html: string) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^#{1,3} (.+)$/gm, (_, t) => `<div style="font-family:var(--font-display);font-size:1rem;font-weight:600;color:var(--accent);margin:1rem 0 0.25rem">${t}</div>`)
      .replace(/^• (.+)$/gm, '<div style="padding-left:1rem;margin:0.2rem 0">• $1</div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  // Get the preceding user question for an assistant message
  const getPrecedingQuestion = (msgIndex: number): string | undefined => {
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return undefined;
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
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>UPSC History Optional specialist</p>
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
                  <div dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(msg.content)) }} />
                )}
              </div>

              {/* Label + Download button row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginTop: '0.3rem',
                padding: '0 4px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>
                  {msg.role === 'user' ? 'You' : '🤖 AI Assistant'}
                </span>
                {msg.role === 'assistant' && i > 0 && (
                  <DownloadPDFButton
                    content={msg.content}
                    question={getPrecedingQuestion(i)}
                  />
                )}
              </div>
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
