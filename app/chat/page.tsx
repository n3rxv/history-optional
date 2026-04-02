'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED = [
  "Ashoka's Dhamma vs Buddhism — how different were they?",
  'Permanent Settlement vs Ryotwari — compare revenue systems.',
  'Causes and consequences of the Revolt of 1857.',
  'Explain the Mandala theory from the Arthashastra.',
  'French Revolution and the rise of nationalism in Europe.',
  'Mughal state under Aurangzeb — a critical analysis.',
];

async function downloadAnswerAsPDF(markdownText: string, questionText?: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

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

  const strip = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
  const lines: Array<{ type: 'heading' | 'bullet' | 'body' | 'blank'; text: string }> = [];
  for (const raw of markdownText.split('\n')) {
    const trimmed = raw.trim();
    if (!trimmed) { lines.push({ type: 'blank', text: '' }); continue; }
    if (/^#{1,3}\s/.test(trimmed)) lines.push({ type: 'heading', text: trimmed.replace(/^#{1,3}\s*/, '') });
    else if (/^[•\-\*]\s/.test(trimmed)) lines.push({ type: 'bullet', text: trimmed.replace(/^[•\-\*]\s*/, '') });
    else lines.push({ type: 'body', text: trimmed });
  }

  const topY = 24; const bottomY = pageH - 16;
  let curPage = 1; let y = topY;
  addWatermark(); drawHeader();

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomY) { doc.addPage(); curPage++; addWatermark(); drawHeader(); y = topY; }
  };

  if (questionText) {
    const qText = strip(questionText);
    const qLines = doc.splitTextToSize(`Q: ${qText}`, contentW - 8);
    const qBoxH = qLines.length * 5.5 + 6;
    doc.setFillColor(250, 245, 225); doc.setDrawColor(200, 170, 80); doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, qBoxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(100, 70, 20);
    doc.text(qLines, margin + 4, y + 5.5);
    y += qBoxH + 6;
  }

  for (const line of lines) {
    if (line.type === 'blank') { y += 3; continue; }
    const txt = strip(line.text);
    if (line.type === 'heading') {
      const wrapped = doc.splitTextToSize(txt, contentW);
      ensureSpace(wrapped.length * 6.5 + 4);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(120, 80, 10);
      doc.text(wrapped, margin, y); y += wrapped.length * 6.5;
      doc.setDrawColor(200, 160, 60); doc.setLineWidth(0.3);
      doc.line(margin, y - 1, margin + Math.min(contentW, txt.length * 2.8), y - 1); y += 3;
    } else if (line.type === 'bullet') {
      const wrapped = doc.splitTextToSize(txt, contentW - 6);
      ensureSpace(wrapped.length * 5.5 + 1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 30, 10);
      doc.text('•', margin + 1, y); doc.text(wrapped, margin + 6, y); y += wrapped.length * 5.5 + 1;
    } else {
      const wrapped = doc.splitTextToSize(txt, contentW);
      ensureSpace(wrapped.length * 5.5 + 1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 30, 10);
      doc.text(wrapped, margin, y); y += wrapped.length * 5.5 + 1;
    }
  }

  const totalPages = curPage;
  for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(p, totalPages); }
  const slug = markdownText.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'answer';
  doc.save(`${slug}.pdf`);
}

function DownloadPDFButton({ content, question }: { content: string; question?: string }) {
  const [downloading, setDownloading] = useState(false);
  const handleClick = async () => {
    setDownloading(true);
    try { await downloadAnswerAsPDF(content, question); }
    catch (e) { alert('PDF generation failed.'); }
    finally { setDownloading(false); }
  };
  return (
    <button onClick={handleClick} disabled={downloading} className="chat-pdf-btn">
      {downloading ? (
        <><span className="chat-spin">↻</span> Generating…</>
      ) : (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> Save PDF</>
      )}
    </button>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialTopic = searchParams.get('topic') || '';

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: initialTopic
      ? `Hello! You're studying **${initialTopic}**. Ask me anything — concepts, answer structures, historiography, or model answers.`
      : `Hello! I'm your **History Optional AI**.\n\nI can help with:\n\n• **Concept explanations** — deep dives into any topic\n• **Answer structuring** — UPSC-style frameworks\n• **PYQ analysis** — model answers and key points\n• **Comparisons** — rulers, movements, periods\n• **Historiography** — citing historians in answers\n\nWhat would you like to explore?`,
  }]);
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
- Historiographical Mandate: Incorporate the views of relevant historians.
- PYQ Integration: At the conclusion of the response, suggest relevant Previous Year Questions (PYQs) that align with the subject matter discussed.
- III. SYSTEM LOGIC FOR AMBIGUITY When encountering "blur" words like "Discuss" or "Comment", determine the mode based on the subject matter.
- Always be accurate with historical facts.`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
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
      .replace(/^#{1,2} (.+)$/gm, (_: string, t: string) => `<div class="chat-msg-h1">${t}</div>`)
      .replace(/^### (.+)$/gm, (_: string, t: string) => `<div class="chat-msg-h2">${t}</div>`)
      .replace(/^• (.+)$/gm, '<div class="chat-bullet">• $1</div>')
      .replace(/^[\-\*] (.+)$/gm, '<div class="chat-bullet">• $1</div>')
      .replace(/\n\n/g, '<div class="chat-para-gap"></div>')
      .replace(/\n/g, '<br/>');
  };

  const getPrecedingQuestion = (msgIndex: number): string | undefined => {
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return undefined;
  };

  return (
    <>
      <style>{`
        .chat-wrap { display:flex; flex-direction:column; height:calc(100vh - 60px); background:var(--bg); }

        /* Header */
        .chat-header {
          display:flex; align-items:center; gap:1rem;
          padding:0.9rem 1.5rem;
          border-bottom:1px solid var(--border);
          background:linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(12,12,12,0.95) 100%);
          backdrop-filter:blur(12px);
          position:sticky; top:0; z-index:10;
        }
        .chat-header-icon {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg, rgba(29,78,216,0.35), rgba(59,130,246,0.15));
          border:1px solid rgba(59,130,246,0.25);
          display:flex; align-items:center; justify-content:center;
          font-size:16px; flex-shrink:0;
        }
        .chat-header-title { font-family:var(--font-display); font-size:1rem; font-weight:600; color:var(--text); }
        .chat-header-sub { color:var(--text3); font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase; margin-top:1px; }
        .chat-new-btn {
          margin-left:auto;
          background:transparent; border:1px solid var(--border2);
          color:var(--text3); cursor:pointer; padding:0.3rem 0.8rem;
          border-radius:6px; font-size:0.72rem; font-family:var(--font-body);
          transition:all 0.15s; letter-spacing:0.04em;
        }
        .chat-new-btn:hover { border-color:var(--accent2); color:var(--text2); background:rgba(59,130,246,0.06); }

        /* Messages area */
        .chat-msgs { flex:1; overflow-y:auto; padding:2rem 1.5rem 1rem; }
        .chat-msgs-inner { max-width:780px; margin:0 auto; }

        /* Message bubbles */
        .chat-msg-row { margin-bottom:1.75rem; display:flex; flex-direction:column; }
        .chat-msg-row.user { align-items:flex-end; }
        .chat-msg-row.assistant { align-items:flex-start; }

        .chat-bubble-user {
          max-width:75%;
          background:linear-gradient(135deg, rgba(29,78,216,0.22), rgba(59,130,246,0.1));
          border:1px solid rgba(59,130,246,0.28);
          border-radius:16px 16px 4px 16px;
          padding:0.85rem 1.1rem;
          color:var(--text); font-size:0.88rem; line-height:1.65;
        }
        .chat-bubble-ai {
          max-width:90%;
          background:linear-gradient(135deg, rgba(22,22,22,0.95), rgba(16,16,16,0.9));
          border:1px solid rgba(255,255,255,0.07);
          border-radius:4px 16px 16px 16px;
          padding:1rem 1.2rem;
          color:var(--text); font-size:0.88rem; line-height:1.72;
          position:relative;
        }
        .chat-bubble-ai::before {
          content:'';
          position:absolute; top:0; left:0; right:0;
          height:1px;
          background:linear-gradient(90deg, rgba(59,130,246,0.4), transparent 60%);
          border-radius:4px 16px 0 0;
        }

        /* Message formatting */
        .chat-msg-h1 {
          font-family:var(--font-display); font-size:0.95rem; font-weight:600;
          background:linear-gradient(90deg, var(--accent), rgba(59,130,246,0.6));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          margin:1rem 0 0.3rem; padding-bottom:0.35rem;
          border-bottom:1px solid rgba(59,130,246,0.15);
        }
        .chat-msg-h2 {
          font-family:var(--font-display); font-size:0.87rem; font-weight:600;
          color:var(--yellow); margin:0.75rem 0 0.2rem;
        }
        .chat-bullet { padding-left:0.9rem; margin:0.2rem 0; color:var(--text2); }
        .chat-bullet::first-letter { color:var(--accent); }
        .chat-para-gap { height:0.6rem; }

        /* Meta row */
        .chat-meta {
          display:flex; align-items:center; gap:0.5rem;
          margin-top:0.4rem; padding:0 4px;
        }
        .chat-meta.user { flex-direction:row-reverse; }
        .chat-meta-label { color:var(--text3); font-size:0.65rem; letter-spacing:0.08em; font-family:var(--font-mono); }
        .chat-ai-badge {
          display:inline-flex; align-items:center; gap:4px;
          font-size:0.62rem; letter-spacing:0.1em; font-family:var(--font-mono);
          color:rgba(59,130,246,0.7);
        }
        .chat-ai-dot {
          width:5px; height:5px; border-radius:50%;
          background:rgba(59,130,246,0.6);
          box-shadow:0 0 4px rgba(59,130,246,0.5);
        }

        /* Typing indicator */
        .chat-typing {
          display:flex; align-items:center; gap:0.6rem;
          padding:0.75rem 1rem; margin-bottom:1rem;
          background:linear-gradient(135deg, rgba(22,22,22,0.9), rgba(16,16,16,0.85));
          border:1px solid rgba(255,255,255,0.06); border-radius:4px 14px 14px 14px;
          width:fit-content;
        }
        .chat-typing-dots { display:flex; gap:4px; }
        .chat-typing-dot {
          width:6px; height:6px; border-radius:50%; background:rgba(59,130,246,0.5);
          animation:chatDotPulse 1.3s ease infinite;
        }
        .chat-typing-dot:nth-child(2) { animation-delay:0.15s; }
        .chat-typing-dot:nth-child(3) { animation-delay:0.3s; }
        .chat-typing-text { font-size:0.68rem; color:var(--text3); letter-spacing:0.08em; font-family:var(--font-mono); }
        @keyframes chatDotPulse {
          0%,100% { opacity:0.25; transform:scale(0.75); }
          50% { opacity:1; transform:scale(1.1); }
        }

        /* Suggested */
        .chat-suggested-label {
          font-family:var(--font-mono); font-size:0.6rem; letter-spacing:0.2em;
          text-transform:uppercase; color:var(--text3); margin-bottom:0.9rem;
          display:flex; align-items:center; gap:0.6rem;
        }
        .chat-suggested-label::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,var(--border),transparent); }
        .chat-suggested-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; }
        @media(max-width:560px) { .chat-suggested-grid { grid-template-columns:1fr; } }
        .chat-suggested-btn {
          background:linear-gradient(135deg, rgba(18,18,18,0.9), rgba(14,14,14,0.8));
          border:1px solid var(--border); border-radius:8px;
          padding:0.65rem 0.9rem; text-align:left;
          color:var(--text2); cursor:pointer; font-size:0.8rem;
          font-family:var(--font-body); transition:all 0.18s; line-height:1.4;
        }
        .chat-suggested-btn:hover {
          border-color:rgba(59,130,246,0.35); color:var(--text);
          background:linear-gradient(135deg, rgba(29,78,216,0.1), rgba(18,18,18,0.9));
          transform:translateY(-1px);
        }

        /* Input area */
        .chat-input-area {
          border-top:1px solid var(--border);
          padding:1rem 1.5rem 1.25rem;
          background:linear-gradient(0deg, rgba(10,10,10,0.98) 0%, rgba(14,14,14,0.96) 100%);
        }
        .chat-input-inner { max-width:780px; margin:0 auto; }
        .chat-input-box {
          display:flex; gap:0.6rem; align-items:flex-end;
          background:rgba(22,22,22,0.9);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:12px; padding:0.6rem 0.6rem 0.6rem 1rem;
          transition:border-color 0.18s, box-shadow 0.18s;
        }
        .chat-input-box:focus-within {
          border-color:rgba(59,130,246,0.35);
          box-shadow:0 0 0 3px rgba(59,130,246,0.07), 0 4px 20px rgba(0,0,0,0.4);
        }
        .chat-textarea {
          flex:1; background:transparent; border:none; outline:none; resize:none;
          color:var(--text); font-family:var(--font-body); font-size:0.88rem;
          line-height:1.55; padding:0.2rem 0; min-height:22px; max-height:180px;
        }
        .chat-textarea::placeholder { color:var(--text3); }
        .chat-send-btn {
          width:36px; height:36px; border-radius:8px; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:all 0.18s; font-size:14px;
        }
        .chat-send-btn.active {
          background:linear-gradient(135deg, #1d4ed8, #3b82f6);
          color:#fff; box-shadow:0 2px 10px rgba(59,130,246,0.35);
        }
        .chat-send-btn.inactive {
          background:rgba(30,30,30,0.8); color:var(--text3); cursor:not-allowed;
        }
        .chat-send-btn.active:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(59,130,246,0.45); }
        .chat-hint { font-size:0.64rem; color:var(--text3); text-align:center; margin-top:0.55rem; letter-spacing:0.04em; }

        /* PDF button */
        .chat-pdf-btn {
          display:inline-flex; align-items:center; gap:5px;
          background:linear-gradient(135deg, rgba(200,168,75,0.15), rgba(234,201,106,0.08));
          border:1px solid rgba(200,168,75,0.3); border-radius:20px;
          padding:0.28rem 0.7rem; color:rgba(200,168,75,0.85);
          cursor:pointer; font-size:0.65rem; font-family:var(--font-mono);
          letter-spacing:0.06em; transition:all 0.18s;
        }
        .chat-pdf-btn:hover { border-color:rgba(200,168,75,0.5); color:#c8a84b; background:linear-gradient(135deg,rgba(200,168,75,0.2),rgba(234,201,106,0.1)); }
        .chat-pdf-btn:disabled { opacity:0.5; cursor:wait; }
        .chat-spin { display:inline-block; animation:chatSpin 1s linear infinite; }
        @keyframes chatSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div className="chat-wrap">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-icon">⚔</div>
          <div>
            <div className="chat-header-title">AI History Assistant</div>
            <div className="chat-header-sub">UPSC History Optional · Powered by Claude</div>
          </div>
          <button className="chat-new-btn" onClick={() => setMessages([{
            role: 'assistant',
            content: 'New conversation started. What would you like to study?',
          }])}>+ New Chat</button>
        </div>

        {/* Messages */}
        <div className="chat-msgs">
          <div className="chat-msgs-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg-row ${msg.role}`}>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  {msg.role === 'user' ? (
                    <span>{msg.content}</span>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(msg.content)) }} />
                  )}
                </div>
                <div className={`chat-meta ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <span className="chat-ai-badge"><span className="chat-ai-dot" />AI</span>
                      {i > 0 && <DownloadPDFButton content={msg.content} question={getPrecedingQuestion(i)} />}
                    </>
                  ) : (
                    <span className="chat-meta-label">You</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-typing">
                <div className="chat-typing-dots">
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                </div>
                <span className="chat-typing-text">Thinking…</span>
              </div>
            )}

            {messages.length <= 1 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="chat-suggested-label">Suggested questions</div>
                <div className="chat-suggested-grid">
                  {SUGGESTED.map((q, i) => (
                    <button key={i} className="chat-suggested-btn" onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-inner">
            <div className="chat-input-box">
              <textarea
                ref={inputRef}
                className="chat-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything about History Optional…"
                rows={1}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 180) + 'px';
                }}
              />
              <button
                className={`chat-send-btn ${input.trim() && !loading ? 'active' : 'inactive'}`}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                ↑
              </button>
            </div>
            <div className="chat-hint">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text2)' }}>Loading…</div>}>
      <ChatContent />
    </Suspense>
  );
}
