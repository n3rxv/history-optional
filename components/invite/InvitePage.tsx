'use client';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { toast } from '@/components/ui/Toast';
import { inviteLink, REFERRED_DAYS, REFERRER_DAYS } from '@/lib/referral';

type Stats = { code: string; joined: number; daysEarned: number };

/**
 * The reader's invite link and what it has earned. The link is made on the
 * first visit here, by /api/referral; nothing is asked of the server before.
 */
export default function InvitePage() {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const { user, loading } = useFirebaseAuth();
  const { isOpen, message, requireLogin, closeModal } = useLoginPrompt();
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let live = true;
    user.getIdToken()
      .then((token) => fetch('/api/referral', { headers: { 'x-user-token': token } }))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Stats) => { if (live) setStats(d); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [user]);

  const link = stats ? inviteLink(stats.code) : '';
  const text = T(
    `For UPSC History optional, try History Optional: notes, PYQs and answer checking. Buy your first 6-month or yearly plan through my link and get ${REFERRED_DAYS} extra days:`,
    `UPSC इतिहास वैकल्पिक के लिए History Optional आज़माएँ: नोट्स, PYQ और उत्तर जाँच। मेरे लिंक से अपना पहला 6 महीने या एक साल का प्लान लें और ${REFERRED_DAYS} दिन अतिरिक्त पाएँ:`,
  );

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast(T('Link copied', 'लिंक कॉपी हो गया')); }
    catch { toast(link); }
  };
  const share = async () => {
    try { await navigator.share({ title: 'History Optional', text, url: link }); }
    catch (e) { if ((e as Error).name !== 'AbortError') await copy(); }
  };

  return (
    <div className="iv ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ds-container iv-wrap">
        <h1 className="ds-h1 iv-h1">{T('Invite a friend', 'किसी दोस्त को बुलाएँ')}</h1>
        <p className="ds-lede iv-lede">
          {T(`When a friend buys their first 6-month or yearly plan through your link, they get ${REFERRED_DAYS} extra days and you get ${REFERRER_DAYS}.`,
            `जब कोई दोस्त आपके लिंक से अपना पहला 6 महीने या एक साल का प्लान ख़रीदता है, तो उसे ${REFERRED_DAYS} दिन अतिरिक्त मिलते हैं और आपको ${REFERRER_DAYS}।`)}
        </p>

        <section className="iv-card ds-card" aria-live="polite">
          {loading ? null : !user ? (
            <>
              <p className="iv-muted">{T('Sign in to get your invite link.', 'अपना आमंत्रण लिंक पाने के लिए साइन इन करें।')}</p>
              <button type="button" className="ds-btn ds-btn-solid" onClick={() => requireLogin(T('Sign in to get your invite link.', 'अपना आमंत्रण लिंक पाने के लिए साइन इन करें।'))}>{T('Sign in', 'साइन इन')}</button>
            </>
          ) : failed ? (
            <p className="iv-muted">{T('Your link could not be loaded. Refresh the page to try again.', 'आपका लिंक लोड नहीं हो सका। फिर कोशिश करने के लिए पेज रीफ़्रेश करें।')}</p>
          ) : !stats ? (
            <p className="iv-muted">{T('Making your link…', 'आपका लिंक बन रहा है…')}</p>
          ) : (
            <>
              <label className="iv-label" htmlFor="iv-link">{T('Your invite link', 'आपका आमंत्रण लिंक')}</label>
              <div className="iv-linkrow">
                <input id="iv-link" className="iv-link" value={link} readOnly onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="ds-btn ds-btn-solid" onClick={copy}>{T('Copy', 'कॉपी करें')}</button>
              </div>
              <div className="iv-share">
                <a className="ds-btn ds-btn-line" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a className="ds-btn ds-btn-line" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Telegram</a>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button type="button" className="ds-btn ds-btn-line" onClick={share}>{T('More', 'और')}</button>
                )}
              </div>
              <p className="iv-stats">
                {stats.joined === 0
                  ? T('No friends have joined through your link yet.', 'अभी तक आपके लिंक से कोई दोस्त नहीं जुड़ा है।')
                  : T(`${stats.joined} ${stats.joined === 1 ? 'friend has' : 'friends have'} joined. You have earned ${stats.daysEarned} days.`,
                    `${stats.joined} ${stats.joined === 1 ? 'दोस्त जुड़ा' : 'दोस्त जुड़े'}। आपने ${stats.daysEarned} दिन कमाए हैं।`)}
              </p>
            </>
          )}
        </section>

        <section className="iv-how">
          <h2>{T('How it works', 'यह कैसे काम करता है')}</h2>
          <ol>
            <li>{T('Send your link to friends preparing for History optional.', 'अपना लिंक इतिहास वैकल्पिक की तैयारी कर रहे दोस्तों को भेजें।')}</li>
            <li>{T('A friend buys the 6-month or yearly plan through it. Only their first purchase counts.', 'दोस्त उस लिंक से 6 महीने या एक साल का प्लान ख़रीदता है। केवल उसकी पहली ख़रीद गिनी जाती है।')}</li>
            <li>{T(`They get ${REFERRED_DAYS} extra days and you get ${REFERRER_DAYS}, added to your plans as soon as they pay. If you are not on a plan, your days start then.`,
              `उसे ${REFERRED_DAYS} दिन अतिरिक्त मिलते हैं और आपको ${REFERRER_DAYS}, जो उसके भुगतान करते ही आपके प्लान में जुड़ जाते हैं। अगर आप किसी प्लान पर नहीं हैं, तो आपके दिन तभी शुरू होते हैं।`)}</li>
          </ol>
          <p className="iv-muted">{T('The day plan does not count, and nor does a purchase on your own account.', 'एक दिन का प्लान नहीं गिना जाता, और न ही आपके अपने खाते पर की गई ख़रीद।')}</p>
        </section>
      </div>
      <LoginPromptModal isOpen={isOpen} onClose={closeModal} message={message} />
    </div>
  );
}

const CSS = `
.iv-wrap { max-width: 720px; padding-top: var(--space-10); padding-bottom: var(--space-12); }
.iv-h1 { margin: 0; }
.iv-lede { margin: var(--space-4) 0 0; }
.iv-card { margin-top: var(--space-8); padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); align-items: flex-start; }
.iv-label { font-family: var(--font-ui); font-size: 0.84rem; font-weight: 600; color: var(--text2); }
.iv-linkrow { display: flex; gap: var(--space-2); width: 100%; margin-top: calc(-1 * var(--space-2)); }
.iv-link { flex: 1; min-width: 0; padding: 0 var(--space-3); min-height: 46px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg2); font-family: var(--font-ui); font-size: 0.92rem; color: var(--text); }
.iv-share { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.iv-stats, .iv-muted { margin: 0; font-family: var(--font-ui); font-size: 0.9rem; line-height: 1.55; color: var(--text3); }
.iv-stats { color: var(--text2); }
.iv-how { margin-top: var(--space-10); }
.iv-how h2 { margin: 0 0 var(--space-3); font-size: 1.2rem; color: var(--text); }
.iv-how ol { margin: 0 0 var(--space-4); padding-left: 1.2em; display: flex; flex-direction: column; gap: var(--space-2); }
.iv-how li { line-height: 1.6; color: var(--text2); }
@media (max-width: 720px) {
  .iv-wrap { padding-top: var(--space-6); }
  .iv-card { padding: var(--space-5); }
  .iv-share .ds-btn { flex: 1 1 0; justify-content: center; }
}
`;
