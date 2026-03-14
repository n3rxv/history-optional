'use client';

import { useState } from 'react';
import NoteAnnotationCanvas from './NoteAnnotationCanvas';

interface Props {
  noteSlug: string;
  userId?: string | null; // passed from NoteReader
}

export default function AnnotationToggle({ noteSlug, userId }: Props) {
  const [active, setActive] = useState(false);

  return (
    <>
      <NoteAnnotationCanvas
        noteSlug={noteSlug}
        active={active}
        onToggle={() => setActive(false)}
        userId={userId}
      />
      <button
        onClick={() => setActive(a => !a)}
        title={active ? 'Exit drawing mode' : 'Draw / annotate'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
          background: active ? 'rgba(212,168,67,0.2)' : 'var(--bg3)',
          border: active ? '1px solid rgba(212,168,67,0.5)' : '1px solid var(--border2)',
          color: active ? '#d4a843' : 'var(--text2)',
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
