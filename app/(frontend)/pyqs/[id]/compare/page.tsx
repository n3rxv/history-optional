'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { pyqs, type PYQ } from '@/lib/pyqData';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';
import TopperPdf from '@/components/TopperPdf';
import TopperLocked from '@/components/TopperLocked';
import CompareIcon from '@/components/CompareIcon';
import LoginPromptModal from '@/components/LoginPromptModal';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';

type Copy = { id: string; question: string; note: string | null };
type Side = 'a' | 'b';
type Picks = Record<Side, string>;

/** Matches the allowance in /api/topper-copies/[id]. */
const FREE_VIEWS = 5;

/** Each side keeps one colour throughout: its badge, avatar and tab. */
const TONE: Record<Side, string> = { a: 'var(--accent)', b: 'var(--premium-text)' };
const wash = (side: Side, pct = 12) => `color-mix(in srgb, ${TONE[side]} ${pct}%, transparent)`;

/** "Vikram Grewal, AIR-51, 2018" as its parts. */
function parseNote(note: string | null) {
  const parts = (note ?? '').split(',').map(s => s.trim()).filter(Boolean);
  return {
    name: parts[0] || 'Topper copy',
    rank: parts.find(p => /^AIR/i.test(p))?.replace(/^AIR[\s-]*/i, 'AIR '),
    year: parts.find(p => /^\d{4}$/.test(p)),
  };
}
const topperOf = (c: Copy) => parseNote(c.note).name;
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/**
 * The pair to open with: whatever the URL names (?a=&b=), so a refresh or
 * Back keeps the comparison. Without a b, the a copy (or the first) goes
 * beside the first one by a different topper: two copies by the same person
 * compare little. The Topper Copies page links here with only an a.
 */
function initialPicks(copies: Copy[]): Picks {
  const byId = new Map(copies.map(c => [c.id, c]));
  const p = new URLSearchParams(window.location.search);
  const a = byId.get(p.get('a') ?? '') ?? copies[0];
  const b = byId.get(p.get('b') ?? '');
  if (b && b.id !== a.id) return { a: a.id, b: b.id };
  const other = copies.find(c => c.id !== a.id && topperOf(c) !== topperOf(a)) ?? copies.find(c => c.id !== a.id)!;
  return { a: a.id, b: other.id };
}

function writeUrl(picks: Picks) {
  const p = new URLSearchParams(window.location.search);
  p.set('a', picks.a);
  p.set('b', picks.b);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
}

function Avatar({ name, side, size = 40 }: { name: string; side: Side; size?: number }) {
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: 'var(--radius-circle)', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: wash(side), color: TONE[side], border: `1px solid ${wash(side, 30)}`,
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size * 0.38,
    }}>{initials(name)}</span>
  );
}

/**
 * Two topper copies of one PYQ, side by side, so a reader can see how
 * different toppers built the same answer. On a phone the two stack behind
 * a switcher, since two booklets will not fit across a phone.
 *
 * Each copy opened costs a free reader one of their free views, exactly as
 * opening it in the viewer does: the copy endpoint counts it, once. Panes
 * are keyed by copy, not by side, so Swap moves the two open copies across
 * rather than opening them again and charging for them twice.
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
  /** Copies the server refused, by id. */
  const [denied, setDenied] = useState<Record<string, boolean>>({});
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

  // Kept subscribed, so logging in from this page opens the comparison. A
  // reply that lands after its listener is gone is dropped: in development
  // the effect runs twice, and the first listener's answer, arriving after
  // both copies had been opened and counted, reset "left" to one too few.
  useEffect(() => {
    let live = true;
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) { setAccess('signed-out'); return; }
      const token = await user.getIdToken();
      const data = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then(r => r.json());
      if (!live) return;
      if (!data.access) { setAccess('locked'); return; }
      setFreeLeft(data.isPremium || data.hasTopperAccess ? null : Math.max(0, FREE_VIEWS - (data.clicks ?? 0)));
      setAccess('open');
    });
    return () => { live = false; unsubscribe(); };
  }, []);

  const choose = (side: Side, copyId: string) => {
    if (!picks) return;
    const next = { ...picks, [side]: copyId };
    setPicks(next);
    writeUrl(next);
  };

  const swap = () => {
    if (!picks) return;
    const next = { a: picks.b, b: picks.a };
    setPicks(next);
    writeUrl(next);
  };

  const unlocked = () => {
    setFreeLeft(null);
    setDenied({});
    setAccess('open');
    setEpoch(e => e + 1);
  };

  if (!pyq) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text3)' }}>
      Question not found. <Link href="/pyqs" style={{ color: 'var(--accent)' }}>&#8592; Back to PYQs</Link>
    </div>
  );

  const list = copies ?? [];
  const byId = new Map(list.map(c => [c.id, c]));
  const toppers = [...new Set(list.map(topperOf))];
  const sameTopper = (c: Copy) => list.filter(x => x.note === c.note).length > 1;
  const optionLabel = (c: Copy) => {
    const { name, rank, year } = parseNote(c.note);
    const who = [name, rank, year].filter(Boolean).join(' · ');
    return sameTopper(c) ? `${who} — ${c.question.slice(0, 40)}…` : who;
  };
  const section = pyq.section.replace(/^Paper I+ - /, '');
  const topic = pyq.topic.replace(/^\d+\.\s*/, '');

  const pane = (side: Side) => {
    const copyId = picks![side];
    const copy = byId.get(copyId);
    const otherId = picks![side === 'a' ? 'b' : 'a'];
    const { name, rank, year } = parseNote(copy?.note ?? null);
    return (
      <section key={`${copyId}:${epoch}`} className="cmp-pane" data-active={active === side}
        aria-label={`Answer ${side.toUpperCase()}: ${name}`}
        style={{
          minWidth: 0, background: 'var(--bg2)', border: '1px solid var(--border)',
          borderTop: `3px solid ${TONE[side]}`, borderRadius: 'var(--radius-xl)',
          overflow: 'hidden', boxShadow: 'var(--elev-1)',
        }}>
        <header className="cmp-head" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)',
        }}>
          <Avatar name={name} side={side} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 'var(--leading-snug)',
            }}>{name}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)',
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em', color: 'var(--text3)',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              <span style={{ color: TONE[side], fontWeight: 600 }}>ANSWER {side.toUpperCase()}</span>
              {rank && <><span aria-hidden="true">·</span><span>{rank}</span></>}
              {year && <><span aria-hidden="true">·</span><span>{year}</span></>}
            </div>
          </div>
          {/* A native select under a drawn button: the platform's own picker,
              which on a phone is the one readers know, in the page's look. */}
          <label className="cmp-change">
            <span>Change topper</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <select value={copyId} onChange={e => choose(side, e.target.value)}
              aria-label={`Choose the topper for answer ${side.toUpperCase()}`}>
              {list.map(c => (
                <option key={c.id} value={c.id} disabled={c.id === otherId}>{optionLabel(c)}</option>
              ))}
            </select>
          </label>
        </header>
        {copy && (
          <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em',
              color: 'var(--text3)', marginBottom: 'var(--space-1)',
            }}>QUESTION THEY ANSWERED</div>
            <p className="cmp-asked" title={copy.question} style={{
              color: 'var(--text2)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-ui)', margin: 0,
            }}>{copy.question}</p>
          </div>
        )}
        {denied[copyId] ? (
          <div style={{ padding: 'var(--space-8) var(--space-4)', background: 'var(--bg-sunken)' }}>
            <TopperLocked onUnlocked={unlocked} message="Your free topper-copy views are used up. Unlock to open this one." />
          </div>
        ) : (
          <TopperPdf
            embedded
            copyId={copyId}
            height="max(420px, calc(100vh - 260px))"
            onLoad={() => { if (freeLeft !== null) setOpened(n => n + 1); }}
            onDenied={() => setDenied(d => ({ ...d, [copyId]: true }))}
          />
        )}
      </section>
    );
  };

  // A card in place of the panes: signed out, or not enough copies.
  const gate = (title: string, body: React.ReactNode, action: React.ReactNode) => (
    <div style={{
      maxWidth: 520, margin: 'var(--space-10) auto', textAlign: 'center',
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-10) var(--space-8)', boxShadow: 'var(--elev-1)',
    }}>
      <div style={{
        width: 52, height: 52, margin: '0 auto var(--space-4)', borderRadius: 'var(--radius-circle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--accent-dim)', color: 'var(--accent)',
        border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
      }}><CompareIcon size={22} /></div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--text)', margin: '0 0 var(--space-2)' }}>{title}</h2>
      <div style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 'var(--leading-ui)', marginBottom: 'var(--space-6)' }}>{body}</div>
      {action}
    </div>
  );
  const primary: React.CSSProperties = {
    display: 'inline-block', background: 'var(--accent)', color: 'var(--accent-on)', border: 'none',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-8)', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'var(--space-6) var(--space-6) var(--space-12)' }}>
      <style>{`
        .cmp-grid { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5); align-items: start; }
        .cmp-tabs { display: none; }
        .cmp-asked { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .cmp-change {
          position: relative; flex-shrink: 0; display: inline-flex; align-items: center; gap: var(--space-2);
          padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg); color: var(--text2); font-size: 0.8rem; font-family: var(--font-ui);
          transition: border-color 0.15s, color 0.15s;
        }
        .cmp-change:hover, .cmp-change:focus-within { border-color: var(--accent); color: var(--accent); }
        .cmp-change select { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; font-size: 1rem; }
        .cmp-swap {
          position: absolute; left: 50%; top: 26px; transform: translateX(-50%); z-index: 2;
          width: 36px; height: 36px; border-radius: var(--radius-circle); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg); color: var(--text2); border: 1px solid var(--border); box-shadow: var(--elev-2);
          transition: color 0.15s, border-color 0.15s, transform 0.2s;
        }
        .cmp-swap:hover { color: var(--accent); border-color: var(--accent); transform: translateX(-50%) rotate(180deg); }
        .cmp-back { color: var(--text3); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: var(--space-1); transition: color 0.15s; }
        .cmp-back:hover { color: var(--accent); }
        .cmp-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-6); align-items: center; }
        @media (max-width: 768px) {
          .cmp-hero { grid-template-columns: 1fr; gap: var(--space-4); }
          .cmp-grid { display: block; }
          .cmp-pane[data-active="false"] { display: none; }
          .cmp-tabs { display: flex; }
          .cmp-swap { display: none; }
          /* The name gets the row; the picker goes under it, full width. */
          .cmp-head { flex-wrap: wrap; padding: var(--space-4) !important; }
          .cmp-change { order: 3; width: 100%; justify-content: center; }
        }
      `}</style>

      <Link href={`/pyqs/${pyq.id}`} className="cmp-back">&#8592; Back to the question</Link>

      {/* The question both copies answer, and how many there are to choose from. */}
      <div className="cmp-hero" style={{
        margin: 'var(--space-4) 0 var(--space-5)', padding: 'var(--space-6) var(--space-8)',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, var(--bg2)) 0%, var(--bg2) 60%)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--elev-1)',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)',
            fontFamily: 'var(--font-mono)', fontSize: '0.66rem', letterSpacing: '0.15em', color: 'var(--accent)',
          }}>
            <CompareIcon size={14} /> TOPPERS&rsquo; ANSWERS, SIDE BY SIDE
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--text)',
            lineHeight: 'var(--leading-snug)', letterSpacing: 'var(--track-display)', margin: '0 0 var(--space-4)', maxWidth: 900,
          }}>{pyq.question}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {[`UPSC ${pyq.year}`, `${pyq.marks} marks`, section, topic].map(chip => (
              <span key={chip} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text2)',
                background: 'var(--bg)', border: '1px solid var(--border)',
                padding: '2px var(--space-2)', borderRadius: 'var(--radius-xs)',
              }}>{chip}</span>
            ))}
          </div>
        </div>
        {list.length > 0 && (
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {list.length}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              topper {list.length === 1 ? 'copy' : 'copies'}
            </div>
          </div>
        )}
      </div>

      {(access === 'checking' || copies === null) && <OwlLoader label="Loading topper copies" />}

      {copies !== null && copies.length === 0 && gate(
        'No topper copies for this question yet',
        'Copies are added as toppers’ answer booklets come in. Other questions already have several to compare.',
        <Link href="/topper-copies" style={primary}>Browse topper copies</Link>,
      )}

      {copies !== null && copies.length === 1 && gate(
        'Only one topper copy so far',
        <>There is nothing to set it beside yet, but {parseNote(copies[0].note).name}&rsquo;s answer is here to read.</>,
        <Link href={`/topper-copies/${copies[0].id}`} style={primary}>Read the copy</Link>,
      )}

      {access === 'signed-out' && list.length >= 2 && gate(
        'Read two toppers’ answers side by side',
        <>
          {toppers.length} toppers answered this question, among them {toppers.slice(0, 2).join(' and ')}.
          Log in to put any two next to each other. Your first {FREE_VIEWS} copies are free.
        </>,
        <button onClick={() => requireLogin('Log in to compare topper copies')} style={primary}>Log in to compare</button>,
      )}

      {access === 'locked' && list.length >= 2 && (
        <div style={{ margin: 'var(--space-10) 0' }}><TopperLocked onUnlocked={unlocked} /></div>
      )}

      {access === 'open' && picks && (
        <>
          {freeLeft !== null && (
            <p style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap',
              color: 'var(--text2)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.66rem', letterSpacing: '0.08em', fontWeight: 600,
                color: 'var(--premium-text)', background: 'color-mix(in srgb, var(--premium-text) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--premium-text) 30%, transparent)',
                padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)',
              }}>FREE PREVIEW</span>
              Each copy opened here uses one of your {FREE_VIEWS} free views.
              <strong style={{ color: 'var(--text)' }}>{Math.max(0, freeLeft - opened)} left</strong>
            </p>
          )}
          <div className="cmp-tabs" role="tablist" style={{
            gap: 'var(--space-1)', marginBottom: 'var(--space-3)', padding: 'var(--space-1)',
            background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          }}>
            {(['a', 'b'] as Side[]).map(side => {
              const c = byId.get(picks[side]);
              const on = active === side;
              const name = c ? topperOf(c) : '';
              return (
                <button key={side} role="tab" aria-selected={on} onClick={() => setActive(side)} style={{
                  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                  background: on ? 'var(--bg)' : 'transparent', boxShadow: on ? 'var(--elev-1)' : 'none',
                  border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)',
                  color: on ? 'var(--text)' : 'var(--text3)', fontSize: '0.82rem', fontWeight: on ? 600 : 400, cursor: 'pointer',
                }}>
                  <Avatar name={name} side={side} size={22} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </button>
              );
            })}
          </div>
          <div className="cmp-grid">
            {pane('a')}
            <button key="swap" className="cmp-swap" onClick={swap} aria-label="Swap the two answers" title="Swap sides">
              <CompareIcon size={16} />
            </button>
            {pane('b')}
          </div>
        </>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}
