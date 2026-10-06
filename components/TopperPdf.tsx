'use client';
import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';

export interface TopperCopyDetail {
  id: string;
  question: string;
  pdf_url: string;
  note: string | null;
  created_at: string;
  /** The page this question's answer starts on. One booklet can hold several
   *  questions, so each card opens at its own place in the PDF. */
  start_page?: number | null;
}

type Fetched = { copy: TopperCopyDetail } | { denied: true } | { error: string };

// pdf.js has no types here; it is loaded from the CDN at runtime.
/* eslint-disable @typescript-eslint/no-explicit-any */
type PdfDoc = any;

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';
let pdfjsReady: Promise<any> | null = null;

function loadPdfjs(): Promise<any> {
  pdfjsReady ??= new Promise((resolve, reject) => {
    const w = window as any;
    const done = () => {
      w.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.js`;
      resolve(w.pdfjsLib);
    };
    if (w.pdfjsLib) return done();
    const script = document.createElement('script');
    script.src = `${PDFJS}/pdf.min.js`;
    script.onload = done;
    script.onerror = () => { pdfjsReady = null; reject(new Error('pdf.js failed to load')); };
    document.head.appendChild(script);
  });
  return pdfjsReady;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchCopy(id: string): Promise<Fetched> {
  try {
    const token = (await auth.currentUser?.getIdToken()) ?? '';
    const r = await fetch(`/api/topper-copies/${id}`, { headers: { 'x-user-token': token } });
    if (r.status === 403) return { denied: true };
    const d = await r.json();
    return d.data ? { copy: d.data } : { error: 'Copy not found.' };
  } catch {
    return { error: 'Failed to load.' };
  }
}

/** Draws every page into `el`, one canvas each, tagged with its page number. */
async function drawPages(el: HTMLDivElement, pdf: PdfDoc, scale: number) {
  el.innerHTML = '';
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.dataset.page = String(n);
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    canvas.style.marginBottom = '12px';
    canvas.style.borderRadius = '3px';
    canvas.style.boxShadow = 'var(--elev-1)';
    el.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  }
}

/**
 * Scrolls the page box, and only the page box, to a page. scrollIntoView
 * would also scroll the window, which on the Compare page jolts both panes
 * whenever one of them opens.
 */
function showPage(el: HTMLDivElement, page: number) {
  const canvas = el.querySelector<HTMLCanvasElement>(`canvas[data-page="${page}"]`);
  if (canvas) el.scrollTop = canvas.offsetTop - el.clientTop;
}

/** Which page is at the top of the page box. */
function topPage(el: HTMLDivElement): number {
  const canvases = Array.from(el.querySelectorAll<HTMLCanvasElement>('canvas[data-page]'));
  for (const c of canvases) {
    if (c.offsetTop + c.offsetHeight > el.scrollTop + 4) return Number(c.dataset.page);
  }
  return canvases.length ? Number(canvases[canvases.length - 1].dataset.page) : 1;
}

type Props = {
  copyId: string;
  /** Height of the scrolling page box, e.g. '80vh'. */
  height: string;
  onLoad?: (copy: TopperCopyDetail) => void;
  /** The caller may not open this copy: no access, or the free views are used. */
  onDenied?: () => void;
  /** Drawn inside a card the caller owns, as on Compare: no border of its own,
   *  and a toolbar that does not repeat what the card's header says. */
  embedded?: boolean;
};

/**
 * One topper copy's handwritten pages, opened at the page its answer starts
 * on, with zoom. Used by the copy viewer and by each pane of Compare.
 *
 * Give it a `key` of the copy id: a new copy is a new instance, which keeps
 * the one-request rule below simple.
 */
export default function TopperPdf({ copyId, height, onLoad, onDenied, embedded = false }: Props) {
  const [copy, setCopy] = useState<TopperCopyDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  // The PDF itself failed (a network error, or a browser refusing the file),
  // as opposed to the copy record: the box would otherwise sit empty.
  const [pdfFailed, setPdfFailed] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [rendering, setRendering] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PdfDoc>(null);
  const callbacks = useRef({ onLoad, onDenied });
  useEffect(() => { callbacks.current = { onLoad, onDenied }; });

  // One request per copy, even when React runs this effect twice in
  // development: for a free reader, each request spends one of their free
  // views, so a second request would charge them twice. And the caller hears
  // about each request once: Compare counts the free views a reader has left
  // from onLoad, and a re-run of this effect over a request already answered
  // (moving the pane with Swap did it) counted a view nobody was charged.
  const request = useRef<{ id: string; p: Promise<Fetched>; told: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (request.current?.id !== copyId) request.current = { id: copyId, p: fetchCopy(copyId), told: false };
    const req = request.current;
    req.p.then(res => {
      if (cancelled) return;
      const first = !req.told;
      req.told = true;
      if ('copy' in res) {
        setCopy(res.copy);
        setStatus('ready');
        if (first) callbacks.current.onLoad?.(res.copy);
      } else if ('denied' in res) {
        setStatus('denied');
        if (first) callbacks.current.onDenied?.();
      } else {
        setError(res.error);
        setStatus('error');
      }
    });
    return () => { cancelled = true; };
  }, [copyId]);

  useEffect(() => {
    if (!copy) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        // Signed server-side and short-lived; see lib/r2.ts.
        const pdf = await pdfjs.getDocument(copy.pdf_url).promise;
        if (cancelled || !boxRef.current) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPdfLoading(false);
        setRendering(true);
        await drawPages(boxRef.current, pdf, 1.5);
        setRendering(false);
        // Not for page one, or the reader sees a jolt every time.
        if (copy.start_page && copy.start_page > 1) showPage(boxRef.current, copy.start_page);
      } catch (err) {
        console.error('PDF load error:', err);
        if (!cancelled) { setPdfLoading(false); setPdfFailed(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [copy]);

  const zoom = async (delta: number) => {
    const el = boxRef.current;
    if (!pdfRef.current || rendering || !el) return;
    const next = Math.min(Math.max(scale + delta, 0.5), 3);
    // Redrawing empties the box; return to the page being read, or a zoom
    // eight pages into a booklet drops the reader back on page one.
    const was = topPage(el);
    setScale(next);
    setRendering(true);
    await drawPages(el, pdfRef.current, next);
    setRendering(false);
    showPage(el, was);
  };

  if (status === 'denied') return null;
  if (status === 'error') return <div className="tp-msg error">{error}</div>;
  if (status === 'loading') return <OwlLoader label="Loading the topper copy" />;

  return (
    <div className={`tp ds${embedded ? ' embedded' : ''}`}>
      <style>{TP_CSS}</style>
      <div className="tp-bar">
        <span className="tp-pages">{numPages > 0 ? `${numPages} ${numPages === 1 ? 'page' : 'pages'}` : ''}{!embedded && numPages > 0 ? ', handwritten' : ''}</span>
        <div className="tp-tools">
          {!pdfLoading && !pdfFailed && (
            <div className="tp-zoom">
              <button type="button" onClick={() => zoom(-0.25)} disabled={rendering} aria-label="Zoom out">−</button>
              <span>{Math.round((scale / 1.5) * 100)}%</span>
              <button type="button" onClick={() => zoom(0.25)} disabled={rendering} aria-label="Zoom in">+</button>
            </div>
          )}
          {copy && <a className="tp-open" href={copy.pdf_url} target="_blank" rel="noopener noreferrer">Open the PDF ↗</a>}
        </div>
      </div>
      {pdfLoading && <OwlLoader label="Loading the PDF" />}
      {pdfFailed && (
        <div className="tp-msg">
          The pages would not load here.{' '}
          {copy && <a href={copy.pdf_url} target="_blank" rel="noopener noreferrer">Open the PDF in a new tab</a>}
        </div>
      )}
      <div ref={boxRef} className="tp-box" style={{ height: pdfFailed ? 0 : height }} />
    </div>
  );
}

const TP_CSS = `
.tp { border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; background: var(--ds-card); }
.tp.embedded { border: none; border-radius: 0; }
.tp-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--border); }
.tp-pages { font-size: 0.84rem; color: var(--text3); }
.tp-tools { display: flex; align-items: center; gap: var(--space-3); }
.tp-zoom { display: flex; align-items: center; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--bg); }
.tp-zoom button { width: 32px; height: 30px; border: none; background: none; color: var(--text2); font-size: 1rem; cursor: pointer; }
.tp-zoom button:disabled { opacity: 0.45; cursor: default; }
.tp-zoom span { min-width: 44px; text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text2); }
.tp-open { font-size: 0.84rem; font-weight: 600; color: var(--accent-text); text-decoration: none; white-space: nowrap; }
.tp-open:hover { text-decoration: underline; text-underline-offset: 3px; }
.tp-box { position: relative; overflow-y: auto; padding: var(--space-3); background: var(--ds-soft); }
.tp-msg { padding: var(--space-8) var(--space-5); text-align: center; font-size: 0.95rem; color: var(--text2); }
.tp-msg a { color: var(--accent-text); font-weight: 600; }
.tp-msg.error { color: var(--danger-text); }
`;
