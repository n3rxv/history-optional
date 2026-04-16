'use client';
import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

type Message = { role: 'user' | 'assistant'; content: string; };

const SUGGESTED = [
  { icon: '🏛', label: "Ashoka's Dhamma", q: "Ashoka's Dhamma vs Buddhism — how different were they?" },
  { icon: '📜', label: 'Revenue Systems', q: 'Permanent Settlement vs Ryotwari — compare revenue systems.' },
  { icon: '⚔️', label: '1857 Revolt', q: 'Causes and consequences of the Revolt of 1857.' },
  { icon: '🔮', label: 'Mandala Theory', q: 'Explain the Mandala theory from the Arthashastra.' },
  { icon: '🗼', label: 'French Revolution', q: 'French Revolution and the rise of nationalism in Europe.' },
  { icon: '🕌', label: 'Aurangzeb Analysis', q: 'Mughal state under Aurangzeb — a critical analysis.' },
];

/* ─── PDF generator ──────────────────────────────────────────────────── */
async function downloadAnswerAsPDF(markdownText: string, questionText?: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210, pageH = 297, M = 20, contentW = 170;
  const BLUE1: [number,number,number] = [37,99,235];
  const BLUE2: [number,number,number] = [59,130,246];
  const INK: [number,number,number] = [15,23,42];
  const INK2: [number,number,number] = [51,65,85];
  const MUTED: [number,number,number] = [100,116,139];
  const RULE: [number,number,number] = [203,213,225];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL = 'https://www.historyoptional.xyz';
  let pg = 1, y = 0;
  const drawBg = () => { doc.setFillColor(255,255,255); doc.rect(0,0,pageW,pageH,'F'); doc.setFillColor(...BLUE1); doc.rect(0,0,3,pageH,'F'); };
  const drawHeader = () => {
    doc.setFillColor(248,250,255); doc.rect(0,0,pageW,15,'F');
    doc.setFillColor(...BLUE1); doc.rect(3,14.7,pageW-3,0.5,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...BLUE1);
    doc.text('HISTORY OPTIONAL',M,9.5); doc.link(M,3,52,10,{url:URL});
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
    doc.text(DOMAIN,M+54,9.5); doc.text('AI Chat  |  UPSC History Optional',pageW-M,9.5,{align:'right'});
  };
  const drawFooter = () => {
    doc.setFillColor(248,250,255); doc.rect(0,pageH-12,pageW,12,'F');
    doc.setFillColor(...BLUE1); doc.rect(3,pageH-12,pageW-3,0.4,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...BLUE1);
    doc.text(DOMAIN,M,pageH-5); doc.link(M,pageH-10,58,7,{url:URL});
    doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
    doc.text('AI History Assistant  |  UPSC History Optional',pageW/2,pageH-5,{align:'center'});
    doc.text(String(pg),pageW-M,pageH-5,{align:'right'});
  };
  const nextPage = () => { doc.addPage(); pg++; drawBg(); drawHeader(); drawFooter(); y=23; };
  const chk = (n: number) => { if (y+n > pageH-15) nextPage(); };
  drawBg(); drawHeader(); drawFooter(); y=23;
  if (questionText) {
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BLUE2);
    doc.text('QUESTION',M,y+1); y+=5;
    const strip0 = (t: string) => t.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1');
    const qL = doc.splitTextToSize(strip0(questionText),contentW-6) as string[];
    const qH = qL.length*6+8;
    doc.setFillColor(248,250,255); doc.setDrawColor(...BLUE2); doc.setLineWidth(0.35);
    doc.roundedRect(M,y,contentW,qH,2,2,'FD');
    doc.setFillColor(...BLUE1); doc.roundedRect(M,y,2.5,qH,1,1,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...INK);
    qL.forEach((l:string,i:number)=>{ doc.text(l,M+6,y+6+i*6); }); y+=qH+8;
  }
  const strip = (t: string) => t.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/`(.+?)`/g,'$1')
    .replace(/[^\x00-\x7F]/g,c=>{const m:Record<string,string>={'\u2013':'--','\u2014':'--','\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"','\u2026':'...'};return m[c]??'';});
  for (const raw of markdownText.split('\n')) {
    const t = raw.trim();
    if (!t||/^---+$/.test(t)){y+=2;continue;}
    if (/^#{1,2} /.test(t)){const txt=strip(t.replace(/^#{1,2} /,''));chk(16);y+=4;doc.setFillColor(...BLUE1);doc.rect(M,y-4,2.5,8,'F');doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...BLUE1);doc.text(txt.toUpperCase(),M+6,y+0.5);doc.setDrawColor(...RULE);doc.setLineWidth(0.25);doc.line(M+6+txt.length*2.8,y-2,pageW-M,y-2);y+=8;}
    else if (/^#{3,4} /.test(t)){const txt=strip(t.replace(/^#{3,4} /,''));chk(10);y+=2;doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...BLUE2);doc.text(txt,M+4,y);y+=6.5;}
    else if (/^[•\-\*] /.test(t)){const txt=strip(t.replace(/^[•\-\*] /,''));doc.setFont('helvetica','normal');doc.setFontSize(10);const bL=doc.splitTextToSize(txt,contentW-12) as string[];chk(bL.length*5.8+4);doc.setFillColor(...BLUE1);doc.circle(M+2.5,y+1.5,1.1,'F');doc.setTextColor(...INK);bL.forEach((l:string)=>{chk(7);doc.text(l,M+8,y);y+=5.8;});y+=1;}
    else {const txt=strip(t);doc.setFont('helvetica','normal');doc.setFontSize(10);const pL=doc.splitTextToSize(txt,contentW-4) as string[];chk(pL.length*5.8+2);doc.setTextColor(...INK2);pL.forEach((l:string)=>{chk(7);doc.text(l,M,y);y+=5.8;});y+=1.5;}
  }
  for(let p=1;p<=pg;p++){doc.setPage(p);doc.saveGraphicsState();// @ts-ignore
  doc.setGState(doc.GState({opacity:0.03}));doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(...BLUE1);doc.text(DOMAIN,pageW/2,pageH/2,{align:'center',angle:28});doc.restoreGraphicsState();}
  const slug=markdownText.slice(0,40).replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/\s+/g,'_')||'answer';
  doc.save(slug+'.pdf');
}

function DownloadPDFButton({ content, question }: { content: string; question?: string }) {
  const [dl, setDl] = useState(false);
  return (
    <button onClick={async()=>{setDl(true);try{await downloadAnswerAsPDF(content,question);}catch{alert('PDF failed.');}finally{setDl(false);}}} disabled={dl} className="ho-pdf-btn">
      {dl ? <><span className="ho-spin">↻</span> Generating…</> : <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> PDF</>}
    </button>
  );
}

/* ─── ChatContent ────────────────────────────────────────────────────── */
function ChatContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialTopic = searchParams.get('topic') || '';

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: initialTopic
      ? `You're studying **${initialTopic}**. Ask me anything — concepts, answer structures, historiography, or model answers.`
      : `I'm your **History Optional AI**.\n\nI can help with:\n\n• **Concept explanations** — deep dives into any topic\n• **Answer structuring** — UPSC-style frameworks\n• **PYQ analysis** — model answers and key points\n• **Comparisons** — rulers, movements, periods\n• **Historiography** — citing historians in answers\n\nWhat would you like to explore?`,
  }]);

  const [input, setInput] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [splitPct, setSplitPct] = useState(60);

  const { usage, canChat, incrementChat, GateModals, showChatLimitModal, slots } = useSubscriptionGate(() => {});
  const usageLoading = usage?.loading ?? true;

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartPct = useRef(60);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && messages.length > 1) {
      setTimeout(() => lastAiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartPct.current = splitPct;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
  }, [splitPct]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !bodyRef.current) return;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const rect = bodyRef.current.getBoundingClientRect();
      const pct = ((clientY - rect.top) / rect.height) * 100;
      setSplitPct(Math.min(84, Math.max(16, pct)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const sendMessage = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    if (q.length > 2000) { alert('Message too long. Max 2000 characters.'); return; }
    if (!canChat) { showChatLimitModal(); return; }
    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
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
- Use plain English spellings only — no diacritical marks or special Unicode characters`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]); return; }
      const reply = data.content?.[0]?.text || 'Sorry, could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      incrementChat();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const getPQ = (idx: number) => {
    for (let i = idx - 1; i >= 0; i--) if (messages[i].role === 'user') return messages[i].content;
    return undefined;
  };

  const sanitize = (html: string) => html
    .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/on\w+="[^"]*"/gi,'').replace(/on\w+='[^']*'/gi,'').replace(/javascript:/gi,'');

  const fmt = (text: string) => text
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^---+$/gm,'<div class="ho-hr"></div>')
    .replace(/^#{1,2} (.+)$/gm,(_,t)=>`<div class="ho-h1">${t}</div>`)
    .replace(/^### (.+)$/gm,(_,t)=>`<div class="ho-h2">${t}</div>`)
    .replace(/^#### (.+)$/gm,(_,t)=>`<div class="ho-h3">${t}</div>`)
    .replace(/^[•\-\*] (.+)$/gm,'<div class="ho-bullet"><span class="ho-dot"></span><span>$1</span></div>')
    .replace(/\n\n/g,'<div class="ho-gap"></div>').replace(/\n/g,'<br/>');

  const usagePct = usage?.isPremium ? 100 : Math.min(100, ((usage?.chat_count ?? 0) / 5) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ho-root {
          --bg:      #07080c;
          --bg1:     #0b0d15;
          --bg2:     #0e1020;
          --sf:      rgba(255,255,255,0.032);
          --sf2:     rgba(255,255,255,0.055);
          --bd:      rgba(255,255,255,0.07);
          --bd2:     rgba(255,255,255,0.12);
          --ac:      #4f8ef7;
          --ac2:     #7eb3ff;
          --gold:    #d4a853;
          --gold2:   #f0c97a;
          --tx:      #e4e8f2;
          --tx2:     #8a93ab;
          --tx3:     #4a5268;
          --green:   #3ecf8e;
          --red:     #f87171;
          --ff:      'Geist', system-ui, sans-serif;
          --ffs:     'Instrument Serif', Georgia, serif;
          --ffm:     'Geist Mono', monospace;

          font-family: var(--ff);
          height: calc(100vh - 60px);
          display: flex; flex-direction: column;
          background: var(--bg);
          overflow: hidden; position: relative; z-index: 1;
        }

        /* Ambient orbs */
        .ho-orb {
          position: fixed; border-radius: 50%; pointer-events: none;
          filter: blur(90px); z-index: 0;
          animation: ho-drift 20s ease-in-out infinite alternate;
        }
        .ho-orb-a { width:700px; height:700px; background:radial-gradient(circle,rgba(37,99,235,0.12),transparent 65%); top:-250px; left:-200px; animation-duration:24s; }
        .ho-orb-b { width:550px; height:550px; background:radial-gradient(circle,rgba(109,40,217,0.1),transparent 65%); bottom:-200px; right:-120px; animation-duration:30s; animation-delay:-10s; }
        .ho-orb-c { width:350px; height:350px; background:radial-gradient(circle,rgba(212,168,83,0.07),transparent 65%); top:38%; left:52%; animation-duration:38s; animation-delay:-18s; }
        @keyframes ho-drift { from{transform:translate(0,0) scale(1);}to{transform:translate(45px,35px) scale(1.12);} }

        /* grain */
        .ho-root::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.022;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ── Header ── */
        .ho-hdr {
          position:relative; z-index:20; flex-shrink:0;
          display:flex; align-items:center; gap:.9rem;
          padding:0 1.75rem; height:56px;
          border-bottom:1px solid var(--bd);
          background:linear-gradient(180deg,rgba(11,13,21,0.97),rgba(7,8,12,0.93));
          backdrop-filter:blur(28px);
        }
        .ho-brand { display:flex; align-items:center; gap:.6rem; }
        .ho-brand-mark {
          width:30px; height:30px; border-radius:8px;
          background:linear-gradient(135deg,rgba(79,142,247,.18),rgba(79,142,247,.05));
          border:1px solid rgba(79,142,247,.28);
          display:flex; align-items:center; justify-content:center;
          font-size:13px;
          box-shadow:0 0 18px rgba(79,142,247,.09), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .ho-brand-name { font-family:var(--ffs); font-size:1.05rem; color:var(--tx); letter-spacing:-.01em; }
        .ho-brand-name b { color:var(--gold); font-weight:400; font-style:italic; }

        .ho-status {
          display:flex; align-items:center; gap:.4rem;
          background:rgba(62,207,142,.07); border:1px solid rgba(62,207,142,.18);
          border-radius:20px; padding:.2rem .6rem;
          font-size:.6rem; color:var(--green); font-family:var(--ffm); letter-spacing:.07em;
        }
        .ho-live { width:5px; height:5px; border-radius:50%; background:var(--green); box-shadow:0 0 7px var(--green); animation:ho-pulse 2.2s ease infinite; }
        @keyframes ho-pulse { 0%,100%{opacity:1;}50%{opacity:.3;} }

        .ho-hdr-r { margin-left:auto; display:flex; align-items:center; gap:.5rem; }

        .ho-usage {
          display:flex; align-items:center; gap:.45rem;
          font-family:var(--ffm); font-size:.6rem;
        }
        .ho-usage-track { width:52px; height:3px; background:var(--bd); border-radius:2px; overflow:hidden; }
        .ho-usage-fill { height:100%; border-radius:2px; transition:width .4s ease; }

        .ho-newbtn {
          background:var(--sf); border:1px solid var(--bd2); color:var(--tx2);
          cursor:pointer; padding:.28rem .8rem; border-radius:8px;
          font-size:.7rem; font-family:var(--ff); letter-spacing:.02em;
          transition:all .18s; display:flex; align-items:center; gap:.3rem;
        }
        .ho-newbtn:hover { background:rgba(79,142,247,.1); border-color:rgba(79,142,247,.32); color:var(--ac2); }

        /* ── Body ── */
        .ho-body {
          position:relative; z-index:2; flex:1;
          display:flex; flex-direction:column; overflow:hidden;
        }

        /* ── Messages ── */
        .ho-msgs {
          overflow-y:auto; overflow-x:hidden;
          padding:2rem 1.5rem .75rem; flex-shrink:0;
          scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.05) transparent;
        }
        .ho-msgs::-webkit-scrollbar{width:3px;}
        .ho-msgs::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px;}
        .ho-inner { max-width:820px; margin:0 auto; }

        /* ── Welcome ── */
        .ho-welcome { padding:1.25rem 0 1.5rem; animation:ho-up .5s ease both; }
        .ho-eyebrow {
          font-family:var(--ffm); font-size:.59rem; color:var(--ac);
          letter-spacing:.18em; text-transform:uppercase; margin-bottom:.65rem;
          display:flex; align-items:center; gap:.5rem;
        }
        .ho-eyebrow::before { content:''; width:16px; height:1px; background:var(--ac); }
        .ho-wtitle {
          font-family:var(--ffs); font-size:clamp(1.8rem,4vw,2.5rem);
          color:var(--tx); line-height:1.15; font-weight:400; margin-bottom:.45rem;
        }
        .ho-wtitle i { color:var(--gold); font-style:italic; }
        .ho-wsub {
          font-size:.875rem; color:var(--tx2); line-height:1.65;
          max-width:480px; font-weight:300; margin-bottom:1.75rem;
        }
        .ho-chips { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:1.5rem; }
        .ho-chip {
          display:flex; align-items:center; gap:.45rem;
          background:var(--sf); border:1px solid var(--bd);
          border-radius:10px; padding:.5rem .8rem;
          font-size:.78rem; color:var(--tx2); cursor:pointer;
          transition:all .2s; font-family:var(--ff);
        }
        .ho-chip:hover {
          background:rgba(79,142,247,.09); border-color:rgba(79,142,247,.27);
          color:var(--tx); transform:translateY(-1px);
          box-shadow:0 4px 22px rgba(0,0,0,.35);
        }
        .ho-chip-ic { font-size:.95rem; line-height:1; }
        .ho-sep {
          display:flex; align-items:center; gap:.7rem;
          font-family:var(--ffm); font-size:.57rem; color:var(--tx3);
          letter-spacing:.15em; text-transform:uppercase; margin-bottom:1.4rem;
        }
        .ho-sep::before,.ho-sep::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,transparent,var(--bd),transparent); }

        /* ── Rows ── */
        .ho-row { display:flex; flex-direction:column; margin-bottom:1.6rem; animation:ho-up .28s ease both; }
        .ho-row.user { align-items:flex-end; }
        .ho-row.assistant { align-items:flex-start; }
        @keyframes ho-up { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }

        /* User bubble */
        .ho-buser {
          max-width:68%;
          background:linear-gradient(135deg,rgba(79,142,247,.16),rgba(79,142,247,.07));
          border:1px solid rgba(79,142,247,.26);
          border-radius:18px 18px 4px 18px;
          padding:.8rem 1.05rem;
          color:#d8e2f5; font-size:.875rem; line-height:1.72;
          white-space:pre-wrap; word-break:break-word;
        }

        /* AI bubble */
        .ho-bai {
          max-width:96%;
          background:linear-gradient(155deg,var(--bg1) 0%,var(--bg2) 100%);
          border:1px solid var(--bd);
          border-radius:4px 18px 18px 18px;
          padding:1.35rem 1.45rem 1.15rem;
          color:#c8d0e2; font-size:.875rem; line-height:1.88;
          position:relative;
          box-shadow:0 8px 52px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.028);
        }
        .ho-bai::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,rgba(79,142,247,.65) 0%,rgba(79,142,247,.15) 45%,transparent 100%);
          border-radius:4px 18px 0 0;
        }
        .ho-bai::after {
          content:''; position:absolute; top:0; left:0; width:45%; height:100%; pointer-events:none;
          background:radial-gradient(ellipse at 0% 0%,rgba(79,142,247,.035),transparent 70%);
          border-radius:4px 0 0 18px;
        }

        /* markdown inside AI */
        .ho-h1 {
          font-family:var(--ffs); font-size:1.08rem; font-weight:400;
          color:#f0f4ff; line-height:1.35;
          margin:1.35rem 0 .55rem;
          padding:.45rem .95rem .45rem 1rem;
          background:linear-gradient(135deg,rgba(79,142,247,.1),rgba(79,142,247,.03));
          border-left:2.5px solid var(--ac);
          border-radius:0 8px 8px 0;
        }
        .ho-h1:first-child { margin-top:0; }
        .ho-h2 {
          font-family:var(--ff); font-size:.875rem; font-weight:600;
          color:var(--gold2); margin:1.15rem 0 .3rem;
          padding-left:.7rem; border-left:2px solid var(--gold); line-height:1.4;
        }
        .ho-h3 {
          font-family:var(--ff); font-size:.855rem; font-weight:600;
          color:var(--green); margin:.95rem 0 .25rem;
          padding-left:.65rem; border-left:1.5px solid var(--green); line-height:1.4;
        }
        .ho-bullet {
          display:flex; align-items:flex-start; gap:.7rem;
          margin:.4rem 0; padding:.38rem .55rem .38rem .38rem;
          border-radius:7px; transition:background .15s; color:#b5bfd5;
        }
        .ho-bullet:hover { background:rgba(255,255,255,.025); }
        .ho-dot {
          width:5.5px; height:5.5px; border-radius:50%;
          background:linear-gradient(135deg,var(--ac),var(--ac2));
          box-shadow:0 0 7px rgba(79,142,247,.48);
          flex-shrink:0; margin-top:.67rem;
        }
        .ho-bullet span:last-child { flex:1; line-height:1.82; }
        .ho-bai strong { color:#ecf0fc; font-weight:600; }
        .ho-bai em { color:#7a8aa8; font-style:italic; }
        .ho-hr { height:1px; background:linear-gradient(90deg,rgba(79,142,247,.2),rgba(79,142,247,.04) 65%,transparent); margin:.9rem 0; }
        .ho-gap { height:.6rem; }

        /* meta */
        .ho-meta {
          display:flex; align-items:center; gap:.45rem;
          margin-top:.38rem; padding:0 3px;
          font-family:var(--ffm); font-size:.6rem;
        }
        .ho-meta.user { flex-direction:row-reverse; color:var(--tx3); }
        .ho-aibadge { display:inline-flex; align-items:center; gap:4px; color:rgba(79,142,247,.55); }
        .ho-aidot { width:4px; height:4px; border-radius:50%; background:var(--ac); box-shadow:0 0 5px var(--ac); }

        /* typing */
        .ho-typing {
          display:flex; align-items:center; gap:.6rem;
          padding:.7rem .95rem;
          background:var(--bg1); border:1px solid var(--bd);
          border-radius:4px 13px 13px 13px; width:fit-content;
          margin-bottom:1.5rem; animation:ho-up .22s ease both;
        }
        .ho-tdots { display:flex; gap:4px; }
        .ho-td {
          width:5.5px; height:5.5px; border-radius:50%;
          background:rgba(79,142,247,.38);
          animation:ho-tb 1.3s ease infinite;
        }
        .ho-td:nth-child(2){animation-delay:.13s;}
        .ho-td:nth-child(3){animation-delay:.26s;}
        @keyframes ho-tb { 0%,60%,100%{transform:translateY(0);opacity:.25;}30%{transform:translateY(-5px);opacity:1;} }
        .ho-ttext { font-size:.62rem; color:var(--tx3); letter-spacing:.1em; font-family:var(--ffm); }

        /* ── Drag ── */
        .ho-drag {
          height:10px; flex-shrink:0; cursor:ns-resize;
          display:flex; align-items:center; justify-content:center;
          position:relative; z-index:10; background:transparent;
          user-select:none;
        }
        .ho-drag::before {
          content:''; position:absolute; left:0; right:0; top:50%; height:1px;
          background:linear-gradient(90deg,transparent 0%,var(--bd) 20%,rgba(79,142,247,.22) 50%,var(--bd) 80%,transparent 100%);
          transform:translateY(-50%); transition:opacity .2s;
        }
        .ho-dpill {
          width:34px; height:3.5px; border-radius:2px;
          background:var(--bd2); position:relative; z-index:1; transition:all .2s;
        }
        .ho-drag:hover .ho-dpill { width:50px; background:var(--ac); box-shadow:0 0 10px rgba(79,142,247,.32); }

        /* ── Input pane ── */
        .ho-ipane {
          flex:1; display:flex; flex-direction:column; overflow:hidden;
          background:linear-gradient(0deg,rgba(7,8,12,.99),rgba(11,13,21,.96));
          border-top:1px solid var(--bd); backdrop-filter:blur(24px);
        }
        .ho-iinner {
          max-width:820px; margin:0 auto; width:100%;
          padding:.85rem 1.5rem .55rem;
          display:flex; flex-direction:column; gap:.5rem; height:100%;
        }
        .ho-ibox {
          flex:1; display:flex; align-items:flex-end; gap:.6rem;
          background:var(--sf); border:1px solid var(--bd2);
          border-radius:14px; padding:.65rem .65rem .65rem .95rem;
          transition:border-color .2s, box-shadow .2s; min-height:48px;
        }
        .ho-ibox:focus-within {
          border-color:rgba(79,142,247,.38);
          box-shadow:0 0 0 3px rgba(79,142,247,.065), 0 8px 36px rgba(0,0,0,.55);
        }
        .ho-ta {
          flex:1; background:transparent; border:none; outline:none; resize:none;
          color:var(--tx); font-family:var(--ff); font-size:.875rem; line-height:1.62;
          min-height:22px; max-height:200px; overflow-y:auto; scrollbar-width:none; padding:.1rem 0;
        }
        .ho-ta::placeholder { color:var(--tx3); }
        .ho-ta::-webkit-scrollbar { display:none; }

        .ho-send {
          width:34px; height:34px; border-radius:9px; border:none;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; cursor:pointer; transition:all .18s; font-size:14px;
        }
        .ho-send.on { background:linear-gradient(135deg,#2563eb,#4f8ef7); color:#fff; box-shadow:0 3px 14px rgba(79,142,247,.38); }
        .ho-send.on:hover { transform:translateY(-1px); box-shadow:0 5px 20px rgba(79,142,247,.48); }
        .ho-send.on:active { transform:scale(.95); }
        .ho-send.off { background:var(--sf); color:var(--tx3); cursor:not-allowed; }

        .ho-ifooter {
          display:flex; align-items:center; justify-content:space-between;
          font-family:var(--ffm); font-size:.58rem; color:var(--tx3); padding:0 2px .05rem;
        }
        .ho-hint { display:flex; align-items:center; gap:.32rem; }
        .ho-hint kbd {
          background:var(--sf2); border:1px solid var(--bd); border-radius:3px;
          padding:.04rem .28rem; font-family:var(--ffm); font-size:.56rem; color:var(--tx3);
        }

        /* PDF btn */
        .ho-pdf-btn {
          display:inline-flex; align-items:center; gap:4px;
          background:rgba(212,168,83,.07); border:1px solid rgba(212,168,83,.2);
          border-radius:20px; padding:.2rem .6rem;
          color:rgba(212,168,83,.72); cursor:pointer;
          font-size:.6rem; font-family:var(--ffm); letter-spacing:.06em; transition:all .18s;
        }
        .ho-pdf-btn:hover { border-color:rgba(212,168,83,.42); color:var(--gold2); background:rgba(212,168,83,.12); }
        .ho-pdf-btn:disabled { opacity:.4; cursor:wait; }
        .ho-spin { display:inline-block; animation:ho-sp 1s linear infinite; }
        @keyframes ho-sp { to{transform:rotate(360deg);} }

        @media(max-width:600px){
          .ho-wtitle{font-size:1.7rem;}
          .ho-hdr{padding:0 1rem;}
          .ho-msgs{padding:1.25rem 1rem .5rem;}
          .ho-iinner{padding:.7rem 1rem .45rem;}
          .ho-usage{display:none;}
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="ho-orb ho-orb-a" />
      <div className="ho-orb ho-orb-b" />
      <div className="ho-orb ho-orb-c" />

      <div className="ho-root">
        <GateModals slots={slots} />

        {/* Header */}
        <header className="ho-hdr">
          <div className="ho-brand">
            <div className="ho-brand-mark">⚔</div>
            <span className="ho-brand-name">History <b>Optional</b></span>
          </div>
          <div className="ho-status">
            <span className="ho-live" />
            AI Active
          </div>
          <div className="ho-hdr-r">
            {!usageLoading && (
              <div className="ho-usage">
                {usage?.isPremium ? (
                  <span style={{color:'var(--green)',fontSize:'.6rem'}}>✦ Unlimited</span>
                ) : (
                  <>
                    <div className="ho-usage-track">
                      <div className="ho-usage-fill" style={{
                        width: usagePct+'%',
                        background: usagePct>=100 ? 'var(--red)' : usagePct>=60 ? 'var(--gold)' : 'var(--ac)',
                      }}/>
                    </div>
                    <span style={{color: usagePct>=100?'var(--red)':'var(--tx3)'}}>
                      {usage?.chat_count??0}/5
                    </span>
                  </>
                )}
              </div>
            )}
            <button className="ho-newbtn" onClick={()=>setMessages([{role:'assistant',content:'New session started. What would you like to study?'}])}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Chat
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="ho-body" ref={bodyRef}>

          {/* Messages */}
          <div className="ho-msgs" style={{height:`${splitPct}%`}}>
            <div className="ho-inner">

              {/* Welcome */}
              {messages.length === 1 && messages[0].role === 'assistant' && (
                <div className="ho-welcome">
                  <div className="ho-eyebrow">UPSC Mains · History Optional</div>
                  <h1 className="ho-wtitle">Your <i>intelligent</i><br/>History mentor</h1>
                  <p className="ho-wsub">Deep-dive into any topic, evaluate your answers, explore historiography, or request exam-ready model answers.</p>
                  <div className="ho-chips">
                    {SUGGESTED.map((s,i)=>(
                      <button key={i} className="ho-chip" onClick={()=>sendMessage(s.q)}>
                        <span className="ho-chip-ic">{s.icon}</span>{s.label}
                      </button>
                    ))}
                  </div>
                  <div className="ho-sep">or ask anything below</div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg,i)=>(
                <div key={i} className={`ho-row ${msg.role}`}
                  ref={msg.role==='assistant'&&i===messages.length-1?lastAiRef:null}>
                  <div className={msg.role==='user'?'ho-buser':'ho-bai'}>
                    {msg.role==='user'
                      ? msg.content
                      : <div dangerouslySetInnerHTML={{__html:sanitize(fmt(msg.content))}}/>
                    }
                  </div>
                  <div className={`ho-meta ${msg.role}`}>
                    {msg.role==='assistant' ? (
                      <>
                        <span className="ho-aibadge"><span className="ho-aidot"/>AI</span>
                        {i>0 && <DownloadPDFButton content={msg.content} question={getPQ(i)}/>}
                      </>
                    ) : <span>You</span>}
                  </div>
                </div>
              ))}

              {/* Typing */}
              {loading && (
                <div className="ho-typing">
                  <div className="ho-tdots"><div className="ho-td"/><div className="ho-td"/><div className="ho-td"/></div>
                  <span className="ho-ttext">Thinking…</span>
                </div>
              )}

              <div ref={bottomRef}/>
            </div>
          </div>

          {/* Drag */}
          <div className="ho-drag" onMouseDown={onDragStart} onTouchStart={onDragStart}>
            <div className="ho-dpill"/>
          </div>

          {/* Input */}
          <div className="ho-ipane">
            <div className="ho-iinner">
              <div className="ho-ibox">
                <textarea
                  ref={inputRef}
                  className="ho-ta"
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                  placeholder="Ask anything about History Optional, or paste your answer for evaluation…"
                  rows={1}
                />
                <button
                  className={`ho-send ${input.trim()&&!loading?'on':'off'}`}
                  onClick={()=>sendMessage()}
                  disabled={!input.trim()||loading}
                  aria-label="Send"
                >↑</button>
              </div>
              <div className="ho-ifooter">
                <div className="ho-hint">
                  <kbd>Enter</kbd> send · <kbd>⇧ Enter</kbd> newline
                </div>
                {!usageLoading && !usage?.isPremium && (
                  <span style={{color:!canChat?'var(--red)':'var(--tx3)'}}>
                    {!canChat ? '⚠ Limit reached · upgrade for unlimited' : `${5-(usage?.chat_count??0)} messages left`}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 60px)',background:'#07080c',color:'#4a5268',fontFamily:'system-ui',fontSize:'.85rem'}}>
        Loading…
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
