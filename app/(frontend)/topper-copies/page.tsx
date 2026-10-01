'use client';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pyqs } from '@/lib/pyqData';
import { allNotes } from '@/lib/notes';
import { auth } from '@/lib/firebase';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import OwlLoader from '@/components/OwlLoader';
import TopperLocked from '@/components/TopperLocked';

type Copy = { id: string; question: string; note: string | null; pyq_ids: number[]; topics: string[] };
type Access = { access: boolean; clicks: number; isPremium?: boolean; hasTopperAccess?: boolean };

/** Matches the allowance in /api/topper-copies/[id]. */
const FREE_VIEWS = 5;

const PYQ_YEAR = new Map(pyqs.map(q => [q.id, q.year]));
const NOTE_TITLE = new Map(allNotes.map(n => [n.slug, n.title]));
const NOTE_SECTION = new Map(allNotes.map(n => [n.slug, n.section]));
const NOTE_ORDER = new Map(allNotes.map((n, i) => [n.slug, i]));
const noteOrder = (slug: string) => NOTE_ORDER.get(slug) ?? allNotes.length;

// Copies are filed by notes topic, so their tabs are the notes' four
// sections; a copy is in whichever sections its topics are.
const SECTIONS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Ancient India' },
  { label: 'Medieval', value: 'Medieval India' },
  { label: 'Modern',   value: 'Modern India' },
  { label: 'World',    value: 'World History' },
];
const inSection = (c: Copy, section: string) =>
  section === 'all' || c.topics.some(t => NOTE_SECTION.get(t) === section);

/** "Vikram Grewal" from "Vikram Grewal, AIR-51, 2018". */
const topperOf = (c: Copy) => (c.note ?? '').split(',')[0].trim();
/** 51 from "Vikram Grewal, AIR-51, 2018"; unranked notes sort last. */
const rankOf = (note: string) => Number(note.match(/AIR[\s-]*(\d+)/i)?.[1] ?? Infinity);

function SectionTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)',
      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
      background: active ? 'var(--accent-dim)' : 'var(--bg2)',
      color: active ? 'var(--accent)' : 'var(--text2)',
      fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
      fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    }}>
      {label}
      <span style={{
        fontSize: '0.68rem',
        background: active ? 'var(--accent-dim)' : 'var(--bg3)',
        color: active ? 'var(--accent)' : 'var(--text3)',
        padding: '2px var(--space-2)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-mono)',
      }}>{count}</span>
    </button>
  );
}

/**
 * Every topper copy, on a page of its own. They used to be a mode of the PYQ
 * list, behind a button that swapped the questions out for copies, which hid
 * them from anyone who did not think to press it and left the two lists
 * sharing one set of filters that meant different things to each.
 *
 * Copies are grouped by notes topic in syllabus order and can be narrowed by
 * section, topic, topper and text. Opening one spends a free reader one of
 * their free views; that is counted by the copy endpoint, not here.
 */
export default function TopperCopiesPage() {
  const router = useRouter();
  const [copies, setCopies] = useState<Copy[] | null>(null);
  const [section, setSection] = useState('all');
  const [topic, setTopic] = useState('all');
  const [topper, setTopper] = useState('all');
  const [search, setSearch] = useState('');
  /** null while Firebase is still deciding who the reader is. */
  const [access, setAccess] = useState<Access | 'signed-out' | null>(null);
  const [paywall, setPaywall] = useState(false);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  // The filters ride in the URL (?section=&topic=&topper=&q=), so Back from
  // a copy lands on the same list. Read on mount rather than with
  // useSearchParams, and in a layout effect, so a restored list replaces the
  // full one before the first paint. tsection and ttopic are the names these
  // had on /pyqs, which old links still carry here through the redirect.
  const [restored, setRestored] = useState(false);
  useLayoutEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get('section') ?? p.get('tsection');
    if (s && SECTIONS.some(t => t.value === s)) setSection(s);
    const t = p.get('topic') ?? p.get('ttopic');
    if (t && NOTE_TITLE.has(t)) setTopic(t);
    // Checked against the toppers once the copies arrive.
    const name = p.get('topper');
    if (name) setTopper(name.slice(0, 100));
    const q = p.get('q');
    if (q) setSearch(q.slice(0, 200));
    setRestored(true);
  }, []);

  useEffect(() => {
    fetch('/api/topper-copies/all')
      .then(r => r.json())
      .then(d => setCopies(d.data ?? []))
      .catch(() => setCopies([]));
  }, []);

  // Kept subscribed: logging in from this page should update the notice.
  useEffect(() => auth.onAuthStateChanged(async user => {
    if (!user) { setAccess('signed-out'); return; }
    const token = await user.getIdToken();
    const data: Access = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then(r => r.json());
    setAccess(data);
  }), []);

  /** Each topper once, best rank first. */
  const toppers = useMemo(() => {
    const byName = new Map<string, { name: string; note: string; count: number }>();
    for (const c of copies ?? []) {
      const name = topperOf(c);
      if (!name) continue;
      const t = byName.get(name) ?? { name, note: c.note ?? '', count: 0 };
      t.count++;
      byName.set(name, t);
    }
    return [...byName.values()].sort((a, b) => rankOf(a.note) - rankOf(b.note) || a.name.localeCompare(b.name));
  }, [copies]);

  // A topper named by a link who has no copies (or the old ?topper=1 flag
  // from /pyqs) would leave an empty list with nothing selected to explain
  // it, so one is only applied once the copies show that it exists.
  const who = !copies || toppers.some(t => t.name === topper) ? topper : 'all';

  useEffect(() => {
    // Not before the restore, or the defaults erase what it is about to read.
    if (!restored) return;
    const p = new URLSearchParams();
    if (section !== 'all') p.set('section', section);
    if (topic !== 'all') p.set('topic', topic);
    if (who !== 'all') p.set('topper', who);
    if (search.trim()) p.set('q', search.trim());
    const qs = p.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next);
  }, [restored, section, topic, who, search]);

  /** How many copies answer each PYQ, for the Compare link. */
  const perPyq = useMemo(() => {
    const n = new Map<number, number>();
    for (const c of copies ?? []) for (const id of c.pyq_ids) n.set(id, (n.get(id) ?? 0) + 1);
    return n;
  }, [copies]);

  // Topper and text narrow everything below them, the tab counts and the
  // topic list included, so a count never promises copies the list then
  // does not show.
  const pool = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (copies ?? []).filter(c => {
      if (who !== 'all' && topperOf(c) !== who) return false;
      if (!s) return true;
      return c.question.toLowerCase().includes(s) || (c.note?.toLowerCase().includes(s) ?? false);
    });
  }, [copies, who, search]);

  // The notes topics that have copies, grouped by section in syllabus order,
  // and only the chosen section's once one is picked. The chosen topic stays
  // listed even when the other filters leave it none, or the select would
  // show "All Topics" over a list that is still filtered by it.
  const topicGroups = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of pool) for (const t of c.topics) count.set(t, (count.get(t) ?? 0) + 1);
    return [...new Set(allNotes.map(n => n.section))]
      .filter(s => section === 'all' || s === section)
      .map(s => ({
        section: s,
        topics: allNotes
          .filter(n => n.section === s && (count.has(n.slug) || n.slug === topic))
          .map(n => ({ slug: n.slug, title: n.title, count: count.get(n.slug) ?? 0 })),
      }))
      .filter(g => g.topics.length > 0);
  }, [pool, section, topic]);

  const shown = useMemo(
    () => pool.filter(c => inSection(c, section) && (topic === 'all' || c.topics.includes(topic))),
    [pool, section, topic],
  );

  // Grouped by notes topic in syllabus order, so sections follow in order
  // too, as on the PYQ list. A copy filed under two topics shows once, under
  // the first one the filters allow. Within a topic, copies answering the
  // same PYQ sit together, and copies that answer none come last.
  const groups = useMemo(() => {
    const fits = (t: string) =>
      (section === 'all' || NOTE_SECTION.get(t) === section) && (topic === 'all' || t === topic);
    const firstPyq = (c: Copy) => (c.pyq_ids.length ? Math.min(...c.pyq_ids) : Number.MAX_SAFE_INTEGER);
    const byTopic = new Map<string, Copy[]>();
    for (const c of shown) {
      const home = c.topics.filter(fits).sort((x, y) => noteOrder(x) - noteOrder(y))[0] ?? '';
      byTopic.set(home, [...(byTopic.get(home) ?? []), c]);
    }
    return [...byTopic.entries()]
      .sort(([x], [y]) => noteOrder(x) - noteOrder(y))
      .map(([slug, list]) => ({
        slug,
        copies: list.sort((x, y) => firstPyq(x) - firstPyq(y) || x.question.localeCompare(y.question)),
      }));
  }, [shown, section, topic]);

  const filtered = section !== 'all' || topic !== 'all' || who !== 'all' || search.trim() !== '';
  const clear = () => { setSection('all'); setTopic('all'); setTopper('all'); setSearch(''); };

  // Opening a copy is what spends a free view, and the copy endpoint counts
  // it. Here only decide between the copy and the paywall, asking afresh
  // when the last answer was no, since the reader may have bought since.
  const open = async (href: string) => {
    const user = auth.currentUser;
    if (!user) { requireLogin('Log in to view topper copies'); return; }
    let a = access && access !== 'signed-out' ? access : null;
    if (!a?.access) {
      const token = await user.getIdToken();
      a = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then(r => r.json()) as Access;
      setAccess(a);
    }
    if (a.access) router.push(href); else setPaywall(true);
  };

  const free = access && access !== 'signed-out' && !access.isPremium && !access.hasTopperAccess ? access : null;
  const freeLeft = free ? Math.max(0, FREE_VIEWS - (free.clicks ?? 0)) : 0;

  const field: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)',
    color: 'var(--text)', fontSize: '0.875rem',
  };
  const chip: React.CSSProperties = {
    fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-hair)', textDecoration: 'none',
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-12)' }}>
      <style>{`
        .tc-card{transition:border-color 0.15s;}
        .tc-card:hover{border-color:color-mix(in srgb, var(--accent) 35%, var(--border))!important;}
        .tc-actions{display:flex;flex-direction:column;gap:var(--space-2);flex-shrink:0;}
        /* On a phone the buttons go under the question, side by side, rather
           than squeezing it into a column a few words wide. */
        @media (max-width:600px){
          .tc-card{padding:var(--space-4)!important;}
          .tc-actions{flex-direction:row;width:100%;}
          .tc-actions>button{flex:1;}
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
          History Optional
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
              Topper Copies
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 620 }}>
              {copies?.length
                ? `${copies.length} handwritten Mains answers by ${toppers.length} UPSC toppers, filed by syllabus topic and linked to the PYQs they answer.`
                : 'Handwritten Mains answers by UPSC toppers, filed by syllabus topic and linked to the PYQs they answer.'}
            </p>
          </div>
          <Link href="/pyqs" style={{
            border: '1px solid var(--border)', color: 'var(--text2)',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
            marginTop: 'var(--space-1)',
          }}>Browse PYQs &rarr;</Link>
        </div>
      </div>

      {/* Where the reader stands. Nothing for unlimited access: there is
          nothing to tell them. */}
      {(access === 'signed-out' || free) && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2) var(--space-4)', marginBottom: 'var(--space-5)',
          color: 'var(--text2)', fontSize: '0.82rem', lineHeight: 1.6,
        }}>
          {access === 'signed-out' ? (
            <>
              <button onClick={() => requireLogin('Log in to view topper copies')} style={{
                background: 'none', border: 'none', padding: 0, color: 'var(--accent)',
                cursor: 'pointer', fontSize: 'inherit', fontWeight: 600,
              }}>Log in</button>
              {' '}to open copies. Your first {FREE_VIEWS} are free.
            </>
          ) : freeLeft > 0 ? (
            <>Free preview: <strong>{freeLeft} of {FREE_VIEWS}</strong> copy views left. Unlimited access is ₹799/year.</>
          ) : (
            <>
              Your {FREE_VIEWS} free copy views are used.{' '}
              <button onClick={() => setPaywall(true)} style={{
                background: 'none', border: 'none', padding: 0, color: 'var(--accent)',
                cursor: 'pointer', fontSize: 'inherit', fontWeight: 600,
              }}>Unlock every copy for ₹799/year</button>
            </>
          )}
        </div>
      )}

      {/* Sections. A topic chosen under one section is meaningless under
          another, so a tab resets it. */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        {SECTIONS.map(tab => (
          <SectionTab key={tab.value} label={tab.label}
            count={pool.filter(c => inSection(c, tab.value)).length}
            active={section === tab.value}
            onClick={() => { setSection(tab.value); setTopic('all'); }} />
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-5)',
        display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions or toppers…"
          aria-label="Search topper copies"
          style={{ ...field, flex: 1, minWidth: 200, fontFamily: 'var(--font-body)', outline: 'none' }}
        />
        <select value={topic} onChange={e => setTopic(e.target.value)}
          style={{ ...field, cursor: 'pointer', maxWidth: 280 }} aria-label="Filter topper copies by topic">
          <option value="all">All Topics</option>
          {topicGroups.map(g => (
            <optgroup key={g.section} label={g.section}>
              {g.topics.map(t => <option key={t.slug} value={t.slug}>{t.title} ({t.count})</option>)}
            </optgroup>
          ))}
        </select>
        <select value={who} onChange={e => setTopper(e.target.value)}
          style={{ ...field, cursor: 'pointer', maxWidth: 280 }} aria-label="Filter topper copies by topper">
          <option value="all">All Toppers</option>
          {toppers.map(t => (
            <option key={t.name} value={t.name}>
              {t.note.split(',').map(s => s.trim()).join(' · ')} ({t.count})
            </option>
          ))}
        </select>
        {filtered && (
          <button onClick={clear} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
          }}>Clear ✕</button>
        )}
      </div>

      {copies === null && <OwlLoader label="Loading topper copies" />}

      {copies !== null && copies.length === 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-12)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>📚</div>
          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>No topper copies yet</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 'var(--space-2)' }}>Check back soon.</div>
        </div>
      )}

      {copies !== null && copies.length > 0 && (
        <div>
          <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: 'var(--space-4)' }}>
            {shown.length} of {copies.length} copies
          </div>
          {shown.length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: '0.9rem', textAlign: 'center', padding: 'var(--space-10) 0' }}>
              No copies match these filters.{' '}
              <button onClick={clear} style={{
                background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit',
              }}>Clear them</button>
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {groups.map(g => (
              <section key={g.slug || '_none'}>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600,
                      color: 'var(--text)', margin: 0,
                    }}>{g.slug ? NOTE_TITLE.get(g.slug) ?? g.slug : 'Other copies'}</h2>
                    <span style={{
                      fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)',
                      border: '1px solid var(--border)', padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                    }}>{g.copies.length} {g.copies.length === 1 ? 'copy' : 'copies'}</span>
                    {section === 'all' && g.slug && (
                      <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                        {NOTE_SECTION.get(g.slug)}
                      </span>
                    )}
                    {g.slug && (
                      <Link href={`/notes/${g.slug}`} style={{
                        marginLeft: 'auto', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)', textDecoration: 'none',
                      }}>Notes &rarr;</Link>
                    )}
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', marginTop: 'var(--space-3)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {g.copies.map(c => {
                    // The PYQ with the most other copies, if any has one.
                    const cmp = c.pyq_ids
                      .filter(id => (perPyq.get(id) ?? 0) >= 2)
                      .sort((x, y) => (perPyq.get(y) ?? 0) - (perPyq.get(x) ?? 0))[0];
                    return (
                      <div key={c.id} className="tc-card" style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--space-6)',
                        borderLeft: '3px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                            <p style={{ color: 'var(--text)', fontSize: '0.93rem', lineHeight: 1.6, marginBottom: c.note ? 'var(--space-2)' : 'var(--space-3)' }}>
                              {c.question}
                            </p>
                            {c.note && (
                              <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
                                &#128221; {c.note}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                              {c.topics.filter(slug => slug !== g.slug).map(slug => (
                                <Link key={slug} href={`/notes/${slug}`} style={{
                                  ...chip, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)',
                                }}>
                                  {NOTE_TITLE.get(slug) ?? slug}
                                </Link>
                              ))}
                              {c.pyq_ids.map(pid => (
                                <Link key={pid} href={`/pyqs/${pid}`} style={{
                                  ...chip,
                                  color: 'color-mix(in srgb, var(--accent) 80%, transparent)',
                                  background: 'var(--accent-dim)',
                                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                }}>
                                  &#128279; PYQ {PYQ_YEAR.get(pid) ?? ''}{' '}&#8599;
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div className="tc-actions">
                            <button onClick={() => open(`/topper-copies/${c.id}`)} style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)',
                              background: 'var(--accent-dim)',
                              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                              color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-2) var(--space-4)', fontSize: '0.8rem',
                              cursor: 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                            }}>View Copy &#8594;</button>
                            {cmp !== undefined && (
                              <button
                                onClick={() => open(`/pyqs/${cmp}/compare?a=${c.id}`)}
                                title={`Side by side with the other copies of this PYQ (${perPyq.get(cmp)} in all)`}
                                style={{
                                  background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
                                  borderRadius: 'var(--radius-sm)', padding: 'var(--space-1) var(--space-4)',
                                  fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                                }}
                              >Compare ({perPyq.get(cmp)})</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {paywall && (
        <div
          role="dialog" aria-modal="true" aria-label="Unlock topper copies"
          onClick={e => { if (e.target === e.currentTarget) setPaywall(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, padding: 'var(--space-4)',
            background: 'color-mix(in srgb, var(--bg) 80%, transparent)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <TopperLocked
            onUnlocked={() => { setAccess({ access: true, clicks: 0, hasTopperAccess: true }); setPaywall(false); }}
            onDismiss={() => setPaywall(false)}
            message={`Your ${FREE_VIEWS} free topper-copy views are used up. Unlock to open every copy.`}
          />
        </div>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}
