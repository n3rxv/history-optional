'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { useLang } from '@/lib/i18n/LangContext';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { toast } from '@/components/ui/Toast';
import { FRIEND_DISCOUNT_PAISE, REFERRAL_REWARD_PAISE, formatPaise, inviteLink, isUpiId, normalisePhone } from '@/lib/referral';
import type { ReferralSummary } from '@/lib/referralServer';

/**
 * The reader's invite link, balance and cash-out. The link is made on the
 * first visit here, by /api/referral; nothing is asked of the server before.
 * The rules are in lib/referral and supabase/referral_balance.sql.
 */
export default function InvitePage() {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const { user, loading } = useFirebaseAuth();
  const { isOpen, message, requireLogin, closeModal } = useLoginPrompt();
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [upi, setUpi] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [cashErr, setCashErr] = useState<string | null>(null);

  const load = useCallback(async (u: User) => {
    try {
      const token = await u.getIdToken();
      const r = await fetch('/api/referral', { headers: { 'x-user-token': token } });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as ReferralSummary;
      setData(d);
      setUpi((v) => v || d.lastUpi || '');
      setPhone((v) => v || d.defaultPhone || '');
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => { if (live) await load(user); })();
    return () => { live = false; };
  }, [user, load]);

  const rs = (paise: number) => formatPaise(paise);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(langHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const listOf = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${T('and', 'और')} ${items[items.length - 1]}`;

  const HISTORY: Record<string, string> = {
    earn: T('A friend bought a yearly plan', 'एक दोस्त ने एक साल का प्लान ख़रीदा'),
    spend: T('Used on your yearly plan', 'आपके एक साल के प्लान पर इस्तेमाल हुआ'),
    payout: T('Cashed out to UPI', 'UPI पर निकाला गया'),
    payout_reversed: T('Cash-out cancelled, back in your balance', 'निकासी रद्द, पैसे बैलेंस में वापस'),
  };
  const REFUSED: Record<string, string> = {
    bad_upi: T('Enter a UPI id like name@bank.', 'name@bank जैसी UPI आईडी डालें।'),
    bad_phone: T('Enter your 10-digit mobile number.', 'अपना 10 अंकों का मोबाइल नंबर डालें।'),
    no_window: T('Cash-out opens once you have bought a yearly plan.', 'एक साल का प्लान लेने के बाद ही पैसे निकाल सकते हैं।'),
    pending: T('Your last request is still being paid.', 'आपकी पिछली माँग का भुगतान अभी बाक़ी है।'),
    not_yet: T('Cash-out opens at your next milestone.', 'अगले पड़ाव पर पैसे निकाल सकेंगे।'),
    empty: T('There is nothing in your balance to cash out.', 'आपके बैलेंस में निकालने के लिए कुछ नहीं है।'),
    failed: T('Could not send the request. Try again.', 'माँग नहीं भेजी जा सकी। फिर कोशिश करें।'),
  };

  const link = data ? inviteLink(data.code) : '';
  const text = T(
    `For UPSC History optional, try History Optional: notes, PYQs and answer checking. Buy your first yearly plan through my link and pay ${rs(FRIEND_DISCOUNT_PAISE)} less:`,
    `UPSC इतिहास वैकल्पिक के लिए History Optional आज़माएँ: नोट्स, PYQ और उत्तर जाँच। मेरे लिंक से अपना पहला एक साल का प्लान लें और ${rs(FRIEND_DISCOUNT_PAISE)} कम दें:`,
  );

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast(T('Link copied', 'लिंक कॉपी हो गया')); }
    catch { toast(link); }
  };
  const share = async () => {
    try { await navigator.share({ title: 'History Optional', text, url: link }); }
    catch (e) { if ((e as Error).name !== 'AbortError') await copy(); }
  };

  const cashOut = async () => {
    if (!user || !data) return;
    setCashErr(null);
    if (!isUpiId(upi)) { setCashErr(REFUSED.bad_upi); return; }
    if (!normalisePhone(phone)) { setCashErr(REFUSED.bad_phone); return; }
    setSending(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/referral/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token },
        body: JSON.stringify({ upi: upi.trim(), phone }),
      });
      const d = await r.json();
      if (!r.ok) { setCashErr(REFUSED[d.code] ?? REFUSED.failed); return; }
      toast(T(`${rs(d.amountPaise)} requested`, `${rs(d.amountPaise)} की माँग भेज दी`));
      await load(user);
    } catch {
      setCashErr(REFUSED.failed);
    } finally {
      setSending(false);
    }
  };

  const win = data?.window ?? null;
  const next = win?.milestones.find((m) => !m.reached);

  return (
    <div className="iv ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ds-container iv-wrap">
        <h1 className="ds-h1 iv-h1">{T(`Invite friends, earn ${rs(REFERRAL_REWARD_PAISE)} each`, `दोस्तों को बुलाएँ, हर दोस्त पर ${rs(REFERRAL_REWARD_PAISE)} कमाएँ`)}</h1>
        <p className="ds-lede iv-lede">
          {T(`When a friend buys their first yearly plan through your link, they pay ${rs(FRIEND_DISCOUNT_PAISE)} less and you get ${rs(REFERRAL_REWARD_PAISE)} in your balance.`,
            `जब कोई दोस्त आपके लिंक से अपना पहला एक साल का प्लान ख़रीदता है, तो उसे ${rs(FRIEND_DISCOUNT_PAISE)} कम देने पड़ते हैं और आपके बैलेंस में ${rs(REFERRAL_REWARD_PAISE)} जुड़ जाते हैं।`)}
        </p>

        <section className="iv-card ds-card" aria-live="polite">
          {loading ? null : !user ? (
            <>
              <p className="iv-muted">{T('Sign in to get your invite link.', 'अपना आमंत्रण लिंक पाने के लिए साइन इन करें।')}</p>
              <button type="button" className="ds-btn ds-btn-solid" onClick={() => requireLogin(T('Sign in to get your invite link.', 'अपना आमंत्रण लिंक पाने के लिए साइन इन करें।'))}>{T('Sign in', 'साइन इन')}</button>
            </>
          ) : failed ? (
            <p className="iv-muted">{T('Your link could not be loaded. Refresh the page to try again.', 'आपका लिंक लोड नहीं हो सका। फिर कोशिश करने के लिए पेज रीफ़्रेश करें।')}</p>
          ) : !data ? (
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
                {data.friends === 0
                  ? T('No friends have joined through your link yet.', 'अभी तक आपके लिंक से कोई दोस्त नहीं जुड़ा है।')
                  : T(`${data.friends} ${data.friends === 1 ? 'friend has' : 'friends have'} joined through your link.`,
                    `आपके लिंक से ${data.friends} ${data.friends === 1 ? 'दोस्त जुड़ा है' : 'दोस्त जुड़े हैं'}।`)}
              </p>
            </>
          )}
        </section>

        {user && data && (
          <section className="iv-card ds-card iv-bal" aria-labelledby="iv-bal-title">
            <div className="iv-bal-top">
              <h2 id="iv-bal-title" className="iv-label">{T('Your balance', 'आपका बैलेंस')}</h2>
              <p className="iv-amount">{rs(Math.max(0, data.balancePaise))}</p>
            </div>

            {!win ? (
              <p className="iv-text">
                {T('It comes off your own yearly plan at checkout, up to the full price. Once you have a yearly plan, you can cash it out to UPI as well.',
                  'यह चेकआउट पर आपके अपने एक साल के प्लान से घट जाता है, पूरी क़ीमत तक। एक साल का प्लान लेने के बाद आप इसे UPI पर भी निकाल सकते हैं।')}
                {data.balancePaise > 0 && <> <Link href="/pricing" className="iv-a">{T('Use it on a yearly plan', 'इसे एक साल के प्लान पर इस्तेमाल करें')}</Link></>}
              </p>
            ) : win.capPaise === 0 ? (
              <p className="iv-text">
                {T('Your current yearly plan was paid from your balance, so invites start earning again with your next yearly plan. Your balance still comes off it at checkout.',
                  'आपका मौजूदा एक साल का प्लान बैलेंस से चुकाया गया था, इसलिए आमंत्रणों से कमाई आपके अगले एक साल के प्लान से फिर शुरू होगी। तब भी आपका बैलेंस चेकआउट पर घटता रहेगा।')}
              </p>
            ) : (
              <>
                <div className="iv-meter">
                  <div className="iv-meter-head">
                    <span>{T('Earned on this yearly plan', 'इस एक साल के प्लान पर कमाई')}</span>
                    <strong>{T(`${rs(win.earnedPaise)} of ${rs(win.capPaise)}`, `${rs(win.capPaise)} में से ${rs(win.earnedPaise)}`)}</strong>
                  </div>
                  <div className="iv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={win.capPaise} aria-valuenow={win.earnedPaise} aria-label={T('Earned towards your limit', 'आपकी सीमा की ओर कमाई')}>
                    <span className="iv-bar-fill" style={{ width: `${Math.min(100, (win.earnedPaise / win.capPaise) * 100)}%` }} />
                    {win.milestones.slice(0, -1).map((m) => (
                      <span key={m.atPaise} className={`iv-tick${m.reached ? ' on' : ''}`} style={{ left: `${(m.atPaise / win.capPaise) * 100}%` }} />
                    ))}
                  </div>
                  <p className="iv-muted">
                    {T(`Cash-out opens at ${listOf(win.milestones.map((m) => rs(m.atPaise)))} earned. Your limit is what this plan brought in after payment fees.`,
                      `कमाई ${listOf(win.milestones.map((m) => rs(m.atPaise)))} पहुँचने पर पैसे निकाल सकते हैं। आपकी सीमा वह रक़म है जो पेमेंट शुल्क कटने के बाद इस प्लान से आई।`)}
                  </p>
                </div>

                {data.pending ? (
                  <p className="iv-pending">
                    {T(`${rs(data.pending.amountPaise)} is on its way to ${data.pending.upi}, asked for on ${fmtDate(data.pending.requestedAt)}.`,
                      `${rs(data.pending.amountPaise)}, ${data.pending.upi} पर भेजे जा रहे हैं। आपने ${fmtDate(data.pending.requestedAt)} को माँगे थे।`)}
                  </p>
                ) : data.canCashOut ? (
                  <div className="iv-cash">
                    <h3 className="iv-label">{T(`Cash out ${rs(data.balancePaise)} to UPI`, `${rs(data.balancePaise)} UPI पर निकालें`)}</h3>
                    <div className="iv-fields">
                      <label className="iv-field">
                        <span>{T('UPI id', 'UPI आईडी')}</span>
                        <input id="iv-upi" className="iv-link" value={upi} onChange={(e) => { setUpi(e.target.value); setCashErr(null); }}
                          placeholder="name@bank" autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="email" />
                      </label>
                      <label className="iv-field">
                        <span>{T('Mobile number', 'मोबाइल नंबर')}</span>
                        <input id="iv-phone" className="iv-link" value={phone} onChange={(e) => { setPhone(e.target.value); setCashErr(null); }}
                          placeholder="98765 43210" autoComplete="tel-national" inputMode="tel" />
                      </label>
                    </div>
                    <button type="button" className={`ds-btn ds-btn-solid iv-cash-btn${sending ? ' is-loading' : ''}`} onClick={cashOut} disabled={sending}>
                      {sending ? T('Sending…', 'भेज रहे हैं…') : T(`Cash out ${rs(data.balancePaise)}`, `${rs(data.balancePaise)} निकालें`)}
                    </button>
                    {cashErr && <p className="iv-err" role="alert">{cashErr}</p>}
                    <p className="iv-muted">
                      {T('Or keep it for your next yearly plan. Check the UPI id: the money goes to whoever it belongs to.',
                        'या इसे अपने अगले एक साल के प्लान के लिए रखें। UPI आईडी ध्यान से जाँचें: पैसे उसी को जाएँगे जिसकी यह आईडी है।')}
                    </p>
                  </div>
                ) : next ? (
                  <p className="iv-muted">{T(`Your next cash-out opens at ${rs(next.atPaise)} earned.`, `अगली बार पैसे तब निकाल सकेंगे जब कमाई ${rs(next.atPaise)} हो जाएगी।`)}</p>
                ) : null}
              </>
            )}

            {data.history.length > 0 && (
              <div className="iv-hist">
                <h3 className="iv-label">{T('History', 'हिसाब')}</h3>
                <ul>
                  {data.history.map((h, i) => (
                    <li key={i}>
                      <span>{HISTORY[h.kind] ?? h.kind}<small>{fmtDate(h.at)}</small></span>
                      <strong className={h.amountPaise > 0 ? 'plus' : ''}>{h.amountPaise > 0 ? '+' : '−'}{rs(Math.abs(h.amountPaise))}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="iv-how">
          <h2>{T('How it works', 'यह कैसे काम करता है')}</h2>
          <ol>
            <li>{T('Send your link to friends preparing for History optional.', 'अपना लिंक इतिहास वैकल्पिक की तैयारी कर रहे दोस्तों को भेजें।')}</li>
            <li>{T(`A friend buys their first yearly plan through it and pays ${rs(FRIEND_DISCOUNT_PAISE)} less. You get ${rs(REFERRAL_REWARD_PAISE)} in your balance.`,
              `दोस्त उस लिंक से अपना पहला एक साल का प्लान ख़रीदता है और ${rs(FRIEND_DISCOUNT_PAISE)} कम देता है। आपके बैलेंस में ${rs(REFERRAL_REWARD_PAISE)} जुड़ जाते हैं।`)}</li>
            <li>{T('Before you have a yearly plan, your balance comes off yours at checkout, up to the full price.',
              'जब तक आपके पास एक साल का प्लान नहीं है, आपका बैलेंस चेकआउट पर आपके प्लान से घटता है, पूरी क़ीमत तक।')}</li>
            <li>{T('With a yearly plan, you can earn up to what it brought in after payment fees, about ₹2,830 on a ₹2,899 plan. Each new yearly plan starts this again.',
              'एक साल का प्लान लेने के बाद आप उतना कमा सकते हैं जितना वह प्लान पेमेंट शुल्क कटने के बाद लाया, ₹2,899 के प्लान पर लगभग ₹2,830। हर नया एक साल का प्लान यह गिनती फिर से शुरू करता है।')}</li>
            <li>{T('Cash out to UPI when your earnings reach ₹1,000, ₹2,000 and your limit, or keep the balance for your next yearly plan.',
              'कमाई ₹1,000, ₹2,000 और आपकी सीमा तक पहुँचने पर पैसे UPI पर निकालें, या बैलेंस अपने अगले एक साल के प्लान के लिए रखें।')}</li>
          </ol>
          <p className="iv-muted">{T('Only yearly plans count. Your balance stays for as long as invites run.', 'केवल एक साल के प्लान गिने जाते हैं। जब तक आमंत्रण चल रहे हैं, आपका बैलेंस बना रहेगा।')}</p>
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
.iv-card + .iv-card { margin-top: var(--space-4); }
.iv-label { margin: 0; font-family: var(--font-ui); font-size: 0.84rem; font-weight: 600; color: var(--text2); }
.iv-linkrow { display: flex; gap: var(--space-2); width: 100%; margin-top: calc(-1 * var(--space-2)); }
.iv-link { flex: 1; min-width: 0; padding: 0 var(--space-3); min-height: 46px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg2); font-family: var(--font-ui); font-size: 0.92rem; color: var(--text); }
.iv-share { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.iv-stats, .iv-muted, .iv-text { margin: 0; font-family: var(--font-ui); font-size: 0.9rem; line-height: 1.55; color: var(--text3); }
.iv-stats, .iv-text { color: var(--text2); }
.iv-a { color: var(--accent-text); font-weight: 600; }
.iv-bal { align-items: stretch; }
.iv-bal-top { display: flex; flex-direction: column; gap: 2px; }
.iv-amount { margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
.iv-meter { display: flex; flex-direction: column; gap: var(--space-2); }
.iv-meter-head { display: flex; justify-content: space-between; gap: var(--space-3); font-family: var(--font-ui); font-size: 0.88rem; color: var(--text2); }
.iv-meter-head strong { color: var(--text); white-space: nowrap; }
.iv-bar { position: relative; height: 10px; border-radius: var(--radius-full); background: var(--ds-soft); }
.iv-bar-fill { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--accent); }
.iv-tick { position: absolute; top: -3px; width: 2px; height: 16px; margin-left: -1px; border-radius: 1px; background: var(--border2, var(--border)); }
.iv-tick.on { background: var(--accent-on); }
.iv-pending { margin: 0; padding: 10px 14px; border-radius: var(--radius-lg); background: var(--success-wash); color: var(--success-text); font-family: var(--font-ui); font-size: 0.9rem; font-weight: 600; }
.iv-cash { display: flex; flex-direction: column; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--border); }
.iv-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-3); }
.iv-field { display: flex; flex-direction: column; gap: 4px; font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); }
.iv-cash-btn { align-self: flex-start; }
.iv-err { margin: 0; font-family: var(--font-ui); font-size: 0.86rem; color: var(--danger-text); }
.iv-hist { padding-top: var(--space-4); border-top: 1px solid var(--border); }
.iv-hist ul { list-style: none; margin: var(--space-2) 0 0; padding: 0; display: flex; flex-direction: column; }
.iv-hist li { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--border); font-family: var(--font-ui); font-size: 0.9rem; color: var(--text2); }
.iv-hist li:last-child { border-bottom: none; }
.iv-hist li span { display: flex; flex-direction: column; }
.iv-hist small { font-size: 0.78rem; color: var(--text3); }
.iv-hist strong { color: var(--text); white-space: nowrap; }
.iv-hist strong.plus { color: var(--success-text); }
.iv-how { margin-top: var(--space-10); }
.iv-how h2 { margin: 0 0 var(--space-3); font-size: 1.2rem; color: var(--text); }
.iv-how ol { margin: 0 0 var(--space-4); padding-left: 1.2em; display: flex; flex-direction: column; gap: var(--space-2); }
.iv-how li { line-height: 1.6; color: var(--text2); }
@media (max-width: 720px) {
  .iv-wrap { padding-top: var(--space-6); }
  .iv-card { padding: var(--space-5); }
  .iv-share .ds-btn { flex: 1 1 0; justify-content: center; }
  .iv-meter-head { flex-direction: column; gap: 2px; }
  .iv-fields { grid-template-columns: minmax(0, 1fr); }
  .iv-cash-btn { align-self: stretch; justify-content: center; }
}
`;
