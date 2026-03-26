'use client';

import { useEffect, useRef, useState, useCallback, type JSX } from 'react';
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

function uid() { return crypto.randomUUID(); }

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('writing_pads')
      .select('id, name, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
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

  // ── Welcome popup ──────────────────────────────────────────────
  useEffect(() => {
    const dismissed = localStorage.getItem('pad_welcome_dismissed');
    if (!dismissed) setShowWelcome(true);
  }, []);

  function dismissWelcome() {
    if (dontShowAgain) localStorage.setItem('pad_welcome_dismissed', '1');
    setShowWelcome(false);
  }

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

  // SVG icons for tools
  const ToolIcons: Record<string, JSX.Element> = {
    pen: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    ),
    highlighter: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
    ),
    eraser: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
        <path d="M22 21H7"/><path d="m5 11 9 9"/>
      </svg>
    ),
    text: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),
    select: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/>
      </svg>
    ),
    undo: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
      </svg>
    ),
    trash: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252525; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }

        .pad-nav-btn {
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 6px;
          color: #555;
          cursor: pointer;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.02em;
          padding: 4px 10px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .pad-nav-btn:hover { border-color: #333; color: #999; background: rgba(255,255,255,0.03); }
        .pad-nav-btn.active { background: rgba(240,237,232,0.08); border-color: #383838; color: #c0bdb8; }
        .pad-nav-btn.primary { background: #f0ede8; color: #0a0a0a; border-color: #f0ede8; font-weight: 600; }
        .pad-nav-btn.primary:hover { background: #fff; border-color: #fff; }

        .tool-btn {
          width: 40px; height: 40px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #3a3a3a;
          transition: all 0.15s;
          position: relative;
        }
        .tool-btn:hover { background: rgba(255,255,255,0.05); color: #888; }
        .tool-btn.active {
          background: rgba(240,237,232,0.1);
          border-color: rgba(240,237,232,0.15);
          color: #f0ede8;
          box-shadow: 0 0 0 1px rgba(240,237,232,0.05) inset;
        }
        .tool-btn.active::before {
          content: '';
          position: absolute;
          left: 3px; top: 50%; transform: translateY(-50%);
          width: 2px; height: 16px;
          background: #d4a843;
          border-radius: 2px;
        }
        .tool-btn.danger:hover { color: #c0392b; background: rgba(192,57,43,0.08); }

        .size-btn {
          width: 40px; height: 32px;
          background: transparent; border: 1px solid transparent;
          border-radius: 6px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .size-btn:hover { background: rgba(255,255,255,0.04); }
        .size-btn.active { border-color: rgba(240,237,232,0.12); background: rgba(255,255,255,0.06); }

        .pad-item {
          display: flex; align-items: center;
          padding: 9px 14px;
          border-bottom: 1px solid #0e0e0e;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s;
          gap: 10px;
        }
        .pad-item:hover { background: rgba(255,255,255,0.025); border-left-color: #2a2a2a; }
        .pad-item.active { background: rgba(240,237,232,0.04); border-left-color: #d4a843; }

        .color-swatch {
          width: 22px; height: 22px; border-radius: 5px;
          cursor: pointer; transition: all 0.12s;
          border: 1.5px solid transparent;
          flex-shrink: 0;
        }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch.active { border-color: #fff; transform: scale(1.2); box-shadow: 0 0 0 2px rgba(255,255,255,0.1); }

        .hl-swatch {
          width: 28px; height: 14px; border-radius: 3px;
          cursor: pointer; transition: all 0.12s;
          border: 1.5px solid transparent;
          flex-shrink: 0;
        }
        .hl-swatch:hover { transform: scale(1.1); }
        .hl-swatch.active { border-color: #fff; }

        .color-picker-panel {
          position: absolute; left: 56px; top: 160px;
          background: #0c0c0c;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 16px;
          z-index: 300;
          width: 176px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.02) inset;
        }
        .picker-label {
          font-size: 9px; color: #3a3a3a;
          letter-spacing: 0.14em; text-transform: uppercase;
          margin-bottom: 10px;
          font-family: 'DM Mono', monospace;
        }

        @keyframes fadeInPad { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
        .pad-list-sidebar { animation: fadeInPad 0.18s ease; }

        @keyframes welcomeIn { from { opacity:0; transform: scale(0.97) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .welcome-card { animation: welcomeIn 0.25s cubic-bezier(0.16,1,0.3,1); }

        .toolbar-divider { width: 24px; height: 1px; background: #181818; margin: 6px auto; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', color: '#f0ede8', fontFamily: "'Libre Baskerville', serif", overflow: 'hidden' }}>

        {/* ── TOP NAV ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 18px', height: 48,
          borderBottom: '1px solid #141414',
          flexShrink: 0,
          background: '#080808',
        }}>
          {/* Left: home + pad name */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10, color: '#3a3a3a', letterSpacing: '0.08em',
            textDecoration: 'none', fontFamily: "'DM Mono', monospace",
            transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#666'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3a3a3a'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </Link>

          <div style={{ width: 1, height: 18, background: '#1e1e1e', flexShrink: 0 }} />

          {/* Pad name input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <input
              value={padName}
              onChange={e => setPadName(e.target.value)}
              onBlur={saveToDb}
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: '#c0bdb8', fontFamily: "'Libre Baskerville', serif",
                fontSize: 13, fontStyle: 'italic',
                minWidth: 140, maxWidth: 260,
              }}
            />
          </div>

          {/* Right controls */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Save indicator */}
            {saving ? (
              <span style={{ fontSize: 10, color: '#d4a843', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", opacity: 0.8 }}>
                saving…
              </span>
            ) : (
              <span style={{ fontSize: 10, color: '#282828', fontFamily: "'DM Mono', monospace" }}>✓ saved</span>
            )}

            <div style={{ width: 1, height: 16, background: '#1e1e1e' }} />

            {/* Zoom controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 7, padding: '2px 6px' }}>
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, transition: 'color 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
              >−</button>
              <span style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono', monospace", minWidth: 34, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => setZoom(1)}
              >{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, transition: 'color 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
              >+</button>
            </div>

            <button onClick={() => setZoom(0.6)} className="pad-nav-btn">Fit</button>

            <div style={{ width: 1, height: 16, background: '#1e1e1e' }} />

            <button
              onClick={() => setShowPadList(p => !p)}
              className={`pad-nav-btn${showPadList ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              My Pads
            </button>

            <button onClick={newPad} className="pad-nav-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New
            </button>

            <button onClick={saveToDb} className="pad-nav-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Save
            </button>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── TOOLBAR ── */}
          <div style={{
            width: 52, background: '#080808',
            borderRight: '1px solid #141414',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '10px 0', gap: 2,
            flexShrink: 0,
          }}>

            {/* Tool group */}
            {([
              { t: 'pen',         label: 'Pen  (P)' },
              { t: 'highlighter', label: 'Highlight  (H)' },
              { t: 'eraser',      label: 'Eraser  (E)' },
              { t: 'text',        label: 'Text  (T)' },
              { t: 'select',      label: 'Pan  (Space)' },
            ] as const).map(({ t, label }) => (
              <button
                key={t}
                title={label}
                onClick={() => setTool(t)}
                className={`tool-btn${tool === t ? ' active' : ''}`}
              >
                {ToolIcons[t]}
              </button>
            ))}

            <div className="toolbar-divider" />

            {/* Color swatch button */}
            <button
              title="Color picker"
              onClick={() => setShowColorPicker(p => !p)}
              className={`tool-btn${showColorPicker ? ' active' : ''}`}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                background: penColor,
                border: '1.5px solid rgba(255,255,255,0.18)',
                boxShadow: penColor === '#111111' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : `0 0 6px ${penColor}44`,
                transition: 'box-shadow 0.2s',
              }} />
            </button>

            {/* Color picker panel */}
            {showColorPicker && (
              <div className="color-picker-panel">
                <div className="picker-label">Pen color</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {PEN_COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => { setPenColor(c.value); setShowColorPicker(false); }}
                      className={`color-swatch${penColor === c.value ? ' active' : ''}`}
                      style={{
                        background: c.value,
                        boxShadow: c.value === '#111111' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="picker-label">Highlighter</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => { setPenColor(c.value); setTool('highlighter'); setShowColorPicker(false); }}
                      className={`hl-swatch${penColor === c.value ? ' active' : ''}`}
                      style={{ background: c.value.replace(/[\d.]+\)$/, '0.9)') }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="toolbar-divider" />

            {/* Size picker */}
            {[1, 2, 4, 8].map(s => (
              <button
                key={s}
                title={`Size ${s}`}
                onClick={() => setPenSize(s)}
                className={`size-btn${penSize === s ? ' active' : ''}`}
              >
                <div style={{
                  width: Math.min(s * 2.5 + 2, 20),
                  height: Math.min(s * 2.5 + 2, 20),
                  borderRadius: '50%',
                  background: penSize === s ? '#f0ede8' : '#2e2e2e',
                  transition: 'all 0.12s',
                }} />
              </button>
            ))}

            {/* Text size options */}
            {tool === 'text' && (
              <>
                <div className="toolbar-divider" />
                {[14, 18, 24, 32].map(fs => (
                  <button
                    key={fs}
                    title={`${fs}px`}
                    onClick={() => setTextFontSize(fs)}
                    style={{
                      width: 40, height: 28,
                      background: textFontSize === fs ? 'rgba(255,255,255,0.07)' : 'transparent',
                      border: `1px solid ${textFontSize === fs ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      borderRadius: 5, cursor: 'pointer',
                      fontSize: 9, color: textFontSize === fs ? '#c0bdb8' : '#3a3a3a',
                      fontFamily: "'DM Mono', monospace",
                      transition: 'all 0.12s',
                    }}
                  >{fs}</button>
                ))}
              </>
            )}

            <div style={{ flex: 1 }} />
            <div className="toolbar-divider" />

            {/* Undo */}
            <button title="Undo (⌘Z)" onClick={undo} className="tool-btn">{ToolIcons.undo}</button>
            {/* Clear */}
            <button title="Clear pad" onClick={clearPad} className="tool-btn danger">{ToolIcons.trash}</button>
          </div>

          {/* ── PAD LIST SIDEBAR ── */}
          {showPadList && (
            <div className="pad-list-sidebar" style={{
              width: 220,
              background: '#080808',
              borderRight: '1px solid #141414',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {/* Sidebar header */}
              <div style={{
                padding: '12px 14px 10px',
                borderBottom: '1px solid #141414',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 9, color: '#3a3a3a', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>My Pads</span>
                <button onClick={newPad} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #252525',
                  color: '#666', borderRadius: 5, padding: '3px 9px',
                  fontSize: 10, cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                  display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#383838'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#252525'}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New
                </button>
              </div>

              {/* Pad list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {pads.length === 0 && (
                  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#2a2a2a', fontStyle: 'italic' }}>No pads yet</div>
                    <div style={{ fontSize: 9, color: '#1e1e1e', marginTop: 6, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>create one to begin</div>
                  </div>
                )}
                {pads.map(pad => (
                  <div
                    key={pad.id}
                    onClick={() => loadPad(pad.id)}
                    className={`pad-item${pad.id === activePadId ? ' active' : ''}`}
                  >
                    {/* Doc icon */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={pad.id === activePadId ? '#d4a843' : '#333'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, color: pad.id === activePadId ? '#e8e5e0' : '#888',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontStyle: 'italic', transition: 'color 0.15s',
                      }}>{pad.name}</div>
                      <div style={{ fontSize: 9, color: '#2e2e2e', marginTop: 2, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>
                        {new Date(pad.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deletePad(pad.id); }}
                      style={{
                        background: 'none', border: 'none', color: '#242424',
                        cursor: 'pointer', padding: '3px', borderRadius: 4,
                        display: 'flex', transition: 'all 0.12s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c0392b'; (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#242424'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
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
                border: '1.5px solid rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.03)',
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
                    background: 'rgba(8,8,8,0.92)',
                    border: '1px dashed rgba(212,168,67,0.35)',
                    borderRadius: 4, outline: 'none',
                    padding: '6px 10px',
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: textFontSize * zoom,
                    color: penColor,
                    minWidth: 140, minHeight: 44,
                    resize: 'both', lineHeight: 1.55,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
                  }}
                  placeholder="Type… (Shift+Enter to place)"
                />
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontStyle: 'italic', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>
                  shift+enter to place · esc to cancel
                </div>
              </div>
            )}

            {/* Pan hint */}
            {tool === 'select' && (
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                fontSize: 10, color: 'rgba(255,255,255,0.12)', fontStyle: 'italic',
                fontFamily: "'DM Mono', monospace", pointerEvents: 'none',
                letterSpacing: '0.08em',
                background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 20,
                backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                drag to pan · esc to return to pen
              </div>
            )}

            {/* Canvas position indicator (bottom right) */}
            <div style={{
              position: 'absolute', bottom: 14, right: 16,
              fontSize: 9, color: '#222',
              fontFamily: "'DM Mono', monospace",
              pointerEvents: 'none', letterSpacing: '0.06em',
            }}>
              {Math.round(offsetRef.current.x)}, {Math.round(offsetRef.current.y)}
            </div>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        <div style={{
          height: 26, background: '#060606',
          borderTop: '1px solid #111',
          display: 'flex', alignItems: 'center',
          padding: '0 18px', gap: 0, flexShrink: 0,
          overflow: 'hidden',
        }}>
          {[
            ['P', 'Pen'], ['H', 'Highlight'], ['E', 'Eraser'], ['T', 'Text'],
            ['Space', 'Pan'], ['⌘Z', 'Undo'], ['⌘S', 'Save'], ['⌘ Scroll', 'Zoom'],
          ].map(([k, v], i) => (
            <span key={k} style={{
              fontSize: 9, color: '#242424',
              fontFamily: "'DM Mono', monospace",
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 10px',
              borderRight: i < 7 ? '1px solid #131313' : 'none',
            }}>
              <span style={{ color: '#333', background: '#111', border: '1px solid #1a1a1a', borderRadius: 3, padding: '0 4px', fontSize: 8, letterSpacing: '0.05em' }}>{k}</span>
              <span style={{ color: '#282828' }}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── WELCOME POPUP ── */}
      {showWelcome && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="welcome-card" style={{
            background: '#0a0a0a',
            border: '1px solid #1e1e1e',
            borderRadius: 18,
            padding: '36px 40px',
            width: 490,
            maxWidth: '90vw',
            boxShadow: '0 32px 96px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.02) inset',
            fontFamily: "'Libre Baskerville', serif",
          }}>
            {/* Title */}
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em' }}>Writing Pad</span>
              <span style={{ fontSize: 11, color: '#d4a843', fontStyle: 'italic', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>∞ canvas</span>
            </div>
            <div style={{ fontSize: 12, color: '#3a3a3a', fontStyle: 'italic', marginBottom: 28, borderBottom: '1px solid #131313', paddingBottom: 20 }}>
              A distraction-free space to write, annotate, and think.
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { key: 'P', label: 'Pen', desc: 'Freehand drawing with 6 colors and 4 sizes' },
                { key: 'H', label: 'Highlighter', desc: 'Semi-transparent highlights in 4 colors' },
                { key: 'E', label: 'Eraser', desc: 'Circle eraser — size matches your pen size' },
                { key: 'T', label: 'Text', desc: 'Click anywhere to place typed text' },
                { key: 'Space', label: 'Pan', desc: 'Hold Space + drag to pan the infinite canvas' },
                { key: '⌘ Scroll', label: 'Zoom', desc: 'Pinch or Ctrl+scroll to zoom in/out' },
                { key: '⌘Z', label: 'Undo', desc: 'Undo last stroke or text' },
                { key: '⌘S', label: 'Save', desc: 'Auto-saves to cloud — manual save also available' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    minWidth: 54, fontSize: 9, color: '#777',
                    background: '#111', border: '1px solid #1e1e1e',
                    borderRadius: 5, padding: '3px 6px', textAlign: 'center',
                    letterSpacing: '0.06em', marginTop: 1, flexShrink: 0,
                    fontFamily: "'DM Mono', monospace",
                  }}>{key}</span>
                  <div>
                    <span style={{ fontSize: 12, color: '#c0bdb8', fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginLeft: 8 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Do not show again */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div
                onClick={() => setDontShowAgain(p => !p)}
                style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: dontShowAgain ? '1px solid #d4a843' : '1px solid #2e2e2e',
                  background: dontShowAgain ? '#d4a843' : 'transparent',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {dontShowAgain && <span style={{ fontSize: 10, color: '#000', fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </div>
              <span
                onClick={() => setDontShowAgain(p => !p)}
                style={{ fontSize: 11, color: '#444', cursor: 'pointer', fontStyle: 'italic', userSelect: 'none', transition: 'color 0.15s' }}
              >
                Don't show this again
              </span>
            </div>

            {/* Button */}
            <button
              onClick={dismissWelcome}
              style={{
                width: '100%', padding: '11px 0',
                background: 'linear-gradient(135deg, #c8a84b, #e8c96a, #c8a84b)',
                backgroundSize: '200%',
                color: '#0a0a0a',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Libre Baskerville', serif",
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(212,168,67,0.2)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundPosition = 'right center'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(212,168,67,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundPosition = 'left center'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212,168,67,0.2)'; }}
            >
              Start Writing
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles (kept for reference, superseded by className approach) ──
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
