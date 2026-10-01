'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { pyqs, type PYQ } from '@/lib/pyqData';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';
import TopperPdf from '@/components/TopperPdf';
import TopperLocked from '@/components/TopperLocked';
import LoginPromptModal from '@/components/LoginPromptModal';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';

type Copy = { id: string; question: string; note: string | null };
type Side = 'a' | 'b';
type Picks = Record<Side, string>;

/** Matches the allowance in /api/topper-copies/[id]. */
const FREE_VIEWS = 5;

/** "Vikram Grewal" from "Vikram Grewal, AIR-51, 2018". */
const topperOf = (c: Copy) => (c.note ?? '').split(',')[0].trim();

/**
 * The pair to open with: whatever the URL names (?a=&b=), so a refresh or
 * Back keeps the comparison, and otherwise the first copy beside the first
 * one by a different topper. Two copies by the same person compare little.
 */
function initialPicks(copies: Copy[]): Picks {
  const ids = new Set(copies.map(c => c.id));
  const p = new URLSearchParams(window.location.search);
  const first = copies[0];
  const other = copies.find(c => c.id !== first.id && topperOf(c) !== topperOf(first)) ?? copies[1];
  const a = ids.has(p.get('a') ?? '') ? p.get('a')! : first.id;
  const wantB = p.get('b') ?? '';
  const b = ids.has(wantB) && wantB !== a ? wantB : (other.id !== a ? other.id : first.id);
  return { a, b };
}

function writeUrl(picks: Picks) {
  const p = new URLSearchParams(window.location.search);
  p.set('a', picks.a);
  p.set('b', picks.b);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
}

/**
 * Two topper copies of one PYQ, side by side, so a reader can see how
 * different toppers built the same answer. On a phone the two stack behind
 * a switcher, since two booklets will not fit across a phone.
 *
 * Each copy opened costs a free reader one of their free views, exactly as
 * opening it in the viewer does: the copy endpoint counts it, once.
 */
export default function ComparePage() {
  const { id } = useParams<{ id: string }>();
  const pyq = pyqs.find((q: PYQ) => q.id === parseInt(id));

  const [copies, setCopies] = useState<Copy[] | null>(null);
  const [picks, setPicks] = useState<Picks | null>(null);
  const [access, setAccess] = useState<'checking' | 'signed-out' | 'locked' | 'open'>('checking');
  /** Free views left when the page opened; null for unlimited. */
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  const [opened, setOpened] = useState(0);
  const [denied, setDenied] = useState<Record<Side, boolean>>({ a: false, b: false });
  // Bumped after a purchase, so the panes that were refused ask again.
  const [epoch, setEpoch] = useState(0);
  const [active, setActive] = useState<Side>('a');
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  useEffect(() => {
    if (!pyq) return;
    fetch(`/api/topper-copies?pyq_id=${pyq.id}`)
      .then(r => r.json())
      .then(d => {
        const list: Copy[] = d.data ?? [];
        setCopies(list);
        if (list.length >= 2) {
          const first = initialPicks(list);
          setPicks(first);
          writeUrl(first);
        }
      })
      .catch(() => setCopies([]));
  }, [pyq]);

  // Kept subscribed, so logging in from this page opens the comparison.
  useEffect(() => auth.onAuthStateChanged(async user => {
    if (!user) { setAccess('signed-out'); return; }
    const token = await user.getIdToken();
    const data = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then(r => r.json());
    if (!data.access) { setAccess('locked'); return; }
    setFreeLeft(data.isPremium || data.hasTopperAccess ? null : Math.max(0, FREE_VIEWS - (data.clicks ?? 0)));
    setAccess('open');
  }), []);

  const choose = (side: Side, copyId: string) => {
    if (!picks) return;
    const next = { ...picks, [side]: copyId };
    setPicks(next);
    setDenied(d => ({ ...d, [side]: false }));
    writeUrl(next);
  };

  const unlocked = () => {
    setFreeLeft(null);
    setDenied({ a: false, b: false });
    setAccess('open');
    setEpoch(e => e + 1);
  };

  if (!pyq) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text3)' }}>
      Question not found. <Link href="/pyqs" style={{ color: 'var(--accent)' }}>&#8592; Back to PYQs</Link>
    </div>
  );

  const byId = new Map((copies ?? []).map(c => [c.id, c]));
  const sameNote = (c: Copy) => (copies ?? []).filter(x => x.note === c.note).length > 1;
  const label = (c: Copy) => `${c.note ?? 'Topper copy'}${sameNote(c) ? ` · ${c.question.slice(0, 48)}…` : ''}`;

  const pane = (side: Side) => {
    const copyId = picks![side];
    const copy = byId.get(copyId);
    const otherId = picks![side === 'a' ? 'b' : 'a'];
    return (
      <div key={side} className="cmp-pane" data-active={active === side} style={{ minWidth: 0 }}>
        <select
          value={copyId}
          onChange={e => choose(side, e.target.value)}
          aria-label={side === 'a' ? 'First copy' : 'Second copy'}
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)',
            fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginBottom: 'var(--space-2)',
          }}
        >
          {(copies ?? []).map(c => (
            <option key={c.id} value={c.id} disabled={c.id === otherId}>{label(c)}</option>
          ))}
        </select>
        {copy && (
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', lineHeight: 1.5, margin: '0 0 var(--space-3)' }}>
            {copy.question}
          </p>
        )}
        {denied[side] ? (
          <TopperLocked onUnlocked={unlocked} message="Your free topper-copy views are used up. Unlock to open this one." />
        ) : (
          <TopperPdf
            key={`${copyId}:${epoch}`}
            copyId={copyId}
            height="calc(100vh - 300px)"
            onLoad={() => { if (freeLeft !== null) setOpened(n => n + 1); }}
            onDenied={() => setDenied(d => ({ ...d, [side]: true }))}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'var(--space-6) var(--space-4) var(--space-12)' }}>
      <style>{`
        .cmp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
        .cmp-tabs { display: none; }
        @media (max-width: 768px) {
          .cmp-grid { display: block; }
          .cmp-pane[data-active="false"] { display: none; }
          .cmp-tabs { display: flex; }
        }
      `}</style>

      <Link href={`/pyqs/${pyq.id}`} style={{ color: 'var(--text3)', fontSize: '0.85rem', textDecoration: 'none' }}>
        &#8592; Back to the question
      </Link>
      <div style={{ margin: 'var(--space-4) 0 var(--space-6)' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 'var(--space-2)',
        }}>Compare topper copies · {pyq.year} · {pyq.marks}M</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          {pyq.question}
        </h1>
      </div>

      {(access === 'checking' || copies === null) && <OwlLoader label="Loading topper copies" />}

      {copies !== null && copies.length < 2 && (
        <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>
          This question has {copies.length === 1 ? 'only one topper copy' : 'no topper copies'} yet, so there is nothing to compare.
        </p>
      )}

      {access === 'signed-out' && copies !== null && copies.length >= 2 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4)' }}>
          <p style={{ color: 'var(--text2)', marginBottom: 'var(--space-4)' }}>Log in to compare topper copies.</p>
          <button
            onClick={() => requireLogin('Log in to compare topper copies')}
            style={{
              background: 'var(--accent)', color: 'var(--accent-on)', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-6)', fontSize: '0.9rem',
            }}
          >Log in</button>
        </div>
      )}

      {access === 'locked' && copies !== null && copies.length >= 2 && <TopperLocked onUnlocked={unlocked} />}

      {access === 'open' && picks && (
        <>
          {freeLeft !== null && (
            <p style={{
              color: 'var(--text2)', fontSize: '0.8rem', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', margin: '0 0 var(--space-4)',
            }}>
              Free preview: each copy you open here uses one of your {FREE_VIEWS} free topper-copy views ·{' '}
              <strong>{Math.max(0, freeLeft - opened)} left</strong>
            </p>
          )}
          <div className="cmp-tabs" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {(['a', 'b'] as Side[]).map(side => {
              const c = byId.get(picks[side]);
              const on = active === side;
              return (
                <button key={side} onClick={() => setActive(side)} aria-pressed={on} style={{
                  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: on ? 'var(--accent-dim)' : 'var(--bg2)',
                  border: on ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: on ? 'var(--accent)' : 'var(--text2)',
                  borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)',
                  fontSize: '0.8rem', fontWeight: on ? 600 : 400, cursor: 'pointer',
                }}>{c ? topperOf(c) || 'Topper copy' : ''}</button>
              );
            })}
          </div>
          <div className="cmp-grid">
            {pane('a')}
            {pane('b')}
          </div>
        </>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}
