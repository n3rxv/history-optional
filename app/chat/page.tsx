'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhoneModal } from '@/components/PhoneModal';

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

  const strip = (t: string) => t.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/`(.+?)`/g,'$1');
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
      const bL = doc.splitTextToSize(txt, contentW-7) as string[];
      chk(bL.length*5.8+4);
      doc.setFillColor(...BLUE1);
      doc.circle(M+2.5, y+1.5, 1.1,'F');
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      bL.forEach((l:string)=>{ chk(7); doc.text(l,M+7,y); y+=5.8; });
      y += 1;
    } else {
      const txt = strip(t);
      const pL = doc.splitTextToSize(txt, contentW) as string[];
      chk(pL.length*5.8+2);
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.setTextColor(...INK2);
      pL.forEach((l:string)=>{ chk(7); doc.text(l,M,y); y+=5.8; });
      y += 1.5;
    }
  }

  for (let p=1; p<=pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({opacity:0.04}));
    doc.setFont('helvetica','bold');
    doc.setFontSize(20);
    doc.setTextColor(...BLUE1);
    for (let wy=50; wy<pageH-20; wy+=60) {
      doc.text(DOMAIN, pageW/2, wy, {align:'center', angle:28});
    }
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
  const [token, setToken] = useState<string | null>(null);
  const [chatUsed, setChatUsed] = useState(0);
  const [chatLimit] = useState(5);
  const [isOwner, setIsOwner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [noPhone, setNoPhone] = useState(false);
  const [modal, setModal] = useState<'none' | 'unauthenticated' | 'no_phone' | 'limit_reached'>('none');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const pendingMsgRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token ?? null;
      setToken(t);
      if (!t) return;
      const res = await fetch('/api/chat-usage', { headers: { 'x-user-token': t } });
      const data = await res.json();
      if (data.owner) { setIsOwner(true); return; }
      if (data.subscribed) { setIsSubscribed(true); return; }
      if (data.reason === 'no_phone') { setNoPhone(true); return; }
      setChatUsed(data.used ?? 0);
    };
    init();
  }, []);

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

    if (!token) { setModal('unauthenticated'); return; }
    if (noPhone) { pendingMsgRef.current = q; setModal('no_phone'); return; }
    if (!isOwner && !isSubscribed && chatUsed >= chatLimit) { setModal('limit_reached'); return; }

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token ?? '' },
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
- Be accurate with historical facts`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      if (response.status === 401) { setModal('unauthenticated'); setLoading(false); return; }
      if (response.status === 403 && data.error === 'no_phone') { setModal('no_phone'); setLoading(false); return; }
      if (response.status === 403 && data.error === 'limit_reached') { setModal('limit_reached'); setLoading(false); return; }
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!isOwner && !isSubscribed) setChatUsed(prev => prev + 1);
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
        .chat-wrap { display:flex; flex-direction:column; height:calc(100vh - 60px); background:var(--bg); }

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

        .chat-msgs { flex:1; overflow-y:auto; padding:2rem 1.5rem 1rem; }
        .chat-msgs-inner { max-width:780px; margin:0 auto; }

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
          max-width:92%;
          background:linear-gradient(160deg, #0d1117 0%, #0a0e16 100%);
          border:1px solid rgba(59,130,246,0.14);
          border-radius:4px 16px 16px 16px;
          padding:1.25rem 1.4rem 1.1rem;
          color:#e2e8f0;
          font-size:0.9rem;
          line-height:1.78;
          position:relative;
          box-shadow:0 4px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(59,130,246,0.08) inset;
        }
        .chat-bubble-ai::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.3) 50%, transparent 100%);
          border-radius:4px 16px 0 0;
        }

        .chat-msg-h1 {
          font-family:var(--font-display);
          font-size:1rem; font-weight:700;
          color:#ffffff;
          margin:1.2rem 0 0.5rem;
          padding:0.5rem 0.75rem;
          background:linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.06));
          border-left:3px solid #3b82f6;
          border-radius:0 6px 6px 0;
          letter-spacing:-0.01em;
        }
        .chat-msg-h1:first-child { margin-top:0; }

        .chat-msg-h2 {
          font-family:var(--font-display);
          font-size:0.95rem; font-weight:700;
          color:#f59e0b;
          margin:1rem 0 0.35rem;
          display:flex; align-items:center; gap:0.5rem;
        }
        .chat-msg-h2::before {
          content:'';
          display:inline-block; width:3px; height:14px;
          background:#f59e0b; border-radius:2px; flex-shrink:0;
        }

        .chat-msg-h3 {
          font-family:var(--font-display);
          font-size:0.92rem; font-weight:700;
          color:#22c55e;
          margin:0.85rem 0 0.3rem;
          display:flex; align-items:center; gap:0.45rem;
        }
        .chat-msg-h3::before {
          content:'';
          display:inline-block; width:3px; height:13px;
          background:#22c55e; border-radius:2px; flex-shrink:0;
        }

        .chat-bullet {
          display:flex; align-items:flex-start; gap:0.6rem;
          margin:0.45rem 0; padding:0.35rem 0.6rem;
          color:#cbd5e1;
          border-radius:4px;
          transition:background 0.15s;
        }
        .chat-bullet:hover { background:rgba(59,130,246,0.05); }
        .chat-bullet-dot {
          width:6px; height:6px; border-radius:50%;
          background:#3b82f6;
          box-shadow:0 0 6px rgba(59,130,246,0.6);
          flex-shrink:0; margin-top:0.55rem;
        }
        .chat-bullet span:last-child { flex:1; line-height:1.7; }
        .chat-bullet strong { color:#f1f5f9; }

        .chat-bubble-ai br + br { display:none; }
        .chat-para-gap { height:0.65rem; }

        .chat-hr {
          height:1px;
          background:linear-gradient(90deg, rgba(59,130,246,0.25), rgba(59,130,246,0.05) 60%, transparent);
          margin:1rem 0;
          border:none;
        }

        .chat-bubble-ai strong { color:#f1f5f9; font-weight:700; }
        .chat-bubble-ai em { color:#94a3b8; font-style:italic; }

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

        .chat-typing {
          display:flex; align-items:center; gap:0.6rem;
          padding:0.75rem 1rem; margin-bottom:1rem;
          background:linear-gradient(135deg, rgba(13,17,23,0.95), rgba(10,14,22,0.9));
          border:1px solid rgba(59,130,246,0.12); border-radius:4px 14px 14px 14px;
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
        .chat-send-btn.inactive { background:rgba(30,30,30,0.8); color:var(--text3); cursor:not-allowed; }
        .chat-send-btn.active:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(59,130,246,0.45); }
        .chat-hint { font-size:0.64rem; color:var(--text3); text-align:center; margin-top:0.55rem; letter-spacing:0.04em; }

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
        {modal === 'unauthenticated' && (
          <div style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:380, width:'100%' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'#3b82f6', marginBottom:12 }}>Sign in required</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#f0f0f0', marginBottom:10 }}>Sign in to chat</div>
              <div style={{ color:'#888', fontSize:'0.85rem', lineHeight:1.65, marginBottom:24 }}>Create a free account to start chatting with your AI History tutor.</div>
              <button onClick={async () => { await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.href } }); }} style={{ width:'100%', padding:'13px', borderRadius:8, border:'1px solid #333', background:'#161616', color:'#f0f0f0', fontWeight:600, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
              <button onClick={() => setModal('none')} style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid #222', borderRadius:8, color:'#555', cursor:'pointer', fontSize:'0.82rem' }}>Cancel</button>
            </div>
          </div>
        )}
        {modal === 'no_phone' && token && (
          <PhoneModal
            token={token}
            onDone={() => {
                setNoPhone(false);
                setModal('none');
                const pending = pendingMsgRef.current;
                pendingMsgRef.current = null;
                if (pending) setTimeout(() => sendMessage(pending), 100);
              }}
            onCancel={() => setModal('none')}
          />
        )}
        {modal === 'limit_reached' && (
          <div style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:380, width:'100%' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'#f87171', marginBottom:12 }}>Monthly limit reached</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#f0f0f0', marginBottom:10 }}>You've used {chatLimit} free messages this month</div>
              <div style={{ color:'#888', fontSize:'0.85rem', lineHeight:1.65, marginBottom:24 }}>Resets on the 1st of next month. Subscribe for unlimited access.</div>
              <div style={{ background:'linear-gradient(135deg,#0d1b3e,#091530)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:'20px', marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.8rem', fontWeight:700, color:'#f0f0f0', lineHeight:1 }}>₹999<span style={{ fontSize:'0.85rem', color:'#555', fontWeight:400 }}>/year</span></div>
                <div style={{ marginTop:12, fontSize:'0.82rem', color:'#aaa' }}>✓ Unlimited AI chat every day</div>
                <div style={{ fontSize:'0.82rem', color:'#aaa', marginTop:6 }}>✓ Unlimited answer evaluations</div>
              </div>
              <button onClick={() => setModal('none')} style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid #222', borderRadius:8, color:'#555', cursor:'pointer', fontSize:'0.82rem' }}>Maybe later</button>
            </div>
          </div>
        )}

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

        <div className="chat-msgs">
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
            {token && !isOwner && !isSubscribed && (
              <div style={{ textAlign:'center', marginTop:'0.4rem', fontFamily:'var(--font-mono)', fontSize:'0.62rem', color: chatUsed >= chatLimit ? '#f87171' : '#555', letterSpacing:'0.08em' }}>
                {chatUsed >= chatLimit ? 'Monthly limit reached · resets on the 1st' : `${chatLimit - chatUsed} of ${chatLimit} free messages remaining this month`}
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
