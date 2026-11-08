'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import { loadAspirantProfile, saveAspirantProfile, type AspirantProfile } from '@/lib/aspirantProfile';
import { applyTheme, isDarkTheme } from '@/lib/theme';
import { daysToMains, NEXT_MAINS } from '@/lib/examDates';
import { PLANS, isPlanId } from '@/lib/plans';
import { PhoneModal } from '@/components/PhoneModal';
import Mascot from '@/components/Mascot';
import UserAvatar from '@/components/ui/UserAvatar';
import { toast, toastSignInError } from '@/components/ui/Toast';

/**
 * Profile and settings on one page, in place of the small dialog the menu
 * used to open: who the reader is, the details that drive the countdown, the
 * number we reach them on, and the site's own settings.
 *
 * The basics stay on this device, as they always have, and are kept by Save.
 * Language and theme apply as soon as they are picked, as they do in the
 * navbar. The phone number is the one on the account.
 */

const ATTEMPTS = ['1st', '2nd', '3rd', '4th', '5th+'];
/** What an attempt pill reads in Hindi. The stored value stays the English one. */
const ATTEMPT_HI: Record<string, string> = { '1st': 'पहला', '2nd': 'दूसरा', '3rd': 'तीसरा', '4th': 'चौथा', '5th+': 'पाँचवाँ+' };
/** The plan's name in Hindi, as the label in lib/plans.ts gives it in English. */
const PLAN_HI: Record<string, string> = { yearly: 'सालाना', sixmonths: '6 महीने', daily: 'दैनिक' };
const NEXT_MAINS_YEAR = NEXT_MAINS.slice(0, 4);
const YEARS = [NEXT_MAINS_YEAR, String(Number(NEXT_MAINS_YEAR) + 1), String(Number(NEXT_MAINS_YEAR) + 2)];
const AGES = Array.from({ length: 34 }, (_, i) => String(i + 18));
const BANNER_KEY = 'ho_profile_banner_hidden';

type Sub = { plan: string; expires_at: string } | null;

const Icon = {
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9.5 2h5" /></svg>,
  // eslint-disable-next-line @next/next/no-img-element
  google: <img src="/icons/google.svg" alt="" width={18} height={18} />,
};

export default function ProfileSettings() {
  const router = useRouter();
  const { langHi, toggleLang } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<AspirantProfile>({ name: '', age: '', attempt: '', year: '' });
  const [form, setForm] = useState<AspirantProfile>(saved);
  const [phone, setPhone] = useState<string | null | undefined>(undefined);
  const [names, setNames] = useState<{ first: string | null; last: string | null }>({ first: null, last: null });
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [sub, setSub] = useState<Sub | undefined>(undefined);
  const [dark, setDark] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const p = loadAspirantProfile();
    setSaved(p);
    setForm(p);
    setDark(isDarkTheme());
    try { setBannerHidden(localStorage.getItem(BANNER_KEY) === '1'); } catch { setBannerHidden(false); }
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);

  // The number and the plan come from the account.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await user.getIdToken();
      const [prof, status] = await Promise.all([
        fetch('/api/profile', { headers: { 'x-user-token': token } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/sub-status', { headers: { 'x-user-token': token } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      if (cancelled) return;
      setPhone(prof?.phone ?? null);
      setNames({ first: prof?.firstName ?? null, last: prof?.lastName ?? null });
      setSub(status?.isPremium ? { plan: status.plan, expires_at: status.expires_at } : null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const dirty = (Object.keys(form) as (keyof AspirantProfile)[]).some((k) => form[k].trim() !== saved[k].trim());
  const set = (k: keyof AspirantProfile, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const next = { name: form.name.trim(), age: form.age.trim(), attempt: form.attempt.trim(), year: form.year.trim() };
    saveAspirantProfile(next);
    setSaved(next);
    setForm(next);
    toast(L('Profile updated', 'प्रोफ़ाइल अपडेट हो गई'));
  };

  const pickTheme = (d: boolean) => { applyTheme(d); setDark(d); };
  const pickLang = (hi: boolean) => { if (hi !== langHi) toggleLang(); };

  const refreshPhone = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const prof = await fetch('/api/profile', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => null);
    setPhone(prof?.phone ?? null);
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); }
    catch (err) { toastSignInError(err, langHi); }
    finally { setSigningIn(false); }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (!ready) return <div className="pf ds"><style dangerouslySetInnerHTML={{ __html: PF_CSS }} /><div className="pf-wrap" /></div>;

  if (!user) {
    return (
      <div className="pf ds">
        <style dangerouslySetInnerHTML={{ __html: PF_CSS }} />
        <div className="pf-wrap pf-signin">
          <Mascot pose="peek" width={120} />
          <h1>{L('Sign in to continue', 'जारी रखने के लिए साइन इन करें')}</h1>
          <p>{L('Your profile and settings are kept on your account.', 'आपकी प्रोफ़ाइल और सेटिंग्स आपके खाते में रहती हैं।')}</p>
          <button type="button" className="pf-google" onClick={handleSignIn} disabled={signingIn}>
            {Icon.google}{signingIn ? L('Opening Google…', 'Google खुल रहा है…') : L('Sign in with Google', 'Google से साइन इन करें')}
          </button>
        </div>
      </div>
    );
  }

  const name = saved.name || [names.first, names.last].filter(Boolean).join(' ') || user.displayName || L('UPSC aspirant', 'UPSC अभ्यर्थी');
  const facts = [
    saved.age && L(`${saved.age} years`, `${saved.age} वर्ष`),
    saved.attempt && L(`${saved.attempt} attempt`, `${ATTEMPT_HI[saved.attempt] ?? saved.attempt} प्रयास`),
    saved.year && L(`Mains ${saved.year}`, `मुख्य परीक्षा ${saved.year}`),
  ].filter(Boolean).join(' · ');

  const days = saved.year === NEXT_MAINS_YEAR ? daysToMains() : null;
  const banner = days !== null
    ? { title: L(`Mains ${saved.year} is ${days} days away`, `मुख्य परीक्षा ${saved.year} में ${days} दिन बाक़ी`), text: L('The countdown in your menu runs to it.', 'आपके मेन्यू की उलटी गिनती इसी तक चलती है।'), tone: 'accent' }
    : !saved.year
      ? { title: L('Add your target year', 'अपना लक्ष्य वर्ष जोड़ें'), text: L('Pick it below and we’ll count down to your Mains.', 'नीचे चुनें और हम आपकी मुख्य परीक्षा तक उलटी गिनती करेंगे।'), tone: 'accent' }
      : null;

  const planLabel = sub ? (isPlanId(sub.plan) ? (langHi ? PLAN_HI[sub.plan] : PLANS[sub.plan].label) : (langHi ? 'प्रीमियम' : 'Premium')) : null;
  const planDays = sub ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)) : 0;

  const pills = (key: 'attempt' | 'year', options: string[], label: string, show: (o: string) => string = (o) => o) => (
    <div className="pf-field" role="radiogroup" aria-label={label}>
      <span className="pf-label">{label}</span>
      <div className="pf-pills">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={form[key] === o} className={`pf-pill${form[key] === o ? ' on' : ''}`}
            onClick={() => set(key, form[key] === o ? '' : o)}>
            {show(o)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pf ds">
      <style dangerouslySetInnerHTML={{ __html: PF_CSS }} />
      <div className="pf-wrap">
        <div className="pf-top">
          <Link href="/dashboard" className="pf-back" aria-label={L('Back to your dashboard', 'डैशबोर्ड पर वापस')}>{Icon.back}</Link>
          <h1>{L('Profile and settings', 'प्रोफ़ाइल और सेटिंग्स')}</h1>
        </div>

        <header className="pf-who">
          <UserAvatar email={user.email ?? ''} name={name} photoURL={user.photoURL} size={64} />
          <div className="pf-who-text">
            <strong>{name}</strong>
            <span>{facts || user.email}</span>
          </div>
          <span className={`pf-plan${sub ? ' premium' : ''}`}>{sub ? planLabel : L('Free plan', 'निःशुल्क प्लान')}</span>
        </header>

        {banner && !bannerHidden && (
          <div className={`pf-banner ${banner.tone}`}>
            <span className="pf-banner-icon">{Icon.clock}</span>
            <div><strong>{banner.title}</strong><span>{banner.text}</span></div>
            <button type="button" className="pf-banner-x" aria-label={L('Dismiss', 'हटाएँ')}
              onClick={() => { setBannerHidden(true); try { localStorage.setItem(BANNER_KEY, '1'); } catch { /* shows again next visit */ } }}>
              {Icon.close}
            </button>
          </div>
        )}

        <section className="pf-sec">
          <div className="pf-sec-head">
            <h2>{L('The basics', 'मूल जानकारी')}</h2>
            <p>{L('Kept on this device. Your target year sets the exam countdown.', 'इसी डिवाइस पर रहती है। आपका लक्ष्य वर्ष परीक्षा की उलटी गिनती तय करता है।')}</p>
          </div>
          <div className="pf-grid">
            <label className="pf-field">
              <span className="pf-label">{L('Full name', 'पूरा नाम')}</span>
              <input className="pf-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={L('e.g. Rahul Sharma', 'जैसे राहुल शर्मा')} autoComplete="name" />
            </label>
            <label className="pf-field">
              <span className="pf-label">{L('Age', 'आयु')}</span>
              <select className="pf-input" value={form.age} onChange={(e) => set('age', e.target.value)}>
                <option value="">{L('Rather not say', 'नहीं बताना')}</option>
                {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
                {form.age && !AGES.includes(form.age) && <option value={form.age}>{form.age}</option>}
              </select>
            </label>
          </div>
          {pills('attempt', form.attempt && !ATTEMPTS.includes(form.attempt) ? [...ATTEMPTS, form.attempt] : ATTEMPTS, L('Attempt', 'प्रयास'), (o) => (langHi ? ATTEMPT_HI[o] ?? o : o))}
          {pills('year', form.year && !YEARS.includes(form.year) ? [...YEARS, form.year] : YEARS, L('Target Mains', 'लक्ष्य मुख्य परीक्षा'))}
          <div className="pf-save-row">
            {dirty && <button type="button" className="ds-btn ds-btn-line pf-btn" onClick={() => setForm(saved)}>{L('Undo changes', 'बदलाव हटाएँ')}</button>}
            <button type="button" className="ds-btn ds-btn-solid pf-btn" onClick={save} disabled={!dirty}>{L('Save', 'सहेजें')}</button>
          </div>
        </section>

        <section className="pf-sec">
          <div className="pf-sec-head">
            <h2>{L('Your account', 'आपका खाता')}</h2>
            <p>{L('How you sign in, and the number we reach you on.', 'आप कैसे साइन इन करते हैं, और वह नंबर जिस पर हम आपसे संपर्क करते हैं।')}</p>
          </div>
          <div className="pf-rows">
            <div className="pf-row">
              <div><strong>{L('Email', 'ईमेल')}</strong><span>{user.email}</span></div>
            </div>
            <div className="pf-row">
              <div>
                <strong>{L('Mobile number', 'मोबाइल नंबर')}</strong>
                <span>{phone === undefined ? L('Loading…', 'लोड हो रहा है…') : phone || L('Not added yet', 'अभी नहीं जोड़ा')}</span>
              </div>
              <button type="button" className="ds-btn ds-btn-line pf-btn" onClick={() => setPhoneOpen(true)} disabled={phone === undefined}>
                {phone ? L('Change', 'बदलें') : L('Add', 'जोड़ें')}
              </button>
            </div>
            <div className="pf-row">
              <div>
                <strong>{L('Plan', 'प्लान')}</strong>
                <span>
                  {sub === undefined ? L('Loading…', 'लोड हो रहा है…')
                    : sub ? L(`${planLabel}, ${planDays} day${planDays === 1 ? '' : 's'} left`, `${planLabel}, ${planDays} दिन बाक़ी`)
                      : L('Free plan', 'निःशुल्क प्लान')}
                </span>
              </div>
              <Link href="/pricing" className={`ds-btn pf-btn ${sub ? 'ds-btn-line' : 'ds-btn-premium'}`}>{sub ? L('See plans', 'प्लान देखें') : L('Upgrade', 'अपग्रेड करें')}</Link>
            </div>
          </div>
        </section>

        <section className="pf-sec">
          <div className="pf-sec-head">
            <h2>{L('Settings', 'सेटिंग्स')}</h2>
            <p>{L('These apply straight away, on this device.', 'ये तुरंत लागू होती हैं, इसी डिवाइस पर।')}</p>
          </div>
          <div className="pf-rows">
            <div className="pf-row">
              <div><strong>{L('Language', 'भाषा')}</strong><span>{L('Notes, chat and menus', 'नोट्स, चैट और मेन्यू')}</span></div>
              <div className="pf-seg" role="radiogroup" aria-label={L('Language', 'भाषा')}>
                <button type="button" role="radio" aria-checked={!langHi} className={!langHi ? 'on' : ''} onClick={() => pickLang(false)}>English</button>
                <button type="button" role="radio" aria-checked={langHi} className={langHi ? 'on' : ''} onClick={() => pickLang(true)}>हिन्दी</button>
              </div>
            </div>
            <div className="pf-row">
              <div><strong>{L('Theme', 'थीम')}</strong><span>{L('Paper or dark', 'हल्की या गहरी')}</span></div>
              <div className="pf-seg" role="radiogroup" aria-label={L('Theme', 'थीम')}>
                <button type="button" role="radio" aria-checked={!dark} className={!dark ? 'on' : ''} onClick={() => pickTheme(false)}>{L('Light', 'हल्की')}</button>
                <button type="button" role="radio" aria-checked={dark} className={dark ? 'on' : ''} onClick={() => pickTheme(true)}>{L('Dark', 'गहरी')}</button>
              </div>
            </div>
            <div className="pf-row">
              <div><strong>{L('Sign out', 'साइन आउट')}</strong><span>{L('Your notes and progress stay on your account.', 'आपके नोट्स और प्रगति आपके खाते में रहते हैं।')}</span></div>
              <button type="button" className="ds-btn ds-btn-line pf-btn pf-danger" onClick={handleSignOut}>{L('Sign out', 'साइन आउट')}</button>
            </div>
          </div>
        </section>
      </div>

      {phoneOpen && (
        <PhoneModal
          getToken={() => auth.currentUser?.getIdToken() ?? Promise.resolve(null)}
          initialFirstName={names.first}
          initialLastName={names.last}
          email={user.email}
          onDone={() => { setPhoneOpen(false); refreshPhone(); toast(L('Your number is saved', 'आपका नंबर सहेज लिया गया')); }}
          onCancel={() => setPhoneOpen(false)}
        />
      )}
    </div>
  );
}

const PF_CSS = `
.pf { min-height: calc(100dvh - 60px); background: var(--bg); }
.pf-wrap { max-width: 760px; margin: 0 auto; padding: var(--space-6) var(--space-6) var(--space-12); }
.pf-top { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-6); }
.pf-top h1 { margin: 0; font-size: 1.125rem; font-weight: 700; letter-spacing: -0.01em; }
.pf-back {
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  border: 1px solid var(--border2); border-radius: var(--radius-md); color: var(--text2); background: var(--ds-card);
  box-shadow: var(--shadow-xs);
}
.pf-back:hover { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }

.pf-who {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-5); background: var(--ds-soft); border: 1px solid var(--border); border-radius: var(--radius-2xl);
}
.pf-who-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pf-who-text strong { font-size: 1.125rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-who-text span { font-size: 0.875rem; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-plan {
  flex-shrink: 0; padding: 2px var(--space-3); border-radius: var(--radius-full);
  border: 1px solid var(--border2); background: var(--ds-card); font-size: 0.78rem; font-weight: 600; color: var(--text2);
}
.pf-plan.premium { background: var(--premium-wash); color: var(--premium-text); border-color: color-mix(in srgb, var(--premium-text) 35%, transparent); }

.pf-banner {
  position: relative; display: flex; align-items: flex-start; gap: var(--space-3);
  margin-top: var(--space-4); padding: var(--space-4) 52px var(--space-4) var(--space-4);
  border: 1px solid var(--border); border-radius: var(--radius-2xl); background: var(--ds-card);
}
.pf-banner.accent { background: var(--accent-wash); border-color: color-mix(in srgb, var(--accent) 25%, transparent); }
.pf-banner-icon { color: var(--accent-text); display: inline-flex; flex-shrink: 0; margin-top: 1px; }
.pf-banner div { display: flex; flex-direction: column; gap: 2px; }
.pf-banner strong { font-size: 0.875rem; font-weight: 600; }
.pf-banner span { font-size: 0.875rem; color: var(--text2); }
.pf-banner-x {
  position: absolute; top: 8px; right: 8px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: none; border-radius: var(--radius-md); color: var(--text3); cursor: pointer;
}
.pf-banner-x:hover { color: var(--text); background: color-mix(in srgb, var(--text) 6%, transparent); }

.pf-sec { padding: var(--space-8) 0 0; }
.pf-sec + .pf-sec { margin-top: var(--space-8); border-top: 1px solid var(--border); }
.pf-sec-head { margin-bottom: var(--space-5); }
.pf-sec-head h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.pf-sec-head p { margin: 2px 0 0; font-size: 0.875rem; color: var(--text2); }

.pf-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: var(--space-4); }
.pf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4); }
.pf-grid .pf-field { margin-bottom: var(--space-4); }
.pf-label { font-size: 0.875rem; font-weight: 500; color: var(--text2); }
.pf-input {
  width: 100%; box-sizing: border-box; min-height: 44px; padding: 0 var(--space-3);
  background: var(--ds-card); color: var(--text); border: 1px solid var(--border2); border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs); font-size: 1rem; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pf-input:focus { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.pf-input::placeholder { color: var(--text3); }
.pf-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
/* A radio pill: the dot inside it, as in the onboarding and profile designs. */
.pf-pill {
  display: inline-flex; align-items: center; gap: var(--space-2);
  min-height: 36px; padding: 0 var(--space-3) 0 var(--space-2-5);
  background: var(--ds-card); color: var(--text); border: 1px solid var(--border2); border-radius: var(--radius-md);
  font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.pf-pill::before { content: ''; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--border3); box-sizing: border-box; transition: border 0.15s; }
.pf-pill:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.pf-pill.on { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-text); }
.pf-pill.on::before { border: 5px solid var(--accent); }
.pf-save-row { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-2); }
.pf-btn { border-radius: var(--radius-md); min-height: 40px; font-size: 0.875rem; flex-shrink: 0; }

.pf-rows { display: flex; flex-direction: column; }
.pf-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-4) 0; }
.pf-row + .pf-row { border-top: 1px solid var(--border); }
.pf-row > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pf-row strong { font-size: 0.875rem; font-weight: 600; }
.pf-row span { font-size: 0.875rem; color: var(--text2); overflow-wrap: anywhere; }
.pf-danger { color: var(--danger-text); }
.pf-danger:hover { color: var(--danger-text); border-color: color-mix(in srgb, var(--danger-text) 45%, transparent); }
.pf-seg { display: inline-flex; flex-shrink: 0; padding: var(--space-1); gap: var(--space-0-5); background: var(--ds-soft); border: 1px solid var(--border); border-radius: var(--radius-md); }
.pf-seg button {
  min-height: 34px; padding: 0 var(--space-3); border: 1px solid transparent; border-radius: var(--radius-sm);
  background: none; color: var(--text2); font-size: 0.86rem; font-weight: 600; cursor: pointer;
}
.pf-seg button.on { background: var(--ds-card); color: var(--text); border-color: var(--border2); box-shadow: var(--shadow-xs); }

.pf-signin { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: clamp(40px, 12vh, 120px); }
.pf-signin h1 { margin: var(--space-4) 0 var(--space-2); font-size: 1.875rem; font-weight: 700; letter-spacing: -0.02em; }
.pf-signin p { margin: 0 0 var(--space-6); color: var(--text2); font-size: 1rem; max-width: 380px; }
.pf-google {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-3);
  width: min(360px, 100%); min-height: 44px; padding: 0 var(--space-4);
  background: var(--ds-card); color: var(--text); border: 1px solid var(--border2); border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs); font-size: 0.95rem; font-weight: 600; cursor: pointer;
}
.pf-google:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.pf-google:disabled { opacity: 0.6; cursor: wait; }

@media (max-width: 640px) {
  .pf-wrap { padding: var(--space-4) var(--space-4) var(--space-10); }
  .pf-who { padding: var(--space-4); flex-wrap: wrap; }
  .pf-grid { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .pf-save-row { flex-direction: column-reverse; }
  .pf-save-row .pf-btn { width: 100%; min-height: 44px; }
  .pf-row { flex-wrap: wrap; }
  .pf-sec { padding-top: var(--space-6); }
  .pf-sec + .pf-sec { margin-top: var(--space-6); }
}
`;
