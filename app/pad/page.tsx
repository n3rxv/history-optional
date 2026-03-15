'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────
type Tool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'select';

interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  opacity: number;
  points: { x: number; y: number; pressure: number }[];
}

interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
}

interface PadData {
  strokes: Stroke[];
  textBoxes: TextBox[];
  offsetX: number;
  offsetY: number;
}

interface PadRecord {
  id: string;
  name: string;
  updated_at: string;
  data: PadData;
}

// ── Constants ─────────────────────────────────────────────────────
const PEN_COLORS = [
  { label: 'White',  value: '#f0f0f0' },
  { label: 'Black',  value: '#111111' },
  { label: 'Gold',   value: '#d4a843' },
  { label: 'Cyan',   value: '#4ecdc4' },
  { label: 'Pink',   value: '#ff6b9d' },
  { label: 'Green',  value: '#51cf66' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: 'rgba(255,235,0,0.4)'    },
  { label: 'Cyan',   value: 'rgba(0,220,220,0.35)'   },
  { label: 'Pink',   value: 'rgba(255,100,160,0.35)' },
  { label: 'Green',  value: 'rgba(80,220,100,0.35)'  },
];

const GRID_SIZE = 28;

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─────────────────────────────────────────────────────────────────
export default function PadPage() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const overlayRef    = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  // Infinite canvas: we track a viewport offset (pan)
  const offsetRef     = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning     = useRef(false);
  const panStart      = useRef({ x: 0, y: 0 });
  const panOrigin     = useRef({ x: 0, y: 0 });

  const [tool, setTool]           = useState<Tool>('pen');
  const [penColor, setPenColor]   = useState('#f0f0f0');
  const [penSize, setPenSize]     = useState(2);
  const [zoom, setZoom]           = useState(1);
  const [pads, setPads]           = useState<PadRecord[]>([]);
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [padName, setPadName]     = useState('Untitled Pad');
  const [saving, setSaving]       = useState(false);
  const [showPadList, setShowPadList] = useState(false);
  const [editingText, setEditingText] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textFontSize, setTextFontSize] = useState(18);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const padDataRef = useRef<PadData>({ strokes: [], textBoxes: [], offsetX: 0, offsetY: 0 });
  const activeStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef    = useRef(false);

  // ── Resize canvas to fill viewport ────────────────────────────
  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      setCanvasSize({ w, h });
      if (canvasRef.current) { canvasRef.current.width = w; canvasRef.current.height = h; }
      if (overlayRef.current) { overlayRef.current.width = w; overlayRef.current.height = h; }
      redrawRef.current();
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Draw dot grid ──────────────────────────────────────────────
  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, ox: number, oy: number) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e1e1e';
    const startX = ((-ox) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    const startY = ((-oy) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    for (let x = startX; x < w; x += GRID_SIZE) {
      for (let y = startY; y < h; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Draw a single stroke ───────────────────────────────────────
  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, ox: number, oy: number) {
    if (stroke.points.length < 1) return;
    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth   = stroke.size * zoom;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'screen';
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    const pts = stroke.points.map(p => ({
      x: (p.x - ox) * zoom,
      y: (p.y - oy) * zoom,
    }));
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.size * zoom / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.tool === 'eraser' ? '#000000' : stroke.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i+1].x) / 2;
        const my = (pts[i].y + pts[i+1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Redraw main canvas ─────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const ox = offsetRef.current.x, oy = offsetRef.current.y;

    drawGrid(ctx, w, h, ox, oy);

    for (const stroke of padDataRef.current.strokes) {
      drawStroke(ctx, stroke, ox, oy);
    }
    for (const tb of padDataRef.current.textBoxes) {
      ctx.save();
      ctx.font = `${tb.fontSize * zoom}px 'Libre Baskerville', serif`;
      ctx.fillStyle = tb.color;
      ctx.globalAlpha = 1;
      const lines = tb.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, (tb.x - ox) * zoom, (tb.y - oy) * zoom + i * (tb.fontSize * zoom * 1.35));
      });
      ctx.restore();
    }
  }, [zoom]);

  // Keep a ref to redraw so resize handler can call it
  const redrawRef = useRef(redraw);
  useEffect(() => { redrawRef.current = redraw; }, [redraw]);

  // Redraw whenever offset or zoom changes
  useEffect(() => { redraw(); }, [offset, zoom, redraw]);

  // ── Get world position from pointer event ──────────────────────
  function getWorldPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = overlayRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom + offsetRef.current.x,
      y: (e.clientY - rect.top)  / zoom + offsetRef.current.y,
    };
  }

  function getScreenPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = overlayRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── Pointer events ─────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    // Middle mouse or space+drag = pan
    if (e.button === 1 || tool === 'select') {
      isPanning.current = true;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...offsetRef.current };
      return;
    }
    if (tool === 'text') {
      const pos = getWorldPos(e);
      setEditingText({ x: pos.x, y: pos.y });
      setTextInput('');
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pos = getWorldPos(e);
    const pressure = (e as any).pressure ?? 0.5;
    activeStrokeRef.current = {
      id: uid(),
      tool,
      color: tool === 'highlighter'
        ? (HIGHLIGHT_COLORS.find(c => c.value === penColor)?.value ?? '#fef08a')
        : tool === 'eraser' ? '#000000' : penColor,
      size: tool === 'eraser' ? penSize * 8 : tool === 'highlighter' ? penSize * 6 : penSize,
      opacity: tool === 'highlighter' ? 0.5 : 1,
      points: [{ x: pos.x, y: pos.y, pressure }],
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    // Pan
    if (isPanning.current) {
      const dx = (e.clientX - panStart.current.x) / zoom;
      const dy = (e.clientY - panStart.current.y) / zoom;
      const nx = panOrigin.current.x - dx;
      const ny = panOrigin.current.y - dy;
      offsetRef.current = { x: nx, y: ny };
      setOffset({ x: nx, y: ny });
      return;
    }

    // Eraser circle
    if (tool === 'eraser') {
      const sp = getScreenPos(e);
      setEraserPos({ x: sp.x, y: sp.y });
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const pos = getWorldPos(e);
    const pressure = (e as any).pressure ?? 0.5;
    activeStrokeRef.current.points.push({ x: pos.x, y: pos.y, pressure });

    // Live overlay
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawStroke(ctx, activeStrokeRef.current, offsetRef.current.x, offsetRef.current.y);
  }

  function onPointerUp() {
    isPanning.current = false;
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;
    padDataRef.current.strokes.push({ ...activeStrokeRef.current });
    activeStrokeRef.current = null;
    const overlay = overlayRef.current;
    if (overlay) overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
    redraw();
    debouncedSave();
  }

  // ── Zoom with Ctrl+Scroll ──────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => Math.min(4, Math.max(0.2, z - e.deltaY * 0.001)));
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Text tool ──────────────────────────────────────────────────
  function commitText() {
    if (!editingText || !textInput.trim()) { setEditingText(null); return; }
    padDataRef.current.textBoxes.push({
      id: uid(),
      x: editingText.x, y: editingText.y,
      text: textInput, color: penColor,
      fontSize: textFontSize, fontFamily: 'Libre Baskerville',
    });
    setEditingText(null); setTextInput('');
    redraw(); debouncedSave();
  }

  // ── Undo / Clear ───────────────────────────────────────────────
  function undo() {
    if (padDataRef.current.strokes.length > 0) padDataRef.current.strokes.pop();
    else if (padDataRef.current.textBoxes.length > 0) padDataRef.current.textBoxes.pop();
    redraw(); debouncedSave();
  }

  function clearPad() {
    if (!confirm('Clear all content?')) return;
    padDataRef.current.strokes = [];
    padDataRef.current.textBoxes = [];
    redraw(); debouncedSave();
  }

  // ── Save / Load ────────────────────────────────────────────────
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function debouncedSave() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToDb(), 1500);
  }

  async function saveToDb() {
    setSaving(true);
    const data = { ...padDataRef.current, offsetX: offsetRef.current.x, offsetY: offsetRef.current.y };
    if (activePadId) {
      await supabase.from('writing_pads').update({ data, name: padName, updated_at: new Date().toISOString() }).eq('id', activePadId);
    } else {
      const { data: row } = await supabase.from('writing_pads').insert({ name: padName, data }).select().single();
      if (row) setActivePadId(row.id);
    }
    setSaving(false);
    loadPadList();
  }

  async function loadPadList() {
    const { data } = await supabase.from('writing_pads').select('id, name, updated_at').order('updated_at', { ascending: false });
    if (data) setPads(data as PadRecord[]);
  }

  async function loadPad(id: string) {
    const { data } = await supabase.from('writing_pads').select('*').eq('id', id).single();
    if (!data) return;
    setActivePadId(data.id);
    setPadName(data.name);
    padDataRef.current = data.data as PadData;
    if (data.data.offsetX !== undefined) {
      offsetRef.current = { x: data.data.offsetX, y: data.data.offsetY };
      setOffset({ x: data.data.offsetX, y: data.data.offsetY });
    }
    redraw();
    setShowPadList(false);
  }

  function newPad() {
    setActivePadId(null);
    setPadName('Untitled Pad');
    padDataRef.current = { strokes: [], textBoxes: [], offsetX: 0, offsetY: 0 };
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    redraw();
    setShowPadList(false);
  }

  async function deletePad(id: string) {
    if (!confirm('Delete this pad?')) return;
    await supabase.from('writing_pads').delete().eq('id', id);
    if (activePadId === id) newPad();
    loadPadList();
  }

  useEffect(() => { redraw(); loadPadList(); }, [redraw]);

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveToDb(); }
      if (e.key === 'p') setTool('pen');
      if (e.key === 'h') setTool('highlighter');
      if (e.key === 'e') setTool('eraser');
      if (e.key === 't') setTool('text');
      if (e.key === ' ') setTool('select');
      if (e.key === 'Escape') { setEditingText(null); setTool('pen'); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const cursorStyle = tool === 'eraser' ? 'none'
    : tool === 'select' ? 'grab'
    : tool === 'text' ? 'text'
    : 'crosshair';

  // Screen position of text box
  const textScreenX = editingText ? (editingText.x - offsetRef.current.x) * zoom : 0;
  const textScreenY = editingText ? (editingText.y - offsetRef.current.y) * zoom : 0;

  return (
    <>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#f0ede8', fontFamily: "'Libre Baskerville', serif", overflow: 'hidden' }}>

        {/* ── TOP NAV ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', height: 50, borderBottom: '1px solid #1a1a1a', flexShrink: 0, background: '#000' }}>
          <Link href="/" style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', textDecoration: 'none', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>← Home</Link>
          <span style={{ color: '#222', fontSize: 10 }}>|</span>
          <input
            value={padName}
            onChange={e => setPadName(e.target.value)}
            onBlur={saveToDb}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#f0ede8', fontFamily: "'Libre Baskerville', serif", fontSize: 13, fontStyle: 'italic', minWidth: 180 }}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', fontStyle: 'italic' }}>saving…</span>}
            <span style={{ fontSize: 11, color: '#444', fontFamily: "'Libre Baskerville', serif" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} style={navBtnStyle}>+</button>
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} style={navBtnStyle}>−</button>
            <button onClick={() => setZoom(1)} style={navBtnStyle}>100%</button>
            <button onClick={() => setZoom(0.6)} style={navBtnStyle}>Fit</button>
            <button onClick={() => setShowPadList(p => !p)} style={{ ...navBtnStyle, background: showPadList ? 'rgba(255,255,255,0.06)' : 'transparent', color: showPadList ? '#f0ede8' : '#666' }}>
              All Pads
            </button>
            <button onClick={newPad} style={{ ...navBtnStyle, borderColor: '#2a2a2a', color: '#888' }}>+ New</button>
            <button onClick={saveToDb} style={{ ...navBtnStyle, background: '#f0ede8', color: '#000', borderColor: '#f0ede8', fontWeight: 700 }}>Save</button>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── TOOLBAR ── */}
          <div style={{ width: 52, background: '#050505', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 2, flexShrink: 0 }}>
            {([
              { t: 'pen',         icon: '✒', label: 'Pen (P)' },
              { t: 'highlighter', icon: '▋', label: 'Highlight (H)' },
              { t: 'eraser',      icon: 'E',  label: 'Eraser (E)' },
              { t: 'text',        icon: 'T',  label: 'Text (T)' },
              { t: 'select',      icon: '✥',  label: 'Pan (Space)' },
            ] as const).map(({ t, icon, label }) => (
              <button key={t} title={label} onClick={() => setTool(t)} style={{
                ...toolBtnStyle,
                background: tool === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: tool === t ? '#f0ede8' : '#444',
                fontFamily: "'Libre Baskerville', serif",
                fontStyle: (t === 'text' || t === 'eraser') ? 'normal' : 'italic',
                fontWeight: tool === t ? 700 : 400,
                fontSize: t === 'pen' || t === 'select' ? 16 : 14,
                border: tool === t ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              }}>
                {icon}
              </button>
            ))}

            <div style={{ width: 28, height: 1, background: '#161616', margin: '8px 0' }} />

            {/* Color swatch */}
            <button title="Color" onClick={() => setShowColorPicker(p => !p)} style={{ ...toolBtnStyle, position: 'relative' }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: penColor, border: '1px solid rgba(255,255,255,0.2)', boxShadow: penColor === '#111111' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none' }} />
            </button>

            {showColorPicker && (
              <div style={{ position: 'absolute', left: 60, top: 180, background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 10, padding: 14, zIndex: 300, width: 170, boxShadow: '0 8px 40px rgba(0,0,0,0.9)' }}>
                <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.12em', marginBottom: 8, fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>pen</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PEN_COLORS.map(c => (
                    <button key={c.value} title={c.label} onClick={() => { setPenColor(c.value); setShowColorPicker(false); }} style={{
                      width: 22, height: 22, borderRadius: 4, background: c.value,
                      border: penColor === c.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', transform: penColor === c.value ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.12s',
                      boxShadow: c.value === '#111111' ? 'inset 0 0 0 1px rgba(255,255,255,0.25)' : 'none',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.12em', margin: '10px 0 8px', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>highlight</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.value} title={c.label} onClick={() => { setPenColor(c.value); setTool('highlighter'); setShowColorPicker(false); }} style={{
                      width: 22, height: 14, borderRadius: 3,
                      background: c.value.replace(/[\d.]+\)$/, '0.85)'),
                      border: penColor === c.value ? '2px solid #fff' : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ width: 28, height: 1, background: '#161616', margin: '6px 0' }} />

            {/* Sizes */}
            {[1, 2, 4, 8].map(s => (
              <button key={s} title={`Size ${s}`} onClick={() => setPenSize(s)} style={{
                ...toolBtnStyle,
                background: penSize === s ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: penSize === s ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              }}>
                <div style={{ width: Math.min(s * 2.5 + 2, 20), height: Math.min(s * 2.5 + 2, 20), borderRadius: '50%', background: penSize === s ? '#f0ede8' : '#333' }} />
              </button>
            ))}

            {tool === 'text' && (
              <>
                <div style={{ width: 28, height: 1, background: '#161616', margin: '6px 0' }} />
                {[14, 18, 24, 32].map(fs => (
                  <button key={fs} title={`${fs}px`} onClick={() => setTextFontSize(fs)} style={{
                    ...toolBtnStyle, fontSize: 9,
                    color: textFontSize === fs ? '#f0ede8' : '#444',
                    background: textFontSize === fs ? 'rgba(255,255,255,0.08)' : 'transparent',
                    fontFamily: "'Libre Baskerville', serif",
                  }}>{fs}</button>
                ))}
              </>
            )}

            <div style={{ flex: 1 }} />
            <button title="Undo (⌘Z)" onClick={undo} style={{ ...toolBtnStyle, fontSize: 16, color: '#555' }}>↩</button>
            <button title="Clear pad" onClick={clearPad} style={{ ...toolBtnStyle, fontSize: 13, color: '#3a1a1a' }}>✕</button>
          </div>

          {/* ── PAD LIST SIDEBAR ── */}
          {showPadList && (
            <div style={{ width: 210, background: '#050505', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '14px 16px 10px', fontSize: 9, color: '#444', letterSpacing: '0.12em', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>
                my pads
                <button onClick={newPad} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #222', color: '#888', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: "'Libre Baskerville', serif" }}>+ New</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {pads.length === 0 && <div style={{ padding: '20px 16px', fontSize: 11, color: '#333', textAlign: 'center', fontStyle: 'italic' }}>No pads yet</div>}
                {pads.map(pad => (
                  <div key={pad.id} onClick={() => loadPad(pad.id)} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 14px',
                    borderBottom: '1px solid #0d0d0d', cursor: 'pointer',
                    background: pad.id === activePadId ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderLeft: pad.id === activePadId ? '2px solid #f0ede8' : '2px solid transparent',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#c0bdb8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{pad.name}</div>
                      <div style={{ fontSize: 9, color: '#333', marginTop: 2, letterSpacing: '0.06em' }}>{new Date(pad.updated_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deletePad(pad.id); }} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 14, padding: '2px 4px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INFINITE CANVAS ── */}
          <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000', cursor: cursorStyle }} onClick={() => setShowColorPicker(false)}>

            {/* Main canvas */}
            <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />

            {/* Overlay canvas (live stroke) */}
            <canvas
              ref={overlayRef}
              width={canvasSize.w}
              height={canvasSize.h}
              style={{ position: 'absolute', top: 0, left: 0, display: 'block', cursor: cursorStyle }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => { onPointerUp(); setEraserPos(null); isPanning.current = false; }}
            />

            {/* Eraser circle cursor */}
            {tool === 'eraser' && eraserPos && (
              <div style={{
                position: 'absolute',
                left: eraserPos.x - penSize * 4,
                top: eraserPos.y - penSize * 4,
                width: penSize * 8,
                height: penSize * 8,
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.8)',
              }} />
            )}

            {/* Text input */}
            {editingText && (
              <div style={{ position: 'absolute', top: textScreenY, left: textScreenX, zIndex: 20 }}>
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onBlur={commitText}
                  onKeyDown={e => { if (e.key === 'Escape') setEditingText(null); if (e.key === 'Enter' && e.shiftKey) commitText(); }}
                  style={{
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: 3, outline: 'none',
                    padding: '4px 8px',
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: textFontSize * zoom,
                    color: penColor,
                    minWidth: 120, minHeight: 40,
                    resize: 'both', lineHeight: 1.5,
                  }}
                  placeholder="Type… (Shift+Enter to place)"
                />
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>
                  Shift+Enter to place · Esc to cancel
                </div>
              </div>
            )}

            {/* Pan hint */}
            {tool === 'select' && (
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#333', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif", pointerEvents: 'none' }}>
                drag to pan · Esc to return to pen
              </div>
            )}
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div style={{ height: 24, background: '#000', borderTop: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, flexShrink: 0 }}>
          {[['P','Pen'],['H','Highlight'],['E','Eraser'],['T','Text'],['Space','Pan'],['⌘Z','Undo'],['⌘S','Save'],['⌘ Scroll','Zoom']].map(([k,v]) => (
            <span key={k} style={{ fontSize: 9, color: '#2a2a2a', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic' }}>
              <span style={{ color: '#3a3a3a' }}>{k}</span>
              <span style={{ marginLeft: 4 }}>{v}</span>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#2a2a2a', fontStyle: 'italic', fontFamily: "'Libre Baskerville', serif" }}>
            {Math.round(offsetRef.current.x)}, {Math.round(offsetRef.current.y)}
          </span>
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #1a1a1a',
  borderRadius: 5,
  color: '#666',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: "'Libre Baskerville', serif",
  letterSpacing: '0.03em',
  padding: '3px 9px',
  transition: 'all 0.15s',
};

const toolBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 7,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#444',
  fontSize: 14,
  transition: 'all 0.15s',
};
