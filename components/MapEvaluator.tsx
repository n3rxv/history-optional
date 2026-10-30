'use client';
import { useRef, useState } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { auth } from '@/lib/firebase';
import { saveToHistory } from '@/hooks/useAnswerHistory';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import PdfButton, { downloadMapPdf } from '@/components/evaluate/PdfButton';

/**
 * The map question checked from one PDF: the outline map, the clue pages and
 * the reader's answers. ₹49 a check, paid through Razorpay before the PDF is
 * read; not part of Premium.
 */

interface CheckedResult {
  number: string;
  clue: string;
  status: 'correct' | 'partial' | 'wrong' | 'blank';
  marks: number;
  maxMarks: number;
  studentSite: string | null;
  studentDescription: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  siteMarks: number;
  descriptionScore: number;
  descriptionFeedback: string;
  confidence: number;
}
interface MapCheckResponse { results: CheckedResult[]; totalMarks: number; maxTotal: number; percentage: number }
type Paid = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (o: Record<string, unknown>) => { open: () => void; on: (e: string, fn: () => void) => void };

// The JSON body has a 4.5 MB ceiling and base64 adds a third, so a bigger PDF
// would be turned away only after it had been paid for. Checked before paying.
const MAX_BYTES = 3 * 1024 * 1024;

const razorpay = () => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
/** Checkout is loaded by the pages that sell things; this page may be the first. */
function loadCheckout(): Promise<RazorpayCtor> {
  const ready = razorpay();
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => { const r = razorpay(); if (r) resolve(r); else reject(new Error('The payment window did not load. Please try again.')); };
    s.onerror = () => reject(new Error('The payment window did not load. Check your connection and try again.'));
    document.head.appendChild(s);
  });
}

const toBase64 = (f: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res((r.result as string).split(',')[1]);
  r.onerror = () => rej(new Error('That PDF could not be read.'));
  r.readAsDataURL(f);
});

const sizeOf = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const tone = (status: CheckedResult['status']) => (status === 'correct' ? 'ok' : status === 'partial' ? 'part' : status === 'blank' ? 'blank' : 'no');
const scoreTone = (pct: number) => (pct >= 80 ? 'var(--success-text)' : pct >= 55 ? 'var(--warning-text)' : 'var(--danger-text)');

const MapIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>;
const Chevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

export default function MapEvaluator({ onLoginRequired }: { onLoginRequired: () => void }) {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MapCheckResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  // A payment that went through but whose marking did not. Kept, so trying
  // again re-sends the same payment, which the server accepts once it has
  // let go of the failed attempt, rather than charging the reader twice.
  const [paid, setPaid] = useState<Paid | null>(null);

  useRefreshSafe('ho_map_eval_v2', { results, expanded, paid }, (s) => { setResults(s.results); setExpanded(s.expanded); setPaid(s.paid); });

  const pickFile = (f: File) => {
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { setError(T('Upload a PDF.', 'PDF अपलोड करें।')); return; }
    if (f.size > MAX_BYTES) {
      setError(T(`This PDF is ${(f.size / 1024 / 1024).toFixed(1)} MB. Keep it under 3 MB: scan in black and white, or at a lower resolution.`, `यह PDF ${(f.size / 1024 / 1024).toFixed(1)} MB की है। इसे 3 MB से कम रखें: ब्लैक एंड व्हाइट में या कम रिज़ॉल्यूशन पर स्कैन करें।`));
      return;
    }
    setFile(f); setError('');
  };

  /** Sends the PDF with a completed payment to be marked. */
  const mark = async (payment: Paid, pdf: File) => {
    const user = auth.currentUser;
    if (!user) { onLoginRequired(); return; }
    setBusy(true); setError(''); setProgress(40); setStage(T('Checking the payment…', 'भुगतान जाँचा जा रहा है…'));
    try {
      const pdfBase64 = await toBase64(pdf);
      setProgress(55); setStage(T('Reading your map and answers, about a minute…', 'आपका मैप और उत्तर पढ़े जा रहे हैं, लगभग एक मिनट…'));
      const res = await fetch('/api/razorpay/map-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': await user.getIdToken() },
        body: JSON.stringify({ ...payment, pdfBase64, lang: hi ? 'hi' : 'en' }),
      });
      const data = await res.json().catch(() => ({ error: res.status === 413 ? 'That PDF is too large to send.' : 'The marking did not finish.' }));
      if (!res.ok || data.error) throw new Error(data.error || 'The marking did not finish.');
      setResults(data); setPaid(null); setExpanded(null); setProgress(100);
      const right = (data.results as CheckedResult[]).filter((r) => r.status === 'correct').length;
      saveToHistory({
        type: 'map',
        question: `Map question: ${data.results.length} places`,
        marks: data.totalMarks,
        marksOutOf: data.maxTotal,
        overallFeedback: `${right} of ${data.results.length} places right`,
        sectionMarks: {
          introduction: { awarded: right, out_of: data.results.length },
          body: { awarded: 0, out_of: 0 },
          conclusion: { awarded: 0, out_of: 0 },
          presentation: { awarded: 0, out_of: 0 },
        },
        // Place by place, so the past evaluations can download it again.
        mapResults: { results: data.results, totalMarks: data.totalMarks, maxTotal: data.maxTotal, percentage: data.percentage },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The marking did not finish.');
    } finally {
      setBusy(false); setStage('');
    }
  };

  const payAndMark = async () => {
    const user = auth.currentUser;
    if (!user) { onLoginRequired(); return; }
    if (!file) { setError(T('Choose your PDF first.', 'पहले अपनी PDF चुनें।')); return; }
    if (paid) { await mark(paid, file); return; }
    setBusy(true); setError(''); setProgress(10); setStage(T('Opening the payment…', 'भुगतान खुल रहा है…'));
    try {
      const Razorpay = await loadCheckout();
      const orderRes = await fetch('/api/razorpay/map-order', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-token': await user.getIdToken() } });
      const order = await orderRes.json();
      if (!order.orderId) throw new Error(order.error || 'The payment could not be started.');
      setBusy(false);
      const payment = await new Promise<Paid | null>((resolve, reject) => {
        const rzp = new Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'History Optional',
          description: 'Map answer check, ₹49',
          image: '/favicon.svg',
          // Razorpay's window cannot read the page's CSS variables.
          theme: { color: '#4c6ae2' },
          modal: { ondismiss: () => resolve(null) },
          handler: (resp: Paid) => resolve(resp),
        });
        rzp.on('payment.failed', () => reject(new Error(T('The payment did not go through. Nothing was charged.', 'भुगतान नहीं हुआ। कोई राशि नहीं कटी।'))));
        rzp.open();
      });
      if (!payment) { setProgress(0); setStage(''); return; }
      setPaid(payment);
      await mark(payment, file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The payment could not be started.');
      setBusy(false); setStage(''); setProgress(0);
    }
  };

  const reset = () => { setFile(null); setResults(null); setExpanded(null); setError(''); setProgress(0); setStage(''); if (inputRef.current) inputRef.current.value = ''; };

  if (results) {
    const pct = Math.round(results.percentage);
    const count = (s: CheckedResult['status']) => results.results.filter((r) => r.status === s).length;
    return (
      <div className="me ds">
        <style dangerouslySetInnerHTML={{ __html: ME_CSS }} />
        <div className="me-card me-summary">
          <div>
            <span className="me-summary-label">{T('Your map question', 'आपका मैप प्रश्न')}</span>
            <span className="me-summary-num" style={{ color: scoreTone(pct) }}>{results.totalMarks}<small> / {results.maxTotal}</small></span>
            <span className="me-tally">
              <span className="ok">{T(`${count('correct')} right`, `${count('correct')} सही`)}</span>
              {count('partial') > 0 && <span className="part">{T(`${count('partial')} in part`, `${count('partial')} आंशिक`)}</span>}
              <span className="no">{T(`${count('wrong')} wrong`, `${count('wrong')} ग़लत`)}</span>
              {count('blank') > 0 && <span className="blank">{T(`${count('blank')} left blank`, `${count('blank')} खाली`)}</span>}
            </span>
          </div>
          <div className="me-summary-actions">
            <PdfButton hi={hi} className="ds-btn ds-btn-solid ds-btn-sm" download={() => downloadMapPdf(results, hi)} label={T('Download PDF', 'PDF डाउनलोड करें')} />
            <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={reset}>{T('Check another map', 'दूसरा मैप जँचवाएँ')}</button>
          </div>
        </div>
        <p className="me-note">{T('Each place is out of 2.5: 1.5 for the name and 1 for your note. Open one to see what was read and why.', 'हर स्थल 2.5 अंक का है: नाम के 1.5 और टिप्पणी का 1। क्या पढ़ा गया और क्यों, देखने के लिए खोलें।')}</p>
        <div className="me-rows">
          {results.results.map((r) => {
            const open = expanded === r.number;
            return (
              <section key={r.number} className={`me-row${open ? ' open' : ''}`}>
                <button type="button" className="me-row-head" onClick={() => setExpanded(open ? null : r.number)} aria-expanded={open}>
                  <span className={`me-dot ${tone(r.status)}`} aria-hidden="true" />
                  <span className="me-n">({r.number})</span>
                  <span className={`me-wrote${r.studentSite ? '' : ' none'}`}>{r.studentSite ?? T('Left blank', 'खाली छोड़ा')}</span>
                  <span className={`me-marks ${tone(r.status)}`}>{r.status === 'blank' ? '0' : r.marks} / {r.maxMarks}</span>
                  <span className="me-chev"><Chevron /></span>
                </button>
                {open && (
                  <div className="me-row-body">
                    {r.clue && <p className="me-clue"><span>{T('The clue', 'संकेत')}</span>{r.clue}</p>}
                    <div className="me-pair">
                      <div className="me-box">
                        <span className="me-box-label">{T('You wrote', 'आपने लिखा')}</span>
                        <strong className={r.studentSite ? '' : 'none'}>{r.studentSite ?? '-'}</strong>
                      </div>
                      <div className={`me-box ${r.siteMarks > 0 ? 'ok' : r.status === 'blank' ? '' : 'no'}`}>
                        <span className="me-box-label">{T('The answer', 'सही उत्तर')}{r.status !== 'blank' && <em>{r.siteMarks} / 1.5</em>}</span>
                        <strong>{r.correctSite ?? '-'}</strong>
                        {r.correctLocation && <span className="me-box-sub">{r.correctLocation}</span>}
                      </div>
                    </div>
                    <div className="me-desc">
                      <div className="me-desc-head"><span>{T('Your note', 'आपकी टिप्पणी')}</span>{r.status !== 'blank' && <em>{r.descriptionScore} / 1</em>}</div>
                      <p className={r.studentDescription ? '' : 'none'}>{r.studentDescription ?? T('Nothing written', 'कुछ नहीं लिखा')}</p>
                      {r.descriptionFeedback && <p className="me-feedback">{r.descriptionFeedback}</p>}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="me ds">
      <style dangerouslySetInnerHTML={{ __html: ME_CSS }} />
      <div className="me-card">
        <div className="me-head">
          <span className="me-icon"><MapIcon /></span>
          <div>
            <h3>{T('Have your map answer checked', 'अपना मैप उत्तर जँचवाएँ')}</h3>
            <p>{T('One PDF with the map you marked, the clue pages and your answers. Each of the 20 places is checked: the name for 1.5 marks, your note for 1.', 'एक PDF में आपका चिह्नित मैप, संकेत वाले पेज और आपके उत्तर। हर 20 स्थल जाँचे जाते हैं: नाम के 1.5 अंक, टिप्पणी का 1।')}</p>
          </div>
          <span className="me-price">₹49</span>
        </div>
        <ol className="me-steps">
          {[
            [T('Mark the map', 'मैप चिह्नित करें'), T('And write a short note on each place', 'और हर स्थल पर छोटी टिप्पणी लिखें')],
            [T('Scan it to one PDF', 'एक PDF में स्कैन करें'), T('Map, clues and answers, under 3 MB', 'मैप, संकेत और उत्तर, 3 MB से कम')],
            [T('Pay and get the marks', 'भुगतान करें और अंक पाएँ'), T('₹49 a check, not part of Premium', '₹49 प्रति जाँच, Premium में शामिल नहीं')],
          ].map(([t, s], i) => <li key={t}><span>{i + 1}</span><div><strong>{t}</strong><p>{s}</p></div></li>)}
        </ol>

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }} />
        <button type="button" className={`me-drop${drag ? ' drag' : ''}${file ? ' has' : ''}`} disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}>
          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>{sizeOf(file.size)} · {T('tap to choose another', 'दूसरी चुनने के लिए टैप करें')}</span>
            </>
          ) : (
            <>
              <strong>{T('Choose your PDF', 'अपनी PDF चुनें')}</strong>
              <span>{T('or drop it here. One file, under 3 MB.', 'या यहाँ छोड़ें। एक फ़ाइल, 3 MB से कम।')}</span>
            </>
          )}
        </button>

        {paid && !busy && (
          <p className="me-paid">{T('Your payment went through, but the marking did not finish. Try again: you will not be charged a second time.', 'आपका भुगतान हो गया, पर जाँच पूरी नहीं हुई। फिर कोशिश करें: दोबारा पैसे नहीं कटेंगे।')}{!file && T(' Choose the same PDF first.', ' पहले वही PDF चुनें।')}</p>
        )}
        {error && <p className="me-err" role="alert">{error}</p>}
        {busy && (
          <div className="me-wait">
            <div className="me-wait-top"><span>{stage}</span><span>{progress}%</span></div>
            <span className="me-bar"><span style={{ width: `${progress}%` }} /></span>
          </div>
        )}

        <button type="button" className="ds-btn ds-btn-solid ds-btn-block me-go" onClick={payAndMark} disabled={busy || !file}>
          {busy ? T('Working…', 'हो रहा है…') : paid ? T('Try the marking again', 'जाँच फिर से करें') : file ? T('Pay ₹49 and check it', '₹49 देकर जँचवाएँ') : T('Choose a PDF to begin', 'शुरू करने के लिए PDF चुनें')}
        </button>
      </div>
    </div>
  );
}

const ME_CSS = `
.me { display: flex; flex-direction: column; gap: var(--space-3); max-width: 900px; }
.me-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.me-head { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-4); }
.me-head > div { flex: 1; min-width: 0; }
.me-head h3 { margin: 0 0 4px; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }
.me-head p { margin: 0; font-size: 0.94rem; line-height: 1.55; color: var(--text2); }
.me-icon { width: 44px; height: 44px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--accent-dim); color: var(--accent-text); }
.me-price { flex-shrink: 0; padding: 3px 12px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.9rem; font-weight: 800; }
.me-steps { list-style: none; margin: 0 0 var(--space-4); padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
.me-steps li { display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); }
.me-steps li > span { width: 24px; height: 24px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--ds-card); color: var(--accent-text); font-size: 0.8rem; font-weight: 800; }
.me-steps strong { display: block; font-size: 0.92rem; }
.me-steps p { margin: 2px 0 0; font-size: 0.84rem; line-height: 1.45; color: var(--text3); }
.me-drop { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: var(--space-6) var(--space-4); border: 1.5px dashed var(--border2); border-radius: var(--radius-lg); background: var(--bg); color: var(--text); font: inherit; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.me-drop:hover:not(:disabled), .me-drop.drag { border-color: var(--accent); background: var(--accent-dim); }
.me-drop.has { padding: var(--space-4); border-style: solid; border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.me-drop strong { font-size: 1rem; word-break: break-word; }
.me-drop span { font-size: 0.86rem; color: var(--text3); }
.me-paid { margin: var(--space-3) 0 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--warning-wash); color: var(--warning-text); font-size: 0.9rem; font-weight: 600; line-height: 1.5; }
.me-err { margin: var(--space-3) 0 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--danger-wash); color: var(--danger-text); font-size: 0.9rem; line-height: 1.5; }
.me-wait { margin-top: var(--space-3); }
.me-wait-top { display: flex; justify-content: space-between; gap: var(--space-3); margin-bottom: 6px; font-size: 0.88rem; color: var(--text2); font-variant-numeric: tabular-nums; }
.me-bar { display: block; height: 6px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.me-bar span { display: block; height: 100%; background: var(--accent); border-radius: inherit; transition: width 0.4s ease; }
.me-go { margin-top: var(--space-4); min-height: 48px; }
.me-go:disabled { opacity: 0.55; cursor: not-allowed; }

.me-summary { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); padding: var(--space-5) var(--space-6); }
.me-summary > div { display: flex; flex-direction: column; gap: 2px; }
.me-summary > .me-summary-actions { flex-direction: row; flex-wrap: wrap; gap: var(--space-2); }
.me-summary-label { font-size: 0.86rem; color: var(--text3); }
.me-summary-num { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.1; }
.me-summary-num small { font-size: 1.05rem; font-weight: 600; color: var(--text3); }
.me-tally { display: flex; flex-wrap: wrap; gap: 4px var(--space-3); margin-top: 4px; font-size: 0.88rem; font-weight: 600; }
.me-tally .ok { color: var(--success-text); } .me-tally .part { color: var(--warning-text); } .me-tally .no { color: var(--danger-text); } .me-tally .blank { color: var(--text3); }
.me-note { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.9rem; line-height: 1.55; color: var(--text2); }
.me-rows { display: flex; flex-direction: column; gap: 6px; }
.me-row { background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.me-row.open { box-shadow: var(--elev-1); }
.me-row-head { width: 100%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: none; border-radius: var(--radius-lg); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.me-row-head:hover { background: var(--ds-soft); }
.me-dot { width: 10px; height: 10px; flex-shrink: 0; border-radius: 50%; background: var(--border2); }
.me-dot.ok { background: var(--success-text); } .me-dot.part { background: var(--warning-text); } .me-dot.no { background: var(--danger-text); }
.me-n { min-width: 46px; flex-shrink: 0; font-size: 0.86rem; color: var(--text3); font-variant-numeric: tabular-nums; }
.me-wrote { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.me-wrote.none { color: var(--text3); font-weight: 500; }
.me-marks { flex-shrink: 0; font-size: 0.9rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text3); }
.me-marks.ok { color: var(--success-text); } .me-marks.part { color: var(--warning-text); } .me-marks.no { color: var(--danger-text); }
.me-chev { flex-shrink: 0; display: inline-flex; color: var(--text3); transition: transform 0.2s; }
.me-row.open .me-chev { transform: rotate(180deg); }
.me-row-body { display: flex; flex-direction: column; gap: var(--space-2); padding: 0 var(--space-4) var(--space-4); }
.me-clue { margin: 0; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--ds-soft); font-size: 0.9rem; line-height: 1.5; }
.me-clue span { margin-right: 6px; font-weight: 700; color: var(--text2); }
.me-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
.me-box { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg); }
.me-box.ok { border-color: color-mix(in srgb, var(--success-text) 35%, transparent); background: var(--success-wash); }
.me-box.no { border-color: color-mix(in srgb, var(--danger-text) 30%, transparent); background: var(--danger-wash); }
.me-box-label { display: flex; justify-content: space-between; gap: var(--space-2); font-size: 0.8rem; color: var(--text3); }
.me-box-label em { font-style: normal; font-weight: 700; font-variant-numeric: tabular-nums; }
.me-box.ok .me-box-label em, .me-box.ok strong { color: var(--success-text); }
.me-box.no .me-box-label em, .me-box.no strong { color: var(--danger-text); }
.me-box strong { font-size: 0.96rem; }
.me-box strong.none { color: var(--text3); font-weight: 500; }
.me-box-sub { font-size: 0.82rem; color: var(--text3); }
.me-desc { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
.me-desc-head { display: flex; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--ds-soft); font-size: 0.82rem; font-weight: 700; color: var(--text2); }
.me-desc-head em { font-style: normal; font-variant-numeric: tabular-nums; }
.me-desc p { margin: 0; padding: var(--space-3); font-size: 0.92rem; line-height: 1.6; }
.me-desc p.none { color: var(--text3); font-style: italic; }
.me-desc .me-feedback { border-top: 1px solid var(--border); background: var(--bg); color: var(--text2); }

@media (max-width: 640px) {
  .me-card { padding: var(--space-4); }
  .me-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: var(--space-3); }
  .me-head > div { grid-column: 1 / -1; grid-row: 2; }
  .me-price { grid-column: 3; grid-row: 1; align-self: center; }
  .me-icon { width: 40px; height: 40px; }
  .me-steps { grid-template-columns: minmax(0, 1fr); }
  .me-summary { padding: var(--space-4); }
  .me-summary .ds-btn { width: 100%; justify-content: center; }
  .me-summary > .me-summary-actions { width: 100%; flex-direction: column; }
  .me-pair { grid-template-columns: minmax(0, 1fr); }
  .me-row-head { gap: var(--space-2); padding: var(--space-3); }
  .me-n { min-width: 42px; }
}
@media (prefers-reduced-motion: reduce) { .me-bar span, .me-chev { transition: none; } }
`;
