'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { supabase } from '@/lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: { book_title: string; content: string }[];
};

const SUGGESTED = [
  "Ashoka's Dhamma vs Buddhism — how different were they?",
  'Permanent Settlement vs Ryotwari — compare revenue systems.',
  'Causes and consequences of the Revolt of 1857.',
  'Explain the Mandala theory from the Arthashastra.',
  'French Revolution and the rise of nationalism in Europe.',
  'Mughal state under Aurangzeb — a critical analysis.',
];

function cleanChunk(text: string): string {
  return text
    .replace(/indira gandhi national open university[\s\S]{0,600}/gi, '')
    .replace(/expert committee[\s\S]{0,600}/gi, '')
    .replace(/school of social sciences[\s\S]{0,300}/gi, '')
    .replace(/check your progress[\s\S]{0,400}/gi, '')
    .replace(/answers to check your progress[\s\S]{0,400}/gi, '')
    .replace(/instructional video[\s\S]{0,300}/gi, '')
    .replace(/suggested readings[\s\S]{0,400}/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/BHIC\s*-\s*\d+/gi, '')
    .replace(/\.{4,}/g, '')
    .replace(/_{4,}/g, '')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

function SourcePassages({ sources }: { sources: { book_title: string; content: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const cleaned = sources
    .map(s => ({ ...s, content: cleanChunk(s.content) }))
    .filter(s => s.content.length > 80);
  if (cleaned.length === 0) return null;
  return (
    <div style={{ margin: '0.75rem 0 0.25rem', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', overflow: 'hidden', background: 'rgba(15,15,30,0.6)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '0.5rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(99,102,241,0.08)', borderBottom: expanded ? '1px solid rgba(99,102,241,0.15)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem' }}>📖</span>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Source Passages · {cleaned.length} found
          </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: '#6366f1' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && cleaned.map((s, si) => (
        <div key={si} style={{ padding: '0.75rem 0.9rem', borderTop: si > 0 ? '1px solid rgba(99,102,241,0.1)' : 'none' }}>
          <div style={{ display: 'inline-block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '0.15rem 0.5rem', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
            {s.book_title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.75 }}>
            {s.content.split(/(?<=[.?!])\s+/).filter((t: string) => t.trim().length > 20).slice(0, 6).map((sentence: string, i: number) => (
              <span key={i}>{sentence.trim()} </span>
            ))}
            {s.content.split(/(?<=[.?!])\s+/).length > 6 && (
              <span style={{ color: '#6366f1', fontSize: '0.72rem' }}>…</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
    // Top gold rule
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, pageW, 0.8, 'F');
    // Header area
    doc.setFillColor(...BGSOFT);
    doc.rect(0, 0.8, pageW, 13, 'F');
    // Bottom rule of header
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
    // Gold bottom rule
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

  // Question block
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

  // Content
  const lines = markdownText.split('\n');
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^---+$/.test(t)) { y += 1.5; continue; }

    if (/^#{1,2} /.test(t)) {
      const txt = strip(t.replace(/^#{1,2} /, ''));
      chk(14); y += 5;
      // Gold left bar + heading
      doc.setFillColor(...GOLD);
      doc.rect(M, y - 5, 2, 9, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(txt, M + 6, y);
      // Thin rule
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
      // Gold bullet
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

  // Single subtle watermark per page, center only
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
  const [bookMode, setBookMode] = useState(false);
  const [dragPos, setDragPos] = useState(() => ({ x: 16, y: typeof window !== "undefined" && window.innerWidth < 768 ? window.innerHeight - 220 : 180 }));
  const dragRef = useRef<{dragging:boolean, startX:number, startY:number, origX:number, origY:number}>({dragging:false,startX:0,startY:0,origX:0,origY:0});
  const [bookTitle, setBookTitle] = useState<string>('all');
  const [showBookPaywall, setShowBookPaywall] = useState(false);
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
- NEVER write a historian name or concept as a bare standalone bullet like "- Jadunath Sarkar". Always write: "**Jadunath Sarkar** argues that..." within the bullet text.
- NEVER add a separate "Key Historians Cited" list at the end. Weave all historian references naturally into the argument body.
- Do NOT write bare keyword lists. Each point should read: **Term/Concept** — explanation of what it is, why it matters, how it connects to the broader theme.
- Think of each bullet as a mini-paragraph: keyword + explanation + historical significance.
- Depth over brevity. A well-explained point is worth more than five bare keywords.
- Avoid telegraphic one-liners. Every claim needs supporting context.

Every response must:
- Use **bold** for key terms, historian names, and pivotal events WITHIN sentences only
- For section subheadings use ### (e.g. ### Introduction), NEVER a standalone **bold** line on its own
- A line that is ONLY **bold text** with nothing else is forbidden — either make it a ### heading or fold it into a sentence
- Include specific dates, names, and events for empirical weight
- Incorporate relevant historians and their arguments with brief explanation of their thesis
- Be accurate with historical facts
- Use plain English spellings only — no diacritical marks or special Unicode characters (write "Vijigishu" not "Vijigishu with diacritics", "Kautilya" not "Kautilya with diacritics", "Arthashastra" not "Arthasastra" etc.)`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          bookMode,
          bookTitle: bookTitle === 'all' ? undefined : bookTitle,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]); setLoading(false); return; }
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, sources: data.sources ?? [] }]);
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

  const formatTable = (text: string): string => {
    const lines = text.split('\n');
    let result = '';
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.includes('|') && line.trim().startsWith('|')) {
        const nextLine = lines[i + 1] || '';
        if (nextLine.match(/^[|\s\-:]+$/)) {
          const headers = line.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
          let rows = '';
          i += 2;
          while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
            const cols = lines[i].split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
            rows += `<tr>${cols}</tr>`;
            i++;
          }
          result += `<div class="chat-table-wrap"><table class="chat-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
          continue;
        }
      }
      result += lines[i] + '\n';
      i++;
    }
    return result;
  };

  const formatMessage = (text: string) => {
    text = formatTable(text);
    // Step 1: Protect --- from bullet matching
    text = text.replace(/^-{3,}$/gm, '___HR___');
    // Step 2: Headings
    text = text.replace(/^#{1,2} (.+)$/gm, (_: string, t: string) => `___H1___${t}___END___`);
    text = text.replace(/^### (.+)$/gm, (_: string, t: string) => `___H2___${t}___END___`);
    text = text.replace(/^#{4,6} (.+)$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    // Step 3: Numbered bullets e.g. "1. text" or "1) text"
    text = text.replace(/^ *\d+[.)]\s+(.+)$/gm, (_: string, t: string) => `___BULLET___${t}___END___`);
    // Step 3b: Bullet containing ONLY a bold term (with optional colon) = subheading
    text = text.replace(/^ *[-*•–—]\s+\*\*([^*]+?)\*\*:?\s*$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    // Step 4: All bullet variants: -, *, •, –, —
    text = text.replace(/^ *[-*•–—]\s+(.+)$/gm, (_: string, t: string) => `___BULLET___${t}___END___`);
    // Step 4b: Standalone bold-only lines = subheading (must run before bold replacement)
    text = text.replace(/^\s*\*\*([^*]+)\*\*\s*$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    // Step 5: Bold and italic
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Step 6: Replace tokens with HTML
    text = text.replace(/___HR___/g, '<div class="chat-hr"></div>');
    text = text.replace(/___H1___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h1">${t}</div>`);
    text = text.replace(/___H2___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h2">${t.replace(/^#+\s*/, '')}</div>`);
    text = text.replace(/___H3___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h3">${t}</div>`);
    text = text.replace(/___BULLET___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-bullet"><span class="chat-bullet-dot"></span><span>${t}</span></div>`);
    // Step 7: Paragraphs and line breaks
    text = text.replace(/\n\n/g, '<div class="chat-para-gap"></div>');
    text = text.replace(/\n/g, '<br/>');
    // Post-process: bold-only bullet = subheading (catches cases Step 3b misses)
    text = text.replace(/<div class="chat-bullet"><span class="chat-bullet-dot"><\/span><span><strong>([^<]+)<\/strong>:?\s*<\/span><\/div>/g,
      (_: string, t: string) => `<div class="chat-msg-h3">${t}</div>`);
    // Remove para-gap between consecutive bullets
    text = text.replace(/<\/div><div class="chat-para-gap"><\/div><div class="chat-bullet">/g, '</div><div class="chat-bullet">');
    // Remove para-gap between subheading and first bullet
    text = text.replace(/(<div class="chat-msg-h[123]">[^<]+<\/div>)<div class="chat-para-gap"><\/div>(<div class="chat-bullet">)/g, '$1$2');
    return text;
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
          margin:0.15rem 0;
          padding:0.45rem 0.7rem 0.45rem 0.5rem;
          border-radius:6px;
          transition:background 0.15s;
          color:#c8d3e0;
        }
        .chat-bullet:hover { background:rgba(59,130,246,0.05); }
        .chat-bullet + .chat-para-gap + .chat-bullet, .chat-bullet + .chat-bullet { margin-top:0; }
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
          color:#fff; position:relative; overflow:hidden;
        }
        .chat-send-btn.inactive { background:rgba(28,28,32,0.9); color:var(--text3); cursor:not-allowed; }
        .chat-send-btn.active::before { content:""; position:absolute; top:0; left:-75%; width:50%; height:100%; background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%); transform:skewX(-20deg); opacity:0; pointer-events:none; z-index:1; }
        .chat-send-btn.active:hover::before { opacity:1; animation:glass-shine 0.55s ease forwards; }
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
        .chat-table-wrap { overflow-x:auto; margin:1rem 0; border-radius:8px; border:1px solid rgba(59,130,246,0.15); }
        .chat-table { width:100%; border-collapse:collapse; font-size:0.85rem; }
        .chat-table th { background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.2); padding:8px 12px; text-align:left; color:#f1f5f9; font-weight:600; }
        .chat-table td { border:1px solid rgba(255,255,255,0.07); padding:7px 12px; color:#c8d3e0; vertical-align:top; }
        .chat-table tr:hover td { background:rgba(59,130,246,0.04); }
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
                {msg.sources && msg.sources.length > 0 && (
                  <SourcePassages sources={msg.sources} />
                )}
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

        {/* Books toggle — draggable floating */}
        <div
          onMouseDown={e => {
            dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: dragPos.x, origY: dragPos.y };
            const onMove = (ev: MouseEvent) => {
              if (!dragRef.current.dragging) return;
              setDragPos({
                x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
              });
            };
            const onUp = () => { dragRef.current.dragging = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          onTouchStart={e => {
            const t = e.touches[0];
            dragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, origX: dragPos.x, origY: dragPos.y };
            const onMove = (ev: TouchEvent) => {
              const touch = ev.touches[0];
              setDragPos({
                x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.origX + touch.clientX - dragRef.current.startX)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origY + touch.clientY - dragRef.current.startY)),
              });
            };
            const onUp = () => { dragRef.current.dragging = false; window.removeEventListener('touchmove', onMove as any); window.removeEventListener('touchend', onUp); };
            window.addEventListener('touchmove', onMove as any, { passive: true });
            window.addEventListener('touchend', onUp);
          }}
          style={{
            position:'fixed', left: dragPos.x, top: dragPos.y, zIndex:1000,
            cursor:'grab', userSelect:'none', touchAction:'none',
          }}
        >
          <div style={{
            display:'inline-flex', flexDirection:'column', alignItems:'stretch', gap:'0.5rem',
            background: bookMode && usage?.isPremium
              ? 'linear-gradient(135deg, rgba(20,18,40,0.97), rgba(30,20,60,0.97))'
              : 'rgba(15,13,30,0.92)',
            border: bookMode && usage?.isPremium
              ? '1px solid rgba(139,92,246,0.55)'
              : '1px solid rgba(99,102,241,0.22)',
            borderRadius:16, padding:'0.55rem 0.9rem',
            boxShadow: bookMode && usage?.isPremium
              ? '0 0 24px rgba(99,102,241,0.25), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter:'blur(16px)',
            transition:'border 0.3s, box-shadow 0.3s',
            width: 220,
          }}>
            {/* Drag handle bar */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.1rem' }}>
              <div style={{ width:28, height:3, borderRadius:2, background:'rgba(99,102,241,0.3)' }} />
            </div>
            {/* Row: icon + label + toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.55rem' }}>
              <span style={{ fontSize:'0.9rem', filter: bookMode && usage?.isPremium ? 'drop-shadow(0 0 6px #818cf8)' : 'none', transition:'filter 0.3s' }}>📚</span>
              <span style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', letterSpacing:'0.07em', color: bookMode && usage?.isPremium ? '#a5b4fc' : 'var(--text2)', fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap', flex:1 }}>
                Chat with Books
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (usageLoading) return;
                  if (!usage?.isPremium) { setShowBookPaywall(true); return; }
                  setBookMode(b => !b);
                }}
                style={{
                  width:42, height:24, borderRadius:12, border:'none', cursor:'pointer',
                  position:'relative', transition:'all 0.25s', flexShrink:0,
                  background: bookMode && usage?.isPremium
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : 'rgba(99,102,241,0.2)',
                  boxShadow: bookMode && usage?.isPremium ? '0 0 12px rgba(99,102,241,0.6)' : 'none',
                }}
              >
                <span style={{
                  position:'absolute', top:4, left: bookMode && usage?.isPremium ? 20 : 4,
                  width:16, height:16, borderRadius:'50%',
                  background:'#fff', transition:'left 0.25s', display:'block',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.4)',
                }} />
              </button>
            </div>
            {/* Book selector */}
            {bookMode && usage?.isPremium && (
              <select
                value={bookTitle}
                onChange={e => setBookTitle(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize:'0.68rem', background:'rgba(10,8,25,0.9)', color:'var(--text1)',
                  border:'1px solid rgba(99,102,241,0.3)', borderRadius:6,
                  padding:'0.25rem 0.4rem', width:'100%', cursor:'pointer',
                  outline:'none', fontFamily:'var(--font-mono)',
                  maxWidth: 196,
                }}
              >
                <option value="all">📖 All Books</option>
                <option value="Mughals IGNOU">Mughals IGNOU</option>
                <option value="Delhi Sultanate IGNOU">Delhi Sultanate IGNOU</option>
                <option value="Upinder Singh - Ancient & Early Medieval India">Upinder Singh - Ancient & Early Medieval India</option>
                <option value="Sekhar Bandopadhyay - Plassey to Partition">Sekhar Bandopadhyay - Plassey to Partition</option>
                <option value="BL Grover - Modern Indian History">BL Grover - Modern Indian History</option>
                <option value="AL Basham - The Wonder That Was India">AL Basham - The Wonder That Was India</option>
                <option value="Norman Lowe - Mastering Modern World History">Norman Lowe - Mastering Modern World History</option>
                <option value="Eric Hobsbawm - Age of Extremes">Eric Hobsbawm - Age of Extremes (1914-1991)</option>
                <option value="Eric Hobsbawm - Age of Empire">Eric Hobsbawm - Age of Empire (1875-1914)</option>
                <option value="Eric Hobsbawm - Age of Revolution">Eric Hobsbawm - Age of Revolution (1789-1848)</option>
                <option value="Eric Hobsbawm - Age of Capital">Eric Hobsbawm - Age of Capital (1848-1875)</option>
                <option value="Satish Chandra - Medieval India (800-1700)">Satish Chandra - Medieval India (800-1700)</option>
                <option value="Satish Chandra - Medieval India Part 2 (1526-1748)">Satish Chandra - Medieval India Part 2 (1526-1748)</option>
                <option value="Bipan Chandra - History of Modern India">Bipan Chandra - History of Modern India</option>
                <option value="Ajeet Jha — A History of Ancient India">Ajeet Jha — A History of Ancient India</option>
                <option value="Bipan Chandra — India's Struggle for Independence">Bipan Chandra — India's Struggle for Independence</option>
                <option value="Sumit Sarkar — Modern India (1885-1947)">Sumit Sarkar — Modern India (1885-1947)</option>
                <option value="RS Sharma — Ancient India (Old NCERT)">RS Sharma — Ancient India (Old NCERT)</option>
              </select>
            )}
          </div>
        </div>

        {/* Book paywall card */}
        {showBookPaywall && !usageLoading && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setShowBookPaywall(false)}>
            <div style={{ background:'#0f0f1a', border:'1px solid rgba(99,102,241,0.4)', borderRadius:16, padding:'2rem', maxWidth:340, width:'90%', textAlign:'center' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📚</div>
              <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text1)', marginBottom:'0.4rem' }}>Chat with Books</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text2)', marginBottom:'1.25rem', lineHeight:1.5 }}>
                Get answers grounded in 20+ standard History Optional reference books — IGNOU modules, Bipin Chandra, Satish Chandra, Upinder Singh, and more.<br/><br/>
                <span style={{ color:'#818cf8' }}>✦ Premium feature</span>
              </div>
              <button
                onClick={() => { setShowBookPaywall(false); showChatLimitModal(); }}
                style={{ width:'100%', padding:'0.75rem', background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:'0.95rem', cursor:'pointer' }}>
                Unlock Premium
              </button>
              <button onClick={() => setShowBookPaywall(false)}
                style={{ marginTop:'0.75rem', background:'none', border:'none', color:'var(--text3)', fontSize:'0.8rem', cursor:'pointer' }}>
                Maybe later
              </button>
            </div>
          </div>
        )}

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
