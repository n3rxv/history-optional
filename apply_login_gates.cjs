const fs = require('fs');
const path = require('path');

const BASE = process.cwd();
let patchCount = 0;

function patch(relpath, oldStr, newStr, label) {
  const fullPath = path.join(BASE, relpath);
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    console.error(`❌ [${label}] Could not read file: ${fullPath}`);
    process.exit(1);
  }
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    console.log(`⏭  [${label}] Already applied, skipping.`);
    return;
  }
  if (count > 1) {
    console.error(`❌ [${label}] Pattern found ${count} times (expected 1) in ${relpath}`);
    process.exit(1);
  }
  const updated = content.replace(oldStr, newStr);
  fs.writeFileSync(fullPath, updated, 'utf8');
  console.log(`✅ [${label}] Patched ${relpath}`);
  patchCount++;
}

// ── 1. mapping/page.tsx — chapter bar click login gate ──────────────────────
patch(
  'app/mapping/page.tsx',
  `  const toggleChapter = (key: string) => {
    setOpenChapters(prev => {`,
  `  const toggleChapter = (key: string) => {
    if (!requireLogin('Sign in free to browse chapter sites on the map.')) return;
    setOpenChapters(prev => {`,
  'mapping toggleChapter'
);

// ── 2. resources/page.tsx — imports ─────────────────────────────────────────
patch(
  'app/resources/page.tsx',
  `'use client';
import { useState } from 'react';`,
  `'use client';
import { useState } from 'react';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';`,
  'resources imports'
);

// ── 3. resources/page.tsx — hook init ───────────────────────────────────────
patch(
  'app/resources/page.tsx',
  `  const filtered = active === 'All' ? BOOKS : BOOKS.filter(b => b.category === active);

  return (`,
  `  const filtered = active === 'All' ? BOOKS : BOOKS.filter(b => b.category === active);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  return (`,
  'resources hook'
);

// ── 4. resources/page.tsx — Read Free anchor → button ───────────────────────
patch(
  'app/resources/page.tsx',
  `                  {book.archiveUrl && (
                    <a
                      href={book.archiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rbtn"
                      style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: 4,
                        background: meta.color,
                        color: '#0c0c0c',
                        fontSize: '0.67rem', fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        whiteSpace: 'nowrap', flexShrink: 0,
                        letterSpacing: '0.01em',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5a4 4 0 108 0 4 4 0 00-8 0z" stroke="#0c0c0c" strokeWidth="1.1"/>
                        <path d="M3.5 5h3M5 3.5l1.5 1.5L5 6.5" stroke="#0c0c0c" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Read Free
                    </a>
                  )}`,
  `                  {book.archiveUrl && (
                    <button
                      onClick={() => { if (requireLogin('Sign in free to access book links.')) window.open(book.archiveUrl, '_blank', 'noopener,noreferrer'); }}
                      className="rbtn"
                      style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: 4,
                        background: meta.color,
                        color: '#0c0c0c',
                        fontSize: '0.67rem', fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        whiteSpace: 'nowrap', flexShrink: 0,
                        letterSpacing: '0.01em',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5a4 4 0 108 0 4 4 0 00-8 0z" stroke="#0c0c0c" strokeWidth="1.1"/>
                        <path d="M3.5 5h3M5 3.5l1.5 1.5L5 6.5" stroke="#0c0c0c" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Read Free
                    </button>
                  )}`,
  'resources Read Free button'
);

// ── 5. resources/page.tsx — LoginPromptModal render ─────────────────────────
patch(
  'app/resources/page.tsx',
  `    </main>
  );
}`,
  `    </main>
    <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
  );
}`,
  'resources modal render'
);

// ── 6. NoteReader.tsx — imports ──────────────────────────────────────────────
patch(
  'app/notes/[slug]/NoteReader.tsx',
  `import { useNoteSearch } from '@/hooks/useNoteSearch';`,
  `import { useNoteSearch } from '@/hooks/useNoteSearch';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';`,
  'NoteReader imports'
);

// ── 7. NoteReader.tsx — hook + ref ───────────────────────────────────────────
patch(
  'app/notes/[slug]/NoteReader.tsx',
  `  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);`,
  `  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const loginFiredRef = useRef(false);`,
  'NoteReader hook'
);

// ── 8. NoteReader.tsx — scroll gate useEffect ────────────────────────────────
patch(
  'app/notes/[slug]/NoteReader.tsx',
  `  // Admin setup
  useEffect(() => {
    setIsAdmin(!!sessionStorage.getItem(SESSION_KEY));
  }, []);`,
  `  // ── SCROLL GATE: show login prompt at 10% scroll for non-logged-in users ──
  useEffect(() => {
    if (user || authLoading) return;
    const onScroll = () => {
      if (loginFiredRef.current) return;
      const el = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      if (pct >= 0.1) {
        loginFiredRef.current = true;
        requireLogin('Sign in free to read full notes and save your progress.');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [user, authLoading, requireLogin]);

  // Admin setup
  useEffect(() => {
    setIsAdmin(!!sessionStorage.getItem(SESSION_KEY));
  }, []);`,
  'NoteReader scroll gate'
);

// ── 9. NoteReader.tsx — LoginPromptModal render ──────────────────────────────
patch(
  'app/notes/[slug]/NoteReader.tsx',
  `        </button>
      )}
    </div>
  );
}`,
  `        </button>
      )}
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}`,
  'NoteReader modal render'
);

console.log(`\n🎉 Done! ${patchCount} patch(es) applied.`);
console.log('\nNow run:');
console.log('  git add app/mapping/page.tsx app/resources/page.tsx "app/notes/[slug]/NoteReader.tsx"');
console.log('  git commit -m "feat: login gate on chapter toggle, Read Free, notes scroll 10%"');
console.log('  git push');
