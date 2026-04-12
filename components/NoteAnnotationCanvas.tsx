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
}

export default function NoteAnnotationCanvas({ noteSlug, active, onToggle }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const isDrawing  = useRef(false);
  const storageKey = `annotations_v3_${noteSlug}`;

  const [tool,      setTool]      = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor,  setPenColor]  = useState('#f0f0f0');
  const [hlColor,   setHlColor]   = useState('rgba(255,235,0,0.4)');
  const [penWidth,  setPenWidth]  = useState(2);
  const [tick,      setTick]      = useState(0);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  const saveLocal = useCallback((strokes: Stroke[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(strokes)); } catch {}
  }, [storageKey]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) strokesRef.current = JSON.parse(raw);
    } catch {}
    setTick(t => t + 1);
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

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    isDrawing.current = true;
    const pt = getPos(e);
    if (tool === 'eraser') {
      strokesRef.current = strokesRef.current.filter(s => {
        const dy = s.scrollY - window.scrollY;
        return !s.points.some(p => Math.hypot(p.x - pt.x, p.y - (p.y + dy) + pt.y) < penWidth * 6);
      });
      saveLocal(strokesRef.current);
      setTick(t => t + 1);
      return;
    }
    currentRef.current = {
      points: [pt],
      color: tool === 'highlighter' ? hlColor : penColor,
      width: penWidth,
      tool,
      scrollY: window.scrollY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
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
    if (!isDrawing.current || !currentRef.current) return;
    isDrawing.current = false;
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
        <div style={{
          position: 'fixed',
          left: eraserPos.x - (penWidth * 4),
          top: eraserPos.y - (penWidth * 4),
          width: penWidth * 8, height: penWidth * 8,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.8)',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none', zIndex: 200,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
        }} />
      )}

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
            {toolBtn('eraser', 'E', 'Eraser')}
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
          <button onClick={onToggle} style={{
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.45)', color: '#d4a843',
          }}>Done</button>
        </div>
      )}
    </>
  );
}
