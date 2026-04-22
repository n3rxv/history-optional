'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { supabase } from '@/lib/supabase';

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
    

  const pageW = 210, pageH = 297, M = 18, contentW = 174;

  // Premium palette — ink on white, gold accent
  const INK    : [number,number,number] = [10,  10,  10];
  const INK2   : [number,number,number] = [40,  40,  40];
  const INK3   : [number,number,number] = [90,  90,  90];
  const GOLD   : [number,number,number] = [37,  99, 235];
  const GOLD2  : [number,number,number] = [59, 130, 246];
  const RULE   : [number,number,number] = [220, 220, 220];
  const BGSOFT : [number,number,number] = [245, 248, 255];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL    = 'https://www.historyoptional.xyz';

  let pg = 1, y = 0;

  const strip = (t: string) => {
    const map: Record<string,string> = {
      '\u0101':'a','\u0100':'A','\u012b':'i','\u012a':'I','\u016b':'u','\u016a':'U',
      '\u1e0d':'d','\u1e0c':'D','\u1e6d':'t','\u1e6c':'T','\u1e47':'n','\u1e46':'N',
      '\u1e63':'s','\u1e62':'S','\u015b':'s','\u015a':'S','\u1e25':'h','\u1e24':'H',
      '\u1e45':'n','\u1e44':'N','\u1e37':'l','\u1e36':'L','\u1e5b':'r','\u1e5a':'R',
      '\u1e43':'m','\u1e42':'M','\u1e41':'m','\u1e40':'M',
      '\u0107':'c','\u0106':'C','\u010d':'c','\u010c':'C',
      '\u2013':'--','\u2014':'--','\u2018':"'",'\u2019':"'",
      '\u201c':'"','\u201d':'"','\u2026':'...','\u00d7':'x','\u00f7':'/',
      '\u00e9':'e','\u00e8':'e','\u00ea':'e','\u00e0':'a','\u00e2':'a',
      '\u00e4':'a','\u00f6':'o','\u00fc':'u','\u00fb':'u','\u00f1':'n',
      '\u00e7':'c','\u00df':'ss','\u00e6':'ae',
    };
    let result = '';
    const base = t
      .replace(/\*\*(.+?)\*\*/g,'$1')
      .replace(/\*(.+?)\*/g,'$1')
      .replace(/`(.+?)`/g,'$1');
    for (const ch of base) {
      if (ch.charCodeAt(0) < 128) { result += ch; continue; }
      if (map[ch]) { result += map[ch]; continue; }
      const decomposed = ch.normalize('NFD');
      const b = decomposed[0];
      if (b.charCodeAt(0) < 128) { result += b; continue; }
    }
    return result;
  };

  const drawBg = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');
  };

  const drawHeader = () => {
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, pageW, 0.8, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, 0.8, pageW, 13, 'F');
    doc.setFillColor(...RULE);
    doc.rect(0, 13.8, pageW, 0.3, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text('HISTORY OPTIONAL', M, 9);
    doc.link(M, 2, 52, 10, { url: URL });

    doc.setFont('times', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M + 55, 9);
    doc.text('AI Chat  ·  UPSC History Optional', pageW - M, 9, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...RULE);
    doc.rect(0, pageH - 11, pageW, 0.3, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, pageH - 10.7, pageW, 10.7, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, pageH - 0.6, pageW, 0.6, 'F');

    doc.setFont('times', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M, pageH - 4.5);
    doc.link(M, pageH - 9, 50, 7, { url: URL });
    doc.text('AI History Assistant  ·  UPSC History Optional', pageW / 2, pageH - 4.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(String(pg), pageW - M, pageH - 4.5, { align: 'right' });
  };

  const nextPage = () => {
    doc.addPage(); pg++;
    drawBg(); drawHeader(); drawFooter(); y = 26;
  };

  const chk = (n: number) => { if (y + n > pageH - 14) nextPage(); };

  drawBg(); drawHeader(); drawFooter(); y = 26;

  if (questionText) {
    const qTxt = strip(questionText);
    doc.setFont('times', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GOLD);
    doc.text('QUESTION', M, y);
    y += 3.5;

    const qLines = doc.splitTextToSize(strip(questionText!), contentW - 14) as string[];
    const qH = qLines.length * 7.5 + 14;
    doc.setFillColor(...BGSOFT);
    doc.rect(M, y, contentW, qH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y, 2, qH, 'F');

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 8 + i * 7.5); });
    y += qH + 9;
  }

  const lines = markdownText.split('\n');
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^---+$/.test(t)) { y += 1.5; continue; }

    if (/^#{1,2} /.test(t)) {
      const txt = strip(t.replace(/^#{1,2} /, ''));
      chk(14); y += 5;
      doc.setFillColor(...GOLD);
      doc.rect(M, y - 5, 2, 9, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(txt, M + 6, y);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      doc.line(M + 6, y + 2, pageW - M, y + 2);
      y += 8;
    } else if (/^#{3,4} /.test(t)) {
      const txt = strip(t.replace(/^#{3,4} /, ''));
      chk(10); y += 3;
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...INK2);
      doc.text(txt, M + 4, y);
      y += 6;
    } else if (/^[•\-\*] /.test(t)) {
      const txt = strip(t.replace(/^[•\-\*] /, ''));
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const bL = doc.splitTextToSize(txt, contentW - 10) as string[];
      chk(bL.length * 6.8 + 3);
      doc.setFillColor(...GOLD);
      doc.rect(M + 2, y - 1.2, 1.5, 1.5, 'F');
      doc.setTextColor(...INK2);
      bL.forEach((l: string) => { chk(7); doc.text(l, M + 7, y); y += 6.8; });
      y += 1.5;
    } else {
      const txt = strip(t);
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const pL = doc.splitTextToSize(txt, contentW) as string[];
      chk(pL.length * 6.8 + 2);
      doc.setTextColor(...INK2);
      pL.forEach((l: string) => { chk(7); doc.text(l, M, y); y += 6.8; });
      y += 2;
    }
  }

  for (let p = 1; p <= pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({ opacity: 0.025 }));
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    doc.text(DOMAIN, pageW / 2, pageH / 2, { align: 'center', angle: 30 });
    doc.restoreGraphicsState();
  }

  const slug = markdownText.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'answer';
  doc.save(slug + '.pdf');
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
        headers: { 'Content-Type': 'application/json', 'x-user-token': (await supabase.auth.getSession()).data.session?.access_token ?? usage?.fingerprint ?? '' },
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
        /* ── PERPLEXITY-INSPIRED THEME ── */

        /* Scrollbar */
        .chat-msgs::-webkit-scrollbar { width: 4px; }
        .chat-msgs::-webkit-scrollbar-track { background: transparent; }
        .chat-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .chat-msgs::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }

        /* ── Wrapper ── */
        .chat-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 60px);
          background: #0f1117;
          font-family: 'Sora', -apple-system, sans-serif;
        }

        /* ── Message list ── */
        .chat-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 1.25rem 1.5rem;
        }
        .chat-msgs-inner {
          max-width: 740px;
          margin: 0 auto;
        }

        /* ── Row layout ── */
        .chat-msg-row {
          margin-bottom: 2.25rem;
          display: flex;
          flex-direction: column;
          animation: msgIn 0.22s ease;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-msg-row.user { align-items: flex-end; }
        .chat-msg-row.assistant { align-items: flex-start; }

        /* ── User bubble ── */
        .chat-bubble-user {
          max-width: 68%;
          background: #1e2535;
          border: 1px solid #2a3248;
          border-radius: 18px 18px 4px 18px;
          padding: 0.75rem 1.1rem;
          color: #e8ecf4;
          font-size: 0.9rem;
          line-height: 1.65;
          font-family: inherit;
        }

        /* ── AI answer card ── */
        .chat-bubble-ai {
          max-width: 100%;
          background: #13161f;
          border: 1px solid #1e2535;
          border-radius: 4px 16px 16px 16px;
          padding: 1.35rem 1.5rem 1.1rem;
          color: #c8d3e0;
          font-size: 0.905rem;
          line-height: 1.85;
          position: relative;
          font-family: inherit;
          box-shadow: 0 2px 20px rgba(0,0,0,0.35);
        }
        /* thin top accent bar */
        .chat-bubble-ai::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #4f8ef7 0%, rgba(79,142,247,0.2) 60%, transparent 100%);
          border-radius: 4px 16px 0 0;
        }

        /* ── Headings inside AI bubble ── */
        .chat-msg-h1 {
          font-size: 0.97rem;
          font-weight: 700;
          color: #e8ecf4;
          margin: 1.3rem 0 0.5rem;
          padding: 0.45rem 0.85rem 0.45rem 0.95rem;
          background: rgba(79,142,247,0.08);
          border-left: 3px solid #4f8ef7;
          border-radius: 0 8px 8px 0;
          line-height: 1.4;
          letter-spacing: -0.01em;
        }
        .chat-msg-h1:first-child { margin-top: 0; }

        .chat-msg-h2 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #f5a623;
          margin: 1.2rem 0 0.35rem;
          padding-left: 0.6rem;
          border-left: 2.5px solid #f5a623;
          line-height: 1.4;
        }

        .chat-msg-h3 {
          font-size: 0.88rem;
          font-weight: 700;
          color: #34d399;
          margin: 0.9rem 0 0.25rem;
          padding-left: 0.55rem;
          border-left: 2px solid #34d399;
          line-height: 1.4;
        }

        /* ── Bullets ── */
        .chat-bullet {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          margin: 0.4rem 0;
          padding: 0.4rem 0.6rem 0.4rem 0.4rem;
          border-radius: 6px;
          color: #b8c5d6;
          transition: background 0.13s;
        }
        .chat-bullet:hover { background: rgba(79,142,247,0.05); }
        .chat-bullet-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4f8ef7;
          flex-shrink: 0;
          margin-top: 0.62rem;
          opacity: 0.75;
        }
        .chat-bullet span:last-child { flex: 1; line-height: 1.75; }
        .chat-bullet strong { color: #e8ecf4; font-weight: 600; }

        .chat-bubble-ai strong { color: #e8ecf4; font-weight: 600; }
        .chat-bubble-ai em { color: #7e8fa3; font-style: italic; }
        .chat-bubble-ai br + br { display: none; }
        .chat-para-gap { height: 0.6rem; }
        .chat-hr {
          height: 1px;
          background: linear-gradient(90deg, rgba(79,142,247,0.18), transparent);
          margin: 1rem 0;
        }

        /* ── Meta row (AI badge, PDF btn) ── */
        .chat-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.4rem;
          padding: 0 2px;
        }
        .chat-meta.user { flex-direction: row-reverse; }
        .chat-meta-label {
          color: #404a5c;
          font-size: 0.63rem;
          letter-spacing: 0.08em;
          font-family: var(--font-mono, monospace);
        }
        .chat-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          font-family: var(--font-mono, monospace);
          color: rgba(79,142,247,0.55);
        }
        .chat-ai-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(79,142,247,0.55);
        }

        /* ── Typing indicator ── */
        .chat-typing {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          background: #13161f;
          border: 1px solid #1e2535;
          border-radius: 4px 14px 14px 14px;
          width: fit-content;
        }
        .chat-typing-dots { display: flex; gap: 4px; }
        .chat-typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(79,142,247,0.5);
          animation: dotPulse 1.3s ease infinite;
        }
        .chat-typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .chat-typing-dot:nth-child(3) { animation-delay: 0.32s; }
        .chat-typing-text {
          font-size: 0.67rem;
          color: #404a5c;
          letter-spacing: 0.08em;
          font-family: var(--font-mono, monospace);
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.75); }
          50%       { opacity: 1;   transform: scale(1.1);  }
        }

        /* ── Suggested questions ── */
        .chat-suggested-label {
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #404a5c;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-mono, monospace);
        }
        .chat-suggested-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #1e2535, transparent);
        }
        .chat-suggested-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        @media (max-width: 560px) { .chat-suggested-grid { grid-template-columns: 1fr; } }
        .chat-suggested-btn {
          background: #13161f;
          border: 1px solid #1e2535;
          border-radius: 10px;
          padding: 0.7rem 0.95rem;
          text-align: left;
          color: #7e8fa3;
          cursor: pointer;
          font-size: 0.8rem;
          font-family: inherit;
          transition: all 0.16s;
          line-height: 1.45;
        }
        .chat-suggested-btn:hover {
          border-color: rgba(79,142,247,0.3);
          color: #c8d3e0;
          background: rgba(79,142,247,0.06);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }

        /* ── Input area ── */
        .chat-input-area {
          border-top: 1px solid #1a1f2e;
          padding: 0.9rem 1.25rem 1.1rem;
          background: #0f1117;
        }
        .chat-input-inner {
          max-width: 740px;
          margin: 0 auto;
        }
        .chat-input-box {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
          background: #13161f;
          border: 1px solid #1e2535;
          border-radius: 14px;
          padding: 0.6rem 0.6rem 0.6rem 1rem;
          transition: border-color 0.16s, box-shadow 0.16s;
        }
        .chat-input-box:focus-within {
          border-color: rgba(79,142,247,0.35);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.07);
        }
        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: #e8ecf4;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.6;
          padding: 0.15rem 0;
          min-height: 22px;
          max-height: 180px;
        }
        .chat-textarea::placeholder { color: #404a5c; }
        .chat-send-btn {
          width: 34px; height: 34px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.16s;
          font-size: 15px;
        }
        .chat-send-btn.active {
          background: #4f8ef7;
          color: #fff;
          box-shadow: 0 2px 10px rgba(79,142,247,0.4);
        }
        .chat-send-btn.inactive {
          background: #1a1f2e;
          color: #2a3248;
          cursor: not-allowed;
        }
        .chat-send-btn.active:hover {
          background: #5f9bf8;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(79,142,247,0.5);
        }
        .chat-hint {
          font-size: 0.62rem;
          color: #2a3248;
          text-align: center;
          margin-top: 0.5rem;
          letter-spacing: 0.04em;
          font-family: var(--font-mono, monospace);
        }

        /* ── PDF button ── */
        .chat-pdf-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(245,166,35,0.08);
          border: 1px solid rgba(245,166,35,0.22);
          border-radius: 20px;
          padding: 0.25rem 0.65rem;
          color: rgba(245,166,35,0.7);
          cursor: pointer;
          font-size: 0.63rem;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.06em;
          transition: all 0.16s;
        }
        .chat-pdf-btn:hover {
          border-color: rgba(245,166,35,0.45);
          color: #f5a623;
          background: rgba(245,166,35,0.13);
        }
        .chat-pdf-btn:disabled { opacity: 0.4; cursor: wait; }
        .chat-spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="chat-wrap">
        <GateModals slots={slots} />

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
            {!usageLoading && (
              <div style={{ textAlign:'center', marginTop:'0.4rem', fontFamily:'var(--font-mono)', fontSize:'0.62rem', color: !canChat ? '#f87171' : usage?.isPremium ? '#34d399' : '#2a3248', letterSpacing:'0.08em' }}>
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
    <Suspense fallback={<div style={{ padding: '2rem', color: '#404a5c' }}>Loading…</div>}>
      <ChatContent />
    </Suspense>
  );
}
