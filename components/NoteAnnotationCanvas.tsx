'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { useLang } from '@/lib/i18n/LangContext';

interface Point { x: number; y: number; }
interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  scrollY: number;
}

// Real colours, not var(--token)s: a canvas cannot read CSS variables, and
// when the site-wide light-mode change swapped these for tokens every pen but
// white stopped drawing in colour.
const PEN_COLORS = [
  { label: 'Black',  labelHi: 'काला',    value: '#111111' },
  { label: 'White',  labelHi: 'सफ़ेद',    value: '#f0f0f0' },
  { label: 'Gold',   labelHi: 'सुनहरा',   value: '#d4a843' },
  { label: 'Cyan',   labelHi: 'फ़िरोज़ी',  value: '#4ecdc4' },
  { label: 'Pink',   labelHi: 'गुलाबी',   value: '#ff6b9d' },
  { label: 'Green',  labelHi: 'हरा',     value: '#51cf66' },
];
const HL_COLORS = [
  { label: 'Yellow', labelHi: 'पीला',    value: 'rgba(255,235,0,0.4)'    },
  { label: 'Cyan',   labelHi: 'फ़िरोज़ी',  value: 'rgba(0,220,220,0.35)'   },
  { label: 'Pink',   labelHi: 'गुलाबी',   value: 'rgba(255,100,160,0.35)' },
  { label: 'Green',  labelHi: 'हरा',     value: 'rgba(80,220,100,0.35)'  },
];

/** Strokes saved while the colours were tokens, mapped back to what they meant. */
const TOKEN_COLORS: Record<string, string> = {
  'var(--bg3)': '#111111',
  'var(--warning-text)': '#d4a843',
  'var(--info-text)': '#4ecdc4',
  'var(--accent)': '#ff6b9d',
  'var(--success-text)': '#51cf66',
  'color-mix(in srgb, var(--warning-text) 40%, transparent)': 'rgba(255,235,0,0.4)',
  'color-mix(in srgb, var(--info-text) 35%, transparent)': 'rgba(0,220,220,0.35)',
  'color-mix(in srgb, var(--accent) 35%, transparent)': 'rgba(255,100,160,0.35)',
  'color-mix(in srgb, var(--success-text) 35%, transparent)': 'rgba(80,220,100,0.35)',
};

interface Props {
  noteSlug: string;
  active: boolean;
  onToggle: () => void;
}

export default function NoteAnnotationCanvas({ noteSlug, active, onToggle }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const isDrawing  = useRef(false);
  const storageKey = `annotations_v3_${noteSlug}`;
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);

  const [tool,      setTool]      = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  // Dark ink on the light theme, light ink on the dark one.
  const [penColor,  setPenColor]  = useState(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? '#111111' : '#f0f0f0');
  const [hlColor,   setHlColor]   = useState('rgba(255,235,0,0.4)');
  const [penWidth,  setPenWidth]  = useState(2);
  const [tick,      setTick]      = useState(0);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  const saveLocal = useCallback((strokes: Stroke[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(strokes)); } catch {}
  }, [storageKey]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scrollY = window.scrollY;
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.lineWidth = stroke.tool === 'highlighter' ? stroke.width * 8 : stroke.width;
      ctx.strokeStyle = stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.4 : 1;
      const dy = stroke.scrollY - scrollY;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y + dy);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y + dy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => { redraw(); }, [tick, redraw]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) strokesRef.current = (JSON.parse(raw) as Stroke[]).map(st => ({ ...st, color: TOKEN_COLORS[st.color] ?? st.color }));
    } catch {}
    redraw();
  }, [storageKey, redraw]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // Scroll redraw
  useEffect(() => {
    window.addEventListener('scroll', redraw, { passive: true });
    return () => window.removeEventListener('scroll', redraw);
  }, [redraw]);

  const getPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Rubs out any stroke passing near the point. The distance used to be
  // worked out against the wrong y, so the eraser missed what it touched.
  const eraseAt = (pt: Point) => {
    const before = strokesRef.current.length;
    strokesRef.current = strokesRef.current.filter(s => {
      const dy = s.scrollY - window.scrollY;
      return !s.points.some(p => Math.hypot(p.x - pt.x, p.y + dy - pt.y) < penWidth * 6);
    });
    if (strokesRef.current.length === before) return;
    saveLocal(strokesRef.current);
    setTick(t => t + 1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    isDrawing.current = true;
    const pt = getPos(e);
    if (tool === 'eraser') { eraseAt(pt); return; }
    currentRef.current = {
      points: [pt],
      color: tool === 'highlighter' ? hlColor : penColor,
      width: penWidth,
      tool,
      scrollY: window.scrollY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDrawing.current && tool === 'eraser') { eraseAt(getPos(e)); return; }
    if (!isDrawing.current || !currentRef.current) return;
    const pt = getPos(e);
    const s = currentRef.current;
    const pts = s.points;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    // Draw incremental segment directly — no full redraw
    if (pts.length >= 1) {
      ctx.beginPath();
      ctx.lineWidth = s.tool === 'highlighter' ? s.width * 8 : s.width;
      ctx.strokeStyle = s.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = s.tool === 'highlighter' ? 0.4 : 1;
      ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    pts.push(pt);
  };

  const onPointerUp = () => {
    const wasDrawing = isDrawing.current;
    isDrawing.current = false;
    if (!wasDrawing || !currentRef.current) return;
    strokesRef.current.push(currentRef.current);
    currentRef.current = null;
    saveLocal(strokesRef.current);
    setTick(t => t + 1);
  };

  const undo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    saveLocal(strokesRef.current);
    setTick(t => t + 1);
  };

  const clearAll = () => {
    strokesRef.current = [];
    try { localStorage.removeItem(storageKey); } catch {}
    setTick(t => t + 1);
  };

  const tools: { id: typeof tool; label: string; icon: React.ReactNode }[] = [
    { id: 'pen', label: L('Pen', 'पेन'), icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /> },
    { id: 'highlighter', label: L('Marker', 'मार्कर'), icon: <path d="M9 11l-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /> },
    { id: 'eraser', label: L('Eraser', 'रबड़'), icon: <path d="M20 20H9L4 15a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-7 7M6 13l6 6" /> },
  ];
  const colours = tool === 'pen' ? PEN_COLORS : tool === 'highlighter' ? HL_COLORS : [];
  const current = tool === 'pen' ? penColor : hlColor;

  return (
    <>
      <style>{CANVAS_CSS}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => { onPointerMove(e); if (tool === 'eraser') setEraserPos({ x: e.clientX, y: e.clientY }); }}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { onPointerUp(); setEraserPos(null); }}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: active ? 35 : -1,
          pointerEvents: active ? 'all' : 'none',
          touchAction: 'none',
          cursor: tool === 'eraser' ? 'none' : 'crosshair',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.2s',
          background: 'transparent',
        }}
      />

      {active && tool === 'eraser' && eraserPos && (
        <div className="nac-eraser" style={{
          left: eraserPos.x - (penWidth * 4), top: eraserPos.y - (penWidth * 4),
          width: penWidth * 8, height: penWidth * 8,
        }} />
      )}

      {active && (
        <div className="nac-bar ds" role="toolbar" aria-label={L('Drawing', 'चित्र बनाने के साधन')}>
          <div className="nac-tools">
            {tools.map(t => (
              <button key={t.id} type="button" className={tool === t.id ? 'on' : ''} onClick={() => setTool(t.id)} title={t.label} aria-label={t.label} aria-pressed={tool === t.id}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
              </button>
            ))}
          </div>
          {colours.length > 0 && (
            <div className="nac-colours">
              {colours.map(c => (
                <button key={c.value} type="button" title={L(c.label, c.labelHi)} aria-label={L(c.label, c.labelHi)} aria-pressed={current === c.value}
                  className={`nac-swatch${current === c.value ? ' on' : ''}${tool === 'highlighter' ? ' wide' : ''}`}
                  style={{ ['--sw' as string]: tool === 'highlighter' ? c.value.replace(/[\d.]+\)$/, '0.85)') : c.value }}
                  onClick={() => (tool === 'pen' ? setPenColor(c.value) : setHlColor(c.value))} />
              ))}
            </div>
          )}
          <label className="nac-size">
            <span>{L('Size', 'आकार')}</span>
            <input type="range" min={1} max={10} value={penWidth} onChange={e => setPenWidth(+e.target.value)} />
          </label>
          <div className="nac-actions">
            <button type="button" className="nac-btn" onClick={undo} title={L('Undo', 'पूर्ववत करें')} aria-label={L('Undo', 'पूर्ववत करें')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></svg>
            </button>
            <button type="button" className="nac-btn danger" onClick={async () => {
              const ok = await confirmDialog(langHi
                ? { title: 'इस नोट पर बने सभी चित्र मिटाएँ?', text: 'यह वापस नहीं होगा।', confirmLabel: 'मिटाएँ', cancelLabel: 'रद्द करें', tone: 'danger' }
                : { title: 'Rub out every drawing on this note?', text: 'This cannot be undone.', confirmLabel: 'Rub out', tone: 'danger' });
              if (ok) clearAll();
            }} title={L('Clear all', 'सब मिटाएँ')} aria-label={L('Clear all', 'सब मिटाएँ')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>
            </button>
            <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={onToggle}>{L('Done', 'हो गया')}</button>
          </div>
        </div>
      )}
    </>
  );
}

const CANVAS_CSS = `
.nac-eraser { position: fixed; z-index: 200; pointer-events: none; border-radius: 50%; border: 2px solid var(--text2); background: color-mix(in srgb, var(--text) 8%, transparent); }
.nac-bar {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(20px + env(safe-area-inset-bottom, 0px)); z-index: 200;
  display: flex; align-items: center; flex-wrap: wrap; justify-content: center; gap: 10px 14px; width: max-content; max-width: calc(100vw - 24px);
  padding: 8px 10px; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); box-shadow: var(--elev-3);
}
.nac-tools { display: flex; gap: 2px; padding: 3px; border-radius: var(--radius-full); background: var(--ds-soft); }
.nac-tools button { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: none; color: var(--text2); cursor: pointer; }
.nac-tools button.on { background: var(--ds-card); color: var(--premium-text); box-shadow: var(--elev-1); }
.nac-colours { display: flex; align-items: center; gap: 6px; }
.nac-swatch { width: 22px; height: 22px; padding: 0; border-radius: 50%; background: var(--sw); border: 1px solid var(--border2); cursor: pointer; transition: transform 0.12s; }
.nac-swatch.wide { width: 26px; height: 16px; border-radius: 4px; }
.nac-swatch.on { box-shadow: 0 0 0 2px var(--ds-card), 0 0 0 4px var(--text2); }
.nac-size { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text3); }
.nac-size input { width: 72px; accent-color: var(--premium-text); }
.nac-actions { display: flex; align-items: center; gap: 4px; }
.nac-btn { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: none; color: var(--text2); cursor: pointer; }
.nac-btn:hover { background: var(--ds-soft); color: var(--text); }
.nac-btn.danger:hover { color: var(--danger-text); }
/* Clear of the tab bar on a phone. */
@media (max-width: 768px) { .nac-bar { bottom: calc(var(--bn-clear) + 10px); } }
`;
