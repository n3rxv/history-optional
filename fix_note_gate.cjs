const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'app/notes/[slug]/NoteReader.tsx');
let content = fs.readFileSync(FILE, 'utf8');

// ── Step 1: Remove duplicate hook declarations ────────────────────────────────
const DUPE_HOOK = `  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const loginFiredRef = useRef(false);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const loginFiredRef = useRef(false);`;

const SINGLE_HOOK = `  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const loginFiredRef = useRef(false);`;

if (content.includes(DUPE_HOOK)) {
  content = content.replace(DUPE_HOOK, SINGLE_HOOK);
  console.log('✅ Removed duplicate hook declarations');
} else {
  console.log('⏭  Hook duplicate not found, skipping');
}

// ── Step 2: Remove both scroll gate useEffects, replace with nothing ──────────
const SCROLL_GATE = `  // ── SCROLL GATE: show login prompt at 10% scroll for non-logged-in users ──
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

  // ── SCROLL GATE: show login prompt at 10% scroll for non-logged-in users ──
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
  }, [user, authLoading, requireLogin]);`;

if (content.includes(SCROLL_GATE)) {
  content = content.replace(SCROLL_GATE, '');
  console.log('✅ Removed duplicate scroll gate useEffects');
} else {
  // Try removing single one if only one exists
  const SINGLE_GATE = `  // ── SCROLL GATE: show login prompt at 10% scroll for non-logged-in users ──
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
  }, [user, authLoading, requireLogin]);`;
  if (content.includes(SINGLE_GATE)) {
    content = content.replace(SINGLE_GATE, '');
    console.log('✅ Removed single scroll gate useEffect');
  } else {
    console.log('⏭  Scroll gate not found, skipping');
  }
}

// ── Step 3: Replace note content div with content gate ───────────────────────
const OLD_CONTENT = `              <>
                <TableOfContents contentHtml={processedContent} />
                <div
                  ref={noteContentRef}
                  className="note-content"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />
              </>`;

const NEW_CONTENT = `              <>
                <TableOfContents contentHtml={processedContent} />
                <div style={{ position: 'relative' }}>
                  <div
                    ref={noteContentRef}
                    className="note-content"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    style={!user && !authLoading ? {
                      maxHeight: '28vh',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    } : undefined}
                  />
                  {!user && !authLoading && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      paddingBottom: '2.5rem', paddingTop: '6rem',
                      background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 38%)',
                    }}>
                      <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '1.5rem 2rem',
                        textAlign: 'center',
                        maxWidth: 360,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>🔒</div>
                        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                          Sign in to continue reading
                        </div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginBottom: '1.1rem', lineHeight: 1.5 }}>
                          Free account — full notes, highlights & progress tracking.
                        </div>
                        <button
                          onClick={() => requireLogin('Sign in free to read full notes and save your progress.')}
                          style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.55rem 1.5rem',
                            fontFamily: 'var(--font-ui)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          Sign in free →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>`;

if (content.includes(OLD_CONTENT)) {
  content = content.replace(OLD_CONTENT, NEW_CONTENT);
  console.log('✅ Added content gate wall');
} else {
  console.log('⏭  Content area not found or already patched, skipping');
}

fs.writeFileSync(FILE, content, 'utf8');
console.log('\n🎉 Done!');
console.log('\nNow run:');
console.log('  git add "app/notes/[slug]/NoteReader.tsx"');
console.log('  git commit -m "feat: hard content gate on notes at 10% — login wall replaces scroll trigger"');
console.log('  git push');
