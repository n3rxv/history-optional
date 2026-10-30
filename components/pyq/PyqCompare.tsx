'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';
import TopperPdf from '@/components/TopperPdf';
import TopperLocked from '@/components/TopperLocked';
import CompareIcon from '@/components/CompareIcon';
import LoginPromptModal from '@/components/LoginPromptModal';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { pyqSection, tintFor, topicName } from './sections';
import { initials, parseNote, questionKey, sameQuestion, topperOf } from '@/components/topper/note';
import { useTopperQuestionsHi } from '@/components/topper/useTopperQuestionsHi';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi, topicLabel } from '@/lib/pyqHi';

type Copy = { id: string; question: string; note: string | null };
type Side = 'a' | 'b';
type Picks = Record<Side, string>;
type Question = { id: number; question: string; year: number; marks: number; section: string; topic: string };

/** Matches the allowance in /api/topper-copies/[id]. */
const FREE_VIEWS = 5;

const topperOfCopy = (c: Copy) => topperOf(c.note);

/**
 * The pair to open with: whatever the address names (?a=&b=), so a refresh or
 * Back keeps the comparison. Without a b, the a copy (or the first) goes
 * beside the first one by a different topper: two copies by the same person
 * compare little. The Topper Copies page links here with only an a.
 */
function initialPicks(copies: Copy[]): Picks {
  const byId = new Map(copies.map((c) => [c.id, c]));
  const p = new URLSearchParams(window.location.search);
  const a = byId.get(p.get('a') ?? '') ?? copies[0];
  const b = byId.get(p.get('b') ?? '');
  if (b && b.id !== a.id) return { a: a.id, b: b.id };
  const other = copies.find((c) => c.id !== a.id && topperOfCopy(c) !== topperOfCopy(a)) ?? copies.find((c) => c.id !== a.id)!;
  return { a: a.id, b: other.id };
}

function writeUrl(picks: Picks) {
  const p = new URLSearchParams(window.location.search);
  p.set('a', picks.a);
  p.set('b', picks.b);
  window.history.replaceState(window.history.state, '', `${window.location.pathname}?${p.toString()}`);
}

const Avatar = ({ name, side, small }: { name: string; side: Side; small?: boolean }) => (
  <span className={`cmp-avatar ${side}${small ? ' small' : ''}`} aria-hidden="true">{initials(name)}</span>
);

/**
 * Two topper copies of one question, side by side, to see how different
 * toppers built the same answer. On a phone the two stack behind a switcher.
 *
 * Each copy opened costs a free reader one of their free views, exactly as
 * opening it in the viewer does: the copy endpoint counts it, once. Panes are
 * keyed by copy, not by side, so Swap moves the two open copies across rather
 * than opening them again and charging for them twice.
 */
export default function PyqCompare({ pyq }: { pyq: Question }) {
  const meta = pyqSection(pyq.section);
  const { langHi } = useLang();
  const pyqHi = usePyqHi(langHi);
  const L = (en: string, hi: string) => (langHi ? hi : en);
  const qHi = pyqHi?.q[pyq.id];
  /** A copy's question in Hindi: its own, else the PYQ's when the copy answers it as asked. */
  const ownHi = useTopperQuestionsHi(langHi);
  const askedHi = (c: Copy) => ownHi?.[questionKey(c.question)] ?? (qHi && sameQuestion(c.question, pyq.question) ? qHi : undefined);
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
    fetch(`/api/topper-copies?pyq_id=${pyq.id}`)
      .then((r) => r.json())
      .then((d) => {
        const list: Copy[] = d.data ?? [];
        setCopies(list);
        if (list.length >= 2) {
          const first = initialPicks(list);
          setPicks(first);
          writeUrl(first);
        }
      })
      .catch(() => setCopies([]));
  }, [pyq.id]);

  // Kept subscribed, so signing in from this page opens the comparison. A
  // reply that lands after its listener is gone is dropped: in development
  // the effect runs twice, and the first listener's late answer reset the
  // free views left to one too few.
  useEffect(() => {
    let live = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { setAccess('signed-out'); return; }
      const token = await user.getIdToken();
      const data = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => ({}));
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
    setEpoch((e) => e + 1);
  };

  const list = copies ?? [];
  const byId = new Map(list.map((c) => [c.id, c]));
  const toppers = [...new Set(list.map(topperOfCopy))];
  const sameTopper = (c: Copy) => list.filter((x) => x.note === c.note).length > 1;
  const optionLabel = (c: Copy) => {
    const { name, rank, year } = parseNote(c.note);
    const who = [name, rank, year].filter(Boolean).join(' · ');
    return sameTopper(c) ? `${who}: ${(askedHi(c) ?? c.question).slice(0, 40)}…` : who;
  };

  const pane = (side: Side) => {
    const copyId = picks![side];
    const copy = byId.get(copyId);
    const otherId = picks![side === 'a' ? 'b' : 'a'];
    const { name, rank, year } = parseNote(copy?.note ?? null);
    return (
      <section key={`${copyId}:${epoch}`} className={`cmp-pane ${side}`} data-active={active === side} aria-label={`${L('Answer', 'उत्तर')} ${side.toUpperCase()}: ${name}`}>
        <header className="cmp-head">
          <Avatar name={name} side={side} />
          <div className="cmp-who">
            <div className="cmp-name">{name}</div>
            <div className="cmp-sub">
              <span className="cmp-side">{L('Answer', 'उत्तर')} {side.toUpperCase()}</span>
              {rank && <span>{rank}</span>}
              {year && <span>{year}</span>}
            </div>
          </div>
          {/* A native select under a drawn button: the platform's own picker,
              which on a phone is the one readers know, in the page's look. */}
          <label className="cmp-change">
            <span>{L('Change topper', 'टॉपर बदलें')}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <select value={copyId} onChange={(e) => choose(side, e.target.value)} aria-label={L(`Choose the topper for answer ${side.toUpperCase()}`, `उत्तर ${side.toUpperCase()} के लिए टॉपर चुनें`)}>
              {list.map((c) => <option key={c.id} value={c.id} disabled={c.id === otherId}>{optionLabel(c)}</option>)}
            </select>
          </label>
        </header>
        {copy && (
          <div className="cmp-asked-box">
            <div className="cmp-asked-label">{L('The question they answered', 'जिस प्रश्न का उत्तर लिखा गया')}</div>
            <p className="cmp-asked" title={askedHi(copy) ?? copy.question} lang={askedHi(copy) ? 'hi' : undefined}>{askedHi(copy) ?? copy.question}</p>
          </div>
        )}
        {denied[copyId] ? (
          <div className="cmp-denied"><TopperLocked onUnlocked={unlocked} message={L('Your free topper-copy views are used up. Unlock to open this one.', 'आपकी निःशुल्क टॉपर कॉपियाँ इस्तेमाल हो चुकी हैं। इसे खोलने के लिए अनलॉक करें।')} /></div>
        ) : (
          <TopperPdf embedded copyId={copyId} height="max(420px, calc(100vh - 260px))"
            onLoad={() => { if (freeLeft !== null) setOpened((n) => n + 1); }}
            onDenied={() => setDenied((d) => ({ ...d, [copyId]: true }))} />
        )}
      </section>
    );
  };

  // A card in place of the panes: signed out, or not enough copies.
  const gate = (title: string, body: React.ReactNode, action: React.ReactNode) => (
    <div className="cmp-gate">
      <span className="cmp-gate-icon" aria-hidden="true"><CompareIcon size={22} /></span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );

  return (
    <div className="cmp ds" style={tintFor(meta?.key)}>
      <style dangerouslySetInnerHTML={{ __html: CMP_CSS }} />
      <div className="cmp-wrap">
        <Link href={`/pyqs/${pyq.id}`} className="ds-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          {L('The question', 'प्रश्न')}
        </Link>

        <div className="cmp-hero">
          <div className="cmp-hero-main">
            <div className="cmp-kicker"><CompareIcon size={14} /> {L('Toppers’ answers, side by side', 'टॉपरों के उत्तर, आमने-सामने')}</div>
            <h1 lang={qHi ? 'hi' : undefined}>{qHi ?? pyq.question}</h1>
            <div className="cmp-chips">
              {[`UPSC ${pyq.year}`, `${pyq.marks} ${L('marks', 'अंक')}`, (langHi ? meta?.nameHi : meta?.name) ?? pyq.section, langHi ? topicLabel(pyq.topic, pyqHi) : topicName(pyq.topic)].map((chip) => <span key={chip}>{chip}</span>)}
            </div>
          </div>
          {list.length > 0 && (
            <div className="cmp-count"><strong>{list.length}</strong><span>{langHi ? `टॉपर ${list.length === 1 ? 'कॉपी' : 'कॉपियाँ'}` : `topper ${list.length === 1 ? 'copy' : 'copies'}`}</span></div>
          )}
        </div>

        {(access === 'checking' || copies === null) && <OwlLoader label={L('Loading topper copies', 'टॉपर कॉपियाँ लोड हो रही हैं')} />}

        {copies !== null && copies.length === 0 && gate(
          L('No topper copies for this question yet', 'इस प्रश्न की अभी कोई टॉपर कॉपी नहीं है'),
          L('Copies are added as toppers’ answer booklets come in. Other questions already have several to compare.', 'टॉपरों की उत्तर पुस्तिकाएँ आने पर कॉपियाँ जोड़ी जाती हैं। दूसरे प्रश्नों पर तुलना के लिए पहले से कई कॉपियाँ हैं।'),
          <Link href="/topper-copies" className="ds-btn ds-btn-solid">{L('Browse topper copies', 'टॉपर कॉपियाँ देखें')}</Link>,
        )}

        {copies !== null && copies.length === 1 && gate(
          L('Only one topper copy so far', 'अभी केवल एक टॉपर कॉपी है'),
          langHi
            ? <>अभी इसके साथ रखने को दूसरी कॉपी नहीं है, पर {parseNote(copies[0].note).name} का उत्तर यहाँ पढ़ सकते हैं।</>
            : <>There is nothing to set it beside yet, but {parseNote(copies[0].note).name}’s answer is here to read.</>,
          <Link href={`/topper-copies/${copies[0].id}${sameQuestion(copies[0].question, pyq.question) ? `?pyq=${pyq.id}` : ''}`} className="ds-btn ds-btn-solid">{L('Read the copy', 'कॉपी पढ़ें')}</Link>,
        )}

        {access === 'signed-out' && list.length >= 2 && gate(
          L('Read two toppers’ answers side by side', 'दो टॉपरों के उत्तर आमने-सामने पढ़ें'),
          langHi
            ? <>{toppers.length} टॉपरों ने इस प्रश्न का उत्तर लिखा है, इनमें {toppers.slice(0, 2).join(' और ')} भी हैं। किन्हीं दो को साथ-साथ रखने के लिए साइन इन करें। आपकी पहली {FREE_VIEWS} कॉपियाँ निःशुल्क हैं।</>
            : <>{toppers.length} toppers answered this question, among them {toppers.slice(0, 2).join(' and ')}. Sign in to put any two next to each other. Your first {FREE_VIEWS} copies are free.</>,
          <button type="button" className="ds-btn ds-btn-solid" onClick={() => requireLogin(L('Sign in to compare topper copies', 'टॉपर कॉपियों की तुलना के लिए साइन इन करें'))}>{L('Sign in to compare', 'तुलना के लिए साइन इन करें')}</button>,
        )}

        {access === 'locked' && list.length >= 2 && <div className="cmp-locked"><TopperLocked onUnlocked={unlocked} /></div>}

        {access === 'open' && picks && (
          <>
            {freeLeft !== null && (
              <p className="cmp-free">
                <span>{L('Free preview', 'निःशुल्क झलक')}</span>
                {L(`Each copy opened here uses one of your ${FREE_VIEWS} free views.`, `यहाँ खोली गई हर कॉपी आपकी ${FREE_VIEWS} निःशुल्क कॉपियों में से एक गिनी जाती है।`)} <strong>{L(`${Math.max(0, freeLeft - opened)} left`, `${Math.max(0, freeLeft - opened)} बाक़ी`)}</strong>
              </p>
            )}
            <div className="cmp-tabs" role="tablist">
              {(['a', 'b'] as Side[]).map((side) => {
                const c = byId.get(picks[side]);
                const name = c ? topperOfCopy(c) : '';
                return (
                  <button key={side} type="button" role="tab" aria-selected={active === side} className={active === side ? 'on' : ''} onClick={() => setActive(side)}>
                    <Avatar name={name} side={side} small />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
            <div className="cmp-grid">
              {pane('a')}
              <button key="swap" type="button" className="cmp-swap" onClick={swap} aria-label={L('Swap the two answers', 'दोनों उत्तरों की जगह बदलें')} title={L('Swap sides', 'जगह बदलें')}><CompareIcon size={16} /></button>
              {pane('b')}
            </div>
          </>
        )}
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CMP_CSS = `
.cmp { background: var(--bg); min-height: 70vh; }
.cmp-wrap { max-width: 1440px; margin: 0 auto; padding: var(--space-6) var(--space-6) var(--space-12); }
.cmp-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-6); align-items: center; margin: var(--space-4) 0 var(--space-5); padding: var(--space-6) var(--space-8); border: 1px solid var(--border); border-top: 3px solid var(--t); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-1); }
.cmp-hero-main { min-width: 0; }
.cmp-kicker { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); font-size: 0.86rem; font-weight: 700; color: var(--t); }
.cmp-hero h1 { margin: 0 0 var(--space-4); max-width: 900px; font-size: clamp(1.15rem, 2vw, 1.4rem); font-weight: 600; line-height: 1.5; letter-spacing: -0.01em; }
.cmp-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.cmp-chips span { padding: 3px 11px; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--ds-soft); font-size: 0.8rem; color: var(--text2); }
.cmp-count { min-width: 110px; text-align: center; }
.cmp-count strong { display: block; font-size: 2.6rem; font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
.cmp-count span { font-size: 0.86rem; color: var(--text3); }

.cmp-gate { max-width: 520px; margin: var(--space-10) auto; padding: var(--space-10) var(--space-8); text-align: center; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-1); }
.cmp-gate-icon { width: 52px; height: 52px; margin: 0 auto var(--space-4); display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--accent-dim); color: var(--accent-text); }
.cmp-gate h2 { margin: 0 0 var(--space-2); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.01em; }
.cmp-gate p { margin: 0 0 var(--space-6); font-size: 0.95rem; line-height: 1.55; color: var(--text2); }
.cmp-locked { margin: var(--space-10) 0; }

.cmp-free { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); margin: 0 0 var(--space-4); font-size: 0.92rem; color: var(--text2); }
.cmp-free > span { padding: 2px 10px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-size: 0.78rem; font-weight: 700; }
.cmp-free strong { color: var(--text); }

.cmp-grid { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5); align-items: start; }
.cmp-pane { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-1); }
.cmp-pane.a { border-top: 3px solid var(--accent); }
.cmp-pane.b { border-top: 3px solid var(--premium-text); }
.cmp-head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border); }
.cmp-avatar { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.95rem; font-weight: 700; }
.cmp-avatar.small { width: 22px; height: 22px; font-size: 0.62rem; }
.cmp-avatar.a { background: var(--accent-dim); color: var(--accent-text); }
.cmp-avatar.b { background: var(--premium-wash); color: var(--premium-text); }
.cmp-who { flex: 1; min-width: 0; }
.cmp-name { font-size: 1.02rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cmp-sub { display: flex; gap: var(--space-2); margin-top: 2px; font-size: 0.8rem; color: var(--text3); white-space: nowrap; overflow: hidden; }
.cmp-sub span + span::before { content: '·'; margin-right: var(--space-2); }
.cmp-pane.a .cmp-side { color: var(--accent-text); font-weight: 700; }
.cmp-pane.b .cmp-side { color: var(--premium-text); font-weight: 700; }
.cmp-change { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; gap: var(--space-2); padding: 6px 12px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font-size: 0.84rem; font-weight: 600; transition: border-color 0.15s, color 0.15s; }
.cmp-change:hover, .cmp-change:focus-within { border-color: var(--accent); color: var(--accent-text); }
.cmp-change select { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; font-size: 1rem; }
.cmp-asked-box { padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border); background: var(--ds-soft); }
.cmp-asked-label { margin-bottom: 2px; font-size: 0.76rem; font-weight: 700; color: var(--text3); }
.cmp-asked { margin: 0; font-size: 0.88rem; line-height: 1.5; color: var(--text2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cmp-denied { padding: var(--space-8) var(--space-4); background: var(--ds-soft); }
.cmp-swap { position: absolute; left: 50%; top: 26px; transform: translateX(-50%); z-index: 2; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border2); border-radius: 50%; background: var(--ds-card); color: var(--text2); box-shadow: var(--elev-2); cursor: pointer; transition: color 0.15s, border-color 0.15s, transform 0.2s; }
.cmp-swap:hover { color: var(--accent-text); border-color: var(--accent); transform: translateX(-50%) rotate(180deg); }
.cmp-tabs { display: none; gap: 4px; margin-bottom: var(--space-3); padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.cmp-tabs button { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: 8px 10px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.cmp-tabs button span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmp-tabs button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }

@media (max-width: 768px) {
  .cmp-wrap { padding: var(--space-4) var(--space-4) var(--space-10); }
  .cmp-hero { grid-template-columns: 1fr; gap: var(--space-4); padding: var(--space-5) var(--space-4); }
  .cmp-count { text-align: left; display: flex; align-items: baseline; gap: var(--space-2); }
  .cmp-count strong { display: inline; font-size: 1.6rem; }
  .cmp-grid { display: block; }
  .cmp-pane[data-active="false"] { display: none; }
  .cmp-tabs { display: flex; }
  .cmp-swap { display: none; }
  /* The name gets the row; the picker goes under it, full width. */
  .cmp-head { flex-wrap: wrap; padding: var(--space-4); }
  .cmp-change { order: 3; width: 100%; justify-content: center; }
  .cmp-gate { padding: var(--space-8) var(--space-5); }
}
`;
