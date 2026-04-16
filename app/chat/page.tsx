'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

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

  const pageW = 210, pageH = 297, M = 20, contentW = 170;

  const BLUE1  : [number,number,number] = [37,  99,  235];
  const BLUE2  : [number,number,number] = [59, 130,  246];
  const BLUE3  : [number,number,number] = [219,234,254];
  const INK    : [number,number,number] = [15,  23,  42];
  const INK2   : [number,number,number] = [51,  65,  85];
  const MUTED  : [number,number,number] = [100,116,139];
  const RULE   : [number,number,number] = [203,213,225];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL    = 'https://www.historyoptional.xyz';

  let pg = 1, y = 0;

  const drawBg = () => {
    doc.setFillColor(255,255,255);
    doc.rect(0,0,pageW,pageH,'F');
    doc.setFillColor(...BLUE1);
    doc.rect(0,0,3,pageH,'F');
  };

  const drawHeader = () => {
    doc.setFillColor(248,250,255);
    doc.rect(0,0,pageW,15,'F');
    doc.setFillColor(...BLUE1);
    doc.rect(3,14.7,pageW-3,0.5,'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(...BLUE1);
    doc.text('HISTORY OPTIONAL',M,9.5);
    doc.link(M,3,52,10,{url:URL});
    doc.setFont('helvetica','normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(DOMAIN, M+54, 9.5);
    doc.text('AI Chat  |  UPSC History Optional', pageW-M, 9.5, {align:'right'});
  };

  const drawFooter = () => {
    doc.setFillColor(248,250,255);
    doc.rect(0,pageH-12,pageW,12,'F');
    doc.setFillColor(...BLUE1);
    doc.rect(3,pageH-12,pageW-3,0.4,'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(7);
    doc.setTextColor(...BLUE1);
    doc.text(DOMAIN, M, pageH-5);
    doc.link(M,pageH-10,58,7,{url:URL});
    doc.setFont('helvetica','normal');
    doc.setTextColor(...MUTED);
    doc.text('AI History Assistant  |  UPSC History Optional', pageW/2, pageH-5, {align:'center'});
    doc.text(String(pg), pageW-M, pageH-5, {align:'right'});
  };

  const nextPage = () => {
    doc.addPage(); pg++;
    drawBg(); drawHeader(); drawFooter(); y = 23;
  };

  const chk = (n: number) => { if (y+n > pageH-15) nextPage(); };

  drawBg(); drawHeader(); drawFooter(); y = 23;

  if (questionText) {
    doc.setFont('helvetica','bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...BLUE2);
    doc.text('QUESTION', M, y+1);
    y += 5;
    const strip0 = (t: string) => t.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1');
    const qL = doc.splitTextToSize(strip0(questionText), contentW-6) as string[];
    const qH = qL.length*6+8;
    doc.setFillColor(248,250,255);
    doc.setDrawColor(...BLUE2);
    doc.setLineWidth(0.35);
    doc.roundedRect(M,y,contentW,qH,2,2,'FD');
    doc.setFillColor(...BLUE1);
    doc.roundedRect(M,y,2.5,qH,1,1,'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    qL.forEach((l:string,i:number)=>{ doc.text(l,M+6,y+6+i*6); });
    y += qH+8;
  }

  // Strip markdown + replace non-latin chars jsPDF can't handle
  const strip = (t: string) => t
    .replace(/\*\*(.+?)\*\*/g,'$1')
    .replace(/\*(.+?)\*/g,'$1')
    .replace(/`(.+?)`/g,'$1')
    .replace(/[^\x00-\x7F]/g, c => {
      const map: Record<string,string> = {
        '\u1e63':'s','\u1e6d':'t','\u012b':'i','\u016b':'u','\u0101':'a',
        '\u015b':'s','\u1e45':'n','\u1e47':'n','\u015d':'s','\u1e25':'h',
        '\u2013':'--','\u2014':'--','\u2018':"'",'\u2019':"'",
        '\u201c':'"','\u201d':'"','\u2026':'...',
      };
      return map[c] ?? '';
    });
  const lines = markdownText.split('\n');

  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^---+$/.test(t)) { y += 2; continue; }

    if (/^#{1,2} /.test(t)) {
      const txt = strip(t.replace(/^#{1,2} /,''));
      chk(16); y += 4;
      doc.setFillColor(...BLUE1);
      doc.rect(M,y-4,2.5,8,'F');
      doc.setFont('helvetica','bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...BLUE1);
      doc.text(txt.toUpperCase(), M+6, y+0.5);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.25);
      doc.line(M+6+txt.length*2.8, y-2, pageW-M, y-2);
      y += 8;
    } else if (/^#{3,4} /.test(t)) {
      const txt = strip(t.replace(/^#{3,4} /,''));
      chk(10); y += 2;
      doc.setFont('helvetica','bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...BLUE2);
      doc.text(txt, M+4, y);
      y += 6.5;
    } else if (/^[•\-\*] /.test(t)) {
      const txt = strip(t.replace(/^[•\-\*] /,''));
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      const bL = doc.splitTextToSize(txt, contentW-12) as string[];
      chk(bL.length*5.8+4);
      doc.setFillColor(...BLUE1);
      doc.circle(M+2.5, y+1.5, 1.1,'F');
      doc.setTextColor(...INK);
      bL.forEach((l:string)=>{ chk(7); doc.text(l,M+8,y); y+=5.8; });
      y += 1;
    } else {
      const txt = strip(t);
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      const pL = doc.splitTextToSize(txt, contentW-4) as string[];
      chk(pL.length*5.8+2);
      doc.setTextColor(...INK2);
      pL.forEach((l:string)=>{ chk(7); doc.text(l,M,y); y+=5.8; });
      y += 1.5;
    }
  }

  // Subtle watermark — once per page, center only
  for (let p=1; p<=pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({opacity:0.03}));
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.setTextColor(...BLUE1);
    doc.text(DOMAIN, pageW/2, pageH/2, {align:'center', angle:28});
    doc.restoreGraphicsState();
  }

  const slug = markdownText.slice(0,40).replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_')||'answer';
  doc.save(slug+'.pdf');
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
  const { usage, canChat, incrementChat, GateModals, showChatLimitModal, slots } = useSubscriptionGate(() => {});
  const usageLoading = usage?.loading ?? true;
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const [msgsHeight, setMsgsHeight] = useState<number | null>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartH.current = msgsHeight ?? (window.innerHeight - 300);
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const delta = dragStartY.current - y;
      setMsgsHeight(Math.min(window.innerHeight - 160, Math.max(80, dragStartH.current + delta)));
    };
    const onUp = () => { isDragging.current = false; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [msgsHeight]);




  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && messages.length > 1) {
      setTimeout(() => lastAiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;
    if (q.length > 2000) { alert('Message too long. Max 2000 characters.'); return; }

    if (!canChat) { showChatLimitModal(); return; }

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': usage?.fingerprint ?? '' },
        body: JSON.stringify({
          system: `You are an expert UPSC History Optional tutor with deep knowledge of Indian history (Ancient, Medieval, Modern) and World History per the UPSC History Optional syllabus.

Always use UPSC format: Introduction, Body (with subheadings), Conclusion.

For descriptive questions (e.g. 'Discuss features of X'): explain clearly, focus on facts, keep historiography relevant but concise.
For debate/argumentative questions (e.g. 'Was X really Y?'): present multiple perspectives, adopt a clear weighted stance, use heavy historiography to support each side.
For ambiguous words like 'Discuss' or 'Comment': judge from context whether descriptive or argumentative.

CRITICAL WRITING STYLE — strictly follow this:
- Every bullet point or key term MUST be followed by a proper explanation of 2-4 sentences. Never drop a keyword or name without explaining its significance, context, and impact.
- Do NOT write bare keyword lists. Each point should read: **Term/Concept** — explanation of what it is, why it matters, how it connects to the broader theme.
- Think of each bullet as a mini-paragraph: keyword + explanation + historical significance.
- Depth over brevity. A well-explained point is worth more than five bare keywords.
- Avoid telegraphic one-liners. Every claim needs supporting context.

Every response must:
- Use **bold** for key terms, historian names, and pivotal events
- Include specific dates, names, and events for empirical weight
- Incorporate relevant historians and their arguments with brief explanation of their thesis
- Be accurate with historical facts
- Use plain English spellings only — no diacritical marks or special Unicode characters (write "Vijigishu" not "Vijigishu with diacritics", "Kautilya" not "Kautilya with diacritics", "Arthashastra" not "Arthasastra" etc.)`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      if (!response.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]); setLoading(false); return; }
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      incrementChat();
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
      .replace(/^---+$/gm, '<div class="chat-hr"></div>')
      .replace(/^#{1,2} (.+)$/gm, (_: string, t: string) => `<div class="chat-msg-h1">${t}</div>`)
      .replace(/^### (.+)$/gm, (_: string, t: string) => `<div class="chat-msg-h2">${t}</div>`)
      .replace(/^#### (.+)$/gm, (_: string, t: string) => `<div class="chat-msg-h3">${t}</div>`)
      .replace(/^• (.+)$/gm, '<div class="chat-bullet"><span class="chat-bullet-dot"></span><span>$1</span></div>')
      .replace(/^[\-\*] (.+)$/gm, '<div class="chat-bullet"><span class="chat-bullet-dot"></span><span>$1</span></div>')
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
        .chat-wrap { display:flex; flex-direction:column; height:calc(100vh - 60px); background:var(--bg); overflow:hidden; }

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

        .chat-msgs { flex:1; overflow-y:auto; padding:2.5rem 1.5rem 1rem; }
        .chat-msgs-inner { max-width:800px; margin:0 auto; }

        .chat-msg-row { margin-bottom:2rem; display:flex; flex-direction:column; }
        .chat-msg-row.user { align-items:flex-end; }
        .chat-msg-row.assistant { align-items:flex-start; }

        .chat-bubble-user {
          max-width:72%;
          background:linear-gradient(135deg, rgba(29,78,216,0.25), rgba(59,130,246,0.12));
          border:1px solid rgba(59,130,246,0.3);
          border-radius:18px 18px 4px 18px;
          padding:0.9rem 1.2rem;
          color:#f1f5f9; font-size:0.9rem; line-height:1.7;
          font-family:var(--font-body);
        }

        .chat-bubble-ai {
          max-width:94%;
          background:linear-gradient(160deg, #0c1018 0%, #090d14 100%);
          border:1px solid rgba(59,130,246,0.12);
          border-radius:4px 18px 18px 18px;
          padding:1.5rem 1.6rem 1.25rem;
          color:#dde3ed;
          font-size:0.915rem;
          line-height:1.85;
          position:relative;
          box-shadow:0 6px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(59,130,246,0.07) inset;
          font-family:var(--font-body);
        }
        .chat-bubble-ai::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.25) 55%, transparent 100%);
          border-radius:4px 18px 0 0;
        }

        /* ── Headings ── */
        .chat-msg-h1 {
          font-family:var(--font-display);
          font-size:1.05rem; font-weight:700;
          color:#ffffff;
          margin:1.4rem 0 0.6rem;
          padding:0.55rem 0.9rem 0.55rem 1rem;
          background:linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.05));
          border-left:3px solid #3b82f6;
          border-radius:0 8px 8px 0;
          letter-spacing:-0.01em;
          line-height:1.4;
        }
        .chat-msg-h1:first-child { margin-top:0; }

        .chat-msg-h2 {
          font-family:var(--font-display);
          font-size:0.97rem; font-weight:700;
          color:#fbbf24;
          margin:1.3rem 0 0.4rem;
          padding-left:0.6rem;
          border-left:2.5px solid #f59e0b;
          line-height:1.4;
        }

        .chat-msg-h3 {
          font-family:var(--font-display);
          font-size:0.93rem; font-weight:700;
          color:#4ade80;
          margin:1rem 0 0.3rem;
          padding-left:0.55rem;
          border-left:2px solid #22c55e;
          line-height:1.4;
        }

        /* ── Bullets ── */
        .chat-bullet {
          display:flex; align-items:flex-start; gap:0.75rem;
          margin:0.5rem 0;
          padding:0.45rem 0.7rem 0.45rem 0.5rem;
          border-radius:6px;
          transition:background 0.15s;
          color:#c8d3e0;
        }
        .chat-bullet:hover { background:rgba(59,130,246,0.05); }
        .chat-bullet-dot {
          width:7px; height:7px; border-radius:50%;
          background:linear-gradient(135deg,#3b82f6,#60a5fa);
          box-shadow:0 0 7px rgba(59,130,246,0.55);
          flex-shrink:0; margin-top:0.6rem;
        }
        .chat-bullet span:last-child { flex:1; line-height:1.78; }
        .chat-bullet strong { color:#f1f5f9; font-weight:700; }

        .chat-bubble-ai br + br { display:none; }
        .chat-para-gap { height:0.7rem; }

        .chat-hr {
          height:1px;
          background:linear-gradient(90deg, rgba(59,130,246,0.22), rgba(59,130,246,0.04) 65%, transparent);
          margin:1.1rem 0; border:none;
        }

        .chat-bubble-ai strong { color:#f1f5f9; font-weight:700; }
        .chat-bubble-ai em { color:#94a3b8; font-style:italic; }

        /* ── Meta row ── */
        .chat-meta {
          display:flex; align-items:center; gap:0.5rem;
          margin-top:0.45rem; padding:0 4px;
        }
        .chat-meta.user { flex-direction:row-reverse; }
        .chat-meta-label { color:var(--text3); font-size:0.65rem; letter-spacing:0.08em; font-family:var(--font-mono); }
        .chat-ai-badge {
          display:inline-flex; align-items:center; gap:4px;
          font-size:0.62rem; letter-spacing:0.1em; font-family:var(--font-mono);
          color:rgba(59,130,246,0.65);
        }
        .chat-ai-dot {
          width:5px; height:5px; border-radius:50%;
          background:rgba(59,130,246,0.6);
          box-shadow:0 0 5px rgba(59,130,246,0.5);
        }

        /* ── Typing indicator ── */
        .chat-typing {
          display:flex; align-items:center; gap:0.65rem;
          padding:0.8rem 1.1rem; margin-bottom:1rem;
          background:linear-gradient(135deg, rgba(12,16,24,0.95), rgba(9,13,20,0.9));
          border:1px solid rgba(59,130,246,0.1); border-radius:4px 14px 14px 14px;
          width:fit-content;
        }
        .chat-typing-dots { display:flex; gap:4px; }
        .chat-typing-dot {
          width:6px; height:6px; border-radius:50%; background:rgba(59,130,246,0.45);
          animation:chatDotPulse 1.3s ease infinite;
        }
        .chat-typing-dot:nth-child(2) { animation-delay:0.16s; }
        .chat-typing-dot:nth-child(3) { animation-delay:0.32s; }
        .chat-typing-text { font-size:0.68rem; color:var(--text3); letter-spacing:0.08em; font-family:var(--font-mono); }
        @keyframes chatDotPulse {
          0%,100% { opacity:0.2; transform:scale(0.72); }
          50% { opacity:1; transform:scale(1.12); }
        }

        /* ── Suggested questions ── */
        .chat-suggested-label {
          font-family:var(--font-mono); font-size:0.6rem; letter-spacing:0.2em;
          text-transform:uppercase; color:var(--text3); margin-bottom:0.9rem;
          display:flex; align-items:center; gap:0.6rem;
        }
        .chat-suggested-label::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,var(--border),transparent); }
        .chat-suggested-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.55rem; }
        @media(max-width:560px) { .chat-suggested-grid { grid-template-columns:1fr; } }
        .chat-suggested-btn {
          background:linear-gradient(135deg, rgba(16,16,18,0.95), rgba(12,12,14,0.85));
          border:1px solid var(--border); border-radius:10px;
          padding:0.75rem 1rem; text-align:left;
          color:var(--text2); cursor:pointer; font-size:0.8rem;
          font-family:var(--font-body); transition:all 0.18s; line-height:1.45;
        }
        .chat-suggested-btn:hover {
          border-color:rgba(59,130,246,0.32); color:var(--text);
          background:linear-gradient(135deg, rgba(29,78,216,0.1), rgba(16,16,18,0.95));
          transform:translateY(-1px);
          box-shadow:0 4px 16px rgba(0,0,0,0.3);
        }

        /* ── Input area ── */
        .chat-input-area {
          border-top:1px solid var(--border);
          padding:1rem 1.5rem 1.3rem;
          background:linear-gradient(0deg, rgba(8,8,10,0.99) 0%, rgba(12,12,14,0.97) 100%);
        }
        .chat-input-inner { max-width:800px; margin:0 auto; }
        .chat-input-box {
          display:flex; gap:0.6rem; align-items:flex-end;
          background:rgba(20,20,24,0.95);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:14px; padding:0.65rem 0.65rem 0.65rem 1.1rem;
          transition:border-color 0.18s, box-shadow 0.18s;
        }
        .chat-input-box:focus-within {
          border-color:rgba(59,130,246,0.32);
          box-shadow:0 0 0 3px rgba(59,130,246,0.07), 0 6px 24px rgba(0,0,0,0.45);
        }
        .chat-textarea {
          flex:1; background:transparent; border:none; outline:none; resize:none;
          color:var(--text); font-family:var(--font-body); font-size:0.9rem;
          line-height:1.6; padding:0.2rem 0; min-height:22px; max-height:180px;
        }
        .chat-textarea::placeholder { color:var(--text3); }
        .chat-send-btn {
          width:36px; height:36px; border-radius:9px; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:all 0.18s; font-size:15px;
        }
        .chat-send-btn.active {
          background:linear-gradient(135deg, #1d4ed8, #3b82f6);
          color:#fff; box-shadow:0 2px 12px rgba(59,130,246,0.4);
        }
        .chat-send-btn.inactive { background:rgba(28,28,32,0.9); color:var(--text3); cursor:not-allowed; }
        .chat-send-btn.active:hover { transform:translateY(-1px); box-shadow:0 4px 18px rgba(59,130,246,0.5); }
        .chat-hint { font-size:0.63rem; color:var(--text3); text-align:center; margin-top:0.55rem; letter-spacing:0.04em; }

        /* ── PDF button ── */
        .chat-pdf-btn {
          display:inline-flex; align-items:center; gap:5px;
          background:linear-gradient(135deg, rgba(200,168,75,0.14), rgba(234,201,106,0.07));
          border:1px solid rgba(200,168,75,0.28); border-radius:20px;
          padding:0.28rem 0.72rem; color:rgba(200,168,75,0.8);
          cursor:pointer; font-size:0.65rem; font-family:var(--font-mono);
          letter-spacing:0.06em; transition:all 0.18s;
        }
        .chat-pdf-btn:hover { border-color:rgba(200,168,75,0.5); color:#c8a84b; background:linear-gradient(135deg,rgba(200,168,75,0.2),rgba(234,201,106,0.1)); }
        .chat-pdf-btn:disabled { opacity:0.45; cursor:wait; }
        .chat-spin { display:inline-block; animation:chatSpin 1s linear infinite; }
        @keyframes chatSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div className="chat-wrap">
        <GateModals slots={slots} />

        <div className="chat-header">
          <div className="chat-header-icon">⚔</div>
          <div>
            <div className="chat-header-title">AI History Assistant</div>
            <div className="chat-header-sub">UPSC History Optional</div>
          </div>
          <button className="chat-new-btn" onClick={() => setMessages([{
            role: 'assistant',
            content: 'New conversation started. What would you like to study?',
          }])}>+ New Chat</button>
        </div>

        <div className="chat-msgs" style={msgsHeight ? { height: msgsHeight + 'px', flex: 'none' } : {}}>
          <div className="chat-msgs-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg-row ${msg.role}`}
                ref={msg.role === 'assistant' && i === messages.length - 1 ? lastAiRef : null}>
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

        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          style={{
            height: '6px', cursor: 'ns-resize', flexShrink: 0,
            background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), transparent)',
            borderTop: '1px solid rgba(59,130,246,0.15)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), transparent)')}
        />
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
            {!usageLoading && (
              <div style={{ textAlign:'center', marginTop:'0.4rem', fontFamily:'var(--font-mono)', fontSize:'0.62rem', color: !canChat ? '#f87171' : usage?.isPremium ? '#51cf66' : '#555', letterSpacing:'0.08em' }}>
                {usage?.isPremium ? '✦ Unlimited messages' : !canChat ? 'Free messages used · subscribe for unlimited' : `${(usage?.chat_count ?? 0)} of 5 free messages used`}
              </div>
            )}
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
