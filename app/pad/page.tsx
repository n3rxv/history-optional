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
  { label: 'Chalk',   value: '#f0f0f0' },
  { label: 'Ink',     value: '#111111' },
  { label: 'Gold',    value: '#d4a843' },
  { label: 'Teal',    value: '#4ecdc4' },
  { label: 'Rose',    value: '#ff6b9d' },
  { label: 'Mint',    value: '#51cf66' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Lemon',   value: 'rgba(255,235,0,0.4)'    },
  { label: 'Cyan',    value: 'rgba(0,220,220,0.35)'   },
  { label: 'Pink',    value: 'rgba(255,100,160,0.35)' },
  { label: 'Lime',    value: 'rgba(80,220,100,0.35)'  },
];

const GRID_SIZE = 28;

function uid() { return crypto.randomUUID(); }

// ─────────────────────────────────────────────────────────────────
export default function PadPage() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const overlayRef    = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

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
    // Deep warm charcoal — clearly distinct from the toolbar
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(0, 0, w, h);
    // Visible warm dots
    ctx.fillStyle = 'rgba(200,175,130,0.28)';
    const startX = ((-ox) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    const startY = ((-oy) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    for (let x = startX; x < w; x += GRID_SIZE) {
      for (let y = startY; y < h; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
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
      ctx.strokeStyle = '#1a1612';
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
      ctx.fillStyle = stroke.tool === 'eraser' ? '#1a1612' : stroke.color;
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

  const redrawRef = useRef(redraw);
  useEffect(() => { redrawRef.current = redraw; }, [redraw]);
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
        : tool === 'eraser' ? '#0e0c0a' : penColor,
      size: tool === 'eraser' ? penSize * 8 : tool === 'highlighter' ? penSize * 6 : penSize,
      opacity: tool === 'highlighter' ? 0.5 : 1,
      points: [{ x: pos.x, y: pos.y, pressure }],
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (isPanning.current) {
      const dx = (e.clientX - panStart.current.x) / zoom;
      const dy = (e.clientY - panStart.current.y) / zoom;
      const nx = panOrigin.current.x - dx;
      const ny = panOrigin.current.y - dy;
      offsetRef.current = { x: nx, y: ny };
      setOffset({ x: nx, y: ny });
      return;
    }
    if (tool === 'eraser') {
      const sp = getScreenPos(e);
      setEraserPos({ x: sp.x, y: sp.y });
    }
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const pos = getWorldPos(e);
    const pressure = (e as any).pressure ?? 0.5;
    activeStrokeRef.current.points.push({ x: pos.x, y: pos.y, pressure });

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

  // ── Zoom ────────────────────────────────────────────────────────
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

  const textScreenX = editingText ? (editingText.x - offsetRef.current.x) * zoom : 0;
  const textScreenY = editingText ? (editingText.y - offsetRef.current.y) * zoom : 0;

  // SVG icons
  const Icons: Record<string, JSX.Element> = {
    pen: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    ),
    highlighter: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
    ),
    eraser: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
        <path d="M22 21H7"/><path d="m5 11 9 9"/>
      </svg>
    ),
    text: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),
    select: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/>
      </svg>
    ),
    undo: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
      </svg>
    ),
    trash: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    save: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
    list: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    home: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    doc: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    palette: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    ),
  };

  const toolLabels: Record<Tool, string> = {
    pen: 'Pen  (P)',
    highlighter: 'Highlight  (H)',
    eraser: 'Eraser  (E)',
    text: 'Text  (T)',
    select: 'Pan  (Space)',
  };

  const activeColors = tool === 'highlighter' ? HIGHLIGHT_COLORS : PEN_COLORS;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,160,120,0.12); border-radius: 2px; }

        /* === TITLEBAR === */
        .titlebar {
          height: 44px;
          background: #0a0806;
          border-bottom: 1px solid rgba(212,168,67,0.12);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 0;
          flex-shrink: 0;
          position: relative;
          z-index: 50;
        }

        .titlebar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .titlebar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .titlebar-right {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .home-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: rgba(200,175,130,0.5);
          letter-spacing: 0.08em;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.18s;
        }
        .home-btn:hover { color: rgba(200,175,130,0.85); background: rgba(212,168,67,0.07); }

        .title-sep { width: 1px; height: 16px; background: rgba(212,168,67,0.12); }

        .pad-name-input {
          background: none;
          border: none;
          outline: none;
          color: rgba(240,235,220,0.85);
          font-family: 'Fraunces', serif;
          font-size: 13px;
          font-style: italic;
          font-weight: 300;
          min-width: 140px;
          max-width: 280px;
          letter-spacing: 0.01em;
        }
        .pad-name-input::placeholder { color: rgba(200,175,130,0.3); }

        .save-state {
          font-size: 9.5px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 20px;
          transition: all 0.3s;
        }
        .save-state.saving {
          color: #e8c96a;
          background: rgba(212,168,67,0.12);
          border: 1px solid rgba(212,168,67,0.22);
        }
        .save-state.saved {
          color: rgba(200,175,130,0.3);
        }

        .tb-divider { width: 1px; height: 16px; background: rgba(212,168,67,0.1); }

        /* Zoom cluster */
        .zoom-cluster {
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(212,168,67,0.06);
          border: 1px solid rgba(212,168,67,0.14);
          border-radius: 8px;
          overflow: hidden;
        }
        .zoom-btn {
          background: none; border: none; border-radius: 0;
          color: rgba(200,175,130,0.55); cursor: pointer;
          font-size: 15px; padding: 3px 7px;
          line-height: 1; transition: all 0.12s;
          font-weight: 300;
        }
        .zoom-btn:hover { color: rgba(212,168,67,0.9); background: rgba(212,168,67,0.08); }
        .zoom-label {
          font-size: 9.5px; color: rgba(200,175,130,0.5);
          font-family: 'DM Mono', monospace;
          min-width: 38px; text-align: center;
          cursor: pointer; padding: 0 2px;
          transition: color 0.12s;
        }
        .zoom-label:hover { color: rgba(200,175,130,0.8); }

        /* Nav buttons */
        .nav-btn {
          display: flex; align-items: center; gap: 5px;
          background: transparent;
          border: 1px solid rgba(212,168,67,0.14);
          border-radius: 7px;
          color: rgba(200,175,130,0.55);
          cursor: pointer;
          font-size: 10.5px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.04em;
          padding: 4px 10px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .nav-btn:hover { border-color: rgba(212,168,67,0.28); color: rgba(220,195,150,0.85); background: rgba(212,168,67,0.05); }
        .nav-btn.active { background: rgba(212,168,67,0.1); border-color: rgba(212,168,67,0.28); color: rgba(232,201,106,0.8); }
        .nav-btn.primary {
          background: rgba(212,168,67,0.14);
          border-color: rgba(212,168,67,0.35);
          color: #d4a843;
          font-weight: 500;
        }
        .nav-btn.primary:hover {
          background: rgba(212,168,67,0.24);
          border-color: rgba(212,168,67,0.55);
          color: #e8c96a;
          box-shadow: 0 0 14px rgba(212,168,67,0.15);
        }

        /* === FLOATING TOOLBAR (Freenotes style) === */
        .floating-toolbar {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 7px;
          background: #111008;
          border: 1px solid rgba(212,168,67,0.18);
          border-radius: 16px;
          box-shadow:
            0 8px 40px rgba(0,0,0,0.8),
            0 2px 8px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(212,168,67,0.06);
        }

        .tb-tool-btn {
          width: 38px; height: 38px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(200,180,140,0.55);
          transition: all 0.15s;
          position: relative;
        }
        .tb-tool-btn:hover {
          background: rgba(212,168,67,0.08);
          color: rgba(220,195,150,0.9);
          border-color: rgba(212,168,67,0.12);
        }
        .tb-tool-btn.active {
          background: rgba(212,168,67,0.15);
          border-color: rgba(212,168,67,0.35);
          color: #e8c96a;
          box-shadow: 0 0 14px rgba(212,168,67,0.12), inset 0 1px 0 rgba(212,168,67,0.12);
        }
        .tb-tool-btn.danger:hover {
          color: rgba(220,80,80,0.85);
          background: rgba(200,60,60,0.1);
          border-color: rgba(200,60,60,0.18);
        }

        .tb-divider-h {
          width: 22px; height: 1px;
          background: rgba(212,168,67,0.1);
          margin: 3px 0;
        }

        /* Active tool indicator */
        .tb-tool-btn.active::after {
          content: '';
          position: absolute;
          right: -1px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 14px;
          background: linear-gradient(180deg, #e8c96a, #d4a843);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(212,168,67,0.6);
        }

        /* Color indicator on toolbar */
        .tb-color-dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.12s;
        }
        .tb-color-dot:hover { transform: scale(1.2); }

        /* Size dots */
        .size-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 4px 0;
        }
        .size-dot {
          border-radius: 50%;
          background: rgba(200,175,130,0.45);
          cursor: pointer;
          transition: all 0.12s;
          flex-shrink: 0;
          border: 1.5px solid transparent;
        }
        .size-dot.active {
          background: #d4a843;
          box-shadow: 0 0 8px rgba(212,168,67,0.5);
          border-color: rgba(232,201,106,0.5);
        }
        .size-dot:hover { transform: scale(1.25); background: rgba(212,168,67,0.7); }

        /* === FLOATING COLOR PICKER === */
        .color-picker-float {
          position: absolute;
          left: 70px;
          z-index: 200;
          background: #0c0a08;
          border: 1px solid rgba(212,168,67,0.18);
          border-radius: 14px;
          padding: 14px;
          width: 168px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212,168,67,0.05);
          animation: popIn 0.15s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateX(-4px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }

        .cpf-label {
          font-size: 8.5px;
          color: rgba(200,175,130,0.45);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-family: 'DM Mono', monospace;
          margin-bottom: 9px;
        }

        .cpf-swatch {
          width: 24px; height: 24px;
          border-radius: 6px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.12s;
        }
        .cpf-swatch:hover { transform: scale(1.15); }
        .cpf-swatch.active {
          border-color: rgba(255,255,255,0.5);
          box-shadow: 0 0 8px rgba(255,255,255,0.15);
          transform: scale(1.15);
        }

        .hl-swatch {
          width: 32px; height: 16px;
          border-radius: 4px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.12s;
        }
        .hl-swatch:hover { transform: scale(1.08); }
        .hl-swatch.active { border-color: rgba(255,255,255,0.5); transform: scale(1.08); }

        /* === PAD LIST SIDEBAR === */
        .pad-sidebar {
          width: 230px;
          position: absolute;
          top: 0; right: 0; bottom: 0;
          background: #0c0a08;
          border-left: 1px solid rgba(212,168,67,0.12);
          display: flex; flex-direction: column;
          z-index: 80;
          animation: slideIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .pad-sidebar-header {
          padding: 16px 16px 12px;
          border-bottom: 1px solid rgba(212,168,67,0.1);
          display: flex; align-items: center; justify-content: space-between;
        }

        .pad-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s;
        }
        .pad-item:hover { background: rgba(212,168,67,0.04); border-left-color: rgba(212,168,67,0.2); }
        .pad-item.active {
          background: rgba(212,168,67,0.07);
          border-left-color: #d4a843;
        }
        .pad-item + .pad-item { border-top: 1px solid rgba(212,168,67,0.05); }

        /* === PAN HINT === */
        .pan-hint {
          position: absolute;
          bottom: 24px; left: 50%; transform: translateX(-50%);
          font-size: 9.5px;
          color: rgba(200,175,130,0.35);
          font-style: italic;
          font-family: 'DM Mono', monospace;
          pointer-events: none;
          letter-spacing: 0.08em;
          background: rgba(10,8,6,0.75);
          padding: 5px 14px;
          border-radius: 20px;
          border: 1px solid rgba(212,168,67,0.1);
          white-space: nowrap;
        }

        /* === COORDS INDICATOR === */
        .coords {
          position: absolute;
          bottom: 14px; right: 14px;
          font-size: 8.5px;
          color: rgba(200,175,130,0.2);
          font-family: 'DM Mono', monospace;
          pointer-events: none;
          letter-spacing: 0.05em;
        }

        /* === TEXT EDITOR === */
        .text-editor-wrap {
          position: absolute;
          z-index: 20;
        }
        .text-editor {
          background: rgba(10,9,7,0.92);
          border: 1px dashed rgba(212,168,67,0.3);
          border-radius: 6px;
          outline: none;
          padding: 7px 11px;
          font-family: 'Libre Baskerville', serif;
          min-width: 140px; min-height: 44px;
          resize: both;
          line-height: 1.6;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.7);
          transition: border-color 0.15s;
        }
        .text-editor:focus { border-color: rgba(212,168,67,0.55); }
        .text-editor-hint {
          font-size: 8.5px;
          color: rgba(180,160,120,0.18);
          margin-top: 4px;
          font-style: italic;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.06em;
        }

        /* === ERASER CURSOR === */
        .eraser-cursor {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(240,235,225,0.4);
          background: rgba(240,235,225,0.03);
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.8);
        }

        /* === WELCOME MODAL === */
        .welcome-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(16px);
        }
        .welcome-card {
          background: #0c0a08;
          border: 1px solid rgba(212,168,67,0.15);
          border-radius: 20px;
          padding: 36px 40px;
          width: 500px;
          max-width: 92vw;
          box-shadow:
            0 40px 100px rgba(0,0,0,0.95),
            inset 0 1px 0 rgba(212,168,67,0.05);
          animation: welcomeIn 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes welcomeIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .welcome-title {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 400;
          font-style: italic;
          color: rgba(240,235,225,0.9);
          letter-spacing: -0.02em;
          margin-bottom: 2px;
        }
        .welcome-subtitle {
          font-size: 11px;
          color: rgba(200,175,130,0.35);
          font-style: italic;
          margin-bottom: 24px;
          font-family: 'DM Mono', monospace;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(212,168,67,0.08);
          letter-spacing: 0.06em;
        }
        .shortcut-row {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 11px;
        }
        .shortcut-key {
          min-width: 54px; font-size: 8.5px;
          color: rgba(200,175,130,0.6);
          background: rgba(212,168,67,0.07);
          border: 1px solid rgba(212,168,67,0.14);
          border-radius: 5px;
          padding: 3px 6px; text-align: center;
          letter-spacing: 0.06em; margin-top: 1px;
          flex-shrink: 0;
          font-family: 'DM Mono', monospace;
        }
        .shortcut-label {
          font-size: 12px;
          color: rgba(240,235,220,0.75);
          font-weight: 700;
          font-family: 'Libre Baskerville', serif;
        }
        .shortcut-desc {
          font-size: 11px;
          color: rgba(200,175,130,0.35);
          font-style: italic;
          margin-left: 7px;
          font-family: 'Libre Baskerville', serif;
        }
        .welcome-checkbox-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px; margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid rgba(212,168,67,0.08);
        }
        .welcome-checkbox {
          width: 16px; height: 16px; border-radius: 4px;
          border: 1px solid rgba(212,168,67,0.25);
          background: transparent;
          cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .welcome-checkbox.checked {
          background: #d4a843;
          border-color: #d4a843;
        }
        .welcome-start-btn {
          width: 100%; padding: 12px 0;
          background: linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.22));
          border: 1px solid rgba(212,168,67,0.3);
          border-radius: 11px;
          color: #d4a843;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Fraunces', serif;
          font-style: italic;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(212,168,67,0.08);
        }
        .welcome-start-btn:hover {
          background: linear-gradient(135deg, rgba(212,168,67,0.22), rgba(232,201,106,0.3));
          border-color: rgba(212,168,67,0.5);
          box-shadow: 0 6px 30px rgba(212,168,67,0.18);
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: '#1a1612', color: '#f0ede8',
        fontFamily: "'Libre Baskerville', serif",
        overflow: 'hidden',
      }}>

        {/* ── TITLEBAR ── */}
        <nav className="titlebar">
          <div className="titlebar-left">
            <Link href="/" className="home-btn">
              {Icons.home}
              <span>Home</span>
            </Link>
            <div className="title-sep" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: 'rgba(180,160,120,0.2)', flexShrink: 0 }}>{Icons.doc}</span>
              <input
                value={padName}
                onChange={e => setPadName(e.target.value)}
                onBlur={saveToDb}
                className="pad-name-input"
                placeholder="Untitled pad…"
              />
            </div>
          </div>

          {/* Center: save state */}
          <div className="titlebar-center">
            <span className={`save-state ${saving ? 'saving' : 'saved'}`}>
              {saving ? '◌ saving…' : '✓ saved'}
            </span>
          </div>

          <div className="titlebar-right">
            {/* Zoom cluster */}
            <div className="zoom-cluster">
              <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>−</button>
              <span className="zoom-label" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={() => setZoom(z => Math.min(4, z + 0.1))}>+</button>
            </div>

            <button onClick={() => setZoom(0.6)} className="nav-btn">Fit</button>
            <div className="tb-divider" />

            <button
              onClick={() => setShowPadList(p => !p)}
              className={`nav-btn${showPadList ? ' active' : ''}`}
            >
              {Icons.list}
              <span>My Pads</span>
            </button>

            <button onClick={newPad} className="nav-btn" style={{ gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New
            </button>

            <button onClick={saveToDb} className="nav-btn primary">
              {Icons.save}
              <span>Save</span>
            </button>
          </div>
        </nav>

        {/* ── CANVAS AREA ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Main drawing container */}
          <div
            ref={containerRef}
            style={{ position: 'absolute', inset: 0, cursor: cursorStyle }}
            onClick={() => setShowColorPicker(false)}
          >
            <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
              style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />
            <canvas
              ref={overlayRef}
              width={canvasSize.w} height={canvasSize.h}
              style={{ position: 'absolute', top: 0, left: 0, display: 'block', cursor: cursorStyle }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => { onPointerUp(); setEraserPos(null); isPanning.current = false; }}
            />

            {/* Eraser cursor */}
            {tool === 'eraser' && eraserPos && (
              <div className="eraser-cursor" style={{
                left: eraserPos.x - penSize * 4,
                top: eraserPos.y - penSize * 4,
                width: penSize * 8,
                height: penSize * 8,
              }} />
            )}

            {/* Text input */}
            {editingText && (
              <div className="text-editor-wrap" style={{ top: textScreenY, left: textScreenX }}>
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onBlur={commitText}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setEditingText(null);
                    if (e.key === 'Enter' && e.shiftKey) commitText();
                  }}
                  className="text-editor"
                  style={{ color: penColor, fontSize: textFontSize * zoom }}
                  placeholder="Type… (Shift+Enter to place)"
                />
                <div className="text-editor-hint">shift+enter to place · esc to cancel</div>
              </div>
            )}

            {/* Pan hint */}
            {tool === 'select' && (
              <div className="pan-hint">drag to pan · esc to return to pen</div>
            )}

            {/* Coords */}
            <div className="coords">
              {Math.round(offsetRef.current.x)}, {Math.round(offsetRef.current.y)}
            </div>
          </div>

          {/* ── FLOATING TOOLBAR (Freenotes-inspired) ── */}
          <div className="floating-toolbar" onClick={e => e.stopPropagation()}>

            {/* Tool buttons */}
            {(['pen', 'highlighter', 'eraser', 'text', 'select'] as const).map(t => (
              <button
                key={t}
                title={toolLabels[t]}
                onClick={() => setTool(t)}
                className={`tb-tool-btn${tool === t ? ' active' : ''}`}
              >
                {Icons[t]}
              </button>
            ))}

            <div className="tb-divider-h" />

            {/* Color swatch + picker toggle */}
            <button
              title="Colors"
              onClick={() => setShowColorPicker(p => !p)}
              className={`tb-tool-btn${showColorPicker ? ' active' : ''}`}
            >
              <div className="tb-color-dot" style={{ background: penColor }} />
            </button>

            <div className="tb-divider-h" />

            {/* Size selector */}
            <div className="size-row">
              {[1, 2, 3, 5].map(s => (
                <div
                  key={s}
                  className={`size-dot${penSize === s ? ' active' : ''}`}
                  title={`Size ${s}`}
                  onClick={() => setPenSize(s)}
                  style={{ width: s * 3 + 4, height: s * 3 + 4 }}
                />
              ))}
            </div>

            {/* Text font size (only when text tool is active) */}
            {tool === 'text' && (
              <>
                <div className="tb-divider-h" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {[12, 18, 24, 32].map(fs => (
                    <button
                      key={fs}
                      onClick={() => setTextFontSize(fs)}
                      style={{
                        width: 34, height: 24,
                        background: textFontSize === fs ? 'rgba(212,168,67,0.12)' : 'transparent',
                        border: `1px solid ${textFontSize === fs ? 'rgba(212,168,67,0.25)' : 'transparent'}`,
                        borderRadius: 5, cursor: 'pointer',
                        fontSize: 8.5, color: textFontSize === fs ? '#d4a843' : 'rgba(180,160,120,0.3)',
                        fontFamily: "'DM Mono', monospace",
                        transition: 'all 0.12s',
                      }}
                    >{fs}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ flex: 1, minHeight: 8 }} />
            <div className="tb-divider-h" />

            {/* Undo */}
            <button title="Undo (⌘Z)" onClick={undo} className="tb-tool-btn">{Icons.undo}</button>
            {/* Clear */}
            <button title="Clear pad" onClick={clearPad} className="tb-tool-btn danger">{Icons.trash}</button>
          </div>

          {/* ── FLOATING COLOR PICKER ── */}
          {showColorPicker && (
            <div
              className="color-picker-float"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="cpf-label">Pen Colors</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                {PEN_COLORS.map(c => (
                  <div
                    key={c.value}
                    className={`cpf-swatch${penColor === c.value ? ' active' : ''}`}
                    title={c.label}
                    style={{ background: c.value }}
                    onClick={() => setPenColor(c.value)}
                  />
                ))}
              </div>
              <div className="cpf-label">Highlights</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {HIGHLIGHT_COLORS.map(c => (
                  <div
                    key={c.value}
                    className={`hl-swatch${penColor === c.value ? ' active' : ''}`}
                    title={c.label}
                    style={{ background: c.value }}
                    onClick={() => { setPenColor(c.value); setTool('highlighter'); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── PAD LIST SIDEBAR ── */}
          {showPadList && (
            <div className="pad-sidebar">
              <div className="pad-sidebar-header">
                <span style={{
                  fontSize: 8.5, color: 'rgba(200,175,130,0.45)',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  fontFamily: "'DM Mono', monospace",
                }}>My Pads</span>
                <button onClick={newPad} className="nav-btn" style={{ padding: '3px 9px', fontSize: 9.5 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {pads.length === 0 && (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(200,175,130,0.3)', fontStyle: 'italic' }}>No pads yet</div>
                    <div style={{ fontSize: 9, color: 'rgba(200,175,130,0.18)', marginTop: 6, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>create one to begin</div>
                  </div>
                )}
                {pads.map(pad => (
                  <div
                    key={pad.id}
                    onClick={() => loadPad(pad.id)}
                    className={`pad-item${pad.id === activePadId ? ' active' : ''}`}
                  >
                    <span style={{ color: pad.id === activePadId ? '#d4a843' : 'rgba(180,160,120,0.25)', flexShrink: 0 }}>
                      {Icons.doc}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontStyle: 'italic',
                        color: pad.id === activePadId ? 'rgba(240,235,225,0.85)' : 'rgba(180,160,120,0.55)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 300,
                      }}>{pad.name}</div>
                      <div style={{ fontSize: 8.5, color: 'rgba(180,160,120,0.2)', marginTop: 2, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>
                        {new Date(pad.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deletePad(pad.id); }}
                      style={{
                        background: 'none', border: 'none', color: 'rgba(180,160,120,0.1)',
                        cursor: 'pointer', padding: '3px', borderRadius: 4,
                        display: 'flex', transition: 'all 0.12s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(200,80,80,0.7)'; (e.currentTarget as HTMLElement).style.background = 'rgba(200,80,80,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(180,160,120,0.1)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
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
        </div>
      </div>

      {/* ── WELCOME MODAL ── */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-card">
            <div className="welcome-title">Writing Pad</div>
            <div className="welcome-subtitle">∞ canvas · distraction-free · cloud-saved</div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { key: 'P', label: 'Pen', desc: 'Freehand drawing with 6 colors and 4 sizes' },
                { key: 'H', label: 'Highlighter', desc: 'Semi-transparent highlights in 4 colors' },
                { key: 'E', label: 'Eraser', desc: 'Circle eraser — size matches your pen size' },
                { key: 'T', label: 'Text', desc: 'Click anywhere to place typed text' },
                { key: 'Space', label: 'Pan', desc: 'Hold Space + drag to pan the infinite canvas' },
                { key: '⌘ Scroll', label: 'Zoom', desc: 'Pinch or Ctrl+scroll to zoom in/out' },
                { key: '⌘Z', label: 'Undo', desc: 'Undo last stroke or text' },
                { key: '⌘S', label: 'Save', desc: 'Auto-saves — manual save also available' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="shortcut-row">
                  <span className="shortcut-key">{key}</span>
                  <div>
                    <span className="shortcut-label">{label}</span>
                    <span className="shortcut-desc">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="welcome-checkbox-row">
              <div
                className={`welcome-checkbox${dontShowAgain ? ' checked' : ''}`}
                onClick={() => setDontShowAgain(p => !p)}
              >
                {dontShowAgain && (
                  <span style={{ fontSize: 10, color: '#0a0a0a', fontWeight: 700, lineHeight: 1 }}>✓</span>
                )}
              </div>
              <span
                onClick={() => setDontShowAgain(p => !p)}
                style={{ fontSize: 11, color: 'rgba(180,160,120,0.3)', cursor: 'pointer', fontStyle: 'italic', userSelect: 'none', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}
              >
                Don't show this again
              </span>
            </div>

            <button className="welcome-start-btn" onClick={dismissWelcome}>
              Begin Writing
            </button>
          </div>
        </div>
      )}
    </>
  );
}
