'use client';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import OwlLoader from '@/components/OwlLoader';
import TopperLocked from '@/components/TopperLocked';
import CompareIcon from '@/components/CompareIcon';
import { SECTIONS, sectionByName } from '@/components/notes/sections';
import { tintFor } from '@/components/pyq/sections';
import { initials, parseNote, rankOf, topperOf } from './note';

type Copy = { id: string; question: string; note: string | null; pyq_ids: number[]; topics: string[] };
type Access = { access: boolean; clicks: number; isPremium?: boolean; hasTopperAccess?: boolean };
export type NoteMeta = { slug: string; title: string; section: string };
type Filters = { section: string; topic: string; topper: string; q: string };

/** Matches the allowance in /api/topper-copies/[id]. */
const FREE_VIEWS = 5;

/**
 * The filters as the address gives them. tsection and ttopic are the names
 * these had on /pyqs, which old links still carry here through the redirect.
 */
function parse(search: string): Filters {
  const p = new URLSearchParams(search);
  const section = p.get('section') ?? p.get('tsection') ?? '';
  return {
    section: SECTIONS.some((s) => s.name === section) ? section : '',
    topic: p.get('topic') ?? p.get('ttopic') ?? '',
    topper: (p.get('topper') ?? '').slice(0, 100),
    q: (p.get('q') ?? '').slice(0, 200),
  };
}
const subscribeUrl = (cb: () => void) => { window.addEventListener('popstate', cb); return () => window.removeEventListener('popstate', cb); };

const ARROW = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const BACK = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
const MEDAL = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="15" r="6" /><path d="M8.5 10L6 3h4l2 4 2-4h4l-2.5 7" /><path d="M12 12.5l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" /></svg>;

/**
 * Every topper copy: handwritten Mains answers, filed by notes topic in
 * syllabus order and linked to the PYQs they answer, narrowed by part of the
 * syllabus, topic, topper and text.
 *
 * The list is open to everyone; opening a copy needs an account, and spends
 * one of a free reader's five free views (the copy endpoint counts it, not
 * this page). The panel at the top says where the reader stands.
 */
export default function TopperBrowser({ notes, years }: { notes: NoteMeta[]; years: Record<number, number> }) {
  const router = useRouter();
  const [copies, setCopies] = useState<Copy[] | null>(null);
  const urlSearch = useSyncExternalStore(subscribeUrl, () => window.location.search, () => '');
  const fromUrl = useMemo(() => parse(urlSearch), [urlSearch]);
  const [own, setOwn] = useState<Filters | null>(null);
  const f = own ?? fromUrl;
  /** null while Firebase is still deciding who the reader is. */
  const [access, setAccess] = useState<Access | 'signed-out' | null>(null);
  const [paywall, setPaywall] = useState(false);
  /** Question cards showing all their toppers, not the first few. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  const noteTitle = useMemo(() => new Map(notes.map((n) => [n.slug, n.title])), [notes]);
  const noteSection = useMemo(() => new Map(notes.map((n) => [n.slug, n.section])), [notes]);
  const noteOrder = useMemo(() => new Map(notes.map((n, i) => [n.slug, i])), [notes]);
  const order = (slug: string) => noteOrder.get(slug) ?? notes.length;

  useEffect(() => {
    fetch('/api/topper-copies/all')
      .then((r) => r.json())
      .then((d) => setCopies(d.data ?? []))
      .catch(() => setCopies([]));
  }, []);

  // Kept subscribed, so signing in from this page is picked up.
  useEffect(() => auth.onAuthStateChanged(async (user) => {
    if (!user) { setAccess('signed-out'); return; }
    const token = await user.getIdToken();
    const data: Access = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => ({ access: true, clicks: 0 }));
    setAccess(data);
  }), []);

  /** Each topper once, best rank first. */
  const toppers = useMemo(() => {
    const byName = new Map<string, { name: string; note: string; count: number }>();
    for (const c of copies ?? []) {
      const name = topperOf(c.note);
      if (!name) continue;
      const t = byName.get(name) ?? { name, note: c.note ?? '', count: 0 };
      t.count++;
      byName.set(name, t);
    }
    return [...byName.values()].sort((a, b) => rankOf(a.note) - rankOf(b.note) || a.name.localeCompare(b.name));
  }, [copies]);

  // A topper named by a link who has no copies would leave an empty list
  // with nothing selected to explain it, so one is only applied once the
  // copies show they exist. Likewise a topic.
  const who = !copies || toppers.some((t) => t.name === f.topper) ? f.topper : '';
  const topic = noteTitle.has(f.topic) ? f.topic : '';

  const update = (next: Partial<Filters>) => {
    const merged = { ...f, ...next };
    // A topic chosen under one part of the syllabus means nothing under another.
    if (next.section !== undefined) merged.topic = '';
    setOwn(merged);
    const p = new URLSearchParams();
    if (merged.section) p.set('section', merged.section);
    if (merged.topic) p.set('topic', merged.topic);
    if (merged.topper) p.set('topper', merged.topper);
    if (merged.q.trim()) p.set('q', merged.q.trim());
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${p.size ? `?${p}` : ''}`);
  };

  /** Who has a copy answering each PYQ, for the side-by-side link. */
  const toppersByPyq = useMemo(() => {
    const m = new Map<number, Set<string>>();
    for (const c of copies ?? []) for (const id of c.pyq_ids) {
      if (!m.has(id)) m.set(id, new Set());
      m.get(id)!.add(topperOf(c.note));
    }
    return m;
  }, [copies]);

  // Topper and text narrow everything below them, the tab counts and the
  // topic list included, so a count never promises copies the list then
  // does not show.
  const pool = useMemo(() => {
    const s = f.q.trim().toLowerCase();
    return (copies ?? []).filter((c) => {
      if (who && topperOf(c.note) !== who) return false;
      if (!s) return true;
      return c.question.toLowerCase().includes(s) || (c.note?.toLowerCase().includes(s) ?? false);
    });
  }, [copies, who, f.q]);
  const inSection = (c: Copy, section: string) => !section || c.topics.some((t) => noteSection.get(t) === section);

  const topicGroups = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of pool) for (const t of c.topics) count.set(t, (count.get(t) ?? 0) + 1);
    return SECTIONS
      .filter((s) => !f.section || s.name === f.section)
      .map((s) => ({ section: s.name, topics: notes.filter((n) => n.section === s.name && (count.has(n.slug) || n.slug === topic)).map((n) => ({ ...n, count: count.get(n.slug) ?? 0 })) }))
      .filter((g) => g.topics.length > 0);
  }, [pool, f.section, topic, notes]);

  const shown = useMemo(() => pool.filter((c) => inSection(c, f.section) && (!topic || c.topics.includes(topic))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, f.section, topic, noteSection]);

  // Grouped by notes topic in syllabus order. A copy filed under two topics
  // shows once, under the first one the filters allow. Within a topic,
  // copies answering the same PYQ sit together.
  const groups = useMemo(() => {
    const fits = (t: string) => (!f.section || noteSection.get(t) === f.section) && (!topic || t === topic);
    const firstPyq = (c: Copy) => (c.pyq_ids.length ? Math.min(...c.pyq_ids) : Number.MAX_SAFE_INTEGER);
    const byTopic = new Map<string, Copy[]>();
    for (const c of shown) {
      const home = c.topics.filter(fits).sort((x, y) => order(x) - order(y))[0] ?? '';
      byTopic.set(home, [...(byTopic.get(home) ?? []), c]);
    }
    // Within a topic, one card per question: several toppers often answered
    // the same one, and a card each repeated the question down the page.
    const keyOf = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    return [...byTopic.entries()]
      .sort(([x], [y]) => order(x) - order(y))
      .map(([slug, list]) => {
        const byQ = new Map<string, { key: string; question: string; copies: Copy[]; pyq_ids: number[]; topics: string[] }>();
        for (const c of list.sort((x, y) => firstPyq(x) - firstPyq(y) || x.question.localeCompare(y.question))) {
          const key = keyOf(c.question);
          const q = byQ.get(key) ?? { key, question: c.question, copies: [], pyq_ids: [], topics: [] };
          q.copies.push(c);
          q.pyq_ids = [...new Set([...q.pyq_ids, ...c.pyq_ids])];
          q.topics = [...new Set([...q.topics, ...c.topics])];
          byQ.set(key, q);
        }
        for (const q of byQ.values()) q.copies.sort((a, b) => rankOf(a.note ?? '') - rankOf(b.note ?? ''));
        return { slug, copies: list, questions: [...byQ.values()] };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, f.section, topic, noteSection, noteOrder]);

  const filtered = Boolean(f.section || topic || who || f.q.trim());

  // Opening a copy is what spends a free view, and the copy endpoint counts
  // it. Here only decide between the copy and the paywall, asking afresh
  // when the last answer was no, since the reader may have bought since.
  const open = async (href: string) => {
    const user = auth.currentUser;
    if (!user) { requireLogin('Sign in to read topper copies. Your first 5 are free.'); return; }
    let a = access && access !== 'signed-out' ? access : null;
    if (!a?.access) {
      const token = await user.getIdToken();
      a = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()) as Access;
      setAccess(a);
    }
    if (a.access) router.push(href); else setPaywall(true);
  };

  const unlimited = access && access !== 'signed-out' && (access.isPremium || access.hasTopperAccess);
  const freeLeft = access && access !== 'signed-out' && !unlimited ? Math.max(0, FREE_VIEWS - (access.clicks ?? 0)) : null;

  return (
    <div className="tc ds" style={tintFor(undefined)}>
      <style dangerouslySetInnerHTML={{ __html: TC_CSS }} />
      <section className="tc-hero">
        <div className="ds-container tc-hero-row">
          <div className="tc-hero-main">
            <Link href="/pyqs" className="ds-back">{BACK}PYQs</Link>
            <div className="tc-title">
              <span className="tc-icon" aria-hidden="true">{MEDAL}</span>
              <h1 className="ds-h1">Topper copies</h1>
            </div>
            <p className="ds-lede tc-lede">
              Real answer sheets from UPSC toppers, sorted by topic, so you can see what a high-scoring answer looks like on paper.
            </p>
          </div>
          {access !== null && (
            <div className="tc-access">
              {access === 'signed-out' ? (
                <>
                  <strong>{FREE_VIEWS} copies free</strong>
                  <span>with a free account</span>
                  <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={() => requireLogin('Sign in to read topper copies. Your first 5 are free.')}>Sign in</button>
                </>
              ) : unlimited ? (
                <>
                  <strong>Every copy open</strong>
                  <span>{access.isPremium ? 'With your Premium' : 'Topper copies unlocked'}</span>
                </>
              ) : (
                <>
                  <strong>{freeLeft ? `${freeLeft} of ${FREE_VIEWS} free copies left` : 'Free copies used'}</strong>
                  <span>Every copy for a year: ₹799, paid once</span>
                  <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setPaywall(true)}>Unlock every copy</button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="tc-body">
        <div className="ds-container">
          <div className="tc-bar">
            <label className="tc-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search the questions or a topper's name" aria-label="Search topper copies" />
              {f.q && <button type="button" className="tc-clear" onClick={() => update({ q: '' })} aria-label="Clear search">✕</button>}
            </label>
            <div className="tc-tabs" role="tablist" aria-label="Part of the syllabus">
              <button type="button" role="tab" aria-selected={!f.section} className={`tc-tab${!f.section ? ' on' : ''}`} onClick={() => update({ section: '' })}>All</button>
              {SECTIONS.map((s) => (
                <button key={s.key} type="button" role="tab" aria-selected={f.section === s.name} style={tintFor(s.key)}
                  className={`tc-tab${f.section === s.name ? ' on' : ''}`} onClick={() => update({ section: s.name })}>
                  {s.name.replace(' India', '').replace(' History', '')}{copies && <span>{pool.filter((c) => inSection(c, s.name)).length}</span>}
                </button>
              ))}
            </div>
            <div className="tc-selects">
              <select className={`tc-select tc-select-topic${topic ? ' set' : ''}`} value={topic} onChange={(e) => update({ topic: e.target.value })} aria-label="Topic">
                <option value="">Every topic</option>
                {topicGroups.map((g) => (
                  <optgroup key={g.section} label={g.section}>
                    {g.topics.map((t) => <option key={t.slug} value={t.slug}>{t.title} ({t.count})</option>)}
                  </optgroup>
                ))}
              </select>
              <select className={`tc-select${who ? ' set' : ''}`} value={who} onChange={(e) => update({ topper: e.target.value })} aria-label="Topper">
                <option value="">Every topper</option>
                {toppers.map((t) => <option key={t.name} value={t.name}>{[t.name, parseNote(t.note).rank, parseNote(t.note).year].filter(Boolean).join(' · ')} ({t.count})</option>)}
              </select>
            </div>
          </div>

          {copies === null && <OwlLoader label="Loading topper copies" />}
          {copies !== null && copies.length === 0 && <p className="tc-empty">No topper copies are up yet. Check back soon.</p>}

          {copies !== null && copies.length > 0 && (
            <>
              <div className="tc-status" aria-live="polite">
                <span>{(() => { const nq = groups.reduce((n, g) => n + g.questions.length, 0); return `${nq.toLocaleString('en-IN')} ${nq === 1 ? 'question' : 'questions'}, ${shown.length === copies.length ? `${copies.length} copies` : `${shown.length} of ${copies.length} copies`}`; })()}</span>
                {filtered && <button type="button" className="tc-reset" onClick={() => update({ section: '', topic: '', topper: '', q: '' })}>Clear filters</button>}
              </div>
              {shown.length === 0 && <p className="tc-empty">No copy matches all of that. Try fewer filters, or a shorter search.</p>}

              {groups.map((g) => {
                const meta = sectionByName(noteSection.get(g.slug) ?? '');
                return (
                  <section key={g.slug || '-'} className="tc-group" style={tintFor(meta?.key)}>
                    <div className="tc-group-head">
                      <h2>{g.slug ? noteTitle.get(g.slug) ?? g.slug : 'Other copies'}</h2>
                      <span className="tc-group-count">{g.questions.length} {g.questions.length === 1 ? 'question' : 'questions'}, {g.copies.length} {g.copies.length === 1 ? 'copy' : 'copies'}{!f.section && meta ? ` · ${meta.name}` : ''}</span>
                      {g.slug && <Link href={`/notes/${g.slug}`} className="tc-notes">Read the notes {ARROW}</Link>}
                    </div>
                    <div className="tc-cards">
                      {g.questions.map((q) => {
                        // The PYQ the most toppers answered, if two did: the
                        // one whose answers can be set side by side.
                        const cmp = [...q.pyq_ids].sort((x, y) => (toppersByPyq.get(y)?.size ?? 0) - (toppersByPyq.get(x)?.size ?? 0))[0];
                        const onCmp = cmp === undefined ? 0 : toppersByPyq.get(cmp)?.size ?? 0;
                        const mine = new Set(q.copies.map((c) => topperOf(c.note))).size;
                        const open3 = expanded.has(q.key) ? q.copies : q.copies.slice(0, 3);
                        return (
                          <article key={q.key} className="tc-card">
                            <h3 className="tc-q">{q.question}</h3>
                            {(q.pyq_ids.length > 0 || q.topics.length > 1) && (
                              <div className="tc-chips">
                                {q.pyq_ids.map((id) => <Link key={id} href={`/pyqs/${id}`} className="tc-chip pyq">PYQ {years[id] ?? ''}</Link>)}
                                {q.topics.filter((t) => t !== g.slug).map((t) => <Link key={t} href={`/notes/${t}`} className="tc-chip">{noteTitle.get(t) ?? t}</Link>)}
                              </div>
                            )}
                            <div className="tc-by">{q.copies.length === 1 ? 'Answered by' : `Answered by ${mine} ${mine === 1 ? 'topper' : 'toppers'}`}</div>
                            <div className="tc-toppers">
                              {open3.map((c) => {
                                const { name, rank, year } = parseNote(c.note);
                                return (
                                  <button key={c.id} type="button" className="tc-topper" onClick={() => open(`/topper-copies/${c.id}`)} aria-label={`Read ${name}'s answer`}>
                                    <span className="tc-avatar" aria-hidden="true">{initials(name)}</span>
                                    <span className="tc-who-text"><strong>{name}</strong><span>{[rank, year].filter(Boolean).join(' · ')}</span></span>
                                    <span className="tc-go">Read {ARROW}</span>
                                  </button>
                                );
                              })}
                              {q.copies.length > 3 && !expanded.has(q.key) && (
                                <button type="button" className="tc-more" onClick={() => setExpanded((x) => new Set(x).add(q.key))}>
                                  {q.copies.length - 3} more {q.copies.length - 3 === 1 ? 'answer' : 'answers'}
                                </button>
                              )}
                            </div>
                            {onCmp >= 2 && (
                              <button type="button" className="tc-compare" onClick={() => open(`/pyqs/${cmp}/compare?a=${q.copies[0].id}${q.copies[1] ? `&b=${q.copies[1].id}` : ''}`)}>
                                <CompareIcon size={14} /> {mine >= 2 ? 'Compare these answers side by side' : `Compare with ${onCmp - 1} other ${onCmp - 1 === 1 ? 'topper' : 'toppers'}`}
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </section>

      {paywall && (
        <div className="ds-overlay" onClick={() => setPaywall(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
            <TopperLocked
              onUnlocked={() => { setAccess({ access: true, clicks: 0, hasTopperAccess: true }); setPaywall(false); }}
              onDismiss={() => setPaywall(false)}
              message={freeLeft ? undefined : `Your ${FREE_VIEWS} free copies are used. One payment opens every copy for a year.`}
            />
          </div>
        </div>
      )}
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const TC_CSS = `
.tc { background: var(--bg); min-height: 70vh; }
.tc-hero { padding: clamp(20px, 4vh, 44px) 0 clamp(20px, 3vh, 32px); background: linear-gradient(180deg, color-mix(in srgb, var(--premium-wash) 70%, var(--bg)) 0%, var(--bg) 100%); }
.tc-hero-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); }
.tc-hero-main { min-width: 0; }
.tc-title { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-4) 0 var(--space-2); }
.tc-title .ds-h1 { font-size: clamp(1.9rem, 4vw, 2.8rem); }
.tc-icon { width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--ds-card); color: var(--premium-text); border: 1px solid var(--border); box-shadow: var(--elev-1); }
.tc-lede { max-width: 700px; }
.tc-access { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 240px; padding: var(--space-4) var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-1); }
.tc-access strong { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
.tc-access span { font-size: 0.86rem; color: var(--text3); }
.tc-access .ds-btn { margin-top: var(--space-3); }
.tc-body { padding: var(--space-2) 0 clamp(48px, 9vh, 96px); }

.tc-bar { position: sticky; top: 60px; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.tc-search { flex: 1 1 320px; display: flex; align-items: center; gap: var(--space-2); height: 48px; padding: 0 var(--space-2) 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); transition: border-color 0.15s, box-shadow 0.15s; }
.tc-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.tc-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font-size: 1rem; }
.tc-search input::-webkit-search-cancel-button { display: none; }
.tc-clear { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--ds-soft); color: var(--text3); cursor: pointer; font-size: 0.8rem; }
.tc-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.tc-tab { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: 9px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.tc-tab span { min-width: 22px; padding: 1px 7px; border-radius: var(--radius-full); background: var(--ds-card); font-size: 0.76rem; font-weight: 600; color: var(--text3); }
.tc-tab.on { background: var(--ds-card); color: var(--t); box-shadow: var(--elev-1); }
.tc-tab.on span { background: var(--w); color: var(--t); }
.tc-selects { display: flex; flex-wrap: wrap; gap: var(--space-2); width: 100%; }
.tc-select {
  appearance: none; -webkit-appearance: none; min-width: 0; height: 40px; padding: 0 34px 0 14px;
  background: var(--ds-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
  border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text); font: inherit; font-size: 0.9rem; font-weight: 500; cursor: pointer; text-overflow: ellipsis;
}
.tc-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.tc-select-topic { flex: 1 1 260px; max-width: 380px; }
.tc-status { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin: var(--space-2) 0; font-size: 0.95rem; color: var(--text2); }
.tc-reset { background: none; border: none; padding: 4px 0; font: inherit; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.tc-empty { padding: var(--space-8) 0; color: var(--text2); }

.tc-group { padding-top: var(--space-6); }
.tc-group-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px var(--space-3); margin-bottom: var(--space-3); }
.tc-group-head h2 { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; color: var(--t); }
.tc-group-count { font-size: 0.86rem; color: var(--text3); }
.tc-notes { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 0.86rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.tc-notes:hover { text-decoration: underline; text-underline-offset: 3px; }
.tc-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.tc-card { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); transition: border-color 0.15s, box-shadow 0.15s; }
.tc-card:hover { border-color: color-mix(in srgb, var(--t) 40%, transparent); box-shadow: var(--elev-1); }
/* The question leads; the toppers who answered it follow, each a way in. */
.tc-q { margin: 0; font-size: 1.06rem; font-weight: 600; line-height: 1.55; letter-spacing: -0.005em; color: var(--text); }
.tc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tc-chip { padding: 2px 10px; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--ds-soft); font-size: 0.78rem; color: var(--text2); text-decoration: none; }
.tc-chip:hover { border-color: var(--border3); color: var(--text); }
.tc-chip.pyq { border-color: color-mix(in srgb, var(--accent) 30%, transparent); background: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.tc-by { margin-top: var(--space-1); font-size: 0.8rem; font-weight: 700; color: var(--text3); }
.tc-toppers { display: flex; flex-direction: column; margin-top: calc(var(--space-2) * -1); }
.tc-topper { display: flex; align-items: center; gap: var(--space-3); width: 100%; padding: var(--space-2) 0; border: none; border-top: 1px solid var(--border); background: none; font: inherit; text-align: left; cursor: pointer; }
.tc-topper:first-child { border-top: none; }
.tc-avatar { width: 32px; height: 32px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--premium-wash); color: var(--premium-text); font-size: 0.76rem; font-weight: 800; }
.tc-who-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.tc-who-text strong { font-size: 0.9rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tc-who-text span { font-size: 0.78rem; color: var(--text3); }
.tc-go { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; font-size: 0.86rem; font-weight: 700; color: var(--accent-text); }
.tc-topper:hover .tc-who-text strong { color: var(--t); }
.tc-topper:hover .tc-go { text-decoration: underline; text-underline-offset: 3px; }
.tc-topper:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--radius-md); }
.tc-more { align-self: flex-start; padding: var(--space-2) 0 0; border: none; background: none; font: inherit; font-size: 0.86rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.tc-compare { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; margin-top: auto; padding: 5px 12px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
.tc-compare:hover { border-color: var(--accent); color: var(--accent-text); }

@media (max-width: 900px) { .tc-bar { position: static; } .tc-cards { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 760px) {
  .tc-hero-row { flex-direction: column; align-items: stretch; gap: var(--space-4); }
  .tc-access { min-width: 0; }
}
@media (max-width: 640px) {
  .tc-search { flex-basis: 100%; height: 46px; }
  .tc-tabs { display: flex; width: 100%; }
  .tc-tab { flex: 1; padding: 8px 4px; font-size: 0.84rem; }
  .tc-tab span { display: none; }
  .tc-selects { display: grid; grid-template-columns: minmax(0, 1fr); }
  .tc-select-topic { max-width: none; }
  .tc-card { padding: var(--space-4); }
  .tc-q { font-size: 1rem; }
  .tc-notes { margin-left: 0; }
}
`;
