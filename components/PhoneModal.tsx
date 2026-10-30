'use client';

import { useEffect, useRef, useState } from 'react';
import Mascot from '@/components/Mascot';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * The profile route's validation messages (lib/name.ts, lib/phone.ts and the
 * route itself) in Hindi, matched on the English it sends back.
 */
const SERVER_HI: Record<string, string> = {
  'Please enter your first name.': 'कृपया अपना पहला नाम लिखें।',
  'That last name is not valid.': 'यह उपनाम सही नहीं है।',
  'Please enter your phone number.': 'कृपया अपना फ़ोन नंबर लिखें।',
  'That does not look like a phone number.': 'यह फ़ोन नंबर जैसा नहीं लगता।',
  'That number looks too short or too long.': 'यह नंबर बहुत छोटा या बहुत लंबा लगता है।',
  'Please enter a real phone number.': 'कृपया अपना असली फ़ोन नंबर लिखें।',
  'Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.': 'भारतीय मोबाइल नंबर 10 अंकों का होता है और 6, 7, 8 या 9 से शुरू होता है।',
  'Could not identify this browser.': 'इस ब्राउज़र की पहचान नहीं हो सकी।',
  'Too many attempts. Try again later.': 'बहुत ज़्यादा कोशिशें हुईं। थोड़ी देर बाद फिर कोशिश करें।',
  'Could not save your number. Please try again.': 'आपका नंबर सहेजा नहीं जा सका। कृपया फिर कोशिश करें।',
};
function serverErrorHi(msg: string): string {
  if (SERVER_HI[msg]) return SERVER_HI[msg];
  const long = msg.match(/^(First|Last) name must be under (\d+) characters\.$/);
  if (long) return `${long[1] === 'First' ? 'पहला नाम' : 'उपनाम'} ${long[2]} अक्षरों से छोटा होना चाहिए।`;
  return 'कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।';
}

export const COUNTRIES = [
  { code: '+91',  flag: '🇮🇳', name: 'India', hi: 'भारत' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada', hi: 'अमेरिका / कनाडा' },
  { code: '+44',  flag: '🇬🇧', name: 'UK', hi: 'ब्रिटेन' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia', hi: 'ऑस्ट्रेलिया' },
  { code: '+971', flag: '🇦🇪', name: 'UAE', hi: 'संयुक्त अरब अमीरात' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore', hi: 'सिंगापुर' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia', hi: 'मलेशिया' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand', hi: 'न्यूज़ीलैंड' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland', hi: 'आयरलैंड' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany', hi: 'जर्मनी' },
  { code: '+33',  flag: '🇫🇷', name: 'France', hi: 'फ़्रांस' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy', hi: 'इटली' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain', hi: 'स्पेन' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands', hi: 'नीदरलैंड्स' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden', hi: 'स्वीडन' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway', hi: 'नॉर्वे' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark', hi: 'डेनमार्क' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland', hi: 'स्विट्ज़रलैंड' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria', hi: 'ऑस्ट्रिया' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium', hi: 'बेल्जियम' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal', hi: 'पुर्तगाल' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland', hi: 'पोलैंड' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic', hi: 'चेक गणराज्य' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary', hi: 'हंगरी' },
  { code: '+40',  flag: '🇷🇴', name: 'Romania', hi: 'रोमानिया' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia', hi: 'रूस' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine', hi: 'यूक्रेन' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey', hi: 'तुर्की' },
  { code: '+972', flag: '🇮🇱', name: 'Israel', hi: 'इज़राइल' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', hi: 'सऊदी अरब' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar', hi: 'क़तर' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait', hi: 'कुवैत' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain', hi: 'बहरीन' },
  { code: '+968', flag: '🇴🇲', name: 'Oman', hi: 'ओमान' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan', hi: 'पाकिस्तान' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', hi: 'बांग्लादेश' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka', hi: 'श्रीलंका' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal', hi: 'नेपाल' },
  { code: '+95',  flag: '🇲🇲', name: 'Myanmar', hi: 'म्यांमार' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand', hi: 'थाईलैंड' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam', hi: 'वियतनाम' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia', hi: 'इंडोनेशिया' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines', hi: 'फ़िलीपींस' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea', hi: 'दक्षिण कोरिया' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan', hi: 'जापान' },
  { code: '+86',  flag: '🇨🇳', name: 'China', hi: 'चीन' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong', hi: 'हांगकांग' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan', hi: 'ताइवान' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil', hi: 'ब्राज़ील' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina', hi: 'अर्जेंटीना' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico', hi: 'मेक्सिको' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile', hi: 'चिली' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia', hi: 'कोलंबिया' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa', hi: 'दक्षिण अफ़्रीका' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria', hi: 'नाइजीरिया' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya', hi: 'केन्या' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt', hi: 'मिस्र' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco', hi: 'मोरक्को' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana', hi: 'घाना' },
];

export function PhoneModal({
  getToken,
  visitorId,
  initialFirstName,
  initialLastName,
  email,
  onDone,
  onCancel,
}: {
  /**
   * Returns a fresh Firebase ID token, or null for anonymous browsers.
   *
   * A function rather than a string: ID tokens expire after an hour, and this
   * modal can sit open far longer than that. A token captured at mount would
   * be rejected on submit, and the save would silently land as an anonymous
   * row instead of on the account.
   */
  getToken?: () => Promise<string | null>;
  /** The FingerprintJS id, sent when there is no token. */
  visitorId?: string | null;
  /**
   * What is already on file. Google gives a display name at sign-up, so most
   * signed-in readers have a name stored before they ever see this and only
   * need to add the number.
   */
  initialFirstName?: string | null;
  initialLastName?: string | null;
  /** The signed-in account's address, shown read-only so the reader can see which account this is. */
  email?: string | null;
  onDone: () => void;
  /** Omitted for signed-in users: for them the gate has no way past. */
  onCancel?: () => void;
}) {
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);
  // Drives the fade. CSS keyframes cannot animate an unmount, so both
  // directions run off this rather than a class.
  const [shown, setShown] = useState(false);
  const [reduce, setReduce] = useState(false);

  const [firstName, setFirstName] = useState(initialFirstName ?? '');
  const [lastName,  setLastName]  = useState(initialLastName ?? '');
  const [dialCode, setDialCode] = useState('+91');
  const [phone,    setPhone]    = useState('');
  // Which field the server rejected, so the border marks the right input.
  const [errField, setErrField] = useState<'first_name' | 'last_name' | 'phone' | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [open,     setOpen]     = useState(false);
  const [search,   setSearch]   = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * While the modal is up the page behind it must not scroll, and Tab must not
   * walk out of it. The mandatory gate has no close button, so focus landing
   * on the page underneath leaves a keyboard user stranded with no way back.
   */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      // Escape only where there is something to escape to. On the mandatory
      // gate it does nothing, which is the honest behaviour.
      if (e.key === 'Escape' && onCancel) { e.preventDefault(); close(onCancel); return; }
      if (e.key !== 'Tab' || !cardRef.current) return;

      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first)      { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      else if (active && !cardRef.current.contains(active)) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // close/onCancel are stable for the life of the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCancel]);

  useEffect(() => {
    setReduce(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    // Next frame, so the browser paints the hidden state first and has
    // something to transition from.
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const MS = reduce ? 0 : 200;

  /** Fades out, then hands over. Without this the modal vanishes mid-fade. */
  const close = (after?: () => void) => {
    if (!after) return;
    setShown(false);
    setTimeout(after, MS);
  };

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.hi.includes(search.trim()) || c.code.includes(search)
  );
  const countryName = (c: (typeof COUNTRIES)[number]) => (langHi ? c.hi : c.name);
  const selected = COUNTRIES.find(c => c.code === dialCode) ?? COUNTRIES[0];

  const submit = async () => {
    // The Enter handlers call this directly, so the disabled button is not
    // enough to stop a second submit.
    if (loading) return;

    // Checked in the same order the server checks them, so the reader is sent
    // to the first empty field rather than the last.
    if (!firstName.trim()) { setErr(L('Please enter your first name.', 'कृपया अपना पहला नाम लिखें।')); setErrField('first_name'); return; }
    if (!phone.trim())     { setErr(L('Please enter your phone number.', 'कृपया अपना फ़ोन नंबर लिखें।')); setErrField('phone'); return; }

    const digits = phone.replace(/\D/g, '');

    // Caught here rather than at the server because the country is chosen in
    // this component: someone who picks +91 and then types their number with
    // the country code again would otherwise send a 14-digit number that
    // passes the generic international check and is not dialable.
    if (dialCode === '+91' && digits.length !== 10) {
      setErr(digits.length > 10
        ? L('Enter the 10 digits only, without +91.', '+91 के बिना केवल 10 अंक लिखें।')
        : L('An Indian mobile number is 10 digits.', 'भारतीय मोबाइल नंबर 10 अंकों का होता है।'));
      setErrField('phone');
      return;
    }

    setLoading(true); setErr(''); setErrField(null);

    try {
      const token = getToken ? await getToken() : null;
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-user-token': token } : {}),
        },
        body: JSON.stringify({
          phone: dialCode + digits,
          first_name: firstName,
          last_name: lastName,
          visitor_id: visitorId ?? null,
        }),
      });

      // A proxy or an outage can answer with HTML, and .json() throws on it.
      const data = await res.json().catch(() => ({} as { error?: string; field?: string }));

      if (!res.ok) {
        setErr(langHi
          ? serverErrorHi(data.error ?? '')
          : data.error ?? 'Something went wrong. Please try again.');
        setErrField((data.field as typeof errField) ?? null);
        setLoading(false);
        return;
      }
      close(onDone);
    } catch {
      // Offline, or the request was cut off. Without this the button sits on
      // "Saving..." for good, and on the mandatory gate that is a dead end
      // with no way out of the page.
      setErr(L('Could not reach the server. Check your connection and try again.', 'सर्वर से संपर्क नहीं हो सका। अपना कनेक्शन जाँचें और फिर कोशिश करें।'));
      setErrField(null);
      setLoading(false);
    }
  };

  const bad = (f: typeof errField) => (errField === f ? ' bad' : '');

  return (
    <div className={`ds ds-overlay pm-overlay${shown ? ' shown' : ''}`} style={{ ['--pm-ms' as string]: `${MS}ms` }}
      onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={L('Complete your profile', 'अपनी प्रोफ़ाइल पूरी करें')}>
      <style dangerouslySetInnerHTML={{ __html: PM_CSS }} />
      <div ref={cardRef} className="ds-modal pm" onClick={e => e.stopPropagation()}>
        {onCancel && (
          <button type="button" className="ds-x ds-modal-x" onClick={() => close(onCancel)} aria-label={L('Close', 'बंद करें')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
        <div className="pm-head">
          <Mascot pose={getToken ? 'celebrate' : 'peek'} width={72} />
          <h2 className="ds-modal-title">{getToken ? L('You’re signed in', 'आप साइन इन हो गए हैं') : L('Complete your profile', 'अपनी प्रोफ़ाइल पूरी करें')}</h2>
          <p className="ds-modal-text">
            {getToken
              ? L('Check your name and add your number to finish setting up your account.', 'अपना नाम जाँचें और खाता पूरा करने के लिए अपना नंबर जोड़ें।')
              : L('Your name and number, so we can reach you about your account.', 'आपका नाम और नंबर, ताकि आपके खाते के बारे में हम आपसे संपर्क कर सकें।')}
          </p>
        </div>

        <div className="pm-row">
          <label className="pm-field">
            <span className="pm-label">{L('First name', 'पहला नाम')} <i aria-hidden="true">*</i></span>
            <input id="ho-first-name" className={`pm-input${bad('first_name')}`} autoFocus={!initialFirstName} autoComplete="given-name" placeholder={L('Rahul', 'राहुल')}
              value={firstName} onChange={e => setFirstName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </label>
          <label className="pm-field">
            <span className="pm-label">{L('Last name', 'उपनाम')} <em>{L('optional', 'वैकल्पिक')}</em></span>
            <input id="ho-last-name" className={`pm-input${bad('last_name')}`} autoComplete="family-name" placeholder={L('Sharma', 'शर्मा')}
              value={lastName} onChange={e => setLastName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </label>
        </div>

        {email && (
          <label className="pm-field">
            <span className="pm-label">{L('Email', 'ईमेल')}</span>
            <input className="pm-input" value={email} disabled readOnly aria-readonly="true" />
          </label>
        )}

        <div className="pm-field">
          <label className="pm-label" htmlFor="ho-phone">{L('Phone number', 'फ़ोन नंबर')}</label>
          <div className="pm-phone">
            <div className="pm-cc-wrap">
              <button type="button" className={`pm-input pm-cc${bad('phone')}${open ? ' open' : ''}`} onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                aria-haspopup="listbox" aria-expanded={open} aria-label={`${L('Country code', 'देश कोड')}, ${countryName(selected)} ${selected.code}`}>
                <span className="pm-flag">{selected.flag}</span>{selected.code}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {open && (
                <div className="pm-menu" onClick={e => e.stopPropagation()}>
                  <div className="pm-menu-search">
                    <input autoFocus className="pm-input" placeholder={L('Search for a country', 'देश खोजें')} value={search} onChange={e => setSearch(e.target.value)} aria-label={L('Search for a country', 'देश खोजें')} />
                  </div>
                  <div className="pm-menu-list" role="listbox" aria-label={L('Country', 'देश')}>
                    {filtered.map(c => (
                      <button key={c.code + c.name} type="button" role="option" aria-selected={c.code === dialCode} className={`pm-opt${c.code === dialCode ? ' on' : ''}`}
                        onClick={() => { setDialCode(c.code); setOpen(false); setSearch(''); }}>
                        <span className="pm-flag">{c.flag}</span><span className="pm-opt-name">{countryName(c)}</span><span className="pm-opt-code">{c.code}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && <div className="pm-none">{L('No country matches', 'कोई देश नहीं मिला')}</div>}
                  </div>
                </div>
              )}
            </div>
            <input id="ho-phone" className={`pm-input pm-num${bad('phone')}`} autoFocus={!!initialFirstName} type="tel" autoComplete="tel-national"
              placeholder={dialCode === '+91' ? L('Your 10-digit mobile number', 'आपका 10 अंकों का मोबाइल नंबर') : L('Your phone number', 'आपका फ़ोन नंबर')}
              value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          {err && <p className="pm-err" role="alert">{err}</p>}
        </div>

        <button type="button" className="ds-btn ds-btn-solid ds-btn-block pm-save" disabled={loading} onClick={submit}>
          {loading ? L('Saving…', 'सहेजा जा रहा है…') : L('Save and continue', 'सहेजें और आगे बढ़ें')}
        </button>
        {onCancel && <button type="button" className="ds-btn ds-btn-line ds-btn-block pm-cancel" onClick={() => close(onCancel)}>{L('Not now', 'अभी नहीं')}</button>}
        <p className="pm-fine">{L('Kept private, and never shared with anyone.', 'यह निजी रहता है, और किसी से साझा नहीं किया जाता।')}</p>
      </div>
    </div>
  );
}

const PM_CSS = `
.pm-overlay { z-index: 10050; opacity: 0; transition: opacity var(--pm-ms) ease; }
.pm-overlay.shown { opacity: 1; }
.pm { max-width: 400px; overflow: visible; transform: translateY(10px) scale(0.98); transition: transform calc(var(--pm-ms) * 1.2) cubic-bezier(0.16, 1, 0.3, 1); }
.pm-overlay.shown .pm { transform: none; }
.pm-head { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: var(--space-5); }
.pm-head img { margin-bottom: var(--space-3); }
.pm-head .ds-modal-text { max-width: 300px; }
.pm-save, .pm-cancel { border-radius: var(--radius-md); min-height: 44px; }
.pm-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
.pm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4); }
.pm-row .pm-field { margin-bottom: 0; }
.pm-label { font-size: 0.875rem; font-weight: 500; color: var(--text2); }
.pm-label i { font-style: normal; color: var(--accent-text); }
.pm-label em { font-style: normal; font-weight: 500; color: var(--text3); }
.pm-input { width: 100%; box-sizing: border-box; min-height: 44px; padding: 0 var(--space-3); background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-md); box-shadow: var(--shadow-xs); color: var(--text); font: inherit; font-size: 0.98rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.pm-input:focus, .pm-input.open { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.pm-input.bad { border-color: var(--danger-text); }
.pm-input:disabled { background: var(--ds-soft); color: var(--text3); box-shadow: none; }
.pm-input::placeholder { color: var(--text3); }
.pm-phone { display: flex; gap: var(--space-2); }
.pm-cc-wrap { position: relative; flex-shrink: 0; }
.pm-cc { width: auto; display: inline-flex; align-items: center; gap: 6px; padding: 0 var(--space-3); color: var(--text2); cursor: pointer; font-variant-numeric: tabular-nums; }
.pm-cc svg { color: var(--text3); }
.pm-flag { font-size: 1.05rem; line-height: 1; }
.pm-num { flex: 1; min-width: 0; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
.pm-menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 10; width: 280px; max-height: 300px; display: flex; flex-direction: column; overflow: hidden; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-lg); box-shadow: var(--elev-3); }
.pm-menu-search { padding: var(--space-2); border-bottom: 1px solid var(--border); }
.pm-menu-search .pm-input { min-height: 38px; font-size: 0.9rem; }
.pm-menu-list { overflow-y: auto; padding: 4px; overscroll-behavior: contain; }
.pm-opt { width: 100%; display: flex; align-items: center; gap: var(--space-2); padding: 8px 10px; border: none; border-radius: var(--radius-md); background: none; color: var(--text); font: inherit; font-size: 0.9rem; text-align: left; cursor: pointer; }
.pm-opt:hover { background: var(--ds-soft); }
.pm-opt.on { background: var(--accent-dim); color: var(--accent-text); }
.pm-opt-name { flex: 1; min-width: 0; }
.pm-opt-code { color: var(--text3); font-size: 0.82rem; font-variant-numeric: tabular-nums; }
.pm-none { padding: var(--space-3); text-align: center; font-size: 0.86rem; color: var(--text3); }
.pm-err { margin: 4px 0 0; font-size: 0.86rem; color: var(--danger-text); }
.pm-cancel { margin-top: var(--space-2); }
.pm-fine { margin: var(--space-3) 0 0; text-align: center; font-size: 0.82rem; color: var(--text3); }
@media (max-width: 480px) { .pm-row { grid-template-columns: minmax(0, 1fr); } .pm-menu { width: min(280px, calc(100vw - 64px)); } }
`;
