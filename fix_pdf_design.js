const fs = require('fs');

// ── SHARED SANITIZER (already in files, just keeping reference) ──

// ── NEW CHAT PDF FUNCTION ──
const newChatPDF = `async function downloadAnswerAsPDF(markdownText: string, questionText?: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210, pageH = 297, M = 18, contentW = 174;

  // Premium palette — ink on white, gold accent
  const INK    : [number,number,number] = [10,  10,  10];
  const INK2   : [number,number,number] = [40,  40,  40];
  const INK3   : [number,number,number] = [90,  90,  90];
  const GOLD   : [number,number,number] = [180, 140,  40];
  const GOLD2  : [number,number,number] = [210, 170,  70];
  const RULE   : [number,number,number] = [220, 220, 220];
  const BGSOFT : [number,number,number] = [250, 249, 246];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL    = 'https://www.historyoptional.xyz';

  let pg = 1, y = 0;

  const strip = (t: string) => {
    const map: Record<string,string> = {
      '\\u0101':'a','\\u0100':'A','\\u012b':'i','\\u012a':'I','\\u016b':'u','\\u016a':'U',
      '\\u1e0d':'d','\\u1e0c':'D','\\u1e6d':'t','\\u1e6c':'T','\\u1e47':'n','\\u1e46':'N',
      '\\u1e63':'s','\\u1e62':'S','\\u015b':'s','\\u015a':'S','\\u1e25':'h','\\u1e24':'H',
      '\\u1e45':'n','\\u1e44':'N','\\u1e37':'l','\\u1e36':'L','\\u1e5b':'r','\\u1e5a':'R',
      '\\u1e43':'m','\\u1e42':'M','\\u1e41':'m','\\u1e40':'M',
      '\\u0107':'c','\\u0106':'C','\\u010d':'c','\\u010c':'C',
      '\\u2013':'--','\\u2014':'--','\\u2018':"'",'\\u2019':"'",
      '\\u201c':'"','\\u201d':'"','\\u2026':'...','\\u00d7':'x','\\u00f7':'/',
      '\\u00e9':'e','\\u00e8':'e','\\u00ea':'e','\\u00e0':'a','\\u00e2':'a',
      '\\u00e4':'a','\\u00f6':'o','\\u00fc':'u','\\u00fb':'u','\\u00f1':'n',
      '\\u00e7':'c','\\u00df':'ss','\\u00e6':'ae',
    };
    let result = '';
    const base = t
      .replace(/\\*\\*(.+?)\\*\\*/g,'$1')
      .replace(/\\*(.+?)\\*/g,'$1')
      .replace(/\`(.+?)\`/g,'$1');
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text('HISTORY OPTIONAL', M, 9);
    doc.link(M, 2, 52, 10, { url: URL });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M + 55, 9);
    doc.text('AI Chat  \u00b7  UPSC History Optional', pageW - M, 9, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...RULE);
    doc.rect(0, pageH - 11, pageW, 0.3, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, pageH - 10.7, pageW, 10.7, 'F');
    // Gold bottom rule
    doc.setFillColor(...GOLD);
    doc.rect(0, pageH - 0.6, pageW, 0.6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M, pageH - 4.5);
    doc.link(M, pageH - 9, 50, 7, { url: URL });
    doc.text('AI History Assistant  \u00b7  UPSC History Optional', pageW / 2, pageH - 4.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(String(pg), pageW - M, pageH - 4.5, { align: 'right' });
  };

  const nextPage = () => {
    doc.addPage(); pg++;
    drawBg(); drawHeader(); drawFooter(); y = 22;
  };

  const chk = (n: number) => { if (y + n > pageH - 14) nextPage(); };

  drawBg(); drawHeader(); drawFooter(); y = 22;

  // Question block
  if (questionText) {
    const qTxt = strip(questionText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GOLD);
    doc.text('QUESTION', M, y);
    y += 3.5;

    const qLines = doc.splitTextToSize(qTxt, contentW - 8) as string[];
    const qH = qLines.length * 5.5 + 9;
    doc.setFillColor(...BGSOFT);
    doc.rect(M, y, contentW, qH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y, 2, qH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 6 + i * 5.5); });
    y += qH + 9;
  }

  // Content
  const lines = markdownText.split('\\n');
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || /^---+$/.test(t)) { y += 1.5; continue; }

    if (/^#{1,2} /.test(t)) {
      const txt = strip(t.replace(/^#{1,2} /, ''));
      chk(14); y += 5;
      // Gold left bar + heading
      doc.setFillColor(...GOLD);
      doc.rect(M, y - 5, 2, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...INK2);
      doc.text(txt, M + 4, y);
      y += 6;
    } else if (/^[•\\-\\*] /.test(t)) {
      const txt = strip(t.replace(/^[•\\-\\*] /, ''));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const bL = doc.splitTextToSize(txt, contentW - 10) as string[];
      chk(bL.length * 5.3 + 3);
      // Gold bullet
      doc.setFillColor(...GOLD);
      doc.rect(M + 2, y - 1.2, 1.5, 1.5, 'F');
      doc.setTextColor(...INK2);
      bL.forEach((l: string) => { chk(7); doc.text(l, M + 7, y); y += 5.3; });
      y += 1.5;
    } else {
      const txt = strip(t);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const pL = doc.splitTextToSize(txt, contentW) as string[];
      chk(pL.length * 5.3 + 2);
      doc.setTextColor(...INK2);
      pL.forEach((l: string) => { chk(7); doc.text(l, M, y); y += 5.3; });
      y += 2;
    }
  }

  // Single subtle watermark per page, center only
  for (let p = 1; p <= pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({ opacity: 0.025 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    doc.text(DOMAIN, pageW / 2, pageH / 2, { align: 'center', angle: 30 });
    doc.restoreGraphicsState();
  }

  const slug = markdownText.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\\s+/g, '_') || 'answer';
  doc.save(slug + '.pdf');
}`;

// ── NEW EVALUATE PDF FUNCTION ──
const newEvalPDF = `async function downloadModelAnswerPDF(question: string, marks: number, evaluation: Evaluation) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = 210, pageH = 297, M = 18, contentW = 174;

  const INK    : [number,number,number] = [10,  10,  10];
  const INK2   : [number,number,number] = [40,  40,  40];
  const INK3   : [number,number,number] = [90,  90,  90];
  const GOLD   : [number,number,number] = [180, 140,  40];
  const RULE   : [number,number,number] = [220, 220, 220];
  const BGSOFT : [number,number,number] = [250, 249, 246];
  const GREEN  : [number,number,number] = [30, 140,  70];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL    = 'https://www.historyoptional.xyz';

  let pg = 1, y = 0;

  const clean = (t: string) => {
    if (!t) return '';
    const map: Record<string,string> = {
      '\\u0101':'a','\\u0100':'A','\\u012b':'i','\\u012a':'I','\\u016b':'u','\\u016a':'U',
      '\\u1e0d':'d','\\u1e0c':'D','\\u1e6d':'t','\\u1e6c':'T','\\u1e47':'n','\\u1e46':'N',
      '\\u1e63':'s','\\u1e62':'S','\\u015b':'s','\\u015a':'S','\\u1e25':'h','\\u1e24':'H',
      '\\u1e45':'n','\\u1e44':'N','\\u1e37':'l','\\u1e36':'L','\\u1e5b':'r','\\u1e5a':'R',
      '\\u1e43':'m','\\u1e42':'M','\\u1e41':'m','\\u1e40':'M',
      '\\u0107':'c','\\u0106':'C','\\u010d':'c','\\u010c':'C',
      '\\u2013':'--','\\u2014':'--','\\u2018':"'",'\\u2019':"'",
      '\\u201c':'"','\\u201d':'"','\\u2026':'...','\\u00d7':'x','\\u00f7':'/',
      '\\u00e9':'e','\\u00e8':'e','\\u00ea':'e','\\u00e0':'a','\\u00e2':'a',
      '\\u00e4':'a','\\u00f6':'o','\\u00fc':'u','\\u00fb':'u','\\u00f1':'n',
      '\\u00e7':'c','\\u00df':'ss','\\u00e6':'ae',
    };
    let result = '';
    for (const ch of t) {
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text('HISTORY OPTIONAL', M, 9);
    doc.link(M, 2, 52, 10, { url: URL });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M + 55, 9);
    doc.text('Model Answer  \u00b7  ' + marks + 'M  \u00b7  UPSC CSM', pageW - M, 9, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...RULE);
    doc.rect(0, pageH - 11, pageW, 0.3, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, pageH - 10.7, pageW, 10.7, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, pageH - 0.6, pageW, 0.6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M, pageH - 4.5);
    doc.link(M, pageH - 9, 50, 7, { url: URL });
    doc.text('UPSC History Optional  \u00b7  Model Answer Evaluator', pageW / 2, pageH - 4.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(String(pg), pageW - M, pageH - 4.5, { align: 'right' });
  };

  const nextPage = () => {
    doc.addPage(); pg++;
    drawBg(); drawHeader(); drawFooter(); y = 22;
  };

  const chk = (n: number) => { if (y + n > pageH - 14) nextPage(); };

  const secLabel = (txt: string) => {
    chk(14); y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD);
    doc.text(txt.toUpperCase(), M, y);
    y += 2;
    doc.setFillColor(...GOLD);
    doc.rect(M, y, contentW, 0.4, 'F');
    y += 5;
  };

  const writeText = (text: string, size = 9.5, color: [number,number,number] = INK2) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const ls = doc.splitTextToSize(clean(text), contentW) as string[];
    ls.forEach((l: string) => { chk(7); doc.text(l, M, y); y += 5.3; });
  };

  drawBg(); drawHeader(); drawFooter(); y = 22;

  // ── Title bar ──
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, contentW, 12, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, 2, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('MODEL ANSWER', M + 7, y + 8);
  const idealWC = marks === 10 ? '150 words' : marks === 15 ? '200 words' : '250 words';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...INK3);
  doc.text(idealWC + '  \u00b7  ' + marks + ' Marks', pageW - M, y + 8, { align: 'right' });
  y += 18;

  // ── Score ──
  const scoreStr = evaluation.marks + ' / ' + evaluation.marks_out_of;
  const scoreW = 48;
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, scoreW, 14, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, scoreW, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(scoreStr, M + scoreW / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...INK3);
  doc.text('MARKS SCORED', M + scoreW / 2, y + 13.5, { align: 'center' });
  y += 20;

  // ── Question ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...GOLD);
  doc.text('QUESTION', M, y);
  y += 3.5;
  const qLines = doc.splitTextToSize(clean(question), contentW - 8) as string[];
  const qH = qLines.length * 5.3 + 9;
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, contentW, qH, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, 2, qH, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 6 + i * 5.3); });
  y += qH + 10;

  // ── Introduction ──
  secLabel('Introduction');
  writeText(evaluation.model_answer.introduction);
  y += 4;

  // ── Body ──
  secLabel('Body');
  const paras = bodyParas(evaluation.model_answer.body);
  paras.forEach((p: string, i: number) => {
    chk(12);
    doc.setFillColor(...GOLD);
    doc.rect(M, y - 1, 1.5, 1.5, 'F');
    writeText(p, 9.5, INK2);
    if (i < paras.length - 1) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      doc.line(M + 5, y + 1, pageW - M, y + 1);
      y += 4;
    }
  });
  y += 6;

  // ── Conclusion ──
  secLabel('Conclusion');
  writeText(evaluation.model_answer.conclusion);
  y += 4;

  // ── Historians ──
  secLabel('Historians to Cite');
  evaluation.historians_to_cite.forEach((h: any) => {
    const argLines = doc.splitTextToSize(clean(h.argument), contentW - 8) as string[];
    const hH = argLines.length * 5.3 + (h.work ? 20 : 16);
    chk(hH + 5);
    doc.setFillColor(...BGSOFT);
    doc.rect(M, y, contentW, hH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y, 2, hH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(clean(h.name), M + 6, y + 7);

    if (h.work) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...INK3);
      doc.text(clean(h.work), M + 6, y + 13);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK2);
    const tY = y + (h.work ? 18 : 13);
    argLines.forEach((l: string, li: number) => { doc.text(l, M + 6, tY + li * 5.3); });
    y += hH + 5;
  });

  // ── Watermark ──
  for (let p = 1; p <= pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({ opacity: 0.025 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    doc.text(DOMAIN, pageW / 2, pageH / 2, { align: 'center', angle: 30 });
    doc.restoreGraphicsState();
  }

  doc.save('model-answer-' + marks + 'M.pdf');
}`;

// ── APPLY TO FILES ──

// Chat page
let chat = fs.readFileSync('app/chat/page.tsx', 'utf8');
const chatStart = chat.indexOf('async function downloadAnswerAsPDF');
const chatEnd = chat.indexOf('\nasync function ', chatStart + 10) === -1
  ? chat.indexOf('\nfunction ', chatStart + 10)
  : chat.indexOf('\nasync function ', chatStart + 10);
// Find end by looking for the closing of the function
let chatFnEnd = chatStart;
let depth = 0;
let inFn = false;
for (let i = chatStart; i < chat.length; i++) {
  if (chat[i] === '{') { depth++; inFn = true; }
  if (chat[i] === '}') { depth--; }
  if (inFn && depth === 0) { chatFnEnd = i + 1; break; }
}
chat = chat.slice(0, chatStart) + newChatPDF + chat.slice(chatFnEnd);
fs.writeFileSync('app/chat/page.tsx', chat);
console.log('chat PDF rewritten');

// Evaluate page
let ev = fs.readFileSync('app/evaluate/page.tsx', 'utf8');
const evStart = ev.indexOf('async function downloadModelAnswerPDF');
let evFnEnd = evStart;
let evDepth = 0;
let evInFn = false;
for (let i = evStart; i < ev.length; i++) {
  if (ev[i] === '{') { evDepth++; evInFn = true; }
  if (ev[i] === '}') { evDepth--; }
  if (evInFn && evDepth === 0) { evFnEnd = i + 1; break; }
}
ev = ev.slice(0, evStart) + newEvalPDF + ev.slice(evFnEnd);
fs.writeFileSync('app/evaluate/page.tsx', ev);
console.log('evaluate PDF rewritten');
