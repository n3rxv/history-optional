'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Point { x: number; y: number; }
interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  scrollY: number;
}

const PEN_COLORS = [
  { label: 'Black',  value: '#111111' },
  { label: 'White',  value: '#f0f0f0' },
  { label: 'Gold',   value: '#d4a843' },
  { label: 'Cyan',   value: '#4ecdc4' },
  { label: 'Pink',   value: '#ff6b9d' },
  { label: 'Green',  value: '#51cf66' },
];
const HL_COLORS = [
  { label: 'Yellow', value: 'rgba(255,235,0,0.4)'    },
  { label: 'Cyan',   value: 'rgba(0,220,220,0.35)'   },
  { label: 'Pink',   value: 'rgba(255,100,160,0.35)' },
  { label: 'Green',  value: 'rgba(80,220,100,0.35)'  },
];

interface Props {
  noteSlug: string;
  active: boolean;
  onToggle: () => void;
  userId?: string | null; // passed from NoteReader when logged in
}

export default function NoteAnnotationCanvas({ noteSlug, active, onToggle, userId }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const isDrawing  = useRef(false);
  const syncTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `annotations_v3_${noteSlug}`;

  const [tool,      setTool]      = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor,  setPenColor]  = useState('#f0f0f0');
  const [hlColor,   setHlColor]   = useState('rgba(255,235,0,0.4)');
  const [penWidth,  setPenWidth]  = useState(2);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [tick,      setTick]      = useState(0);

  // ── Supabase sync ──────────────────────────────────────────────
  const saveToCloud = useCallback(async (strokes: Stroke[]) => {
    if (!userId) return;
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/canvas-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, note_slug: noteSlug, strokes }),
      });
      setSyncStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('error');
    }
  }, [userId, noteSlug]);

  const debouncedSave = useCallback((strokes: Stroke[]) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => saveToCloud(strokes), 1200);
  }, [saveToCloud]);

  // ── Load: cloud first (if logged in), else localStorage ────────
  useEffect(() => {
    const loadStrokes = async () => {
      if (userId) {
        try {
          const res = await fetch(`/api/canvas-annotations?user_id=${userId}&slug=${noteSlug}`);
          const json = await res.json();
          if (json.strokes?.length) {
            strokesRef.current = json.strokes;
            // Also keep localStorage in sync as backup
            localStorage.setItem(storageKey, JSON.stringify(json.strokes));
            setTick(t => t + 1);
            return;
          }
        } catch {}
      }
      // Fall back to localStorage
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          strokesRef.current = parsed;
          // Migrate to cloud if we just logged in
          if (userId && parsed.length) saveToCloud(parsed);
          setTick(t => t + 1);
        }
      } catch {}
    };
    loadStrokes();
  }, [userId, noteSlug, storageKey, saveToCloud]);

  // ── Redraw ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx    = canvas.getContext('2d'); if (!ctx) return;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const scrollTop = window.scrollY;

    const drawStroke = (s: Stroke) => {
      if (s.points.length < 1) return;
      const dy = s.scrollY - scrollTop;
      ctx.save();
      ctx.translate(0, dy);
      ctx.beginPath();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth   = s.width;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth   = s.width;
      }
      if (s.points.length === 1) {
        ctx.arc(s.points[0].x, s.points[0].y, s.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      } else {
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length - 1; i++) {
          const mx = (s.points[i].x + s.points[i + 1].x) / 2;
          const my = (s.points[i].y + s.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my);
        }
        ctx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    };

    strokesRef.current.forEach(s => drawStroke(s));
    if (currentRef.current) drawStroke(currentRef.current);
  }, [tick]);

  useEffect(() => {
    if (!active) return;
    const onScroll = () => setTick(t => t + 1);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);

  useEffect(() => {
    const onResize = () => setTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Drawing handlers ────────────────────────────────────────────
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => ({
    x: e.clientX, y: e.clientY,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const color = tool === 'highlighter' ? hlColor : penColor;
    const width = tool === 'highlighter' ? penWidth * 7 : tool === 'eraser' ? penWidth * 8 : penWidth;
    currentRef.current = { points: [getPos(e)], color, width, tool, scrollY: window.scrollY };
    isDrawing.current  = true;
    setTick(t => t + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentRef.current) return;
    e.preventDefault();
    currentRef.current.points.push(getPos(e));
    setTick(t => t + 1);
  };

  const onPointerUp = () => {
    if (!currentRef.current) return;
    strokesRef.current = [...strokesRef.current, currentRef.current];
    currentRef.current = null;
    isDrawing.current  = false;
    // Save to localStorage
    try { localStorage.setItem(storageKey, JSON.stringify(strokesRef.current)); } catch {}
    // Debounced save to Supabase
    debouncedSave(strokesRef.current);
    setTick(t => t + 1);
  };

  const undo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    try { localStorage.setItem(storageKey, JSON.stringify(strokesRef.current)); } catch {}
    debouncedSave(strokesRef.current);
    setTick(t => t + 1);
  };

  const clearAll = () => {
    strokesRef.current = [];
    try { localStorage.removeItem(storageKey); } catch {}
    if (userId) {
      fetch('/api/canvas-annotations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, note_slug: noteSlug }),
      }).catch(() => {});
    }
    setTick(t => t + 1);
  };

  // ── UI helpers ──────────────────────────────────────────────────
  const syncLabel =
    syncStatus === 'syncing' ? '↑ Syncing…' :
    syncStatus === 'saved'   ? '✓ Saved'    :
    syncStatus === 'error'   ? '⚠ Error'    : null;

  const syncColor =
    syncStatus === 'saved'  ? '#51cf66' :
    syncStatus === 'error'  ? '#ff6b6b' : '#888';

  const sep = <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />;

  const toolBtn = (t: typeof tool, icon: string, label: string) => (
    <button onClick={() => setTool(t)} title={label} style={{
      padding: '5px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 15,
      background: tool === t ? 'rgba(212,168,67,0.25)' : 'rgba(255,255,255,0.05)',
      border: tool === t ? '1px solid rgba(212,168,67,0.7)' : '1px solid rgba(255,255,255,0.1)',
      color: '#fff', transition: 'all 0.15s',
    }}>{icon}</button>
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: active ? 35 : -1,
          pointerEvents: active ? 'all' : 'none',
          touchAction: 'none',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.2s',
          background: 'transparent',
        }}
      />

      {active && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(8,8,8,0.97)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 14, padding: '9px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          flexWrap: 'wrap', maxWidth: '92vw', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {toolBtn('pen',         '✏️', 'Pen')}
            {toolBtn('highlighter', '🖊️', 'Highlighter')}
            {toolBtn('eraser',      '⬜', 'Eraser')}
          </div>
          {sep}
          {tool === 'pen' && (
            <div style={{ display: 'flex', gap: 5 }}>
              {PEN_COLORS.map(c => (
                <button key={c.value} onClick={() => setPenColor(c.value)} title={c.label} style={{
                  width: 20, height: 20, borderRadius: '50%', padding: 0, cursor: 'pointer',
                  background: c.value,
                  border: penColor === c.value ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                  boxShadow: c.value === '#111111' ? 'inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                  transform: penColor === c.value ? 'scale(1.25)' : 'scale(1)',
                  transition: 'all 0.12s',
                }} />
              ))}
            </div>
          )}
          {tool === 'highlighter' && (
            <div style={{ display: 'flex', gap: 5 }}>
              {HL_COLORS.map(c => (
                <button key={c.value} onClick={() => setHlColor(c.value)} title={c.label} style={{
                  width: 22, height: 14, borderRadius: 3, padding: 0, cursor: 'pointer',
                  background: c.value.replace(/[\d.]+\)$/, '0.85)'),
                  border: hlColor === c.value ? '2px solid #fff' : '2px solid transparent',
                  transition: 'all 0.12s',
                }} />
              ))}
            </div>
          )}
          {sep}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#555' }}>Size</span>
            <input type="range" min={1} max={10} value={penWidth}
              onChange={e => setPenWidth(+e.target.value)}
              style={{ width: 65, accentColor: '#d4a843' }} />
            <span style={{ fontSize: 10, color: '#555', minWidth: 10 }}>{penWidth}</span>
          </div>
          {sep}
          <button onClick={undo} title="Undo" style={{
            padding: '5px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc',
          }}>↩</button>
          <button onClick={clearAll} title="Clear all" style={{
            padding: '5px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff8080',
          }}>🗑</button>
          {syncLabel && (
            <span style={{ fontSize: 11, color: syncColor, minWidth: 70, textAlign: 'center' }}>
              {syncLabel}
            </span>
          )}
          <button onClick={onToggle} style={{
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.45)', color: '#d4a843',
          }}>Done</button>
        </div>
      )}
    </>
  );
}
