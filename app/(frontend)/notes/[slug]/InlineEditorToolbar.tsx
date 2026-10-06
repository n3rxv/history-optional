'use client';

/**
 * The admin's formatting bar over a note being edited in place. execCommand
 * is deprecated but still the only thing every browser runs on a plain
 * contentEditable; the editor is one admin's tool, not worth a library.
 *
 * Buttons act on mousedown with the default prevented, so the selection in
 * the note survives the click.
 */

type Cmd = (command: string, value?: string) => void;

function IconBtn({ title, onClick, children, danger }: { title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" className={`ied-btn${danger ? ' danger' : ''}`} title={title} aria-label={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}>
      {children}
    </button>
  );
}

function Swatch({ color, title, onClick }: { color: string; title: string; onClick: () => void }) {
  return (
    <button type="button" className="ied-swatch" title={title} aria-label={title} style={{ background: color }}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} />
  );
}

const Rule = () => <span className="ied-rule" aria-hidden="true" />;

const ink = ['var(--text)', 'var(--warning-text)', 'var(--accent)', 'var(--success-text)', 'var(--danger-text)'];
const wash = ['--warning-text', '--accent', '--success-text', '--danger-text'].map((v) => `color-mix(in srgb, var(${v}) 40%, transparent)`);

export default function InlineEditorToolbar({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) {
  const cmd: Cmd = (command, value) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };
  const ask = (label: string, command: string) => {
    const url = prompt(label);
    if (url) cmd(command, url);
  };
  const insertTable = () => {
    const cell = '<td style="border:1px solid var(--border2);padding:8px">&nbsp;</td>';
    const row = `<tr>${cell}${cell}${cell}</tr>`;
    cmd('insertHTML', `<table style="border-collapse:collapse;width:100%;margin:1rem 0">${row}${row}</table>`);
  };

  return (
    <div className="ied" role="toolbar" aria-label="Formatting">
      <style>{IED_CSS}</style>
      <IconBtn title="Undo" onClick={() => cmd('undo')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></svg>
      </IconBtn>
      <IconBtn title="Redo" onClick={() => cmd('redo')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 15-6.7L21 13" /></svg>
      </IconBtn>
      <Rule />
      <select className="ied-select" defaultValue="" aria-label="Block style" onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => { cmd('formatBlock', e.target.value); e.target.value = ''; }}>
        <option value="" disabled>Style</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="p">Paragraph</option>
        <option value="blockquote">Quote</option>
        <option value="pre">Code</option>
      </select>
      <select className="ied-select" defaultValue="" aria-label="Text size" onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => { cmd('fontSize', e.target.value); e.target.value = ''; }}>
        <option value="" disabled>Size</option>
        {[['1', '10'], ['2', '13'], ['3', '16'], ['4', '18'], ['5', '24'], ['6', '32'], ['7', '48']].map(([v, px]) => <option key={v} value={v}>{px}</option>)}
      </select>
      <Rule />
      <IconBtn title="Bold" onClick={() => cmd('bold')}><b>B</b></IconBtn>
      <IconBtn title="Italic" onClick={() => cmd('italic')}><i>I</i></IconBtn>
      <IconBtn title="Underline" onClick={() => cmd('underline')}><u>U</u></IconBtn>
      <IconBtn title="Strikethrough" onClick={() => cmd('strikeThrough')}><s>S</s></IconBtn>
      <IconBtn title="Superscript" onClick={() => cmd('superscript')}><span>x<sup>2</sup></span></IconBtn>
      <IconBtn title="Subscript" onClick={() => cmd('subscript')}><span>x<sub>2</sub></span></IconBtn>
      <Rule />
      <IconBtn title="Bullet list" onClick={() => cmd('insertUnorderedList')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
      </IconBtn>
      <IconBtn title="Numbered list" onClick={() => cmd('insertOrderedList')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
      </IconBtn>
      <IconBtn title="Indent" onClick={() => cmd('indent')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M9 12h12M9 18h12M3 9l3 3-3 3" /></svg>
      </IconBtn>
      <IconBtn title="Outdent" onClick={() => cmd('outdent')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M9 12h12M9 18h12M7 9l-3 3 3 3" /></svg>
      </IconBtn>
      <Rule />
      <IconBtn title="Insert link" onClick={() => ask('Link address:', 'createLink')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
      </IconBtn>
      <IconBtn title="Insert image" onClick={() => ask('Image address:', 'insertImage')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
      </IconBtn>
      <IconBtn title="Insert table" onClick={insertTable}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M12 3v18" /></svg>
      </IconBtn>
      <IconBtn title="Divider line" onClick={() => cmd('insertHorizontalRule')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M3 12h18" /></svg>
      </IconBtn>
      <Rule />
      <span className="ied-label">Text</span>
      {ink.map((c) => <Swatch key={c} color={c} title="Text colour" onClick={() => cmd('foreColor', c)} />)}
      <Rule />
      <span className="ied-label">Mark</span>
      {wash.map((c) => <Swatch key={c} color={c} title="Background colour" onClick={() => cmd('hiliteColor', c)} />)}
      <Rule />
      <IconBtn title="Clear formatting" danger onClick={() => cmd('removeFormat')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5h14v2M11 5l-3 14M7 19h6M3 3l18 18" /></svg>
      </IconBtn>
      <IconBtn title="Remove link" danger onClick={() => cmd('unlink')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /><path d="M3 3l18 18" /></svg>
      </IconBtn>
    </div>
  );
}

const IED_CSS = `
.ied { position: sticky; top: 64px; z-index: 60; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 6px 8px; margin-bottom: var(--space-4); background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-lg); box-shadow: var(--elev-2); }
.ied-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: var(--radius-md); background: none; color: var(--text2); font-size: 0.9rem; cursor: pointer; }
.ied-btn:hover { background: var(--ds-soft); color: var(--text); }
.ied-btn.danger:hover { color: var(--danger-text); }
.ied-btn sup, .ied-btn sub { font-size: 0.6em; }
.ied-select { height: 30px; padding: 0 6px; border: 1px solid var(--border2); border-radius: var(--radius-md); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.8rem; cursor: pointer; }
.ied-rule { width: 1px; height: 20px; margin: 0 4px; background: var(--border2); }
.ied-label { font-size: 0.72rem; font-weight: 600; color: var(--text3); margin: 0 2px; }
.ied-swatch { width: 18px; height: 18px; margin: 0 1px; border-radius: 50%; border: 1px solid var(--border2); cursor: pointer; }
.ied-swatch:hover { transform: scale(1.15); }
`;
