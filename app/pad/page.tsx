'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ── Supabase (reuse env vars already in the project) ─────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────
type Tool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'select';
type PenColor = string;

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
  canvasWidth: number;
  canvasHeight: number;
}

interface PadRecord {
  id: string;
  name: string;
  updated_at: string;
  data: PadData;
}

// ── Constants ─────────────────────────────────────────────────────
const PEN_COLORS: { label: string; value: string }[] = [
  { label: 'White', value: '#ffffff' },
  { label: 'Blue', value: '#1e40af' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Orange', value: '#ea580c' },
];

const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
];

const FONT_FAMILIES = ['Courier New', 'Georgia', 'Arial', 'Times New Roman'];

// ── Canvas size — effectively infinite via scroll ─────────────────
const CANVAS_W = 6000;
const CANVAS_H = 8000;
const GRID_SIZE = 28; // dot grid spacing

// ── Unique ID ─────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

// ─────────────────────────────────────────────────────────────────
export default function PadPage() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const overlayRef    = useRef<HTMLCanvasElement>(null); // live stroke preview
  const scrollRef     = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  const [tool, setTool]           = useState<Tool>('pen');
  const [penColor, setPenColor]   = useState('#ffffff');
  const [penSize, setPenSize]     = useState(2);
  const [zoom, setZoom]           = useState(1);
  const [pads, setPads]           = useState<PadRecord[]>([]);
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [padName, setPadName]     = useState('Untitled Pad');
  const [saving, setSaving]       = useState(false);
  const [showPadList, setShowPadList] = useState(false);
  const [editingText, setEditingText] = useState<{ x: number; y: number; id?: string } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textFontSize, setTextFontSize] = useState(18);
  const [textFont, setTextFont]   = useState('Courier New');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // In-memory pad data
  const padDataRef = useRef<PadData>({
    strokes: [],
    textBoxes: [],
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
  });

  // Active stroke being drawn
  const activeStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef    = useRef(false);

  // ── Draw everything to main canvas ────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Dot grid background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#222222';
    for (let x = GRID_SIZE; x < CANVAS_W; x += GRID_SIZE) {
      for (let y = GRID_SIZE; y < CANVAS_H; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render all strokes
    for (const stroke of padDataRef.current.strokes) {
      drawStroke(ctx, stroke);
    }

    // Render all text boxes
    for (const tb of padDataRef.current.textBoxes) {
      ctx.font = `${tb.fontSize}px ${tb.fontFamily}`;
      ctx.fillStyle = tb.color;
      ctx.globalAlpha = 1;
      const lines = tb.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, tb.x, tb.y + i * (tb.fontSize * 1.35));
      });
    }
  }, []);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha   = stroke.opacity;
    ctx.strokeStyle   = stroke.color;
    ctx.lineWidth     = stroke.size;
    ctx.lineCap       = 'round';
    ctx.lineJoin      = 'round';
    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i+1].x) / 2;
      const my = (stroke.points[i].y + stroke.points[i+1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  // ── Pointer events ────────────────────────────────────────────
  function getCanvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = overlayRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top)  / zoom,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === 'text') {
      const pos = getCanvasPos(e);
      setEditingText({ x: pos.x, y: pos.y });
      setTextInput('');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const pos = getCanvasPos(e);
    const pressure = (e as any).pressure ?? 0.5;

    const isHighlight = tool === 'highlighter';
    const color = isHighlight
      ? (HIGHLIGHT_COLORS.find(c => c.value === penColor)?.value ?? '#fef08a')
      : (tool === 'eraser' ? '#000000' : penColor);

    activeStrokeRef.current = {
      id: uid(),
      tool,
      color,
      size: tool === 'eraser' ? penSize * 8 : tool === 'highlighter' ? penSize * 6 : penSize,
      opacity: isHighlight ? 0.4 : 1,
      points: [{ x: pos.x, y: pos.y, pressure }],
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const pos      = getCanvasPos(e);
    const pressure = (e as any).pressure ?? 0.5;
    activeStrokeRef.current.points.push({ x: pos.x, y: pos.y, pressure });

    // Draw live preview on overlay canvas
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawStroke(ctx, activeStrokeRef.current);
  }

  function onPointerUp() {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;

    // Commit stroke to main canvas
    padDataRef.current.strokes.push({ ...activeStrokeRef.current });
    activeStrokeRef.current = null;

    // Clear overlay
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
    }

    redraw();
    debouncedSave();
  }

  // ── Text tool ─────────────────────────────────────────────────
  function commitText() {
    if (!editingText || !textInput.trim()) { setEditingText(null); return; }
    const tb: TextBox = {
      id: uid(),
      x: editingText.x,
      y: editingText.y,
      text: textInput,
      color: penColor,
      fontSize: textFontSize,
      fontFamily: textFont,
    };
    padDataRef.current.textBoxes.push(tb);
    setEditingText(null);
    setTextInput('');
    redraw();
    debouncedSave();
  }

  // ── Undo ──────────────────────────────────────────────────────
  function undo() {
    if (padDataRef.current.strokes.length > 0) {
      padDataRef.current.strokes.pop();
    } else if (padDataRef.current.textBoxes.length > 0) {
      padDataRef.current.textBoxes.pop();
    }
    redraw();
    debouncedSave();
  }

  // ── Clear ─────────────────────────────────────────────────────
  function clearPad() {
    if (!confirm('Clear all content on this pad?')) return;
    padDataRef.current.strokes   = [];
    padDataRef.current.textBoxes = [];
    redraw();
    debouncedSave();
  }

  // ── Save to Supabase ──────────────────────────────────────────
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function debouncedSave() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToDb(), 1500);
  }

  async function saveToDb() {
    setSaving(true);
    const data = { ...padDataRef.current };
    if (activePadId) {
      await supabase
        .from('writing_pads')
        .update({ data, name: padName, updated_at: new Date().toISOString() })
        .eq('id', activePadId);
    } else {
      const { data: row } = await supabase
        .from('writing_pads')
        .insert({ name: padName, data })
        .select()
        .single();
      if (row) setActivePadId(row.id);
    }
    setSaving(false);
    loadPadList();
  }

  // ── Load pad list ─────────────────────────────────────────────
  async function loadPadList() {
    const { data } = await supabase
      .from('writing_pads')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false });
    if (data) setPads(data as PadRecord[]);
  }

  async function loadPad(id: string) {
    const { data } = await supabase
      .from('writing_pads')
      .select('*')
      .eq('id', id)
      .single();
    if (!data) return;
    setActivePadId(data.id);
    setPadName(data.name);
    padDataRef.current = data.data as PadData;
    redraw();
    setShowPadList(false);
  }

  async function newPad() {
    setActivePadId(null);
    setPadName('Untitled Pad');
    padDataRef.current = { strokes: [], textBoxes: [], canvasWidth: CANVAS_W, canvasHeight: CANVAS_H };
    redraw();
    setShowPadList(false);
  }

  async function deletePad(id: string) {
    if (!confirm('Delete this pad?')) return;
    await supabase.from('writing_pads').delete().eq('id', id);
    if (activePadId === id) newPad();
    loadPadList();
  }

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    redraw();
    loadPadList();
  }, [redraw]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveToDb(); }
      if (e.key === 'p') setTool('pen');
      if (e.key === 'h') setTool('highlighter');
      if (e.key === 'e') setTool('eraser');
      if (e.key === 't') setTool('text');
      if (e.key === 'Escape') setEditingText(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────
  function handleZoom(e: WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleZoom, { passive: false });
    return () => el.removeEventListener('wheel', handleZoom);
  }, []);

  const cursorMap: Record<Tool, string> = {
    pen: 'crosshair',
    highlighter: 'cell',
    eraser: 'cell',
    text: 'text',
    select: 'default',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d0d', color: '#f0ede8', fontFamily: "'Courier New', monospace" }}>

      {/* ── TOP NAV ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', height: 52, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: '#0d0d0d' }}>
        <Link href="/" style={{ fontSize: 12, color: '#888', letterSpacing: '0.06em', textDecoration: 'none' }}>← Home</Link>
        <span style={{ color: '#333', fontSize: 10 }}>|</span>

        {/* Pad name */}
        <input
          value={padName}
          onChange={e => setPadName(e.target.value)}
          onBlur={saveToDb}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#f0ede8', fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', minWidth: 160 }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {saving && <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>SAVING…</span>}
          <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={navBtnStyle}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={navBtnStyle}>−</button>
          <button onClick={() => setZoom(1)} style={navBtnStyle}>100%</button>
          <button onClick={() => setZoom(0.6)} style={navBtnStyle}>Fit</button>
          <button onClick={() => setShowPadList(p => !p)} style={{ ...navBtnStyle, background: showPadList ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            All Pads
          </button>
          <button onClick={newPad} style={{ ...navBtnStyle, borderColor: 'rgba(255,255,255,0.2)', color: '#f0ede8' }}>
            + New
          </button>
          <button onClick={saveToDb} style={{ ...navBtnStyle, background: '#f0ede8', color: '#0d0d0d', borderColor: '#f0ede8' }}>
            Save
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── TOOLBAR ── */}
        <div style={{ width: 56, background: '#111', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 4, flexShrink: 0, overflowY: 'auto' }}>

          {/* Tools */}
          {([
            { t: 'pen',         icon: '✒️', label: 'Pen (P)' },
            { t: 'highlighter', icon: '🖊️', label: 'Highlight (H)' },
            { t: 'eraser',      icon: '⬜', label: 'Eraser (E)' },
            { t: 'text',        icon: 'T',  label: 'Text (T)' },
          ] as const).map(({ t, icon, label }) => (
            <button
              key={t}
              title={label}
              onClick={() => setTool(t)}
              style={{
                ...toolBtnStyle,
                background: tool === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: tool === t ? '#f0ede8' : '#666',
                fontFamily: t === 'text' ? "'Courier New', monospace" : undefined,
                fontWeight: t === 'text' ? 700 : undefined,
              }}
            >
              {icon}
            </button>
          ))}

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

          {/* Color swatch */}
          <button
            title="Color"
            onClick={() => setShowColorPicker(p => !p)}
            style={{ ...toolBtnStyle, position: 'relative' }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 3, background: penColor, border: '1px solid rgba(255,255,255,0.3)' }} />
          </button>

          {/* Color picker popup */}
          {showColorPicker && (
            <div style={{ position: 'absolute', left: 64, top: 200, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, zIndex: 200, width: 180 }}>
              <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', marginBottom: 8 }}>PEN</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PEN_COLORS.map(c => (
                  <button key={c.value} title={c.label} onClick={() => { setPenColor(c.value); setShowColorPicker(false); }}
                    style={{ width: 24, height: 24, borderRadius: 4, background: c.value, border: penColor === c.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', margin: '10px 0 8px' }}>HIGHLIGHT</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {HIGHLIGHT_COLORS.map(c => (
                  <button key={c.value} title={c.label} onClick={() => { setPenColor(c.value); setTool('highlighter'); setShowColorPicker(false); }}
                    style={{ width: 24, height: 24, borderRadius: 4, background: c.value, border: penColor === c.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

          {/* Size */}
          {[1, 2, 4, 8].map(s => (
            <button key={s} title={`Size ${s}`} onClick={() => setPenSize(s)}
              style={{ ...toolBtnStyle, background: penSize === s ? 'rgba(255,255,255,0.12)' : 'transparent' }}>
              <div style={{ width: s * 2.5 + 2, height: s * 2.5 + 2, borderRadius: '50%', background: '#f0ede8', maxWidth: 20, maxHeight: 20 }} />
            </button>
          ))}

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

          {/* Text options (show when text tool active) */}
          {tool === 'text' && (
            <>
              {[14, 18, 24, 32].map(fs => (
                <button key={fs} title={`${fs}px`} onClick={() => setTextFontSize(fs)}
                  style={{ ...toolBtnStyle, fontSize: 9, color: textFontSize === fs ? '#f0ede8' : '#555', background: textFontSize === fs ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                  {fs}
                </button>
              ))}
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* Undo */}
          <button title="Undo (⌘Z)" onClick={undo} style={{ ...toolBtnStyle, fontSize: 14 }}>↩</button>
          {/* Clear */}
          <button title="Clear pad" onClick={clearPad} style={{ ...toolBtnStyle, fontSize: 14, color: '#e84444' }}>🗑</button>
        </div>

        {/* ── PAD LIST SIDEBAR ── */}
        {showPadList && (
          <div style={{ width: 220, background: '#111', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px 10px', fontSize: 10, color: '#555', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              MY PADS
              <button onClick={newPad} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f0ede8', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>+ New</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {pads.length === 0 && <div style={{ padding: '20px 16px', fontSize: 12, color: '#555', textAlign: 'center' }}>No pads yet</div>}
              {pads.map(pad => (
                <div key={pad.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: pad.id === activePadId ? 'rgba(255,255,255,0.06)' : 'transparent', borderLeft: pad.id === activePadId ? '2px solid #f0ede8' : '2px solid transparent' }}
                  onClick={() => loadPad(pad.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#f0ede8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pad.name}</div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{new Date(pad.updated_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deletePad(pad.id); }}
                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '2px 4px', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CANVAS SCROLL AREA ── */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflow: 'auto', background: '#1a1a1a', cursor: cursorMap[tool] }}
          onClick={() => setShowColorPicker(false)}
        >
          <div style={{ display: 'inline-block', transformOrigin: '0 0', transform: `scale(${zoom})`, margin: 20 }}>
            <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>

              {/* Main canvas — persisted strokes */}
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
              />

              {/* Overlay canvas — live stroke preview */}
              <canvas
                ref={overlayRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />

              {/* Text input box */}
              {editingText && (
                <div style={{ position: 'absolute', top: editingText.y, left: editingText.x, zIndex: 10 }}>
                  <textarea
                    ref={textareaRef}
                    autoFocus
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onBlur={commitText}
                    onKeyDown={e => { if (e.key === 'Escape') setEditingText(null); if (e.key === 'Enter' && e.shiftKey) commitText(); }}
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1.5px dashed #1e40af',
                      borderRadius: 3,
                      outline: 'none',
                      padding: '4px 8px',
                      fontFamily: textFont,
                      fontSize: textFontSize,
                      color: penColor,
                      minWidth: 120,
                      minHeight: 40,
                      resize: 'both',
                      lineHeight: 1.4,
                    }}
                    placeholder="Type… (Shift+Enter to place)"
                  />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 3, display: 'inline-block' }}>
                    Shift+Enter to place · Esc to cancel
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KEYBOARD SHORTCUTS HINT ── */}
      <div style={{ height: 26, background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, flexShrink: 0 }}>
        {[['P','Pen'],['H','Highlight'],['E','Eraser'],['T','Text'],['⌘Z','Undo'],['⌘S','Save'],['⌘ Scroll','Zoom']].map(([k,v]) => (
          <span key={k} style={{ fontSize: 10, color: '#444' }}>
            <span style={{ color: '#666', fontFamily: "'Courier New', monospace" }}>{k}</span>
            <span style={{ marginLeft: 4 }}>{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#888',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: "'Courier New', monospace",
  letterSpacing: '0.05em',
  padding: '4px 10px',
  transition: 'color 0.15s, border-color 0.15s',
};

const toolBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
  fontSize: 18,
  transition: 'background 0.15s, color 0.15s',
};
