'use client';

import { useState } from 'react';
import NoteAnnotationCanvas from './NoteAnnotationCanvas';

interface Props {
  noteSlug: string;
}

export default function AnnotationToggle({ noteSlug }: Props) {
  const [active, setActive] = useState(false);

  return (
    <>
      <NoteAnnotationCanvas
        noteSlug={noteSlug}
        active={active}
        onToggle={() => setActive(false)}
      />
      <button
        onClick={() => setActive(a => !a)}
        title={active ? 'Exit drawing mode' : 'Draw / annotate'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
          background: active ? 'var(--warning-wash)' : 'var(--bg3)',
          border: active ? '1px solid color-mix(in srgb, var(--warning-text) 50%, transparent)' : '1px solid var(--border2)',
          color: active ? 'var(--warning-text)' : 'var(--text2)',
          fontSize: '0.8rem', fontFamily: 'var(--font-ui)',
          fontWeight: active ? 600 : 400,
          transition: 'all 0.15s',
        }}
      >
        ✏️ {active ? 'Drawing' : 'Annotate'}
      </button>
    </>
  );
}
