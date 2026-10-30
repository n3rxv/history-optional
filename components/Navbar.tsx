'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { tr, t } from '@/lib/i18n/ui';
import SearchModal from './SearchModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { SubscribeCard } from '@/components/SubscribeCard';
import { FEATURES, TOPPER_PRICE } from '@/lib/features';
import { daysToMains } from '@/lib/examDates';
import { PLANS, PLAN_ORDER, DEFAULT_PLAN, planPriceLabel, addPlanDuration, isPlanId, type PlanId } from '@/lib/plans';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import UserAvatar from '@/components/ui/UserAvatar';
import { loadAspirantProfile, PROFILE_EVENT, type AspirantProfile } from '@/lib/aspirantProfile';

/** Plan names in Hindi mode, as the subscribe card writes them. */
const PLAN_HI: Record<PlanId, string> = { daily: 'एक दिन', weekly: 'साप्ताहिक', sixmonths: '6 महीने', yearly: 'सालाना' };

/** A stored plan id shown to the reader. Falls back to the raw value for
 *  rows written before the id set settled. */
function planLabel(plan: string, langHi = false): string {
  return isPlanId(plan) ? (langHi ? PLAN_HI[plan] : PLANS[plan].label) : plan;
}

const fmtDate = (iso: string, month: 'short' | 'long' = 'short', langHi = false) =>
  new Date(iso).toLocaleDateString(langHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month, year: 'numeric' });

const Icon = {
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  chev: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  moon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>,
  sun: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  dash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  plans: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" /></svg>,
  out: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>,
};

function PremiumModal({ onClose, noSubFound, isLoggedIn, onPaymentSuccess }: { onClose: () => void; noSubFound?: boolean; isLoggedIn?: boolean; onPaymentSuccess?: () => void }) {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const [fingerprint, setFingerprint] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
      const { visitorId } = await FP.get();
      setFingerprint(visitorId);
    })();
  }, []);

  // The two free limits come from lib/features.ts, so this cannot drift from
  // what the gates enforce.
  const freeOf = (name: string) => FEATURES.find(f => f.name === name)?.free ?? '';
  const evalFree = freeOf('Answer evaluation').replace(' total', '');
  const chatFree = freeOf('AI Chat').replace(' total', '');
  const gains = langHi ? [
    { title: 'बिना किसी सीमा के उत्तर मूल्यांकन', body: `निःशुल्क में ${evalFree} उत्तर की जाँच होती है। प्रीमियम आपका लिखा हर उत्तर जाँचता है, और पूरे टेस्ट पेपर भी।` },
    { title: 'AI ट्यूटर, असीमित', body: `${chatFree} निःशुल्क चैट के बाद भी, पुस्तकें, PDF, ब्रेनस्टॉर्म और मेंटर मोड के साथ।` },
    { title: 'हर PYQ का आदर्श उत्तर', body: 'अपना उत्तर लिखने से पहले देखें कि प्रश्न का उत्तर कैसे लिखा जा सकता है।' },
    { title: 'टॉपर कॉपियाँ', body: `टॉपरों की असली उत्तर पुस्तिकाएँ, जो अलग से ₹${TOPPER_PRICE.now} में बिकती हैं।` },
    { title: 'प्रिलिम्स विश्लेषण', body: 'प्रिलिम्स का हर PYQ, इस हिसाब से छँटा हुआ कि क्या बार-बार आता है।' },
  ] : [
    { title: 'Answer checking without limits', body: `Free covers ${evalFree} answer. Premium checks every answer you write, and whole test papers too.` },
    { title: 'The AI tutor, unlimited', body: `Past the ${chatFree} free chats, with Books, PDF, Brainstorm and Mentor modes.` },
    { title: 'Model answers for every PYQ', body: 'See how a question could be answered before you write your own.' },
    { title: 'Topper copies', body: `Real answer sheets from toppers, which sell for ₹${TOPPER_PRICE.now} on their own.` },
    { title: 'Prelims analysis', body: 'Every Prelims PYQ, sorted by what keeps coming back.' },
  ];

  return (
    <div className="ds ds-overlay nb-up-overlay" onClick={onClose}>
      <div className="nb-up" role="dialog" aria-modal="true" aria-labelledby="nb-up-title" onClick={e => e.stopPropagation()}>
        <span className="nb-up-grab" aria-hidden="true" />
        <button className="ds-x nb-up-x" onClick={onClose} aria-label={T('Close', 'बंद करें')}>{Icon.close}</button>

        <div className="nb-up-why">
          <Image src="/mascot/owl-celebrate.svg" alt="" width={64} height={60} className="nb-up-owl" />
          <h2 id="nb-up-title">{T('Go Premium', 'प्रीमियम लें')}</h2>
          <p className="nb-up-lede">{T('Notes and PYQs stay free. Premium gets your answers checked and the AI tutor with no limits.', 'नोट्स और PYQ निःशुल्क रहते हैं। प्रीमियम में आपके उत्तर जँचते हैं और AI ट्यूटर बिना किसी सीमा के मिलता है।')}</p>
          <ul className="nb-up-gains">
            {gains.map(g => (
              <li key={g.title}>
                <span className="nb-up-tick" aria-hidden="true">{Icon.check}</span>
                <div><strong>{g.title}</strong><span>{g.body}</span></div>
              </li>
            ))}
          </ul>
          <Link href="/pricing" className="nb-up-more" onClick={onClose}>{T('Compare Free and Premium in full', 'निःशुल्क और प्रीमियम की पूरी तुलना देखें')} {Icon.arrow}</Link>
        </div>

        <div className="nb-up-buy">
          <h3>{T('Choose how long', 'अवधि चुनें')}</h3>
          {noSubFound && <div className="nb-alert">{T('No active subscription found for this account.', 'इस खाते पर कोई सक्रिय सदस्यता नहीं मिली।')}</div>}
          <SubscribeCard
            fingerprint={fingerprint}
            onClose={onClose}
            onSuccess={() => { onPaymentSuccess?.(); onClose(); }}
          />
          {!isLoggedIn && (
            <button
              className="nb-up-signin"
              onClick={async () => {
                sessionStorage.setItem('ho_verify_sub', '1');
                const { signInWithGoogle } = await import('@/lib/firebase');
                await signInWithGoogle();
              }}
            >
              {T('Already on Premium? Sign in', 'पहले से प्रीमियम पर हैं? साइन इन करें')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Extend Plan Modal ──────────────────────────────────────────
type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown> & { handler: (resp: RazorpayResponse) => void }) => { open: () => void };
const razorpayOf = () => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
function ExtendModal({
  user, subData, onClose, onSuccess,
}: {
  user: { id: string; email?: string | null };
  subData: { plan: string; expires_at: string } | null;
  onClose: () => void;
  onSuccess: (newExpiry: string, plan: PlanId) => void;
}) {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(DEFAULT_PLAN);
  const [loading, setLoading] = useState(false);

  // Built from lib/plans.ts, which is what /api/razorpay/order bills from.
  // This list used to be typed by hand and carried a Weekly and a Monthly
  // tile at ₹1,999. Neither is a plan id the server knows, so toPlanId()
  // fell back to yearly: the button said ₹1,999, Razorpay charged ₹2,999,
  // and the reader was granted a year instead of the week or month shown.
  const plans = PLAN_ORDER.map(id => ({
    id, label: PLANS[id].label, shown: planLabel(id, langHi), price: planPriceLabel(id),
  }));

  // addPlanDuration is the same function /api/razorpay/verify uses to set
  // expires_at, so the date previewed here is the date actually granted.
  const computeNewExpiry = (planId: PlanId) => {
    const base = subData?.expires_at && new Date(subData.expires_at) > new Date()
      ? new Date(subData.expires_at) : new Date();
    return addPlanDuration(base, planId);
  };

  const newExpiry = computeNewExpiry(selectedPlan);
  const cur = plans.find(p => p.id === selectedPlan)!;

  const handlePay = async () => {
    setLoading(true);
    try {
      // 0. Ensure Razorpay script is loaded
      if (!razorpayOf()) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Razorpay script failed to load'));
          document.head.appendChild(s);
        });
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not signed in');
      const token = await currentUser.getIdToken();

      // 1. Create Razorpay order
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const order = await orderRes.json();
      const orderId = order.id ?? order.orderId;
      if (!orderId) throw new Error(order.message ?? 'Order creation failed');

      // 2. Open Razorpay
      const Razorpay = razorpayOf()!;
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) throw new Error('Razorpay key not set — check NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local');
      const rzp = new Razorpay({
        key: rzpKey,
        amount: order.amount,
        currency: 'INR',
        name: 'History Optional',
        description: `${cur.label} Plan`,
        order_id: orderId,
        prefill: { email: user.email ?? '' },
        theme: { color: 'var(--accent)' },
        handler: async (resp: RazorpayResponse) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': token },
            // plan is read server-side from the Razorpay order, not from here.
            body: JSON.stringify({ ...resp, fingerprint: null }),
          });
          const v = await verifyRes.json();
          if (v.ok) {
            // The plan comes back from verify, which reads it off the Razorpay
            // order rather than trusting the browser.
            onSuccess(v.expiresAt, (v.plan as PlanId) ?? selectedPlan);
            onClose();
          }
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="ds ds-overlay nb-extend-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ds-modal nb-extend" role="dialog" aria-modal="true" aria-labelledby="nb-extend-title">
        <div className="ds-modal-head">
          <div>
            <h2 id="nb-extend-title">{subData ? T('Extend your plan', 'अपना प्लान बढ़ाएँ') : T('Choose a plan', 'प्लान चुनें')}</h2>
            <p>{subData ? T('The new time is added after your current plan ends.', 'नया समय आपके मौजूदा प्लान के ख़त्म होने के बाद जुड़ता है।') : T('Pick how long you want Premium for.', 'चुनें कि प्रीमियम कितने समय के लिए चाहिए।')}</p>
          </div>
          <button className="ds-x" onClick={onClose} aria-label={T('Close', 'बंद करें')}>{Icon.close}</button>
        </div>

        {subData && (
          <div className="nb-extend-row">
            <span>{T('Your plan ends', 'आपका प्लान ख़त्म होगा')}</span>
            <strong>{fmtDate(subData.expires_at, 'short', langHi)}</strong>
          </div>
        )}

        <div className="nb-plans" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
          {plans.map(p => (
            <button key={p.id} className={`nb-plan${selectedPlan === p.id ? ' on' : ''}`} onClick={() => setSelectedPlan(p.id)} aria-pressed={selectedPlan === p.id}>
              <span>{p.shown}</span>
              <strong>{p.price}</strong>
            </button>
          ))}
        </div>

        <div className="nb-extend-row good">
          <span>{T('After paying, Premium runs until', 'भुगतान के बाद प्रीमियम इस तारीख़ तक चलेगा')}</span>
          <strong>{fmtDate(newExpiry.toISOString(), 'long', langHi)}</strong>
        </div>

        <button className="ds-btn ds-btn-solid ds-btn-lg ds-btn-block" onClick={handlePay} disabled={loading}>
          {loading ? T('Opening Razorpay…', 'Razorpay खुल रहा है…') : langHi ? `भुगतान करें ${cur.price}` : `Pay ${cur.price}`}
        </button>
      </div>
    </div>,
    document.body
  );
}

type MenuItem = { href: string; label: string };

/** A bar entry that opens a short list: Notes and PYQs. */
function NavMenu({ label, items, active, pathname, open, onToggle, onClose, menuRef }: {
  label: string; items: MenuItem[]; active: boolean; pathname: string;
  open: boolean; onToggle: () => void; onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={menuRef} className="nb-drop">
      <button className={`nb-link${active ? ' on' : ''}`} onClick={onToggle} aria-expanded={open} aria-haspopup="menu">
        {label}{Icon.chev}
      </button>
      {open && (
        <div className="nb-drop-menu" role="menu">
          {items.map(item => {
            // The two papers are tabs on one page, so neither is marked.
            const on = !item.href.startsWith('/notes') && item.href.split('#')[0] !== '/' && pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} role="menuitem" className={`nb-drop-item${on ? ' on' : ''}`} onClick={onClose}>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The phone browser's bar takes the page's ground: paper, or black in dark. */
function paintBrowserBar(dark: boolean) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#000000' : '#fcfcfc'));
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { langHi, toggleLang } = useLang();
  const [isDark, setIsDark] = useState(false);
  const [aspirant, setAspirant] = useState<AspirantProfile>({ name: '', age: '', attempt: '', year: '' });
  const aspirantName = aspirant.name;
  const aspirantYear = aspirant.year;
  const [subData, setSubData] = useState<{ plan: string; expires_at: string; autoRenew?: boolean } | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pyqsMenuOpen, setPyqsMenuOpen] = useState(false);
  const [notesMenuOpen, setNotesMenuOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [noSubFound, setNoSubFound] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const pyqsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  /** Stops future weekly debits. Access already paid for is untouched. */
  async function handleCancelAutopay() {
    if (!auth.currentUser) return;
    if (!(await confirmDialog(langHi
      ? { title: 'साप्ताहिक नवीनीकरण बंद करें?', text: 'जिन दिनों का भुगतान आप कर चुके हैं, उनमें पहुँच बनी रहेगी।', confirmLabel: 'नवीनीकरण बंद करें', cancelLabel: 'रहने दें', tone: 'danger' }
      : { title: 'Stop the weekly renewal?', text: 'You keep access for the remaining days you’ve already paid for.', confirmLabel: 'Stop renewal', cancelLabel: 'Keep it', tone: 'danger' }))) return;
    setCancelling(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/razorpay/subscription/cancel', {
        method: 'POST', headers: { 'x-user-token': token },
      });
      if (res.ok) { setSubData(prev => (prev ? { ...prev, autoRenew: false } : prev)); toast(langHi ? 'साप्ताहिक नवीनीकरण बंद हो गया' : 'Weekly renewal stopped'); }
      else toast(langHi ? 'यह नहीं हो पाया। थोड़ी देर में फिर कोशिश करें।' : 'That did not go through. Try again in a moment.', 'error');
    } finally {
      setCancelling(false);
    }
  }

  // The bootstrap in app/layout.tsx stamps data-theme before paint; read it
  // rather than working it out again.
  useEffect(() => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    setIsDark(dark);
    paintBrowserBar(dark);
    // The profile page can switch the theme too; follow it.
    const watch = new MutationObserver(() => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark'));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => watch.disconnect();
  }, []);

  // Always writes an explicit choice, in both directions, so a reader on a
  // dark OS can still pick paper.
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ho-theme', theme); } catch {}
    paintBrowserBar(next);
  };

  // A tap outside a menu closes it. A touch that moved was a scroll, not a tap.
  useEffect(() => {
    let touchMoved = false;
    const onTouchMove = () => { touchMoved = true; };
    const handler = (e: MouseEvent | TouchEvent) => {
      if (e.type === 'touchstart') { touchMoved = false; }
      if (e.type === 'touchend' && touchMoved) return;
      const target = e.target as Node;
      if (notesRef.current && !notesRef.current.contains(target)) setNotesMenuOpen(false);
      if (pyqsRef.current && !pyqsRef.current.contains(target)) setPyqsMenuOpen(false);
      if (accountRef.current && !accountRef.current.contains(target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', handler);
    };
  }, []);

  // A new page closes whatever was open.
  useEffect(() => {
    setOpen(false);
    setNotesMenuOpen(false);
    setPyqsMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // The open sheet locks the page and tells fixed overlays (the install
  // banner) to stand aside.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    document.documentElement.classList.toggle('nb-sheet-open', open);
    return () => { document.body.style.overflow = ''; document.documentElement.classList.remove('nb-sheet-open'); };
  }, [open]);

  // Auto-close premium modal when subscription is confirmed
  useEffect(() => {
    if (subData) {
      setShowPremiumModal(false);
      setNoSubFound(false);
    }
  }, [subData]);

  // Allow any component to open premium modal via custom event
  useEffect(() => {
    const handler = () => setShowPremiumModal(true);
    window.addEventListener('open-premium-modal', handler);
    return () => window.removeEventListener('open-premium-modal', handler);
  }, []);

  // The once-a-session nudge (components/PromoPopup) asks for the same panel,
  // but only a reader who is not on Premium is shown it, and never on top of
  // another dialog or on the pricing page, which says it all already.
  const subRef = React.useRef(subData);
  subRef.current = subData;
  useEffect(() => {
    const handler = () => {
      if (subRef.current || window.location.pathname === '/pricing' || document.querySelector('[role="dialog"], [aria-modal="true"]')) return;
      setShowPremiumModal(true);
    };
    window.addEventListener('promo-premium', handler);
    return () => window.removeEventListener('promo-premium', handler);
  }, []);

  // The dashboard's plan card opens the same Extend panel as the account menu.
  useEffect(() => {
    const handler = () => setShowExtendModal(true);
    window.addEventListener('open-extend-modal', handler);
    return () => window.removeEventListener('open-extend-modal', handler);
  }, []);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('ho_pending_payment') === '1') setShowPremiumModal(true);
      if (sessionStorage.getItem('ho_verify_sub') === '1') {
        sessionStorage.removeItem('ho_verify_sub');
        (async () => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();
            const res = await fetch('/api/usage?fp=check', { headers: { 'x-user-token': token } });
            const data = await res.json();
            // The API answers with `subscribed`. Reading `isPremium`, which it
            // no longer sends, signed every returning subscriber straight out.
            if (data.subscribed !== true) {
              await firebaseSignOut(auth);
              setNoSubFound(true);
              setShowPremiumModal(true);
            }
          }
        })();
      }
    }
  }, []);

  const fetchSub = React.useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/sub-status', { headers: { 'x-user-token': token } });
      const d = await res.json();
      if (d.isPremium) setSubData({ plan: d.plan, expires_at: d.expires_at, autoRenew: !!d.autoRenew });
      else setSubData(null);
    } catch { setSubData(null); }
  }, []);

  const refreshSub = React.useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      await fetchSub(token);
    }
  }, [fetchSub]);

  useEffect(() => {
    setAspirant(loadAspirantProfile());
    const onProfile = () => setAspirant(loadAspirantProfile());
    window.addEventListener(PROFILE_EVENT, onProfile);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        fetchSub(token);
      } else {
        setSubData(null);
      }
    });
    return () => { unsubscribe(); window.removeEventListener(PROFILE_EVENT, onProfile); };
  }, [fetchSub]);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUserMenuOpen(false);
    setOpen(false);
    router.refresh();
  };

  const notesItems: MenuItem[] = [
    { href: '/notes', label: langHi ? 'पेपर I' : 'Paper I' },
    { href: '/notes?paper=2', label: langHi ? 'पेपर II' : 'Paper II' },
    { href: '/prelims', label: tr(t.prelims, langHi) },
    { href: '/timeline', label: langHi ? 'समयरेखा' : 'Timeline' },
    { href: '/historiography', label: langHi ? 'इतिहास-लेखन' : 'Historiography' },
    { href: '/flashcards', label: langHi ? 'फ़्लैशकार्ड' : 'Flashcards' },
    { href: '/current-affairs', label: langHi ? 'समसामयिकी' : 'Current affairs' },
    { href: '/resources', label: tr(t.resources, langHi) },
    { href: '/#daily-answer', label: langHi ? 'दैनिक उत्तर लेखन' : 'Daily answer writing' },
  ];
  const pyqItems: MenuItem[] = [
    { href: '/pyqs', label: langHi ? 'सभी PYQs' : 'All PYQs' },
    { href: '/topper-copies', label: langHi ? 'टॉपर कॉपियाँ' : 'Topper copies' },
    { href: '/test', label: langHi ? 'टेस्ट पेपर' : 'Test papers' },
  ];
  const flatLinks: (MenuItem & { accent?: boolean })[] = [
    { href: '/evaluate', label: tr(t.evaluate, langHi) },
    { href: '/mapping', label: tr(t.mapping, langHi) },
    { href: '/pricing', label: langHi ? 'क़ीमतें' : 'Pricing' },
    { href: '/chat', label: tr(t.chat, langHi), accent: true },
  ];
  const notesActive = ['/notes', '/prelims', '/timeline', '/historiography', '/current-affairs', '/flashcards', '/resources'].some(p => pathname.startsWith(p));
  const pyqsActive = ['/pyqs', '/topper-copies', '/test'].some(p => pathname.startsWith(p));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Mains 2026 or Prelims 2027, for a reader who has set a target year.
  const target = aspirantYear.trim();
  const exam = target === '2026'
    ? { label: langHi ? 'मुख्य परीक्षा 2026' : 'Mains 2026', when: langHi ? '21 अगस्त 2026' : '21 Aug 2026', days: daysToMains() }
    : target === '2027'
      ? { label: langHi ? 'प्रिलिम्स 2027' : 'Prelims 2027', when: langHi ? '23 मई 2027' : '23 May 2027', days: Math.max(0, Math.ceil((new Date('2027-05-23T00:00:00').getTime() - Date.now()) / 86400000)) }
      : null;

  const langToggle = (
    <button className="nb-lang" onClick={toggleLang} aria-label={langHi ? 'Switch to English' : 'हिन्दी में देखें'} title={langHi ? 'Switch to English' : 'Switch to Hindi'}>
      <span className={!langHi ? 'on' : ''}>EN</span>
      <span className={langHi ? 'on' : ''}>हि</span>
    </button>
  );

  const planBlock = subData ? (() => {
    const days = Math.ceil((new Date(subData.expires_at).getTime() - Date.now()) / 86400000);
    const on = fmtDate(subData.expires_at, 'short', langHi);
    return (
      <div className="nb-plan-block">
        <div className="nb-plan-line">
          <strong>{planLabel(subData.plan, langHi)}{subData.autoRenew && (langHi ? ' · नवीनीकरण चालू' : ' · renewing')}</strong>
          <span>{days <= 0 ? (langHi ? 'समाप्त' : 'Expired') : langHi ? `${days} दिन शेष` : `${days} day${days === 1 ? '' : 's'} left`}</span>
        </div>
        <p>{langHi ? `${on} को ${subData.autoRenew ? 'नवीनीकरण' : 'समाप्त'}` : `${subData.autoRenew ? 'Renews' : 'Ends'} ${on}`}</p>
        {/* Extending a running mandate would stack one-time days onto a
            subscription that already renews on its own, so it is offered
            only to one-time plans. */}
        {!subData.autoRenew && (
          <button className="ds-btn ds-btn-line ds-btn-sm ds-btn-block" onClick={() => { setShowExtendModal(true); setUserMenuOpen(false); setOpen(false); }}>
            {langHi ? 'प्लान बढ़ाएँ' : 'Extend plan'}
          </button>
        )}
        {subData.autoRenew && (
          <>
            <button className="ds-btn ds-btn-line ds-btn-sm ds-btn-block" onClick={handleCancelAutopay} disabled={cancelling}>
              {cancelling ? (langHi ? 'रद्द हो रहा है…' : 'Cancelling…') : (langHi ? 'नवीनीकरण रद्द करें' : 'Cancel renewal')}
            </button>
            <p className="nb-fine">{langHi ? `आगे कोई राशि नहीं कटेगी। ${on} तक पहुँच बनी रहेगी।` : `Stops future charges. You keep access until ${on}.`}</p>
          </>
        )}
      </div>
    );
  })() : (
    <div className="nb-plan-block">
      <div className="nb-plan-line"><strong>{langHi ? 'निःशुल्क प्लान' : 'Free plan'}</strong><span>{FEATURES.find(f => f.name === 'Answer evaluation')?.free.replace(' total', '')} {langHi ? 'उत्तर जाँच' : 'answer check'}, {FEATURES.find(f => f.name === 'AI Chat')?.free.replace(' total', '')} {langHi ? 'चैट' : 'chats'}</span></div>
      <button className="ds-btn ds-btn-solid ds-btn-sm ds-btn-block" onClick={() => { setShowPremiumModal(true); setUserMenuOpen(false); setOpen(false); }}>
        {langHi ? 'प्रीमियम लें' : 'Go Premium'}
      </button>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />
      <nav className="nb ds" aria-label={langHi ? 'मुख्य' : 'Main'}>
        <div className="nb-inner">
          <Link href="/" className="nb-brand" aria-label={langHi ? 'History Optional, होम' : 'History Optional, home'}>
            <Image src="/mascot/owl.svg" alt="" width={30} height={28} priority />
            <span>History Optional</span>
          </Link>

          <div className="nb-links">
            <NavMenu label={tr(t.notes, langHi)} items={notesItems} active={notesActive} pathname={pathname}
              open={notesMenuOpen} onToggle={() => { setNotesMenuOpen(o => !o); setPyqsMenuOpen(false); }} onClose={() => setNotesMenuOpen(false)} menuRef={notesRef} />
            <NavMenu label={langHi ? 'PYQ' : 'PYQs'} items={pyqItems} active={pyqsActive} pathname={pathname}
              open={pyqsMenuOpen} onToggle={() => { setPyqsMenuOpen(o => !o); setNotesMenuOpen(false); }} onClose={() => setPyqsMenuOpen(false)} menuRef={pyqsRef} />
            {flatLinks.map(l => (
              <Link key={l.href} href={l.href} className={`nb-link${l.accent ? ' accent' : ''}${isActive(l.href) ? ' on' : ''}`} aria-current={isActive(l.href) ? 'page' : undefined}>
                {l.accent && Icon.chat}{l.label}
              </Link>
            ))}
          </div>

          <div className="nb-right">
            <span className="nb-search-wrap"><SearchModal label={langHi ? 'खोजें' : 'Search'} /></span>
            <span className="nb-wide">{langToggle}</span>
            <button className="nb-icon nb-wide" onClick={toggleTheme} aria-label={langHi ? (isDark ? 'लाइट मोड पर जाएँ' : 'डार्क मोड पर जाएँ') : (isDark ? 'Switch to light mode' : 'Switch to dark mode')} title={langHi ? (isDark ? 'लाइट मोड' : 'डार्क मोड') : (isDark ? 'Light mode' : 'Dark mode')}>
              {isDark ? Icon.sun : Icon.moon}
            </button>

            {user ? (
              <>
                {!subData && (
                  <button className="nb-premium" onClick={() => setShowPremiumModal(true)}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.5 8.2 8 12l4-7 4 7 4.5-3.8L18.8 18H5.2L3.5 8.2Z" /><rect x="5.2" y="19.2" width="13.6" height="1.8" rx="0.9" /></svg>{langHi ? 'अपग्रेड' : 'Upgrade'}</button>
                )}
                <div ref={accountRef} className="nb-account nb-wide">
                  <button className="nb-avatar" onClick={() => setUserMenuOpen(o => !o)} aria-label={langHi ? 'आपका खाता' : 'Your account'} aria-expanded={userMenuOpen} aria-haspopup="menu" title={user.email ?? undefined}>
                    <UserAvatar email={user.email ?? ''} name={aspirantName} photoURL={user.photoURL} size={34} />
                  </button>
                  {userMenuOpen && (
                    <div className="nb-menu" role="menu">
                      <div className="nb-menu-head">
                        <UserAvatar email={user.email ?? ''} name={aspirantName} photoURL={user.photoURL} size={40} />
                        <div className="nb-menu-who">
                          <strong>{aspirantName || (langHi ? 'आपका खाता' : 'Your account')}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                      {planBlock}
                      {exam && (
                        <div className="nb-exam">
                          <span><strong>{exam.label}</strong> · {exam.when}</span>
                          <span className="nb-exam-days"><strong>{exam.days}</strong> {langHi ? 'दिन' : 'days'}</span>
                        </div>
                      )}
                      <div className="nb-menu-links">
                        <Link href="/dashboard" className="nb-menu-item" role="menuitem">{Icon.dash}{langHi ? 'डैशबोर्ड' : 'Dashboard'}</Link>
                        <Link href="/profile" className="nb-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>{Icon.edit}{langHi ? 'प्रोफ़ाइल और सेटिंग्स' : 'Profile and settings'}</Link>
                        <Link href="/pricing" className="nb-menu-item" role="menuitem">{Icon.plans}{langHi ? 'प्लान' : 'Plans'}</Link>
                        <button className="nb-menu-item danger" role="menuitem" onClick={handleSignOut}>{Icon.out}{langHi ? 'साइन आउट करें' : 'Sign out'}</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button className="nb-premium" onClick={() => setShowPremiumModal(true)}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.5 8.2 8 12l4-7 4 7 4.5-3.8L18.8 18H5.2L3.5 8.2Z" /><rect x="5.2" y="19.2" width="13.6" height="1.8" rx="0.9" /></svg>{langHi ? 'प्रीमियम' : 'Premium'}</button>
            )}

            <button className={`nb-icon nb-burger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label={langHi ? (open ? 'मेनू बंद करें' : 'मेनू खोलें') : (open ? 'Close menu' : 'Open menu')} aria-expanded={open}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`nb-sheet ds${open ? ' open' : ''}`} aria-hidden={!open}>
        <button className="nb-sheet-search" onClick={() => { setOpen(false); window.dispatchEvent(new Event('open-search')); }}>
          {Icon.search}{langHi ? 'नोट्स, PYQ और इतिहासकार खोजें' : 'Search notes, PYQs and historians'}
        </button>

        {([
          { title: tr(t.notes, langHi), items: notesItems },
          { title: tr(t.pyqs, langHi), items: pyqItems },
          { title: langHi ? 'टूल्स' : 'Tools', items: [...flatLinks, { href: '/dashboard', label: tr(t.dashboard, langHi) }] },
        ] as { title: string; items: (MenuItem & { accent?: boolean })[] }[]).map(group => (
          <div key={group.title} className="nb-sheet-group">
            <div className="nb-sheet-title">{group.title}</div>
            <div className="nb-sheet-grid">
              {group.items.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`nb-sheet-link${l.href.split('#')[0] !== '/' && !l.href.startsWith('/notes') && isActive(l.href) ? ' on' : ''}${l.accent ? ' accent' : ''}`}>
                  {l.accent && Icon.chat}{l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="nb-sheet-foot">
          {user && (
            <div className="nb-sheet-user">
              <UserAvatar email={user.email ?? ''} name={aspirantName} photoURL={user.photoURL} size={38} />
              <div>
                <strong>{aspirantName || (langHi ? 'UPSC अभ्यर्थी' : 'UPSC aspirant')}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
          {user && planBlock}
          <div className="nb-sheet-actions">
            {langToggle}
            <button className="ds-btn ds-btn-line ds-btn-sm" onClick={toggleTheme}>{isDark ? Icon.sun : Icon.moon}{langHi ? (isDark ? 'लाइट' : 'डार्क') : (isDark ? 'Light' : 'Dark')}</button>
            {user && <Link href="/profile" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setOpen(false)}>{Icon.edit}{langHi ? 'प्रोफ़ाइल' : 'Profile'}</Link>}
            {user && <button className="ds-btn ds-btn-line ds-btn-sm nb-danger" onClick={handleSignOut}>{Icon.out}{langHi ? 'साइन आउट' : 'Sign out'}</button>}
          </div>
        </div>
      </div>

      {showExtendModal && user && (
        <ExtendModal
          user={{ id: user.uid, email: user.email ?? null }}
          subData={subData}
          onClose={() => setShowExtendModal(false)}
          onSuccess={(newExpiry, plan) => setSubData(prev => prev ? { ...prev, plan, expires_at: newExpiry } : { plan, expires_at: newExpiry })}
        />
      )}

      {showPremiumModal && (
        <PremiumModal
          onClose={() => { setShowPremiumModal(false); setNoSubFound(false); }}
          noSubFound={noSubFound}
          isLoggedIn={!!user}
          onPaymentSuccess={refreshSub}
        />
      )}
    </>
  );
}

const NAV_CSS = `
.nb {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1100; height: 60px;
  display: flex; align-items: center; padding: 0 var(--space-5);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: saturate(1.4) blur(12px); -webkit-backdrop-filter: saturate(1.4) blur(12px);
  border-bottom: 1px solid var(--border);
}
.nb-inner { width: 100%; max-width: 1240px; margin: 0 auto; display: flex; align-items: center; gap: var(--space-3); }
.nb-brand { display: inline-flex; align-items: center; gap: var(--space-2); text-decoration: none; color: var(--text); flex-shrink: 0; }
.nb-brand span { font-weight: 800; font-size: 1.04rem; letter-spacing: -0.015em; white-space: nowrap; }
.nb-links { display: flex; align-items: center; gap: 2px; margin-left: clamp(var(--space-6), 4vw, 56px); }
.nb-link {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 11px; border: none; border-radius: var(--radius-md); background: none;
  color: var(--text2); text-decoration: none; font-size: 0.9rem; cursor: pointer; white-space: nowrap;
  transition: color 0.15s, background 0.15s;
}
.nb-link svg { opacity: 0.7; }
.nb-link:hover { color: var(--text); background: var(--ds-soft); }
.nb-link.on { color: var(--text); font-weight: 700; }
.nb-link.accent { color: var(--accent-text); background: var(--accent-dim); margin-left: var(--space-1); }
.nb-link.accent svg { opacity: 1; }
.nb-link.accent:hover { background: color-mix(in srgb, var(--accent) 16%, transparent); }
.nb-link.accent.on { background: var(--accent); color: var(--accent-on); }
.nb-drop { position: relative; }
.nb-drop-menu {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 200; min-width: 210px;
  display: flex; flex-direction: column; padding: var(--space-2);
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); box-shadow: var(--elev-3);
}
.nb-drop-item { padding: 8px 10px; border-radius: var(--radius-md); color: var(--text); text-decoration: none; font-size: 0.9rem; }
.nb-drop-item:hover { background: var(--ds-soft); }
.nb-drop-item.on { color: var(--accent-text); background: var(--accent-dim); font-weight: 600; }
.nb-right { display: flex; align-items: center; gap: var(--space-2); margin-left: auto; }
.nb-search-wrap { display: inline-flex; }
.nb-search {
  display: inline-flex; align-items: center; gap: var(--space-2);
  height: 38px; padding: 0 6px 0 var(--space-3); width: clamp(150px, 13vw, 200px);
  background: var(--ds-soft); color: var(--text3);
  border: 1px solid var(--border2); border-radius: var(--radius-full);
  font-family: var(--font-ui); font-size: 0.86rem; cursor: pointer; transition: border-color 0.15s, color 0.15s;
}
.nb-search:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--text2); }
.nb-search-text { flex: 1; min-width: 0; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nb-search kbd {
  font-family: var(--font-ui); font-size: 0.7rem; color: var(--text3);
  padding: 2px 7px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card);
}
.nb-icon {
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: none; border: 1px solid transparent; border-radius: var(--radius-md); color: var(--text2); cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.nb-icon:hover { background: var(--ds-soft); color: var(--text); }
.nb-lang {
  display: inline-flex; align-items: center; height: 34px; padding: 3px; gap: 2px;
  background: var(--ds-soft); border: 1px solid var(--border2); border-radius: var(--radius-full); cursor: pointer;
}
.nb-lang span { min-width: 30px; height: 26px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-full); font-family: var(--font-ui); font-size: 0.76rem; font-weight: 700; color: var(--text3); }
.nb-lang span.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
/* The way to Premium: the gold of the plan itself, with a sheen that passes on hover. */
.nb-premium { position: relative; isolation: isolate; overflow: hidden; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 15px 0 12px; border: none; border-radius: var(--radius-full); background: var(--premium-fill); color: var(--premium-on); font: inherit; font-size: 0.88rem; font-weight: 800; letter-spacing: 0.01em; white-space: nowrap; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.18), 0 3px 10px -3px color-mix(in srgb, var(--premium-text) 70%, transparent); }
.nb-premium::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%); transform: translateX(-130%); }
.nb-premium:hover::after { transform: translateX(130%); transition: transform 0.8s ease-out; }
.nb-premium:focus-visible { outline: 2px solid var(--premium-text); outline-offset: 2px; }
.nb-premium svg { flex-shrink: 0; margin-top: -1px; }
@media (prefers-reduced-motion: reduce) { .nb-premium:hover::after { transition: none; transform: translateX(-130%); } }
.nb-account { position: relative; }
.nb-avatar { width: 38px; height: 38px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: var(--radius-circle); background: none; cursor: pointer; }
.nb-avatar:focus-visible, .nb-icon:focus-visible, .nb-link:focus-visible, .nb-lang:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.nb-avatar-disc {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
  border-radius: var(--radius-circle); border: 1px solid var(--border2);
  background: var(--accent-dim); color: var(--accent-text); font-family: var(--font-ui); font-weight: 700; line-height: 1; user-select: none;
}
.nb-avatar-disc img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nb-menu {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 200; width: 300px;
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl);
  box-shadow: var(--elev-3); padding: var(--space-2);
}
.nb-menu-head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-2) var(--space-3); border-bottom: 1px solid var(--border); }
.nb-menu-who { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.nb-menu-who strong { font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nb-menu-who span { font-family: var(--font-ui); font-size: 0.78rem; color: var(--text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nb-exam { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin: 0 var(--space-2) var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--ds-soft); font-family: var(--font-ui); font-size: 0.8rem; color: var(--text2); }
.nb-exam strong { color: var(--text); }
.nb-exam-days strong { font-size: 1rem; font-weight: 800; color: var(--accent-text); }
.nb-plan-block { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-2); border-top: 1px solid var(--border); }
.nb-plan-line { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.nb-plan-line strong { font-size: 0.9rem; }
.nb-plan-line span { font-family: var(--font-ui); font-size: 0.78rem; color: var(--text2); }
.nb-plan-block p { margin: 0; font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); }
.nb-plan-block .nb-fine { font-size: 0.76rem; }
.nb-menu-links { display: flex; flex-direction: column; padding-top: var(--space-1); border-top: 1px solid var(--border); }
.nb-menu-item {
  width: 100%; display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2); border: none; background: none; border-radius: var(--radius-md);
  color: var(--text); font-size: 0.9rem; text-decoration: none; text-align: left; cursor: pointer;
}
.nb-menu-item svg { color: var(--text3); }
.nb-menu-item:hover { background: var(--ds-soft); }
.nb-menu-item.danger, .nb-menu-item.danger svg, .nb-danger { color: var(--danger-text); }
.nb-burger { display: none; flex-direction: column; gap: 4px; }
.nb-burger span { display: block; width: 18px; height: 1.6px; border-radius: 2px; background: var(--text); transition: transform 0.2s, opacity 0.15s; }
.nb-burger.open span:nth-child(1) { transform: translateY(5.6px) rotate(45deg); }
.nb-burger.open span:nth-child(2) { opacity: 0; }
.nb-burger.open span:nth-child(3) { transform: translateY(-5.6px) rotate(-45deg); }

.nb-sheet {
  position: fixed; inset: 60px 0 0 0; z-index: 1099;
  background: var(--bg); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto;
  padding: var(--space-4) var(--space-4) calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
  opacity: 0; visibility: hidden; transform: translateY(-6px); pointer-events: none;
  transition: opacity 0.18s, transform 0.18s, visibility 0s linear 0.18s;
}
.nb-sheet.open { opacity: 1; visibility: visible; transform: none; pointer-events: auto; transition: opacity 0.18s, transform 0.18s; }
/* Clear of the bottom tab bar, which stays over the sheet on phones. */
@media (max-width: 768px) { .nb-sheet { padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px)); } }
.nb-sheet-search {
  display: flex; align-items: center; gap: var(--space-2); width: 100%; min-height: 46px; padding: 0 var(--space-4); flex-shrink: 0;
  background: var(--ds-card); color: var(--text3); border: 1px solid var(--border2); border-radius: var(--radius-lg);
  font-size: 0.95rem; text-align: left; cursor: pointer;
}
.nb-sheet-title { margin-bottom: var(--space-2); font-family: var(--font-ui); font-size: 0.8rem; font-weight: 600; color: var(--text3); }
.nb-sheet-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-2); }
.nb-sheet-link {
  display: flex; align-items: center; gap: var(--space-2); min-height: 46px; padding: 0 var(--space-3);
  background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  color: var(--text); text-decoration: none; font-size: 0.95rem;
}
.nb-sheet-link.on { border-color: color-mix(in srgb, var(--accent) 50%, transparent); color: var(--accent-text); font-weight: 600; }
.nb-sheet-link.accent { background: var(--accent-dim); border-color: transparent; color: var(--accent-text); font-weight: 600; }
.nb-sheet-foot { margin-top: auto; display: flex; flex-direction: column; gap: var(--space-3); }
.nb-sheet-foot .nb-plan-block { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-card); padding: var(--space-3); }
.nb-sheet-user { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-card); }
.nb-sheet-user div { display: flex; flex-direction: column; min-width: 0; }
.nb-sheet-user strong { font-size: 0.95rem; }
.nb-sheet-user span { font-family: var(--font-ui); font-size: 0.78rem; color: var(--text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nb-sheet-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.nb-sheet-actions .ds-btn { flex: 1; }

.nb-alert { margin-bottom: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--danger-wash); color: var(--danger-text); font-size: 0.86rem; text-align: center; }
.nb-up {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); width: 100%; max-width: 900px;
  max-height: calc(100dvh - 32px); overflow-y: auto; overscroll-behavior: contain;
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); box-shadow: var(--elev-3);
}
.nb-up-grab { display: none; }
.nb-up-x { position: absolute; top: var(--space-3); right: var(--space-3); z-index: 2; }
.nb-up-why { padding: var(--space-8) var(--space-6) var(--space-6); background: var(--ds-soft); border-right: 1px solid var(--border); }
.nb-up-owl { display: block; margin-bottom: var(--space-3); }
.nb-up-why h2 { margin: 0; font-size: 1.7rem; font-weight: 800; letter-spacing: -0.03em; }
.nb-up-lede { margin: var(--space-2) 0 var(--space-5); font-size: 0.95rem; line-height: 1.6; color: var(--text2); }
.nb-up-gains { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.nb-up-gains li { display: flex; gap: var(--space-3); }
.nb-up-tick { flex-shrink: 0; width: 22px; height: 22px; margin-top: 1px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--success-wash); color: var(--success-text); }
.nb-up-gains div { display: flex; flex-direction: column; gap: 1px; }
.nb-up-gains strong { font-size: 0.92rem; }
.nb-up-gains span { font-size: 0.84rem; line-height: 1.5; color: var(--text3); }
.nb-up-more { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--space-5); font-size: 0.88rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.nb-up-more:hover { text-decoration: underline; text-underline-offset: 3px; }
.nb-up-buy { padding: var(--space-8) var(--space-6) var(--space-6); display: flex; flex-direction: column; }
.nb-up-buy h3 { margin: 0 0 var(--space-4); font-size: 1.05rem; font-weight: 700; }
.nb-up-signin { align-self: center; margin-top: var(--space-4); background: none; border: none; padding: 6px 0; color: var(--text2); font-size: 0.88rem; cursor: pointer; text-decoration: underline; text-decoration-color: var(--border3); text-underline-offset: 3px; }
.nb-up-signin:hover { color: var(--accent-text); }
/* On a phone the panel is a sheet from the bottom, the plans first and the
   pay button held within reach of a thumb. */
@media (max-width: 760px) {
  .nb-up-overlay { align-items: flex-end; padding: 0; }
  .nb-up {
    display: flex; flex-direction: column; max-height: 92dvh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; border-bottom: none;
    animation: nb-up-rise 0.24s cubic-bezier(0.16,1,0.3,1);
  }
  .nb-up-grab { display: block; position: sticky; top: 0; z-index: 3; width: 100%; height: 22px; flex-shrink: 0; background: var(--ds-soft); }
  .nb-up-grab::after { content: ''; position: absolute; left: 50%; top: 8px; width: 40px; height: 4px; margin-left: -20px; border-radius: 4px; background: var(--border3); }
  .nb-up-x { top: 8px; right: var(--space-2); }
  .nb-up-why { padding: var(--space-2) var(--space-4) var(--space-4); border-right: none; border-bottom: 1px solid var(--border); }
  .nb-up-owl { display: none; }
  .nb-up-why h2 { font-size: 1.45rem; }
  .nb-up-lede { margin: var(--space-1) 0 var(--space-3); font-size: 0.9rem; }
  /* Titles only: the sheet keeps the plans within the first screen. */
  .nb-up-gains { gap: var(--space-2); }
  .nb-up-gains div span { display: none; }
  .nb-up-gains strong { font-size: 0.9rem; font-weight: 600; }
  .nb-up-tick { width: 20px; height: 20px; margin-top: 0; }
  .nb-up-more { margin-top: var(--space-3); font-size: 0.86rem; }
  .nb-up-buy { padding: var(--space-4) var(--space-4) 0; }
  .nb-up-buy h3 { margin-bottom: var(--space-3); }
  .nb-up-buy .sc-cta {
    position: sticky; bottom: 0; z-index: 2; margin: 0 calc(-1 * var(--space-4));
    padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
    background: var(--ds-card); border-top: 1px solid var(--border);
  }
  .nb-up-signin { margin: 0 0 var(--space-4); }
}
@keyframes nb-up-rise { from { transform: translateY(24px); opacity: 0.6; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .nb-up { animation: none; } }
.nb-extend-overlay { z-index: 99999; }
.nb-extend { max-width: 420px; }
.nb-extend-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); border: 1px solid var(--border); font-size: 0.88rem; }
.nb-extend-row span { color: var(--text2); }
.nb-extend-row.good { background: var(--success-wash); border-color: transparent; }
.nb-extend-row.good strong { color: var(--success-text); }
.nb-plans { display: grid; gap: var(--space-2); margin-bottom: var(--space-4); }
.nb-plan {
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: var(--space-3) var(--space-2);
  background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.nb-plan span { font-family: var(--font-ui); font-size: 0.8rem; color: var(--text2); }
.nb-plan strong { font-size: 1.05rem; color: var(--text); }
.nb-plan:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.nb-plan.on { border-color: var(--accent); background: var(--accent-dim); }
.nb-plan.on span { color: var(--accent-text); }

@media (max-width: 1240px) {
  .nb-search { width: 38px; padding: 0; justify-content: center; }
  .nb-search-text, .nb-search kbd { display: none; }
}
@media (max-width: 1100px) {
  .nb-links, .nb-wide, .nb-search-wrap { display: none; }
  .nb-burger { display: inline-flex; }
  .nb { padding: 0 var(--space-3); }
}
@media (max-width: 380px) {
  .nb-brand span { display: none; }
}
@media (min-width: 1101px) { .nb-sheet { display: none; } }
@media (prefers-reduced-motion: reduce) { .nb-sheet, .nb-burger span { transition: none; } }
`;
