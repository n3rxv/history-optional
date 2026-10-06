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
import { FEATURES } from '@/lib/features';
import { daysToMains } from '@/lib/examDates';
import { PLANS, PLAN_ORDER, DEFAULT_PLAN, planPriceLabel, addPlanDuration, isPlanId, type PlanId } from '@/lib/plans';

/**
 * The reader's Google profile picture, falling back to their initial.
 *
 * Firebase hands this over as user.photoURL from the Google provider. It is
 * null for anyone who signed in without a picture, so the initial is a real
 * path rather than a safety net, and onError covers a URL that 404s later,
 * which Google's lh3 links do once a photo is removed.
 */
function UserAvatar({ email, name, photoURL, size = 34 }: {
  email: string; name?: string; photoURL?: string | null; size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim() || email || '?').charAt(0).toUpperCase();
  const showImage = Boolean(photoURL) && !failed;
  return (
    <span className="nb-avatar-disc" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL as string} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : initial}
    </span>
  );
}

/** A stored plan id shown to the reader. Falls back to the raw value for
 *  rows written before the id set settled. */
function planLabel(plan: string): string {
  return isPlanId(plan) ? PLANS[plan].label : plan;
}

const fmtDate = (iso: string, month: 'short' | 'long' = 'short') =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month, year: 'numeric' });

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
  const gains = [
    { title: 'Answer checking without limits', body: `Free covers ${evalFree} answer. Premium checks every answer you write, and whole test papers too.` },
    { title: 'The AI tutor, unlimited', body: `Past the ${chatFree} free chats, with Books, PDF, Brainstorm and Mentor modes.` },
    { title: 'Model answers for every PYQ', body: 'See how a question could be answered before you write your own.' },
    { title: 'Topper copies', body: 'Real answer sheets from toppers, which sell for ₹799 on their own.' },
    { title: 'Prelims analysis', body: 'Every Prelims PYQ, sorted by what keeps coming back.' },
  ];

  return (
    <div className="ds ds-overlay nb-up-overlay" onClick={onClose}>
      <div className="nb-up" role="dialog" aria-modal="true" aria-labelledby="nb-up-title" onClick={e => e.stopPropagation()}>
        <span className="nb-up-grab" aria-hidden="true" />
        <button className="ds-x nb-up-x" onClick={onClose} aria-label="Close">{Icon.close}</button>

        <div className="nb-up-why">
          <Image src="/mascot/owl-celebrate.svg" alt="" width={64} height={60} className="nb-up-owl" />
          <h2 id="nb-up-title">Go Premium</h2>
          <p className="nb-up-lede">Notes and PYQs stay free. Premium is for the practice: your answers checked and the AI tutor, with no limits.</p>
          <ul className="nb-up-gains">
            {gains.map(g => (
              <li key={g.title}>
                <span className="nb-up-tick" aria-hidden="true">{Icon.check}</span>
                <div><strong>{g.title}</strong><span>{g.body}</span></div>
              </li>
            ))}
          </ul>
          <Link href="/pricing" className="nb-up-more" onClick={onClose}>Compare Free and Premium in full {Icon.arrow}</Link>
        </div>

        <div className="nb-up-buy">
          <h3>Choose how long</h3>
          {noSubFound && <div className="nb-alert">No active subscription found for this account.</div>}
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
              Already on Premium? Sign in
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
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(DEFAULT_PLAN);
  const [loading, setLoading] = useState(false);

  // Built from lib/plans.ts, which is what /api/razorpay/order bills from.
  // This list used to be typed by hand and carried a Weekly and a Monthly
  // tile at ₹1,999. Neither is a plan id the server knows, so toPlanId()
  // fell back to yearly: the button said ₹1,999, Razorpay charged ₹2,999,
  // and the reader was granted a year instead of the week or month shown.
  const plans = PLAN_ORDER.map(id => ({
    id, label: PLANS[id].label, price: planPriceLabel(id),
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
            <h2 id="nb-extend-title">{subData ? 'Extend your plan' : 'Choose a plan'}</h2>
            <p>{subData ? 'The new time is added after your current plan ends.' : 'Pick how long you want Premium for.'}</p>
          </div>
          <button className="ds-x" onClick={onClose} aria-label="Close">{Icon.close}</button>
        </div>

        {subData && (
          <div className="nb-extend-row">
            <span>Your plan ends</span>
            <strong>{fmtDate(subData.expires_at)}</strong>
          </div>
        )}

        <div className="nb-plans" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
          {plans.map(p => (
            <button key={p.id} className={`nb-plan${selectedPlan === p.id ? ' on' : ''}`} onClick={() => setSelectedPlan(p.id)} aria-pressed={selectedPlan === p.id}>
              <span>{p.label}</span>
              <strong>{p.price}</strong>
            </button>
          ))}
        </div>

        <div className="nb-extend-row good">
          <span>After paying, Premium runs until</span>
          <strong>{fmtDate(newExpiry.toISOString(), 'long')}</strong>
        </div>

        <button className="ds-btn ds-btn-solid ds-btn-lg ds-btn-block" onClick={handlePay} disabled={loading}>
          {loading ? 'Opening Razorpay…' : `Pay ${cur.price}`}
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { langHi, toggleLang } = useLang();
  const [isDark, setIsDark] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aspirantName, setAspirantName] = useState('');
  const [aspirantAge, setAspirantAge] = useState('');
  const [aspirantAttempt, setAspirantAttempt] = useState('');
  const [aspirantYear, setAspirantYear] = useState('');
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
    if (!window.confirm('Stop the weekly renewal? You keep access for the remaining days you’ve already paid for.')) return;
    setCancelling(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/razorpay/subscription/cancel', {
        method: 'POST', headers: { 'x-user-token': token },
      });
      if (res.ok) setSubData(prev => (prev ? { ...prev, autoRenew: false } : prev));
    } finally {
      setCancelling(false);
    }
  }

  // The bootstrap in app/layout.tsx stamps data-theme before paint; read it
  // rather than working it out again.
  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
  }, []);

  // Always writes an explicit choice, in both directions, so a reader on a
  // dark OS can still pick paper.
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ho-theme', theme); } catch {}
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
    const saved = localStorage.getItem('ho_aspirant_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setAspirantName(p.name || ''); setAspirantAge(p.age || ''); setAspirantAttempt(p.attempt || ''); setAspirantYear(p.year || '');
      } catch {}
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        fetchSub(token);
      } else {
        setSubData(null);
      }
    });
    return () => unsubscribe();
  }, [fetchSub]);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUserMenuOpen(false);
    setOpen(false);
    router.refresh();
  };

  const saveProfileField = (key: 'name' | 'age' | 'attempt' | 'year', value: string) => {
    const cur = { name: aspirantName, age: aspirantAge, attempt: aspirantAttempt, year: aspirantYear, [key]: value };
    localStorage.setItem('ho_aspirant_profile', JSON.stringify(cur));
  };

  const notesItems: MenuItem[] = [
    { href: '/notes', label: langHi ? 'पेपर I' : 'Paper I' },
    { href: '/notes?paper=2', label: langHi ? 'पेपर II' : 'Paper II' },
    { href: '/timeline', label: langHi ? 'समयरेखा' : 'Timeline' },
    { href: '/historiography', label: langHi ? 'इतिहास-लेखन' : 'Historiography' },
    { href: '/flashcards', label: langHi ? 'फ्लैशकार्ड' : 'Flashcards' },
    { href: '/current-affairs', label: langHi ? 'समसामयिकी' : 'Current affairs' },
    { href: '/resources', label: tr(t.resources, langHi) },
    { href: '/#daily-answer', label: langHi ? 'दैनिक उत्तर लेखन' : 'Daily answer writing' },
  ];
  const pyqItems: MenuItem[] = [
    { href: '/pyqs', label: langHi ? 'सभी PYQs' : 'All PYQs' },
    { href: '/topper-copies', label: langHi ? 'टॉपर कॉपियाँ' : 'Topper copies' },
    { href: '/test', label: langHi ? 'टेस्ट सीरीज़' : 'Test series' },
  ];
  const flatLinks: (MenuItem & { accent?: boolean })[] = [
    { href: '/evaluate', label: tr(t.evaluate, langHi) },
    { href: '/mapping', label: tr(t.mapping, langHi) },
    { href: '/prelims', label: tr(t.prelims, langHi) },
    { href: '/chat', label: tr(t.chat, langHi), accent: true },
  ];
  const notesActive = ['/notes', '/timeline', '/historiography', '/current-affairs', '/flashcards', '/resources'].some(p => pathname.startsWith(p));
  const pyqsActive = ['/pyqs', '/topper-copies', '/test'].some(p => pathname.startsWith(p));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Mains 2026 or Prelims 2027, for a reader who has set a target year.
  const target = aspirantYear.trim();
  const exam = target === '2026'
    ? { label: 'Mains 2026', when: '21 Aug 2026', days: daysToMains() }
    : target === '2027'
      ? { label: 'Prelims 2027', when: '23 May 2027', days: Math.max(0, Math.ceil((new Date('2027-05-23T00:00:00').getTime() - Date.now()) / 86400000)) }
      : null;

  const langToggle = (
    <button className="nb-lang" onClick={toggleLang} aria-label={langHi ? 'Switch to English' : 'हिन्दी में देखें'} title={langHi ? 'Switch to English' : 'Switch to Hindi'}>
      <span className={!langHi ? 'on' : ''}>EN</span>
      <span className={langHi ? 'on' : ''}>हि</span>
    </button>
  );

  const planBlock = subData ? (() => {
    const days = Math.ceil((new Date(subData.expires_at).getTime() - Date.now()) / 86400000);
    const on = fmtDate(subData.expires_at);
    return (
      <div className="nb-plan-block">
        <div className="nb-plan-line">
          <strong>{planLabel(subData.plan)}{subData.autoRenew && ' · renewing'}</strong>
          <span>{days <= 0 ? 'Expired' : `${days} day${days === 1 ? '' : 's'} left`}</span>
        </div>
        <p>{subData.autoRenew ? 'Renews' : 'Ends'} {on}</p>
        {/* Extending a running mandate would stack one-time days onto a
            subscription that already renews on its own, so it is offered
            only to one-time plans. */}
        {!subData.autoRenew && (
          <button className="ds-btn ds-btn-line ds-btn-sm ds-btn-block" onClick={() => { setShowExtendModal(true); setUserMenuOpen(false); setOpen(false); }}>
            Extend plan
          </button>
        )}
        {subData.autoRenew && (
          <>
            <button className="ds-btn ds-btn-line ds-btn-sm ds-btn-block" onClick={handleCancelAutopay} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel renewal'}
            </button>
            <p className="nb-fine">Stops future charges. You keep access until {on}.</p>
          </>
        )}
      </div>
    );
  })() : (
    <div className="nb-plan-block">
      <div className="nb-plan-line"><strong>Free plan</strong><span>{FEATURES.find(f => f.name === 'Answer evaluation')?.free.replace(' total', '')} answer check, {FEATURES.find(f => f.name === 'AI Chat')?.free.replace(' total', '')} chats</span></div>
      <button className="ds-btn ds-btn-solid ds-btn-sm ds-btn-block" onClick={() => { setShowPremiumModal(true); setUserMenuOpen(false); setOpen(false); }}>
        Go Premium
      </button>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />
      <nav className="nb ds" aria-label="Main">
        <div className="nb-inner">
          <Link href="/" className="nb-brand" aria-label="History Optional, home">
            <Image src="/mascot/owl.svg" alt="" width={30} height={28} priority />
            <span>History Optional</span>
          </Link>

          <div className="nb-links">
            <NavMenu label={tr(t.notes, langHi)} items={notesItems} active={notesActive} pathname={pathname}
              open={notesMenuOpen} onToggle={() => { setNotesMenuOpen(o => !o); setPyqsMenuOpen(false); }} onClose={() => setNotesMenuOpen(false)} menuRef={notesRef} />
            <NavMenu label="PYQs" items={pyqItems} active={pyqsActive} pathname={pathname}
              open={pyqsMenuOpen} onToggle={() => { setPyqsMenuOpen(o => !o); setNotesMenuOpen(false); }} onClose={() => setPyqsMenuOpen(false)} menuRef={pyqsRef} />
            {flatLinks.map(l => (
              <Link key={l.href} href={l.href} className={`nb-link${l.accent ? ' accent' : ''}${isActive(l.href) ? ' on' : ''}`} aria-current={isActive(l.href) ? 'page' : undefined}>
                {l.accent && Icon.chat}{l.label}
              </Link>
            ))}
          </div>

          <div className="nb-right">
            <span className="nb-search-wrap"><SearchModal label={langHi ? 'नोट्स, PYQs, इतिहासकार खोजें' : undefined} /></span>
            <span className="nb-wide">{langToggle}</span>
            <button className="nb-icon nb-wide" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? Icon.sun : Icon.moon}
            </button>

            {user ? (
              <>
                {!subData && (
                  <button className="ds-btn ds-btn-premium ds-btn-sm nb-upgrade" onClick={() => setShowPremiumModal(true)}>Upgrade</button>
                )}
                <div ref={accountRef} className="nb-account nb-wide">
                  <button className="nb-avatar" onClick={() => setUserMenuOpen(o => !o)} aria-label="Your account" aria-expanded={userMenuOpen} aria-haspopup="menu" title={user.email ?? undefined}>
                    <UserAvatar email={user.email ?? ''} name={aspirantName} photoURL={user.photoURL} size={34} />
                  </button>
                  {userMenuOpen && (
                    <div className="nb-menu" role="menu">
                      <div className="nb-menu-head">
                        <UserAvatar email={user.email ?? ''} name={aspirantName} photoURL={user.photoURL} size={40} />
                        <div className="nb-menu-who">
                          <strong>{aspirantName || 'Your account'}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                      {planBlock}
                      {exam && (
                        <div className="nb-exam">
                          <span><strong>{exam.label}</strong> · {exam.when}</span>
                          <span className="nb-exam-days"><strong>{exam.days}</strong> days</span>
                        </div>
                      )}
                      <div className="nb-menu-links">
                        <Link href="/dashboard" className="nb-menu-item" role="menuitem">{Icon.dash}Dashboard</Link>
                        <button className="nb-menu-item" role="menuitem" onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}>{Icon.edit}Your profile</button>
                        <Link href="/pricing" className="nb-menu-item" role="menuitem">{Icon.plans}Plans</Link>
                        <button className="nb-menu-item danger" role="menuitem" onClick={handleSignOut}>{Icon.out}Sign out</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button className="ds-btn ds-btn-premium ds-btn-sm nb-upgrade" onClick={() => setShowPremiumModal(true)}>Premium</button>
            )}

            <button className={`nb-icon nb-burger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`nb-sheet ds${open ? ' open' : ''}`} aria-hidden={!open}>
        <button className="nb-sheet-search" onClick={() => { setOpen(false); window.dispatchEvent(new Event('open-search')); }}>
          {Icon.search}{langHi ? 'नोट्स, PYQs, इतिहासकार खोजें' : 'Search notes, PYQs and historians'}
        </button>

        {([
          { title: tr(t.notes, langHi), items: notesItems },
          { title: 'PYQs', items: pyqItems },
          { title: langHi ? 'टूल्स' : 'Tools', items: [...flatLinks, { href: '/dashboard', label: tr(t.dashboard, langHi) }, { href: '/pricing', label: langHi ? 'प्लान' : 'Plans' }] },
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
                <strong>{aspirantName || 'UPSC aspirant'}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
          {user && planBlock}
          <div className="nb-sheet-actions">
            {langToggle}
            <button className="ds-btn ds-btn-line ds-btn-sm" onClick={toggleTheme}>{isDark ? Icon.sun : Icon.moon}{isDark ? 'Light' : 'Dark'}</button>
            {user && <button className="ds-btn ds-btn-line ds-btn-sm" onClick={() => { setProfileOpen(true); setOpen(false); }}>{Icon.edit}Profile</button>}
            {user && <button className="ds-btn ds-btn-line ds-btn-sm nb-danger" onClick={handleSignOut}>{Icon.out}Sign out</button>}
          </div>
        </div>
      </div>

      {profileOpen && user && (
        <div className="ds ds-overlay" onClick={() => setProfileOpen(false)}>
          <div className="ds-modal nb-profile" role="dialog" aria-modal="true" aria-labelledby="nb-profile-title" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-head">
              <div>
                <h2 id="nb-profile-title">Your profile</h2>
                <p>Kept on this device. Your target year sets the exam countdown.</p>
              </div>
              <button className="ds-x" onClick={() => setProfileOpen(false)} aria-label="Close">{Icon.close}</button>
            </div>
            <div className="nb-profile-fields">
              {([
                { label: 'Name', val: aspirantName, set: setAspirantName, placeholder: 'e.g. Rahul Sharma', key: 'name', mode: 'text' },
                { label: 'Age', val: aspirantAge, set: setAspirantAge, placeholder: 'e.g. 24', key: 'age', mode: 'numeric' },
                { label: 'Attempt', val: aspirantAttempt, set: setAspirantAttempt, placeholder: 'e.g. 1st', key: 'attempt', mode: 'text' },
                { label: 'Target year', val: aspirantYear, set: setAspirantYear, placeholder: 'e.g. 2026', key: 'year', mode: 'numeric' },
              ] as const).map(({ label, val, set, placeholder, key, mode }) => (
                <label key={key} className={`ds-field${key === 'name' ? ' wide' : ''}`}>
                  <span>{label}</span>
                  <input className="ds-input" value={val} placeholder={placeholder} inputMode={mode}
                    onChange={e => { set(e.target.value); saveProfileField(key, e.target.value); }} />
                </label>
              ))}
            </div>
            <button className="ds-btn ds-btn-solid ds-btn-block" onClick={() => setProfileOpen(false)}>Done</button>
          </div>
        </div>
      )}

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
.nb-links { display: flex; align-items: center; gap: 2px; margin-left: clamp(var(--space-4), 2.6vw, var(--space-8)); }
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
  height: 38px; padding: 0 6px 0 var(--space-3); width: clamp(190px, 20vw, 290px);
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
.nb-upgrade { flex-shrink: 0; }
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
.nb-profile { max-width: 440px; }
.nb-profile-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
.nb-profile-fields .wide { grid-column: 1 / -1; }
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

@media (max-width: 1180px) {
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
