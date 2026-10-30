'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { auth, signInWithGoogle } from '@/lib/firebase';
import TopperPdf, { type TopperCopyDetail } from '@/components/TopperPdf';
import TopperLocked from '@/components/TopperLocked';
import OwlLoader from '@/components/OwlLoader';
import Mascot from '@/components/Mascot';
import { initials, parseNote } from '@/components/topper/note';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi } from '@/lib/pyqHi';

const noSubscribe = () => () => {};

/**
 * One topper copy. Who may open it is decided before any PDF is asked for;
 * opening it is what spends a free view, and the server does that when
 * TopperPdf fetches it, so nothing here counts.
 *
 * Signed out, this showed the unlock card, whose button needs an
 * account and so did nothing: a reader arriving from a link was stuck. They
 * are asked to sign in now, which is what their five free copies need.
 *
 * ?pyq= names the PYQ this copy answers as asked, when the page linking here
 * knows it does: Hindi mode then shows that PYQ's Hindi for the question.
 * Without it the copy's own question stays, since a copy linked to a PYQ
 * has often answered a differently worded question on its theme.
 */
export default function TopperCopyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);
  const pyqId = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get('pyq') ?? '', () => '');
  const questionHi = usePyqHi(langHi && /^\d+$/.test(pyqId))?.q[pyqId];
  const [copy, setCopy] = useState<TopperCopyDetail | null>(null);
  const [state, setState] = useState<'checking' | 'signed-out' | 'locked' | 'open'>('checking');

  // Kept subscribed, so signing in from the card below opens the copy.
  useEffect(() => auth.onAuthStateChanged(async (user) => {
    if (!user) { setState('signed-out'); return; }
    const token = await user.getIdToken();
    const data = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => ({ access: true }));
    setState(data.access === true ? 'open' : 'locked');
  }), []);

  const back = () => (window.history.length > 1 ? router.back() : router.push('/topper-copies'));
  const { name, rank, year } = parseNote(copy?.note ?? null);

  return (
    <div className="tv ds">
      <style>{TV_CSS}</style>
      <div className="tv-wrap">
        <button type="button" className="ds-back" onClick={back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          {L('Back', 'वापस')}
        </button>

        {state === 'checking' && <OwlLoader label={L('Checking your access', 'आपकी पहुँच जाँची जा रही है')} />}

        {state === 'signed-out' && (
          <div className="tv-gate">
            <Mascot pose="reading" width={84} />
            <h1>{L('Sign in to read this copy', 'यह कॉपी पढ़ने के लिए साइन इन करें')}</h1>
            <p>{L('A free account opens your first five topper copies, and keeps your notes and progress with you.', 'निःशुल्क खाते से आपकी पहली पाँच टॉपर कॉपियाँ खुलती हैं, और आपके नोट्स व प्रगति आपके साथ रहते हैं।')}</p>
            <button type="button" className="ds-btn ds-btn-solid" onClick={() => signInWithGoogle().catch(() => {})}>{L('Sign in free', 'निःशुल्क साइन इन करें')}</button>
            <Link href="/topper-copies" className="tv-all">{L('See every topper copy', 'सभी टॉपर कॉपियाँ देखें')}</Link>
          </div>
        )}

        {state === 'locked' && (
          <div className="tv-locked"><TopperLocked onUnlocked={() => { setState('open'); router.refresh(); }} onDismiss={back} /></div>
        )}

        {state === 'open' && (
          <>
            {copy && (
              <header className="tv-head">
                <div className="tv-kicker">{L('Topper copy', 'टॉपर कॉपी')}</div>
                <h1 lang={questionHi ? 'hi' : undefined}>{questionHi ?? copy.question}</h1>
                {copy.note && (
                  <div className="tv-who">
                    <span className="tv-avatar" aria-hidden="true">{initials(name)}</span>
                    <span><strong>{name}</strong>{(rank || year) && <span>{[rank, year].filter(Boolean).join(' · ')}</span>}</span>
                  </div>
                )}
              </header>
            )}
            <TopperPdf key={id} copyId={id} height="80vh" onLoad={setCopy} onDenied={() => setState('locked')} />
            {copy && <div className="tv-foot"><Link href="/topper-copies" className="ds-btn ds-btn-line ds-btn-sm">{L('All topper copies', 'सभी टॉपर कॉपियाँ')}</Link></div>}
          </>
        )}
      </div>
    </div>
  );
}

const TV_CSS = `
.tv { background: var(--bg); min-height: 70vh; }
.tv-wrap { max-width: 1000px; margin: 0 auto; padding: var(--space-6) var(--space-6) var(--space-12); }
.tv-head { margin: var(--space-5) 0; padding: var(--space-5) var(--space-6); border: 1px solid var(--border); border-top: 3px solid var(--premium-text); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-1); }
.tv-kicker { margin-bottom: var(--space-2); font-size: 0.86rem; font-weight: 700; color: var(--premium-text); }
.tv-head h1 { margin: 0 0 var(--space-4); font-size: clamp(1.15rem, 2.2vw, 1.4rem); font-weight: 600; line-height: 1.5; letter-spacing: -0.01em; }
.tv-who { display: flex; align-items: center; gap: var(--space-3); }
.tv-who > span:last-child { display: flex; flex-direction: column; }
.tv-who strong { font-size: 0.98rem; }
.tv-who span span { font-size: 0.84rem; color: var(--text3); }
.tv-avatar { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--premium-wash); color: var(--premium-text); font-weight: 800; }
.tv-foot { display: flex; justify-content: center; margin-top: var(--space-6); }
.tv-gate { max-width: 440px; margin: var(--space-10) auto; padding: var(--space-8) var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; border: 1px solid var(--border2); border-radius: var(--radius-xl); background: var(--ds-card); box-shadow: var(--elev-3); }
.tv-gate h1 { margin: var(--space-2) 0 0; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.01em; }
.tv-gate p { margin: 0 0 var(--space-3); font-size: 0.95rem; line-height: 1.55; color: var(--text2); }
.tv-gate .ds-btn { width: 100%; justify-content: center; }
.tv-all { margin-top: var(--space-2); font-size: 0.9rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.tv-locked { margin: var(--space-10) 0; }
@media (max-width: 640px) {
  .tv-wrap { padding: var(--space-4) var(--space-4) var(--space-10); }
  .tv-head { padding: var(--space-4); }
}
`;
