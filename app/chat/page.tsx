'use client';
import { useLang } from '@/lib/i18n/LangContext';
import { tr, t } from '@/lib/i18n/ui';
import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { marked } from 'marked';
import { useSearchParams } from 'next/navigation';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { auth } from '@/lib/firebase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: { book_title: string; content: string }[];
  isMentor?: boolean;
};

type ChatHistoryEntry = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const CHAT_HISTORY_KEY = 'ho_chat_history_v1';
const CHAT_HISTORY_MAX = 50;

function loadChatHistory(): ChatHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChatHistoryList(list: ChatHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(list.slice(0, CHAT_HISTORY_MAX)));
  } catch {}
}

function makeChatTitle(messages: Message[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  const base = (firstUser?.content || 'New chat').trim().replace(/\s+/g, ' ');
  return base.length > 60 ? base.slice(0, 60) + '…' : base;
}

const SUGGESTED_EN = [
  "Ashoka's Dhamma vs Buddhism — how different were they?",
  'Permanent Settlement vs Ryotwari — compare revenue systems.',
  'Causes and consequences of the Revolt of 1857.',
  'Explain the Mandala theory from the Arthashastra.',
  'French Revolution and the rise of nationalism in Europe.',
  'Mughal state under Aurangzeb — a critical analysis.',
];
const SUGGESTED_HI = [
  'अशोक का धम्म बनाम बौद्ध धर्म — दोनों में क्या अंतर था?',
  'स्थायी बंदोबस्त बनाम रैयतवारी — राजस्व प्रणालियों की तुलना करें।',
  '1857 के विद्रोह के कारण और परिणाम।',
  'अर्थशास्त्र से मंडल सिद्धांत की व्याख्या करें।',
  'फ्रांसीसी क्रांति और यूरोप में राष्ट्रवाद का उदय।',
  'औरंगज़ेब के अधीन मुगल राज्य — एक आलोचनात्मक विश्लेषण।',
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
    <div style={{ margin: '0.75rem 0 0.25rem', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', overflow: 'hidden', background: 'var(--bg2)' }}>
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
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
  const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;
  pdfMake.vfs = { ...(pdfFonts.vfs || {}) };

  const loadFont = async (url: string, key: string) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[]);
    }
    pdfMake.vfs[key] = btoa(binary);
  };
  await Promise.all([
    loadFont('/NotoSans-Regular.ttf', 'NotoSans-Regular.ttf'),
    loadFont('/NotoSans-Bold.ttf', 'NotoSans-Bold.ttf'),
  ]);
  pdfMake.fonts = pdfMake.fonts || {};
  pdfMake.fonts['NotoSans'] = {
    normal: 'NotoSans-Regular.ttf',
    bold: 'NotoSans-Bold.ttf',
    italics: 'NotoSans-Regular.ttf',
    bolditalics: 'NotoSans-Bold.ttf',
  };

const BLUE  = '#1a4fa0';
  const BLACK = '#1a1a1a';
  const WHITE = '#ffffff';
  const parseInline = (t: string) =>
    t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  const content: any[] = [];
  content.push({
    columns: [
      { table: { widths: [54], heights: [54], body: [[{ text: 'H.', fontSize: 30, bold: true, font: 'NotoSans', color: WHITE, fillColor: BLACK, alignment: 'center', margin: [0, 8, 0, 0], border: [false, false, false, false] }]] }, layout: 'noBorders', width: 66, margin: [0, 0, 0, 0] },
      { stack: [{ text: 'historyoptional.xyz', fontSize: 36, bold: true, font: 'NotoSans', color: BLACK, margin: [12, 4, 0, 2] }, { text: 'one-stop solution for everything history optional', fontSize: 7.5, color: '#888888', italics: true, margin: [14, 0, 0, 0] }], width: '*' },
      { text: dateStr, fontSize: 8, color: '#888888', alignment: 'right', characterSpacing: 1, margin: [0, 10, 0, 0], width: 'auto' },
    ],
    margin: [0, 0, 0, 10],
  });
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: BLUE }], margin: [0, 0, 0, 16] });
  if (questionText) {
    content.push({ table: { widths: [6, '*'], body: [[{ text: '', fillColor: BLUE, border: [false, false, false, false] }, { stack: [{ columns: [{ text: 'QUESTION', fontSize: 7, bold: true, color: BLUE, characterSpacing: 2, width: 'auto' }, { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 400, y2: 4, lineWidth: 0.5, lineColor: '#aaaaaa' }], width: '*', margin: [8, 0, 0, 0] }], margin: [0, 0, 0, 6] }, { text: questionText, fontSize: 12, bold: true, color: BLACK, lineHeight: 1.4 }], fillColor: '#eef3fc', border: [false, false, false, false], margin: [12, 10, 12, 12] }]] }, layout: 'noBorders', margin: [0, 0, 0, 16] });
  }
  const rawLines = markdownText.split('\n');
  const processedLines: string[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) { tableLines.push(rawLines[i].trim()); i++; }
      const rows = tableLines.filter((l: string) => !/^\|[-| :]+\|$/.test(l));
      const parsedRows = rows.map((r: string) => r.split('|').filter((_: string, idx: number, arr: string[]) => idx > 0 && idx < arr.length - 1).map((c: string) => c.trim()));
      if (parsedRows.length > 0) {
        const tableBody = parsedRows.map((row: string[], rIdx: number) => row.map((cell: string) => ({ text: cell.replace(/\*\*(.+?)\*\*/g, '$1'), bold: rIdx === 0, fontSize: 10, color: rIdx === 0 ? '#ffffff' : '#1a1a1a', margin: [4, 4, 4, 4], fillColor: rIdx === 0 ? '#2a2a2a' : rIdx % 2 === 0 ? '#f5f7ff' : '#ffffff' })));
        content.push({ table: { widths: Array(parsedRows[0].length).fill('*'), body: tableBody }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#cccccc', vLineColor: () => '#cccccc' }, margin: [0, 8, 0, 8] });
      }
      processedLines.push('__TABLE_DONE__');
      continue;
    }
    processedLines.push(rawLines[i]);
    i++;
  }
  const mdLines = processedLines;
  let sectionNum = 0;
  for (const raw of mdLines) {
    const t = raw.trim();
    if (t === '__TABLE_DONE__') continue;
    if (!t || /^---+$/.test(t)) { content.push({ text: ' ', fontSize: 4 }); continue; }
    if (/^# /.test(t)) {
      sectionNum++;
      const heading = parseInline(t.replace(/^# /, '')).toUpperCase();
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#bbbbbb' }], margin: [0, 8, 0, 4] });
      content.push({ columns: [{ text: String(sectionNum).padStart(2, '0'), fontSize: 28, bold: true, color: '#e8e8e8', width: 36, margin: [0, -6, 0, 0] }, { text: heading, fontSize: 13, bold: true, color: BLACK, characterSpacing: 2, width: '*', margin: [4, 2, 0, 0] }], margin: [0, 0, 0, 2] });
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: BLUE }], margin: [0, 2, 0, 8] });
    } else if (/^## /.test(t)) {
      content.push({ columns: [{ canvas: [{ type: 'rect', x: 0, y: 2, w: 4, h: 12, color: BLUE }], width: 10 }, { text: parseInline(t.replace(/^## /, '')), fontSize: 12, bold: true, color: BLACK, width: '*' }], margin: [0, 10, 0, 3] });
    } else if (/^#{3,6} /.test(t)) {
      content.push({ columns: [{ canvas: [{ type: 'rect', x: 0, y: 3, w: 3, h: 9, color: BLUE }], width: 10 }, { text: parseInline(t.replace(/^#{3,6} /, '')), fontSize: 11, bold: true, color: BLACK, width: '*' }], margin: [0, 7, 0, 3] });
    } else if (/^[•\-\*] /.test(t)) {
      content.push({ columns: [{ canvas: [{ type: 'ellipse', x: 3, y: 6, r1: 2.5, r2: 2.5, color: BLUE }], width: 14 }, { text: parseInline(t.replace(/^[•\-\*] /, '')), fontSize: 11, color: BLACK, lineHeight: 1.65, width: '*' }], margin: [8, 0, 0, 5] });
    } else {
      content.push({ text: parseInline(t), fontSize: 11, color: BLACK, lineHeight: 1.7, marginBottom: 5 });
    }
  }
  const slug = (questionText ?? markdownText).slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'response';
  const docDef: any = {
    content,
    defaultStyle: { font: 'NotoSans', fontSize: 11, color: BLACK },
    pageMargins: [40, 40, 40, 58],
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 3, color: BLUE }] },
        { columns: [{ stack: [{ text: 'H.  HISTORY OPTIONAL', fontSize: 8, bold: true, color: BLACK }, { text: 'historyoptional.xyz', fontSize: 7, color: '#888888', margin: [0, 1, 0, 0] }], margin: [40, 10, 0, 0], width: '*' }, { stack: [{ text: currentPage + ' / ' + pageCount, fontSize: 11, bold: true, color: BLACK, alignment: 'right' }, { text: 'PAGE', fontSize: 6, color: '#888888', alignment: 'right', characterSpacing: 1, margin: [0, 1, 0, 0] }], margin: [0, 9, 40, 0], width: 'auto' }] },
      ],
    }),
  };
  // Ensure vfs is set on the exact instance used by createPdf
  pdfMake.vfs = pdfMake.vfs || {};
  Object.keys(pdfMake.vfs).length === 0 && Object.assign(pdfMake.vfs, pdfFonts.vfs || {});
  pdfMake.createPdf(docDef, undefined, pdfMake.fonts, pdfMake.vfs).download(slug + ' (historyoptional.xyz).pdf');
}

function DownloadPDFButton({ content, question }: { content: string; question?: string }) {
  const [downloading, setDownloading] = useState(false);
  const handleClick = async () => {
    setDownloading(true);
    try { await downloadAnswerAsPDF(content, question); }
    catch (e) { console.error(e); alert('PDF generation failed.'); }
    finally { setDownloading(false); }
  };
  return (
    <button onClick={handleClick} disabled={downloading} className="chat-pdf-btn">
      {downloading ? (
        <><span className="chat-spin">&#8635;</span> Generating...</>
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
  const { langHi } = useLang();

  useEffect(() => {
    setMessages(prev => {
      if (prev.length !== 1 || prev[0].role !== 'assistant') return prev;
      const greeting = initialTopic
        ? (langHi
            ? `नमस्ते! आप **${initialTopic}** पढ़ रहे हैं। कुछ भी पूछें — अवधारणाएँ, उत्तर संरचना, इतिहास-लेखन, या आदर्श उत्तर।`
            : `Hello! You're studying **${initialTopic}**. Ask me anything — concepts, answer structures, historiography, or model answers.`)
        : (langHi
            ? `नमस्ते! मैं आपका **History Optional AI** हूँ।\n\nमैं इनमें मदद कर सकता हूँ:\n\n• **अवधारणा स्पष्टीकरण** — किसी भी विषय की गहरी समझ\n• **उत्तर संरचना** — UPSC शैली के ढाँचे\n• **PYQ विश्लेषण** — आदर्श उत्तर और मुख्य बिंदु\n• **तुलनाएँ** — शासक, आंदोलन, काल\n• **इतिहास-लेखन** — उत्तरों में इतिहासकारों का उद्धरण\n\nआप क्या जानना चाहेंगे?`
            : `Hello! I'm your **History Optional AI**.\n\nI can help with:\n\n• **Concept explanations** — deep dives into any topic\n• **Answer structuring** — UPSC-style frameworks\n• **PYQ analysis** — model answers and key points\n• **Comparisons** — rulers, movements, periods\n• **Historiography** — citing historians in answers\n\nWhat would you like to explore?`);
      return [{ role: 'assistant', content: greeting }];
    });
  }, [langHi]);

  const [bookMode, setBookMode] = useState(false);
  const [mentorMode, setMentorMode] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [brainstormMode, setBrainstormMode] = useState(false);
  const [responseStyle, setResponseStyle] = useState<'concise' | 'elaborative'>('concise');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [booksPopoverOpen, setBooksPopoverOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState<string>('all');
  const [showBookPaywall, setShowBookPaywall] = useState(false);
  const [citationModal, setCitationModal] = useState<{ book_title: string; content: string }[] | null>(null);
  const [chatId, setChatId] = useState<string>(() => (typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now())));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<ChatHistoryEntry[]>([]);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const hasUserMessageRef = useRef(false);
  const { usage, canChat, incrementChat, GateModals, showChatLimitModal, showLoginModal, slots } = useSubscriptionGate(() => {});
  const usageLoading = usage?.loading ?? true;
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (loading && last?.role === 'assistant') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (last?.role === 'assistant' && messages.length > 1) {
      setTimeout(() => lastAiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => { setHistoryList(loadChatHistory()); }, []);

  useEffect(() => {
    if (loading) return;
    if (messages.some(m => m.role === 'user')) hasUserMessageRef.current = true;
    if (!hasUserMessageRef.current) return;
    const entry: ChatHistoryEntry = { id: chatId, title: makeChatTitle(messages), messages, updatedAt: Date.now() };
    setHistoryList(prev => {
      const withoutCurrent = prev.filter(c => c.id !== chatId);
      const updated = [entry, ...withoutCurrent].slice(0, CHAT_HISTORY_MAX);
      saveChatHistoryList(updated);
      return updated;
    });
  }, [messages, loading, chatId]);

  const handlePdfUpload = useCallback((file: File) => {
    if (!file || file.type !== 'application/pdf') { alert('Please upload a valid PDF file.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('PDF too large. Max 20MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setPdfBase64(base64);
      setPdfFile(file);
      setPdfName(file.name);
      setMessages(prev => [...prev, { role: 'assistant', content: `PDF uploaded: **${file.name}**\n\nYou can now:\n• Ask me to explain any concept from this PDF\n• Request model answers for questions in it\n• Discuss its contents in detail` }]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(file);
  }, [handlePdfUpload]);

  const greetingMessage = (): Message => ({
    role: 'assistant',
    content: initialTopic
      ? (langHi ? `नमस्ते! आप **${initialTopic}** पढ़ रहे हैं। कुछ भी पूछें।` : `Hello! You're studying **${initialTopic}**. Ask me anything.`)
      : (langHi ? `नमस्ते! मैं आपका **History Optional AI** हूँ।\n\nआप क्या जानना चाहेंगे?` : `Hello! I'm your **History Optional AI**.\n\nWhat would you like to explore?`),
  });

  const startNewChat = useCallback(() => {
    setChatId(typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()));
    hasUserMessageRef.current = false;
    setMessages([greetingMessage()]);
    setInput('');
    setPdfFile(null);
    setPdfBase64(null);
    setPdfName(null);
    setBrainstormMode(false);
    setHistoryOpen(false);
  }, [langHi, initialTopic]);

  const loadHistoryEntry = useCallback((entry: ChatHistoryEntry) => {
    setChatId(entry.id);
    hasUserMessageRef.current = entry.messages.some(m => m.role === 'user');
    setMessages(entry.messages);
    setInput('');
    setHistoryOpen(false);
  }, []);

  const deleteHistoryEntry = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHistoryList(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChatHistoryList(updated);
      return updated;
    });
    if (id === chatId) startNewChat();
  }, [chatId, startNewChat]);

  const sendMessage = async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;
    if (q.length > 10000) { alert('Message too long. Max 10000 characters.'); return; }
    if (!usage || !usage.fingerprint) { showLoginModal(); return; }
    if (!canChat) { showChatLimitModal(); return; }
    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': (auth.currentUser ? await auth.currentUser.getIdToken() : null) ?? '', 'x-fingerprint': document.cookie.match(/fp=([^;]+)/)?.[1] ?? localStorage.getItem('fp') ?? '' },
        body: JSON.stringify({
          ...(pdfBase64 ? { pdf_base64: pdfBase64, pdf_name: pdfName } : {}),
          // system prompt now built server-side in route.ts
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          lang: langHi ? 'hi' : 'en',
          bookMode,
          bookTitle: bookTitle === 'all' ? undefined : bookTitle,
          mentorMode: mentorMode && !!usage?.subscribed,
          responseStyle: mentorMode || brainstormMode ? undefined : responseStyle,
        }),
      });
      if (!response.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]); setLoading(false); return; }
      const reader = response.body!.getReader();
      const dec = new TextDecoder();
      let full = '';
      let sources: { book_title: string; content: string }[] = [];
      setMessages(prev => [...prev, { role: 'assistant', content: '', isMentor: mentorMode && !!usage?.subscribed }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        const SOURCES_MARKER = '\n__SOURCES__';
        const srcIdx = full.indexOf(SOURCES_MARKER);
        if (srcIdx !== -1) {
          try { sources = JSON.parse(full.slice(srcIdx + SOURCES_MARKER.length)); } catch {}
          full = full.slice(0, srcIdx);
        }
        const display = full;
        setMessages(prev => { const updated = [...prev]; updated[updated.length - 1] = { role: 'assistant', content: display, sources }; return updated; });
      }
      setMessages(prev => { const updated = [...prev]; updated[updated.length - 1] = { role: 'assistant', content: full, sources, isMentor: mentorMode && !!usage?.subscribed }; return updated; });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  function sanitize(html: string) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '').replace(/on\w+='[^']*'/gi, '').replace(/javascript:/gi, '');
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

  function linkifyCitations(html: string, sourcesCount: number): string {
    if (!sourcesCount) return html;
    return html.replace(/\b(Sources?)\s*#?\s*(\d+(?:\s*(?:,|and|&)\s*\d+)*)\b/gi, (match: string, _label: string, numList: string) => {
      const nums = Array.from(numList.matchAll(/\d+/g)).map((m: any) => parseInt(m[0], 10));
      const valid = nums.filter(n => n >= 1 && n <= sourcesCount);
      if (valid.length === 0) return match;
      return `<span class="chat-citation" data-citation="${valid.join(',')}">${match}</span>`;
    });
  }

  const formatMessage = (text: string, sourcesCount: number = 0) => {
    text = formatTable(text);
    text = text.replace(/^-{3,}$/gm, '___HR___');
    text = text.replace(/^#{1,2} (.+)$/gm, (_: string, t: string) => `___H1___${t}___END___`);
    text = text.replace(/^### (.+)$/gm, (_: string, t: string) => `___H2___${t}___END___`);
    text = text.replace(/^#{4,6} (.+)$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    text = text.replace(/^ *\d+[.)]\s+(.+)$/gm, (_: string, t: string) => `___BULLET___${t}___END___`);
    text = text.replace(/^ *[-*•–—]\s+\*\*([^*]+?)\*\*:?\s*$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    text = text.replace(/^ *[-*•–—]\s+(.+)$/gm, (_: string, t: string) => `___BULLET___${t}___END___`);
    text = text.replace(/^\s*\*\*([^*]+)\*\*\s*$/gm, (_: string, t: string) => `___H3___${t}___END___`);
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/___HR___/g, '<div class="chat-hr"></div>');
    text = text.replace(/___H1___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h1">${t}</div>`);
    text = text.replace(/___H2___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h2">${t.replace(/^#+\s*/, '')}</div>`);
    text = text.replace(/___H3___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-msg-h3">${t}</div>`);
    text = text.replace(/___BULLET___(.+?)___END___/g, (_: string, t: string) => `<div class="chat-bullet"><span class="chat-bullet-dot"></span><span>${t}</span></div>`);
    text = text.replace(/\n\n/g, '<div class="chat-para-gap"></div>');
    text = text.replace(/\n/g, '<br/>');
    text = text.replace(/<div class="chat-bullet"><span class="chat-bullet-dot"><\/span><span><strong>([^<]+)<\/strong>:?\s*<\/span><\/div>/g, (_: string, t: string) => `<div class="chat-msg-h3">${t}</div>`);
    text = text.replace(/<\/div><div class="chat-para-gap"><\/div><div class="chat-bullet">/g, '</div><div class="chat-bullet">');
    text = text.replace(/(<div class="chat-msg-h[123]">[^<]+<\/div>)<div class="chat-para-gap"><\/div>(<div class="chat-bullet">)/g, '$1$2');
    text = linkifyCitations(text, sourcesCount);
    return text;
  };

  function parseMentorSections(text: string): { type: string; content: string }[] {
    const sections: { type: string; content: string }[] = [];
    const regex = /##([A-Z]+)##([\s\S]*?)##END##/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) sections.push({ type: 'TEXT', content: before });
      sections.push({ type: match[1], content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    const after = text.slice(lastIndex).trim();
    if (after) sections.push({ type: 'TEXT', content: after });
    if (sections.length === 0) sections.push({ type: 'TEXT', content: text });
    return sections;
  }

  function MentorBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
    const sections = parseMentorSections(content);
    const sectionConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
      DIRECTIVE:    { label: 'Directive Rule',       icon: '🔍', color: '#d97706', bg: 'rgba(217,119,6,0.07)',   border: 'rgba(217,119,6,0.25)'  },
      DIAGNOSIS:    { label: 'Demand Diagnosis',     icon: '📋', color: '#6366f1', bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.25)' },
      BLUEPRINTS:   { label: 'Four Blueprints',      icon: '🗺️', color: '#0891b2', bg: 'rgba(8,145,178,0.07)',  border: 'rgba(8,145,178,0.25)'  },
      MODELANSWER:  { label: 'Model Answer',         icon: '📝', color: '#16a34a', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.25)'  },
      EVALUATION:   { label: 'Evaluation',           icon: '⚖️', color: '#7c3aed', bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.25)' },
      STRENGTHS:    { label: 'Strengths',            icon: '✅', color: '#16a34a', bg: 'rgba(22,163,74,0.06)',  border: 'rgba(22,163,74,0.2)'   },
      CORRECTIONS:  { label: 'Corrections',          icon: '🔧', color: '#dc2626', bg: 'rgba(220,38,38,0.06)',  border: 'rgba(220,38,38,0.2)'   },
      IMPROVED:     { label: 'Improved Answer',      icon: '✨', color: '#16a34a', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.25)'  },
      MCQ:          { label: 'Question',             icon: '❓', color: '#0891b2', bg: 'rgba(8,145,178,0.07)',  border: 'rgba(8,145,178,0.25)'  },
      MCQANSWER:    { label: 'Answer & Explanation', icon: '💡', color: '#d97706', bg: 'rgba(217,119,6,0.07)',  border: 'rgba(217,119,6,0.25)'  },
    };
    const renderContent = (text: string, sectionType?: string) => {
      if (sectionType === 'MODELANSWER') return <div dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(text)) }} />;
      if (sectionType === 'BLUEPRINTS') {
        const lines = text.split('\n').filter(l => l.trim());
        const optionLines = lines.filter(l => /^\*\*[A-D]/.test(l.trim()));
        const otherLines = lines.filter(l => !/^\*\*[A-D]/.test(l.trim()));
        const optColors: Record<string, string> = { A: '#d97706', B: '#6366f1', C: '#16a34a', D: '#0891b2' };
        const optBgs: Record<string, string> = { A: 'rgba(217,119,6,0.07)', B: 'rgba(99,102,241,0.07)', C: 'rgba(22,163,74,0.07)', D: 'rgba(8,145,178,0.07)' };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {otherLines.length > 0 && <div dangerouslySetInnerHTML={{ __html: sanitize(marked.parse(otherLines.join('\n'), { breaks: true }) as string) }} style={{ lineHeight: 1.7, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.25rem' }} />}
            {optionLines.map((line, idx) => {
              const letter = line.trim().replace(/^\*\*([A-D]).*/, '$1');
              const html = sanitize(marked.parse(line.trim(), { breaks: true }) as string);
              return <div key={idx} style={{ background: optBgs[letter] || 'rgba(255,255,255,0.03)', border: `1px solid ${(optColors[letter] || '#888')}44`, borderLeft: `3px solid ${optColors[letter] || '#888'}`, borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text)' }}><div dangerouslySetInnerHTML={{ __html: html }} /></div>;
            })}
          </div>
        );
      }
      return <div dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(text)) }} />;
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.15rem' }}>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: '#d4a843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.28)', borderRadius: 20, padding: '2px 9px' }}>🎓 MENTOR</span>
          {isStreaming && <span style={{ fontSize: '0.58rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>generating…</span>}
        </div>
        {sections.map((sec, i) => {
          if (sec.type === 'TEXT') {
            if (!sec.content) return null;
            return <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '1.5rem 1.6rem 1.25rem', position: 'relative', boxShadow: '0 6px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(59,130,246,0.07) inset' }}><div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.25) 55%, transparent 100%)', borderRadius: '4px 18px 0 0' }} /><div dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(sec.content)) }} /></div>;
          }
          const cfg = sectionConfig[sec.type];
          if (!cfg) return <div key={i}>{renderContent(sec.content)}</div>;
          if (sec.type === 'MODELANSWER') {
            return <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '1.5rem 1.6rem 1.25rem', position: 'relative', boxShadow: '0 6px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(59,130,246,0.07) inset', overflow: 'hidden' }}><div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.25) 55%, transparent 100%)', borderRadius: '4px 18px 0 0' }} /><div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}><span>{cfg.icon}</span><span>{cfg.label}</span></div><div className="chat-bubble-ai" style={{ background: 'none', border: 'none', borderRadius: 0, padding: 0, boxShadow: 'none', position: 'static' }}>{renderContent(sec.content, sec.type)}</div></div>;
          }
          return <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, overflow: 'hidden' }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.5rem 0.9rem', borderBottom: `1px solid ${cfg.border}` }}><span style={{ fontSize: '0.85rem' }}>{cfg.icon}</span><span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color }}>{cfg.label}</span></div><div style={{ padding: '0.8rem 0.9rem' }}>{renderContent(sec.content, sec.type)}</div></div>;
        })}
      </div>
    );
  }

  const getPrecedingQuestion = (msgIndex: number): string | undefined => {
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return undefined;
  };

  // active mode label for the mode pill
  const activeModeLabel = mentorMode && usage?.subscribed ? '🎓 Mentor'
    : brainstormMode && usage?.subscribed ? '⚡ Brainstorm'
    : pdfFile ? '📄 PDF'
    : bookMode && usage?.subscribed ? '📚 Books'
    : responseStyle === 'elaborative' ? '📖 Elaborative'
    : '⚡ Concise';

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════
           WHATSAPP-STYLE MOBILE CHAT LAYOUT
           Full-height, messages scroll, input pinned bottom
        ═══════════════════════════════════════════════ */

        .chat-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100dvh - 52px);
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }

        /* ── Messages area: fills all available space, scrolls ── */
        .chat-msgs {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 1rem 0.85rem 0.5rem;
        }
        .chat-msgs-inner {
          max-width: 720px;
          margin: 0 auto;
        }

        /* ── Pinned input footer ── */
        .chat-footer {
          flex-shrink: 0;
          background: var(--bg);
          border-top: 1px solid var(--border);
          padding: 0.55rem 0.75rem 0.7rem;
          padding-bottom: max(0.7rem, env(safe-area-inset-bottom));
        }

        /* ── Mode pill strip (scrollable horizontal) ── */
        .chat-mode-strip {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin-bottom: 0.45rem;
          padding-bottom: 2px;
        }
        .chat-mode-strip::-webkit-scrollbar { display: none; }

        .chat-mode-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          font-size: 0.65rem;
          font-family: var(--font-mono);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text3);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .chat-mode-pill.active {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
        }
        .chat-mode-pill.gold-active {
          border-color: rgba(251,191,36,0.6);
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
        }
        .chat-mode-pill.green-active {
          border-color: rgba(74,222,128,0.5);
          background: rgba(74,222,128,0.1);
          color: #4ade80;
        }
        .chat-mode-pill-badge { color: rgba(251,191,36,0.8); }

        /* ── Input row: textarea + action icons ── */
        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 0.4rem;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 0.4rem 0.45rem 0.4rem 0.9rem;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .chat-input-row:focus-within {
          border-color: rgba(59,130,246,0.45);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.88rem;
          line-height: 1.5;
          padding: 0.3rem 0;
          min-height: 36px;
          max-height: 180px;
        }
        .chat-textarea::placeholder { color: var(--text3); }

        /* ── Action icon buttons inside input row ── */
        .chat-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          padding: 0;
        }
        .chat-icon-btn:hover { color: var(--text2); background: rgba(255,255,255,0.05); }
        .chat-icon-btn.active-blue { color: #60a5fa; }
        .chat-icon-btn.active-gold { color: #fbbf24; }

        /* Send button */
        .chat-send-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s;
          font-size: 15px;
        }
        .chat-send-btn.active {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #fff;
        }
        .chat-send-btn.inactive {
          background: var(--bg3);
          color: var(--text3);
          cursor: not-allowed;
        }

        /* ── Usage line ── */
        .chat-usage-line {
          text-align: center;
          margin-top: 0.3rem;
          font-family: var(--font-mono);
          font-size: 0.58rem;
          letter-spacing: 0.07em;
        }

        /* ── Message rows ── */
        .chat-msg-row {
          margin-bottom: 1.1rem;
          display: flex;
          flex-direction: column;
        }
        .chat-msg-row.user { align-items: flex-end; }
        .chat-msg-row.assistant { align-items: flex-start; }

        /* ── User bubble: right-aligned, smaller max-width on mobile ── */
        .chat-bubble-user {
          max-width: 82%;
          background: linear-gradient(135deg, rgba(29,78,216,0.18), rgba(59,130,246,0.09));
          border: 1px solid rgba(59,130,246,0.22);
          border-radius: 18px 18px 4px 18px;
          padding: 0.7rem 1rem;
          color: var(--text);
          font-size: 0.88rem;
          line-height: 1.6;
          font-family: var(--font-body);
          word-break: break-word;
        }

        /* ── AI bubble ── */
        .chat-bubble-ai {
          max-width: 97%;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 4px 18px 18px 18px;
          padding: 1rem 1.1rem 0.85rem;
          color: var(--text);
          font-size: 0.88rem;
          line-height: 1.8;
          position: relative;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
          font-family: var(--font-body);
          word-break: break-word;
        }
        .chat-bubble-ai::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.2) 55%, transparent 100%);
          border-radius: 4px 18px 0 0;
        }

        /* ── Headings ── */
        .chat-msg-h1 {
          font-family: var(--font-display);
          font-size: 0.97rem; font-weight: 700; color: #ffffff;
          margin: 1.2rem 0 0.5rem;
          padding: 0.45rem 0.8rem 0.45rem 0.85rem;
          background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.04));
          border-left: 3px solid #3b82f6;
          border-radius: 0 8px 8px 0;
          line-height: 1.4;
        }
        .chat-msg-h1:first-child { margin-top: 0; }
        .chat-msg-h2 {
          font-family: var(--font-display);
          font-size: 0.9rem; font-weight: 700; color: #fbbf24;
          margin: 1.1rem 0 0.35rem;
          padding-left: 0.55rem;
          border-left: 2.5px solid #f59e0b;
          line-height: 1.4;
        }
        .chat-msg-h3 {
          font-family: var(--font-display);
          font-size: 0.87rem; font-weight: 700; color: #4ade80;
          margin: 0.9rem 0 0.25rem;
          padding-left: 0.5rem;
          border-left: 2px solid #22c55e;
          line-height: 1.4;
        }

        /* ── Bullets ── */
        .chat-bullet {
          display: flex; align-items: flex-start; gap: 0.6rem;
          margin: 0.1rem 0;
          padding: 0.35rem 0.5rem 0.35rem 0.35rem;
          border-radius: 6px;
          color: var(--text);
        }
        .chat-bullet-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          box-shadow: 0 0 6px rgba(59,130,246,0.5);
          flex-shrink: 0; margin-top: 0.55rem;
        }
        .chat-bullet span:last-child { flex: 1; line-height: 1.72; }
        .chat-bullet strong { color: var(--text); font-weight: 700; }
        .chat-bubble-ai br + br { display: none; }
        .chat-para-gap { height: 0.55rem; }
        .chat-hr { height: 1px; background: linear-gradient(90deg, rgba(59,130,246,0.2), rgba(59,130,246,0.03) 65%, transparent); margin: 0.9rem 0; }
        .chat-bubble-ai strong { color: var(--text); font-weight: 700; }
        .chat-bubble-ai em { color: var(--text2); font-style: italic; }

        /* ── Mentor bubble ── */
        .chat-bubble-mentor { font-size: 0.88rem; line-height: 1.8; font-family: var(--font-body); }

        /* ── Meta row ── */
        .chat-meta {
          display: flex; align-items: center; gap: 0.4rem;
          margin-top: 0.3rem; padding: 0 4px;
        }
        .chat-meta.user { flex-direction: row-reverse; }
        .chat-meta-label { color: var(--text3); font-size: 0.62rem; letter-spacing: 0.08em; font-family: var(--font-mono); }
        .chat-ai-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.6rem; letter-spacing: 0.1em; font-family: var(--font-mono); color: rgba(59,130,246,0.6); }
        .chat-ai-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(59,130,246,0.6); box-shadow: 0 0 5px rgba(59,130,246,0.5); }

        /* ── Typing indicator ── */
        .chat-typing {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.65rem 0.9rem; margin-bottom: 0.75rem;
          background: var(--bg2);
          border: 1px solid var(--border); border-radius: 4px 14px 14px 14px;
          width: fit-content;
        }
        .chat-typing-dots { display: flex; gap: 4px; }
        .chat-typing-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(59,130,246,0.45); animation: chatDotPulse 1.3s ease infinite; }
        .chat-typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .chat-typing-dot:nth-child(3) { animation-delay: 0.32s; }
        .chat-typing-text { font-size: 0.65rem; color: var(--text3); letter-spacing: 0.07em; font-family: var(--font-mono); }
        @keyframes chatDotPulse { 0%,100% { opacity: 0.2; transform: scale(0.72); } 50% { opacity: 1; transform: scale(1.12); } }

        /* ── Suggested questions ── */
        .chat-suggested-label {
          font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--text3); margin-bottom: 0.7rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .chat-suggested-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }
        .chat-suggested-grid { display: flex; flex-direction: column; gap: 0.4rem; }
        .chat-suggested-btn {
          background: var(--bg2);
          border: 1px solid var(--border); border-radius: 12px;
          padding: 0.65rem 0.9rem; text-align: left;
          color: var(--text2); cursor: pointer; font-size: 0.82rem;
          font-family: var(--font-body); transition: all 0.18s; line-height: 1.45;
          width: 100%;
        }
        .chat-suggested-btn:hover { border-color: rgba(59,130,246,0.3); color: var(--text); background: rgba(29,78,216,0.08); }

        /* ── PDF strip (active PDF indicator) ── */
        .chat-pdf-strip {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.65rem; font-family: var(--font-mono); color: #a5b4fc;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
          border-radius: 8px; padding: 0.25rem 0.6rem;
          margin-bottom: 0.45rem; max-width: 100%;
        }
        .chat-pdf-strip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
        .chat-pdf-strip-close { cursor: pointer; opacity: 0.6; flex-shrink: 0; font-size: 0.75rem; }
        .chat-pdf-strip-close:hover { opacity: 1; }

        /* ── Books bottom sheet ── */
        .chat-books-sheet-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 899;
          backdrop-filter: blur(2px);
        }
        .chat-books-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg2); border-top: 1px solid rgba(139,92,246,0.3);
          border-radius: 20px 20px 0 0;
          padding: 1rem 1rem 1.5rem;
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
          z-index: 900;
          max-height: 60vh; overflow-y: auto;
          margin-bottom: 120px;
          border-radius: 20px;
        }
        .chat-books-sheet-handle { width: 36px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 1rem; }
        .chat-books-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .chat-books-title { font-family: var(--font-display); font-size: 0.85rem; font-weight: 600; color: var(--text); }
        .chat-books-toggle { width: 40px; height: 23px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: all 0.25s; }
        .chat-books-toggle.on { background: linear-gradient(90deg, #6366f1, #8b5cf6); box-shadow: 0 0 10px rgba(99,102,241,0.5); }
        .chat-books-toggle.off { background: rgba(99,102,241,0.2); }
        .chat-books-toggle-dot { position: absolute; top: 3px; width: 17px; height: 17px; border-radius: 50%; background: #fff; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
        .chat-books-select { width: 100%; font-size: 0.75rem; background: var(--bg3); color: var(--text); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 0.45rem 0.6rem; cursor: pointer; outline: none; font-family: var(--font-mono); margin-top: 0.5rem; }

        /* ── Mode bottom sheet ── */
        .chat-mode-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 800; }
        .chat-mode-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg2); border-top: 1px solid var(--border);
          border-radius: 20px 20px 0 0;
          padding: 1rem 1rem 1.5rem;
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
          z-index: 801;
        }
        .chat-mode-sheet-handle { width: 36px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 1rem; }
        .chat-mode-sheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
        .chat-mode-sheet-btn {
          display: flex; flex-direction: column; align-items: flex-start;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.75rem 0.85rem;
          cursor: pointer; text-align: left; transition: all 0.15s;
        }
        .chat-mode-sheet-btn:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.08); }
        .chat-mode-sheet-btn.active { border-color: rgba(99,102,241,0.55); background: rgba(99,102,241,0.14); }
        .chat-mode-sheet-icon { font-size: 1.25rem; margin-bottom: 0.35rem; }
        .chat-mode-sheet-label { font-size: 0.78rem; font-weight: 600; color: var(--text); font-family: var(--font-display); }
        .chat-mode-sheet-desc { font-size: 0.65rem; color: var(--text3); margin-top: 0.15rem; line-height: 1.4; }
        .chat-mode-sheet-premium { font-size: 0.55rem; color: rgba(251,191,36,0.8); margin-top: 0.2rem; }

        /* ── PDF button (save PDF) ── */
        .chat-pdf-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: linear-gradient(135deg, rgba(200,168,75,0.14), rgba(234,201,106,0.07));
          border: 1px solid rgba(200,168,75,0.28); border-radius: 20px;
          padding: 0.25rem 0.65rem; color: rgba(200,168,75,0.8);
          cursor: pointer; font-size: 0.62rem; font-family: var(--font-mono);
          letter-spacing: 0.06em; transition: all 0.18s;
        }
        .chat-pdf-btn:hover { border-color: rgba(200,168,75,0.5); color: #c8a84b; }
        .chat-pdf-btn:disabled { opacity: 0.45; cursor: wait; }
        .chat-spin { display: inline-block; animation: chatSpin 1s linear infinite; }
        @keyframes chatSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Tables ── */
        .chat-table-wrap { overflow-x: auto; margin: 0.8rem 0; border-radius: 8px; border: 1px solid rgba(59,130,246,0.15); }
        .chat-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .chat-table th { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.2); padding: 7px 10px; text-align: left; color: #f1f5f9; font-weight: 600; }
        .chat-table td { border: 1px solid rgba(0,0,0,0.07); padding: 6px 10px; color: #c8d3e0; vertical-align: top; }

        /* ── Citations ── */
        .chat-citation { color: #818cf8; cursor: pointer; text-decoration: underline; text-decoration-style: dotted; text-decoration-color: rgba(129,140,248,0.5); text-underline-offset: 2px; }
        .chat-citation:hover { color: #a5b4fc; }

        /* ── History sidebar ── */
        .chat-history-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 998; backdrop-filter: blur(2px); }
        .chat-history-panel { position: fixed; top: 0; left: 0; bottom: 0; width: 290px; max-width: 85vw; background: var(--bg2); border-right: 1px solid var(--border); z-index: 999; display: flex; flex-direction: column; box-shadow: 8px 0 40px rgba(0,0,0,0.5); }
        .chat-history-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem; border-bottom: 1px solid var(--border); }
        .chat-history-panel-title { font-family: var(--font-display); font-size: 0.85rem; font-weight: 600; color: var(--text); }
        .chat-history-close { background: none; border: none; color: var(--text3); font-size: 1.1rem; cursor: pointer; line-height: 1; }
        .chat-history-new { margin: 0.75rem 1rem 0.5rem; display: flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg, rgba(29,78,216,0.22), rgba(59,130,246,0.1)); border: 1px solid rgba(59,130,246,0.3); color: #dbe6ff; padding: 0.5rem; border-radius: 9px; cursor: pointer; font-size: 0.78rem; font-family: var(--font-body); font-weight: 500; }
        .chat-history-list { flex: 1; overflow-y: auto; padding: 0.4rem 0.6rem 1rem; }
        .chat-history-empty { color: var(--text3); font-size: 0.78rem; text-align: center; padding: 2rem 1rem; line-height: 1.6; }
        .chat-history-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 0.6rem 0.65rem; border-radius: 9px; cursor: pointer; margin-bottom: 3px; transition: background 0.15s; }
        .chat-history-item:hover { background: rgba(59,130,246,0.08); }
        .chat-history-item.active { background: rgba(59,130,246,0.14); border: 1px solid rgba(59,130,246,0.28); }
        .chat-history-item-text { flex: 1; min-width: 0; }
        .chat-history-item-title { font-size: 0.77rem; color: var(--text2); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .chat-history-item-date { font-size: 0.6rem; color: var(--text3); margin-top: 3px; font-family: var(--font-mono); }
        .chat-history-item-del { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 0.85rem; flex-shrink: 0; padding: 2px 4px; line-height: 1; opacity: 0.6; }
        .chat-history-item-del:hover { opacity: 1; color: #f87171; }

        /* ── Drag overlay ── */
        .chat-drag-overlay {
          position: fixed; inset: 0; z-index: 900;
          background: rgba(99,102,241,0.07);
          border: 2px dashed rgba(99,102,241,0.4);
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }

        /* ── Desktop toolbar (hidden on mobile, shown on desktop) ── */
        .chat-toolbar { display: none; }
        .chat-style-toggle { display: none; }

        /* ── Desktop: side rail layout (≥900px) ── */
        @media (min-width: 900px) {
          .chat-wrap {
            flex-direction: row;
          }
          .chat-msgs {
            flex: 1;
            min-width: 0;
            overflow-y: auto;
            padding: 1rem 1.5rem 2rem;
          }
          .chat-msgs-inner { max-width: 760px; margin: 0 auto; }
          .chat-footer {
            width: 380px;
            flex-shrink: 0;
            border-top: none;
            border-left: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 1.25rem 1.25rem 1.25rem 0.75rem;
            background: linear-gradient(180deg, rgba(10,10,13,0.4), var(--bg2));
          }
          .chat-mode-strip { display: none; }
          .chat-usage-line { display: none; }
          .chat-input-row {
            border-radius: 0;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.6rem 0.6rem 0.6rem 0.9rem;
          }
          .chat-textarea { min-height: 44px; max-height: 240px; }
          .chat-toolbar {
            display: flex;
            align-items: center;
            gap: 0.32rem;
            margin-bottom: 0.5rem;
            flex-wrap: wrap;
          }
          .chat-style-toggle {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            margin-bottom: 0.5rem;
            padding-left: 0.05rem;
          }
          .chat-input-area-wrap {
            background: linear-gradient(160deg, var(--bg2), var(--bg2));
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 0.7rem 0.75rem 0.8rem;
            box-shadow: 0 8px 28px rgba(0,0,0,0.4);
            position: relative;
          }
          .chat-hint-desktop {
            display: block;
            font-size: 0.58rem;
            color: var(--text3);
            text-align: center;
            margin-top: 0.45rem;
            letter-spacing: 0.03em;
          }
          .chat-usage-desktop {
            display: block;
            text-align: center;
            margin-top: 0.4rem;
            font-family: var(--font-mono);
            font-size: 0.62rem;
            letter-spacing: 0.08em;
          }
          .chat-suggested-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
        }
        .chat-hint-desktop { display: none; }
        .chat-usage-desktop { display: none; }
        .chat-input-area-wrap { background: transparent; border: none; padding: 0; box-shadow: none; }

        /* ── Books popover (desktop) ── */
        .chat-books-popover {
          position: absolute; bottom: calc(100% + 8px); left: 0;
          width: 260px; max-width: 80vw;
          background: var(--bg2);
          border: 1px solid rgba(139,92,246,0.4); border-radius: 14px;
          padding: 0.75rem; box-shadow: 0 12px 40px rgba(0,0,0,0.3);
          backdrop-filter: blur(16px); z-index: 60;
        }
        .chat-books-popover-row { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.1rem; }
        .chat-books-popover-label {
          font-size: 0.7rem; font-family: var(--font-mono); letter-spacing: 0.07em;
          color: var(--accent); font-weight: 600; text-transform: uppercase; flex: 1;
        }

        /* ── Desktop toolbar button styles ── */
        .chat-tool-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
          color: var(--text2); cursor: pointer;
          padding: 0.32rem 0.55rem; border-radius: 7px;
          font-size: 0.66rem; font-family: var(--font-mono); font-weight: 500;
          transition: all 0.15s; white-space: nowrap; position: relative;
        }
        .chat-tool-btn:hover { border-color: rgba(59,130,246,0.4); color: var(--text2); background: rgba(59,130,246,0.07); }
        .chat-tool-btn.active {
          background: rgba(99,102,241,0.18); border-color: rgba(99,102,241,0.6); color: #a5b4fc;
          box-shadow: 0 0 10px rgba(99,102,241,0.2);
        }
        .chat-tool-btn.gold-active {
          background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.6); color: #fbbf24;
        }
        .chat-tool-divider { width: 1px; height: 16px; background: var(--border2); margin: 0 0.1rem; flex-shrink: 0; }
        .chat-tool-badge { color: rgba(251,191,36,0.8); margin-left: 2px; }
      `}</style>

      <div
        className="chat-wrap"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onDrop={handleDrop}
      >
        <GateModals slots={slots} />

        {dragOver && (
          <div className="chat-drag-overlay">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(139,143,255,0.9)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Drop PDF here
            </div>
          </div>
        )}

        {/* ── History sidebar ── */}
        {historyOpen && (
          <>
            <div className="chat-history-overlay" onClick={() => setHistoryOpen(false)} />
            <div className="chat-history-panel">
              <div className="chat-history-panel-head">
                <span className="chat-history-panel-title">Chat History</span>
                <button className="chat-history-close" onClick={() => setHistoryOpen(false)}>✕</button>
              </div>
              <button className="chat-history-new" onClick={startNewChat}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Chat
              </button>
              <div className="chat-history-list">
                {historyList.length === 0 ? (
                  <div className="chat-history-empty">No saved chats yet.<br />Start a conversation and it'll appear here.</div>
                ) : (
                  historyList.slice().sort((a, b) => b.updatedAt - a.updatedAt).map(entry => (
                    <div key={entry.id} className={`chat-history-item ${entry.id === chatId ? 'active' : ''}`} onClick={() => loadHistoryEntry(entry)}>
                      <div className="chat-history-item-text">
                        <div className="chat-history-item-title">{entry.title}</div>
                        <div className="chat-history-item-date">
                          {new Date(entry.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          {' · '}
                          {new Date(entry.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button className="chat-history-item-del" onClick={(e) => deleteHistoryEntry(entry.id, e)} title="Delete">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Books bottom sheet ── */}
        {booksPopoverOpen && usage?.subscribed && (
          <>
            <div className="chat-books-sheet-overlay" onClick={() => setBooksPopoverOpen(false)} />
            <div className="chat-books-sheet">
              <div className="chat-books-sheet-handle" />
              <div className="chat-books-row">
                <span className="chat-books-title">📚 Chat with Books</span>
                <button className={`chat-books-toggle ${bookMode ? 'on' : 'off'}`} onClick={() => setBookMode(b => !b)}>
                  <span className="chat-books-toggle-dot" style={{ left: bookMode ? 20 : 3 }} />
                </button>
              </div>
              {bookMode && (
                <select value={bookTitle} onChange={e => setBookTitle(e.target.value)} className="chat-books-select">
                  <option value="all">📖 All Books</option>
                  <option disabled>── Ancient ──</option>
                  <option value="Ajeet Jha — A History of Ancient India">Ajeet Jha — A History of Ancient India</option>
                  <option value="Upinder Singh - Ancient & Early Medieval India">Upinder Singh - Ancient & Early Medieval India</option>
                  <option value="RS Sharma — Ancient India (Old NCERT)">RS Sharma — Ancient India (Old NCERT)</option>
                  <option value="Romila Thapar — Early India">Romila Thapar — Early India</option>
                  <option value="Ranbir Chakravarti — Exploring Early India">Ranbir Chakravarti — Exploring Early India</option>
                  <option value="RC Majumdar — Ancient India">RC Majumdar — Ancient India</option>
                  <option value="DN Jha — Ancient India in Historical Outline">DN Jha — Ancient India in Historical Outline</option>
                  <option value="KA Nilakanta Sastri — A History of South India">KA Nilakanta Sastri — A History of South India</option>
                  <option value="AL Basham - The Wonder That Was India">AL Basham - The Wonder That Was India</option>
                  <option value="DD Kosambi — An Introduction to the Study of Indian History">DD Kosambi — An Introduction to the Study of Indian History</option>
                  <option disabled>── Medieval ──</option>
                  <option value="Mughals IGNOU">Mughals IGNOU</option>
                  <option value="Delhi Sultanate IGNOU">Delhi Sultanate IGNOU</option>
                  <option value="Satish Chandra - Medieval India (800-1700)">Satish Chandra - Medieval India (800-1700)</option>
                  <option value="Satish Chandra - Medieval India Part 2 (1526-1748)">Satish Chandra - Medieval India Part 2 (1526-1748)</option>
                  <option value="Vipul Singh — Interpreting Medieval India">Vipul Singh — Interpreting Medieval India</option>
                  <option value="India in the Persianate Age">Richard Eaton — India in the Persianate Age</option>
                  <option value="The Rise of Islam and the Bengal Frontier">Richard Eaton — The Rise of Islam and the Bengal Frontier</option>
                  <option value="Irfan Habib — Agrarian System of Mughal India">Irfan Habib — Agrarian System of Mughal India</option>
                  <option disabled>── Modern ──</option>
                  <option value="Bipan Chandra - History of Modern India">Bipan Chandra - History of Modern India</option>
                  <option value="Bipan Chandra — India's Struggle for Independence">Bipan Chandra — India's Struggle for Independence</option>
                  <option value="Sekhar Bandopadhyay - Plassey to Partition">Sekhar Bandopadhyay - Plassey to Partition</option>
                  <option value="Sumit Sarkar — Modern India (1885-1947)">Sumit Sarkar — Modern India (1885-1947)</option>
                  <option value="BL Grover - Modern Indian History">BL Grover - Modern Indian History</option>
                  <option value="Ranajit Guha — Elementary Aspects of Peasant Insurgency">Ranajit Guha — Elementary Aspects of Peasant Insurgency</option>
                  <option disabled>── World ──</option>
                  <option value="Norman Lowe - Mastering Modern World History">Norman Lowe - Mastering Modern World History</option>
                  <option value="Eric Hobsbawm - Age of Revolution">Eric Hobsbawm - Age of Revolution (1789-1848)</option>
                  <option value="Eric Hobsbawm - Age of Capital">Eric Hobsbawm - Age of Capital (1848-1875)</option>
                  <option value="Eric Hobsbawm - Age of Empire">Eric Hobsbawm - Age of Empire (1875-1914)</option>
                  <option value="Eric Hobsbawm - Age of Extremes">Eric Hobsbawm - Age of Extremes (1914-1991)</option>
                  <option value="David Thomson — Europe Since Napoleon">David Thomson — Europe Since Napoleon</option>
                </select>
              )}
            </div>
          </>
        )}

        {/* ── Mode picker bottom sheet ── */}
        {modeSheetOpen && (
          <>
            <div className="chat-mode-sheet-overlay" onClick={() => setModeSheetOpen(false)} />
            <div className="chat-mode-sheet">
              <div className="chat-mode-sheet-handle" />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888888', marginBottom: '0.75rem' }}>Select Mode</div>
              <div className="chat-mode-sheet-grid">
                {/* Concise */}
                <button className={`chat-mode-sheet-btn ${responseStyle === 'concise' && !mentorMode && !brainstormMode ? 'active' : ''}`}
                  onClick={() => { setResponseStyle('concise'); setMentorMode(false); setBrainstormMode(false); setModeSheetOpen(false); }}>
                  <span className="chat-mode-sheet-icon">⚡</span>
                  <span className="chat-mode-sheet-label">Concise</span>
                  <span className="chat-mode-sheet-desc">Bullet-point answers, fast</span>
                </button>
                {/* Elaborative */}
                <button className={`chat-mode-sheet-btn ${responseStyle === 'elaborative' && !mentorMode && !brainstormMode ? 'active' : ''}`}
                  onClick={() => { setResponseStyle('elaborative'); setMentorMode(false); setBrainstormMode(false); setModeSheetOpen(false); }}>
                  <span className="chat-mode-sheet-icon">📖</span>
                  <span className="chat-mode-sheet-label">Elaborative</span>
                  <span className="chat-mode-sheet-desc">Deep prose, full analysis</span>
                </button>
                {/* Brainstorm */}
                <button className={`chat-mode-sheet-btn ${brainstormMode ? 'active' : ''}`}
                  onClick={() => {
                    if (!usage?.subscribed) { setModeSheetOpen(false); showChatLimitModal(); return; }
                    setBrainstormMode(b => !b); setMentorMode(false); setModeSheetOpen(false);
                  }}>
                  <span className="chat-mode-sheet-icon">💡</span>
                  <span className="chat-mode-sheet-label">Brainstorm</span>
                  <span className="chat-mode-sheet-desc">Essay plans & argument maps</span>
                  {!usage?.subscribed && <span className="chat-mode-sheet-premium">✦ Premium</span>}
                </button>
                {/* Mentor */}
                <button className={`chat-mode-sheet-btn ${mentorMode && usage?.subscribed ? 'active' : ''}`}
                  onClick={() => {
                    if (!usage?.subscribed) { setModeSheetOpen(false); showChatLimitModal(); return; }
                    setMentorMode(m => !m); setBrainstormMode(false); setModeSheetOpen(false);
                  }}>
                  <span className="chat-mode-sheet-icon">🎓</span>
                  <span className="chat-mode-sheet-label">Mentor</span>
                  <span className="chat-mode-sheet-desc">TADA framework, 350-word strategy</span>
                  {!usage?.subscribed && <span className="chat-mode-sheet-premium">✦ Premium</span>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Book paywall modal ── */}
        {showBookPaywall && !usageLoading && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBookPaywall(false)}>
            <div style={{ background: 'var(--bg)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: '2rem', maxWidth: 340, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text1)', marginBottom: '0.4rem' }}>Chat with Books</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Get answers grounded in 20+ standard History Optional reference books.<br/><br/>
                <span style={{ color: '#818cf8' }}>✦ Premium feature</span>
              </div>
              <button onClick={() => { setShowBookPaywall(false); showChatLimitModal(); }} style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Unlock Premium</button>
              <button onClick={() => setShowBookPaywall(false)} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#888888', fontSize: '0.8rem', cursor: 'pointer' }}>Maybe later</button>
            </div>
          </div>
        )}

        {/* ── Citation modal ── */}
        {citationModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setCitationModal(null)}>
            <div style={{ background: 'var(--bg)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: '1.25rem', maxWidth: 480, width: '100%', maxHeight: '75vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>📖 Cited Passage{citationModal.length > 1 ? 's' : ''}</span>
                <button onClick={() => setCitationModal(null)} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              {citationModal.map((s, si) => {
                const cleaned = cleanChunk(s.content);
                return (
                  <div key={si} style={{ marginBottom: si < citationModal.length - 1 ? '1rem' : 0, paddingBottom: si < citationModal.length - 1 ? '1rem' : 0, borderBottom: si < citationModal.length - 1 ? '1px solid rgba(99,102,241,0.12)' : 'none' }}>
                    <div style={{ display: 'inline-block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '0.15rem 0.5rem', marginBottom: '0.5rem' }}>{s.book_title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.75 }}>{cleaned || 'Passage text unavailable.'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            MESSAGES AREA
        ════════════════════════════════════════ */}
        <div className="chat-msgs">
          <div className="chat-msgs-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg-row ${msg.role}`}
                ref={msg.role === 'assistant' && i === messages.length - 1 ? lastAiRef : null}>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : (msg.isMentor ? 'chat-bubble-mentor' : 'chat-bubble-ai')}>
                  {msg.role === 'user' ? (
                    <span>{msg.content}</span>
                  ) : msg.content === '' ? (
                    <span style={{ opacity: 0.4, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>●●●</span>
                  ) : msg.isMentor ? (
                    <MentorBubble content={msg.content} isStreaming={loading && i === messages.length - 1} />
                  ) : (loading && i === messages.length - 1) ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitize(marked.parse(msg.content, { breaks: true }) as string) }} />
                  ) : (
                    <div
                      onClick={(e) => {
                        const target = (e.target as HTMLElement).closest('[data-citation]') as HTMLElement | null;
                        if (target && msg.sources) {
                          const indices = target.getAttribute('data-citation')!.split(',').map(Number);
                          const picked = indices.map(n => msg.sources![n - 1]).filter(Boolean);
                          if (picked.length) setCitationModal(picked);
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitize(formatMessage(msg.content, msg.sources?.length ?? 0)) }}
                    />
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && <SourcePassages sources={msg.sources} />}
                <div className={`chat-meta ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <span className="chat-ai-badge"><span className="chat-ai-dot" />AI</span>
                      {i > 0 && <DownloadPDFButton content={msg.content} question={getPrecedingQuestion(i)} />}
                    </>
                  ) : (
                    <span className="chat-meta-label">{tr(t.youLabel, langHi)}</span>
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
              <div style={{ marginTop: '1.25rem' }}>
                <div className="chat-suggested-label">{tr(t.chatSuggestedLabel, langHi)}</div>
                <div className="chat-suggested-grid">
                  {(langHi ? SUGGESTED_HI : SUGGESTED_EN).map((q, i) => (
                    <button key={i} className="chat-suggested-btn" onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} style={{ height: 8 }} />
          </div>
        </div>

        {/* ════════════════════════════════════════
            PINNED INPUT FOOTER
        ════════════════════════════════════════ */}
        <div className="chat-footer">
          {/* ── Desktop-only toolbar ── */}
          <div className="chat-input-area-wrap">
          <div className="chat-toolbar">
            <button className="chat-tool-btn" onClick={() => setHistoryOpen(true)} title="Chat history">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
              History
            </button>
            <button className="chat-tool-btn" onClick={startNewChat} title="Start a new chat">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New
            </button>
            <div className="chat-tool-divider" />
            <button
              className={`chat-tool-btn ${pdfFile ? 'active' : ''}`}
              onClick={() => { if (!usage?.subscribed) { showChatLimitModal(); return; } fileInputRef.current?.click(); }}
              title={usage?.subscribed ? "Upload PDF to discuss or get model answers" : "Premium feature — subscribe to upload PDFs"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {pdfFile ? (
                <>{pdfName} <span onClick={e => { e.stopPropagation(); setPdfFile(null); setPdfBase64(null); setPdfName(null); }} style={{ marginLeft:'4px', opacity:0.6, fontWeight:'bold', cursor:'pointer' }}>✕</span></>
              ) : <>PDF{!usage?.subscribed && <span className="chat-tool-badge">✦</span>}</>}
            </button>
            <button
              className={`chat-tool-btn ${brainstormMode ? 'gold-active' : ''}`}
              onClick={() => { if (!usage?.subscribed) { showChatLimitModal(); return; } setBrainstormMode(b => !b); }}
              title={usage?.subscribed ? "Brainstorm mode — get essay plans & argument maps" : "Premium feature — subscribe to use Brainstorm"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              Brainstorm{!usage?.subscribed && <span className="chat-tool-badge">✦</span>}
            </button>
            <div style={{ position:'relative' }}>
              <button
                className={`chat-tool-btn ${bookMode && usage?.subscribed ? 'active' : ''}`}
                onClick={() => { if (usageLoading) return; if (!usage?.subscribed) { setShowBookPaywall(true); return; } setBooksPopoverOpen(o => !o); }}
                title="Chat with Books — ground answers in reference texts"
              >
                <span style={{ fontSize:'0.85rem' }}>📚</span>
                Books{!usage?.subscribed && <span className="chat-tool-badge">✦</span>}
              </button>
              <button
                className={`chat-tool-btn ${mentorMode && usage?.subscribed ? 'active' : ''}`}
                onClick={() => { if (usageLoading) return; if (!usage?.subscribed) { setShowBookPaywall(true); return; } setMentorMode(m => !m); }}
                title="Mentor Mode — TADA framework, evaluator feedback, 350+ strategy (Premium)"
                style={{ ...(mentorMode && usage?.subscribed ? { background:'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(212,168,67,0.1))', borderColor:'rgba(234,179,8,0.5)', color:'#d4a843' } : {}) }}
              >
                <span style={{ fontSize:'0.85rem' }}>🎓</span>
                Mentor{!usage?.subscribed && <span className="chat-tool-badge">✦</span>}
              </button>
              {booksPopoverOpen && usage?.subscribed && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:55 }} onClick={() => setBooksPopoverOpen(false)} />
                  <div className="chat-books-popover" onClick={e => e.stopPropagation()}>
                    <div className="chat-books-popover-row">
                      <span className="chat-books-popover-label">Chat with Books</span>
                      <button className={`chat-books-toggle ${bookMode ? 'on' : 'off'}`} onClick={() => setBookMode(b => !b)}>
                        <span className="chat-books-toggle-dot" style={{ left: bookMode ? 20 : 4 }} />
                      </button>
                    </div>
                    {bookMode && (
                      <select value={bookTitle} onChange={e => setBookTitle(e.target.value)} className="chat-books-select">
                        <option value="all">📖 All Books</option>
                        <option disabled style={{color:'#555'}}>── Ancient ──</option>
                        <option value="Ajeet Jha — A History of Ancient India">Ajeet Jha — A History of Ancient India</option>
                        <option value="Upinder Singh - Ancient & Early Medieval India">Upinder Singh - Ancient & Early Medieval India</option>
                        <option value="RS Sharma — Ancient India (Old NCERT)">RS Sharma — Ancient India (Old NCERT)</option>
                        <option value="Romila Thapar — Early India">Romila Thapar — Early India</option>
                        <option value="Ranbir Chakravarti — Exploring Early India">Ranbir Chakravarti — Exploring Early India</option>
                        <option value="RC Majumdar — Ancient India">RC Majumdar — Ancient India</option>
                        <option value="DN Jha — Ancient India in Historical Outline">DN Jha — Ancient India in Historical Outline</option>
                        <option value="KA Nilakanta Sastri — A History of South India">KA Nilakanta Sastri — A History of South India</option>
                        <option value="AL Basham - The Wonder That Was India">AL Basham - The Wonder That Was India</option>
                        <option value="DD Kosambi — An Introduction to the Study of Indian History">DD Kosambi — An Introduction to the Study of Indian History</option>
                        <option disabled style={{color:'#555'}}>── Medieval ──</option>
                        <option value="Mughals IGNOU">Mughals IGNOU</option>
                        <option value="Delhi Sultanate IGNOU">Delhi Sultanate IGNOU</option>
                        <option value="Satish Chandra - Medieval India (800-1700)">Satish Chandra - Medieval India (800-1700)</option>
                        <option value="Satish Chandra - Medieval India Part 2 (1526-1748)">Satish Chandra - Medieval India Part 2 (1526-1748)</option>
                        <option value="Vipul Singh — Interpreting Medieval India">Vipul Singh — Interpreting Medieval India</option>
                        <option value="India in the Persianate Age">Richard Eaton — India in the Persianate Age</option>
                        <option value="The Rise of Islam and the Bengal Frontier">Richard Eaton — The Rise of Islam and the Bengal Frontier</option>
                        <option value="Irfan Habib — Agrarian System of Mughal India">Irfan Habib — Agrarian System of Mughal India</option>
                        <option disabled style={{color:'#555'}}>── Modern ──</option>
                        <option value="Bipan Chandra - History of Modern India">Bipan Chandra - History of Modern India</option>
                        <option value="Bipan Chandra — India's Struggle for Independence">Bipan Chandra — India's Struggle for Independence</option>
                        <option value="Sekhar Bandopadhyay - Plassey to Partition">Sekhar Bandopadhyay - Plassey to Partition</option>
                        <option value="Sumit Sarkar — Modern India (1885-1947)">Sumit Sarkar — Modern India (1885-1947)</option>
                        <option value="BL Grover - Modern Indian History">BL Grover - Modern Indian History</option>
                        <option value="Ranajit Guha — Elementary Aspects of Peasant Insurgency">Ranajit Guha — Elementary Aspects of Peasant Insurgency</option>
                        <option disabled style={{color:'#555'}}>── World ──</option>
                        <option value="Norman Lowe - Mastering Modern World History">Norman Lowe - Mastering Modern World History</option>
                        <option value="Eric Hobsbawm - Age of Revolution">Eric Hobsbawm - Age of Revolution (1789-1848)</option>
                        <option value="Eric Hobsbawm - Age of Capital">Eric Hobsbawm - Age of Capital (1848-1875)</option>
                        <option value="Eric Hobsbawm - Age of Empire">Eric Hobsbawm - Age of Empire (1875-1914)</option>
                        <option value="Eric Hobsbawm - Age of Extremes">Eric Hobsbawm - Age of Extremes (1914-1991)</option>
                        <option value="David Thomson — Europe Since Napoleon">David Thomson — Europe Since Napoleon</option>
                      </select>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Response style toggle — desktop only */}
          {!mentorMode && !brainstormMode && (
            <div className="chat-style-toggle">
              <span style={{ fontSize:'0.6rem', color:'var(--text3)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Style</span>
              <span style={{ fontSize:'0.6rem', color:'var(--border)', fontFamily:'var(--font-mono)' }}>—</span>
              {(['concise', 'elaborative'] as const).map(s => (
                <button key={s} onClick={() => setResponseStyle(s)} style={{
                  fontSize:'0.68rem', fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                  padding:'3px 12px', borderRadius:20,
                  border: responseStyle === s ? `1px solid ${s === 'concise' ? '#3b82f6' : '#8b5cf6'}` : '1px solid var(--border)',
                  background: responseStyle === s ? (s === 'concise' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)') : 'transparent',
                  color: responseStyle === s ? (s === 'concise' ? '#60a5fa' : '#a78bfa') : 'var(--text3)',
                  cursor:'pointer', transition:'all 0.15s', fontWeight: responseStyle === s ? 600 : 400,
                }}>
                  {s === 'concise' ? '⚡' : '📖'} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Active PDF strip */}
          {pdfFile && (
            <div className="chat-pdf-strip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="chat-pdf-strip-name">{pdfName}</span>
              <span className="chat-pdf-strip-close" onClick={() => { setPdfFile(null); setPdfBase64(null); setPdfName(null); }}>✕</span>
            </div>
          )}

          {/* Mode pills — horizontal scroll */}
          <div className="chat-mode-strip">
            {/* History */}
            <button className="chat-mode-pill" onClick={() => setHistoryOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
              History
            </button>
            {/* New chat */}
            <button className="chat-mode-pill" onClick={startNewChat}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New
            </button>

            <span style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0, alignSelf: 'center' }} />

            {/* Mode picker */}
            <button
              className={`chat-mode-pill ${mentorMode && usage?.subscribed ? 'gold-active' : brainstormMode && usage?.subscribed ? 'gold-active' : ''}`}
              onClick={() => setModeSheetOpen(true)}
              title="Switch mode"
            >
              {activeModeLabel}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {/* Books */}
            <button
              className={`chat-mode-pill ${bookMode && usage?.subscribed ? 'green-active' : ''}`}
              onClick={() => {
                if (!usage?.subscribed) { setShowBookPaywall(true); return; }
                setBooksPopoverOpen(o => !o);
              }}
            >
              📚 Books{!usage?.subscribed && <span className="chat-mode-pill-badge">✦</span>}
            </button>

            {/* PDF upload */}
            <button
              className={`chat-mode-pill ${pdfFile ? 'active' : ''}`}
              onClick={() => { if (!usage?.subscribed) { showChatLimitModal(); return; } fileInputRef.current?.click(); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              PDF{!usage?.subscribed && <span className="chat-mode-pill-badge">✦</span>}
            </button>
          </div>

          {/* Input row */}
          <div className="chat-input-row">
            <input
              ref={fileInputRef as any}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); (e.target as HTMLInputElement).value = ''; }}
            />
            <textarea
              ref={inputRef}
              className="chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={brainstormMode ? tr(t.chatPlaceholderBrainstorm, langHi) : pdfFile ? tr(t.chatPlaceholderPdf, langHi) : tr(t.chatPlaceholderDefault, langHi)}
              rows={1}
              onInput={e => {
                const ta = e.currentTarget;
                ta.style.height = 'auto';
                ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
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

          {/* Usage line — mobile */}
          {!usageLoading && (
            <div className="chat-usage-line" style={{ color: !canChat ? '#f87171' : usage?.subscribed ? '#51cf66' : 'var(--text3)' }}>
              {usage?.subscribed ? tr(t.chatUnlimited, langHi) : !canChat ? tr(t.chatFreeUsed, langHi) : `${(usage?.chat_count ?? 0)} of 3 free messages used`}
            </div>
          )}

          {/* Desktop hint + usage */}
          <div className="chat-hint-desktop">{tr(t.chatHint, langHi)}</div>
          {!usageLoading && (
            <div className="chat-usage-desktop" style={{ color: !canChat ? '#f87171' : usage?.subscribed ? '#51cf66' : '#555' }}>
              {usage?.subscribed ? tr(t.chatUnlimited, langHi) : !canChat ? tr(t.chatFreeUsed, langHi) : `${(usage?.chat_count ?? 0)} of 3 free messages used`}
            </div>
          )}
          </div>{/* end chat-input-area-wrap */}
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