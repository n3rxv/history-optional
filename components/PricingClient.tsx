'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { SubscribeCard } from '@/components/SubscribeCard';
import Mascot from '@/components/Mascot';
import { FEATURES, ONE_OFF, TOPPER_PRICE } from '@/lib/features';
import { daysToMains, NEXT_MAINS } from '@/lib/examDates';
import { PLANS, PLAN_DURATION, planPriceLabel, type PlanId } from '@/lib/plans';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * The plans, grouped by what each is for, as in the Go Premium panel: the
 * whole preparation paid once, and a single day to try it. The weekly mandate
 * is no longer sold. Readers already on it keep their cancel control here. Every price is formatted from lib/plans.ts, the table the order
 * routes bill from, and every free allowance from lib/features.ts, which the
 * gates read. Nothing here is typed by hand.
 */

type Status = { isPremium: boolean; plan?: string; expires_at?: string; autoRenew?: boolean; canResubscribe?: boolean };

/** The plans on sale. 'weekly' stays in PlanId only for subscriptions bought before it was withdrawn. */
type Sold = Exclude<PlanId, 'weekly'>;
const rupees = (id: PlanId) => PLANS[id].amountPaise / 100;
const PER: Record<Sold, string> = {
  yearly: `about ₹${Math.round(rupees('yearly') / 12)} a month`,
  sixmonths: `about ₹${Math.round(rupees('sixmonths') / 6)} a month`,
  daily: 'for 24 hours',
};
const BLURB: Record<Sold, string> = {
  yearly: 'A full year: enough for the whole run to Mains, with time to revise.',
  sixmonths: 'One focused run up to Mains.',
  daily: 'Everything open for a day: for a test day, or to see the marking properly before a longer plan.',
};
const CTA: Record<Sold, string> = { yearly: 'Get a year', sixmonths: 'Get 6 months', daily: 'Get a day' };
const EXTEND: Record<Sold, string> = { yearly: 'Extend by a year', sixmonths: 'Extend by 6 months', daily: 'Extend by a day' };

const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-label="Included"><path d="M20 6 9 17l-5-5" /></svg>;
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const cell = (v: string) => (v === '✓' ? <Check /> : v === '—' ? <span className="pr-none" aria-label="Not included">-</span> : v);
const fmtLong = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const noop = () => () => {};

export default function PricingClient() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  // Topper copies can be bought outright, so the card needs to know whether
  // this reader has them already; Premium includes them.
  const [topperOwned, setTopperOwned] = useState<boolean | null>(null);
  const [topperBusy, setTopperBusy] = useState(false);
  // Read in the browser only: a count of days rendered on the server would
  // disagree with the client's after midnight.
  const days = useSyncExternalStore(noop, () => daysToMains(), () => null);

  useEffect(() => {
    (async () => {
      try {
        const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
        setFingerprint((await FP.get()).visitorId);
      } catch { /* optional; checkout works without it */ }
    })();
  }, []);

  // A subscriber is shown what they have, not three buy buttons.
  useEffect(() => auth.onAuthStateChanged(async (user) => {
    setSignedIn(Boolean(user));
    if (!user) { setStatus({ isPremium: false }); setTopperOwned(false); return; }
    try {
      const token = await user.getIdToken();
      const [sub, topper] = await Promise.all([
        fetch('/api/sub-status', { headers: { 'x-user-token': token } }).then((r) => r.json()),
        fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => null),
      ]);
      setStatus(sub);
      setTopperOwned(Boolean(topper?.isPremium || topper?.hasTopperAccess));
    } catch { setStatus({ isPremium: false }); setTopperOwned(false); }
  }), []);

  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  /** The same order-then-verify pair the PYQ paywall uses, so topper copies have one purchase path. */
  const buyTopper = async () => {
    const user = auth.currentUser;
    if (!user) { await signInWithGoogle().catch(() => {}); return; }
    const RZP = (window as unknown as { Razorpay?: new (o: unknown) => { open: () => void } }).Razorpay;
    if (!RZP) { toast('Payment is still loading. Give it a moment and try again.', 'error'); return; }
    setTopperBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/razorpay/topper-order', { method: 'POST', headers: { 'x-user-token': token } });
      const order = await res.json();
      if (!res.ok) { toast(order.error || 'Could not start the payment.', 'error'); setTopperBusy(false); return; }
      new RZP({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'History Optional',
        description: 'Topper copies, one year',
        theme: { color: '#4c6ae2' },
        handler: async (response: unknown) => {
          const v = await fetch('/api/razorpay/topper-verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-token': token }, body: JSON.stringify(response),
          }).then((r) => r.json()).catch(() => null);
          if (v?.ok) setTopperOwned(true);
          setTopperBusy(false);
        },
        modal: { ondismiss: () => setTopperBusy(false) },
      }).open();
    } catch {
      toast('Could not start the payment.', 'error');
      setTopperBusy(false);
    }
  };

  const cancelRenewal = async () => {
    if (!auth.currentUser) return;
    if (!(await confirmDialog({ title: 'Stop the weekly renewal?', text: 'You keep access for the days you’ve already paid for.', confirmLabel: 'Stop renewal', cancelLabel: 'Keep it', tone: 'danger' }))) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch('/api/razorpay/subscription/cancel', { method: 'POST', headers: { 'x-user-token': token } });
    if (res.ok) { setStatus((s) => (s ? { ...s, autoRenew: false, canResubscribe: true } : s)); toast('Weekly renewal stopped'); }
    else toast('That did not go through. Try again in a moment.', 'error');
  };

  const premium = Boolean(status?.isPremium);
  // Only readers who bought the weekly plan before it was withdrawn.
  const onAutopay = Boolean(status?.autoRenew);
  const free = (name: string) => FEATURES.find((f) => f.name === name)?.free.replace(' total', '') ?? '';
  /** The number alone ("5" from "5 copies"), for sentences that name the thing themselves. */
  const count = (name: string) => free(name).match(/\d+/)?.[0] ?? free(name);

  /** A one-time plan's button. A purchase on top of a live mandate would push the end date out while the weekly kept debiting; the order route refuses it too. */
  const oneTime = (id: Sold, solid: boolean) => (
    <button type="button" className={`ds-btn ${solid ? 'ds-btn-solid' : 'ds-btn-line'} pr-buy`} disabled={onAutopay} onClick={() => setCheckoutPlan(id)}>
      {onAutopay ? 'You’re on the weekly plan' : premium ? EXTEND[id] : CTA[id]}
    </button>
  );
  const plan = (id: Sold, opts: { featured?: boolean; unit?: string } = {}) => (
    <article className={`pr-plan${opts.featured ? ' featured' : ''}`}>
      <div className="pr-plan-top">
        <h3 className="pr-plan-name">{id === 'yearly' ? 'A year' : id === 'sixmonths' ? '6 months' : 'A day'}</h3>
        {opts.featured && <span className="pr-tag">Most chosen</span>}
      </div>
      <div className="pr-price"><span className="pr-rs">₹</span>{rupees(id).toLocaleString('en-IN')}<span className="pr-unit">{opts.unit ?? ''}</span></div>
      <div className="pr-period">{PER[id]}</div>
      <p className="pr-blurb">{BLURB[id]}</p>
      {oneTime(id, Boolean(opts.featured))}
    </article>
  );

  return (
    <div className="pr ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pr-hero">
        <div className="ds-container">
          <h1 className="ds-h1 pr-h1">Plans and pricing</h1>
          <p className="ds-lede pr-lede">
            Everything you read here is free once you sign in. Premium is for practice, when you want every answer checked and the AI tutor without limits.
          </p>
          {days !== null && days > 0 && <span className="pr-chip">{days.toLocaleString('en-IN')} days to Mains {NEXT_MAINS.slice(0, 4)}</span>}
        </div>
      </header>

      <div className="ds-container">
        {premium && (
          <div className="pr-have" role="status">
            <div>
              <strong>You’re on Premium.</strong>{' '}
              {status?.expires_at && <span>{onAutopay ? 'It renews weekly; this week runs to' : 'It runs to'} {fmtLong(status.expires_at)}.</span>}{' '}
              {!onAutopay && <span>Buying again adds the time on top.</span>}
            </div>
            <div className="pr-have-actions">
              {onAutopay && <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={cancelRenewal}>Cancel the renewal</button>}
              <Link href="/evaluate" className="ds-btn ds-btn-line ds-btn-sm">Check an answer <Arrow /></Link>
            </div>
          </div>
        )}

        <section className="pr-group" aria-labelledby="pr-g1">
          <div className="pr-group-head"><h2 id="pr-g1" className="pr-h2">For your whole preparation</h2><span>Paid once, never renews</span></div>
          <div className="pr-pair">
            {plan('yearly', { featured: true })}
            {plan('sixmonths')}
          </div>
        </section>

        <div className="pr-pair pr-rest">
          <section className="pr-group" aria-labelledby="pr-g3">
            <div className="pr-group-head"><h2 id="pr-g3" className="pr-h2">Just to try it</h2><span>24 hours, paid once</span></div>
            {plan('daily')}
          </section>
        </div>

        {onAutopay && <p className="pr-note">You’re on the weekly plan, which is no longer sold, so the one-time plans are switched off. Cancel the renewal and they open up once your paid days run out.</p>}
        <p className="pr-rzp">Payments go through Razorpay: UPI, cards and net banking. Every plan is a single payment, and nothing renews on its own.</p>

        <section className="pr-section" aria-labelledby="pr-compare">
          <h2 id="pr-compare" className="pr-h2">Free account and Premium</h2>
          <div className="pr-compare" role="table" aria-label="Free account and Premium compared">
            <div className="pr-row pr-row-head" role="row">
              <span role="columnheader">What you get</span>
              <span role="columnheader">Free</span>
              <span role="columnheader" className="pr-col-premium">Premium</span>
            </div>
            {FEATURES.map((f) => (
              <div key={f.name} className="pr-row" role="row">
                <span role="cell" className="pr-what"><strong>{f.name}</strong>{f.detail && <small>{f.detail}</small>}</span>
                <span role="cell" className="pr-val">{cell(f.free)}</span>
                <span role="cell" className="pr-val pr-col-premium">{cell(f.premium)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pr-section" aria-labelledby="pr-once">
          <h2 id="pr-once" className="pr-h2">Bought on their own</h2>
          <p className="pr-section-lede">Every plan includes topper copies, or you can buy them on their own. Map checks are paid per map and aren’t part of any plan.</p>
          <div className="pr-pair">
            {ONE_OFF.map((o) => (
              <article key={o.name} className="pr-plan pr-one">
                <div className="pr-plan-top">
                  <h3 className="pr-plan-name">{o.name === 'Map evaluation' ? 'A map check' : o.name}</h3>
                  <span className={`pr-badge${o.inPremium ? ' in' : ''}`}>{o.inPremium ? 'Also in Premium' : 'Per map'}</span>
                </div>
                <div className="pr-price small"><span className="pr-rs">₹</span>{(o.pricePaise / 100).toLocaleString('en-IN')}<span className="pr-unit">{o.inPremium ? '/year' : ''}</span></div>
                {o.inPremium && <div className="pr-was"><s>₹{TOPPER_PRICE.was}</s><span className="pr-off">{TOPPER_PRICE.off}% off</span></div>}
                <p className="pr-blurb">{o.inPremium ? `Answers scanned from toppers’ copies, question by question. A free account opens ${count('Topper copies')} of them.` : 'Your filled map checked place by place: the name for 1.5 marks and your note for 1. Paid when you upload it.'}</p>
                {/* Map checks cannot be bought here: the ₹49 is charged
                    against an uploaded map, so this card goes to where the
                    map is uploaded. */}
                {o.inPremium ? (
                  <button type="button" className="ds-btn ds-btn-line pr-buy" onClick={buyTopper} disabled={topperOwned === true || topperBusy}>
                    {topperOwned === true ? 'You have these already' : topperBusy ? 'Opening the payment…' : `Buy for ₹${(o.pricePaise / 100).toLocaleString('en-IN')}`}
                  </button>
                ) : (
                  <Link href="/evaluate?mode=map" className="ds-btn ds-btn-line pr-buy">Check a map <Arrow /></Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="pr-section" aria-labelledby="pr-faq">
          <h2 id="pr-faq" className="pr-h2">Before you pay</h2>
          <div className="pr-faq-list">
            {[
              { q: 'Does it renew on its own?', a: <>No. The day, 6-month and yearly plans are single payments. When one runs out, access simply stops until you buy again.</> },
              { q: 'Can I see the marking before I pay?', a: <>Yes. A free account gets <strong>{free('Answer evaluation')} answer check</strong> and <strong>{free('AI Chat')} chats</strong>, enough to judge whether the feedback is worth having. A day at {planPriceLabel('daily')} opens everything for 24 hours.</> },
              { q: 'What happens if I buy while a plan is running?', a: <>The new time is added to the end of the current plan. You don’t lose the days already paid for.</> },
              { q: 'Is the map check included?', a: <>No. Map checks are {`₹${ONE_OFF[1].pricePaise / 100}`} each, whether or not you subscribe. Topper copies are the other way round: every plan includes them, and they can be bought on their own for {`₹${(ONE_OFF[0].pricePaise / 100).toLocaleString('en-IN')}`}.</> },
              { q: 'Are refunds available?', a: <>Purchases are final, with two exceptions: a duplicate payment and an extended outage. The <Link href="/refund">refund policy</Link> has the details and the <Link href="/terms">terms</Link> cover the rest.</> },
              { q: 'Something went wrong with a payment?', a: <>Write to us from the <Link href="/contact">contact page</Link> with the Razorpay payment id, and it will be sorted out.</> },
            ].map((f) => (
              <details key={f.q} className="pr-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pr-close">
          <Mascot pose="peek" width={92} />
          <div className="pr-close-text">
            <h2>Not sure yet?</h2>
            <p>Start with the free account: every note and past question, {count('AI Chat')} chats, {count('Answer evaluation')} answer check, {count('Topper copies')} topper copies and {count('Flashcards')} flashcard answers.</p>
          </div>
          {signedIn
            ? <Link href="/dashboard" className="ds-btn ds-btn-line">Go to your dashboard</Link>
            : <button type="button" className="ds-btn ds-btn-line" onClick={() => signInWithGoogle().catch(() => {})}>Sign in free</button>}
        </section>
      </div>

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} fingerprint={fingerprint} onClose={() => setCheckoutPlan(null)} />}
    </div>
  );
}

/** Checkout stays in SubscribeCard, the same card as the Go Premium panel, rather than being forked here. */
function CheckoutModal({ plan, fingerprint, onClose }: { plan: PlanId; fingerprint: string | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="ds ds-overlay pr-checkout-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ds-modal pr-checkout" role="dialog" aria-modal="true" aria-label={`Checkout, ${PLANS[plan].label} (${PLAN_DURATION[plan]})`}>
        <SubscribeCard fingerprint={fingerprint} initialPlan={plan} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}

const CSS = `
.pr { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.pr-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.pr-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.pr-lede { max-width: 680px; }
.pr-chip { display: inline-flex; margin-top: var(--space-4); padding: 5px 14px; border-radius: var(--radius-full); background: var(--ds-card); border: 1px solid var(--border); font-size: 0.88rem; font-weight: 600; color: var(--text2); }
.pr-h2 { margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }

.pr-have { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin: var(--space-4) 0 var(--space-2); padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); background: var(--success-wash); border: 1px solid color-mix(in srgb, var(--success-text) 30%, transparent); line-height: 1.55; }
.pr-have strong { color: var(--success-text); }
.pr-have span { color: var(--text2); }
.pr-have-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.pr-group { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-6); min-width: 0; }
.pr-group-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px var(--space-3); }
.pr-group-head span { font-size: 0.9rem; color: var(--text3); }
.pr-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); align-items: stretch; }
.pr-rest > .pr-group { margin-top: var(--space-8); }
.pr-rest .pr-plan { flex: 1; }
.pr-plan { display: flex; flex-direction: column; min-width: 0; padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.pr-plan.featured { border: 2px solid var(--accent); box-shadow: var(--elev-2); }
.pr-plan-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-3); }
.pr-plan-name { margin: 0; font-size: 1.08rem; font-weight: 800; }
.pr-tag { padding: 3px 12px; border-radius: var(--radius-full); background: var(--accent); color: var(--accent-on, #fff); font-size: 0.8rem; font-weight: 700; }
.pr-price { font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
.pr-price.small { font-size: 2.4rem; }
.pr-rs { margin-right: 2px; font-size: 0.5em; font-weight: 700; vertical-align: 0.6em; }
.pr-unit { margin-left: 4px; font-size: 0.32em; font-weight: 600; letter-spacing: 0; color: var(--text3); }
.pr-period { margin-top: var(--space-2); font-size: 0.9rem; color: var(--text3); }
.pr-blurb { flex: 1; margin: var(--space-4) 0 var(--space-5); font-size: 0.96rem; line-height: 1.6; color: var(--text2); }
.pr-buy { width: 100%; justify-content: center; min-height: 48px; }
.pr-buy:disabled { opacity: 0.55; cursor: not-allowed; }
.pr-fine { margin: var(--space-2) 0 0; font-size: 0.84rem; line-height: 1.5; color: var(--text3); }
.pr-badge { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
.pr-badge.in { background: var(--success-wash); color: var(--success-text); }
.pr-was { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); font-size: 0.96rem; color: var(--text3); }
.pr-off { padding: 2px var(--space-2); border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-size: 0.78rem; font-weight: 700; }
.pr-note { margin: var(--space-4) 0 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--warning-wash); font-size: 0.92rem; line-height: 1.55; }
.pr-rzp { margin: var(--space-4) 0 0; max-width: 820px; font-size: 0.86rem; line-height: 1.55; color: var(--text3); }

.pr-section { padding-top: var(--space-10); max-width: 920px; }
.pr-section > .pr-h2 { margin-bottom: var(--space-4); }
.pr-section-lede { margin: calc(-1 * var(--space-2)) 0 var(--space-4); color: var(--text2); line-height: 1.6; }
.pr-compare { border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); overflow: hidden; }
.pr-row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 0.8fr) minmax(0, 0.8fr); gap: var(--space-3); padding: var(--space-3) var(--space-5); border-top: 1px solid var(--border); align-items: center; font-size: 0.94rem; }
.pr-row:first-child { border-top: none; }
.pr-row-head { background: var(--ds-soft); font-size: 0.86rem; font-weight: 700; color: var(--text2); }
.pr-what { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pr-what small { font-size: 0.82rem; line-height: 1.45; color: var(--text3); }
.pr-val { display: inline-flex; align-items: center; font-weight: 600; color: var(--text2); }
.pr-none { color: var(--text3); font-weight: 500; }
.pr-col-premium { color: var(--accent-text); }

.pr-faq-list { border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); overflow: hidden; }
.pr-faq-item { border-top: 1px solid var(--border); }
.pr-faq-item:first-child { border-top: none; }
.pr-faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-5); font-weight: 700; cursor: pointer; list-style: none; }
.pr-faq-item summary::-webkit-details-marker { display: none; }
.pr-faq-item summary::after { content: '+'; flex-shrink: 0; font-size: 1.3rem; font-weight: 500; color: var(--text3); transition: transform 0.2s; }
.pr-faq-item[open] summary::after { transform: rotate(45deg); }
.pr-faq-item p { margin: 0; padding: 0 var(--space-5) var(--space-4); line-height: 1.65; color: var(--text2); }
.pr-faq-item a { color: var(--accent-text); }

.pr-close { display: flex; align-items: center; gap: var(--space-5); max-width: 920px; margin-top: var(--space-10); padding: var(--space-6); border-radius: var(--radius-xl); background: var(--ds-card); border: 1px solid var(--border); }
.pr-close-text { flex: 1; min-width: 0; }
.pr-close-text h2 { margin: 0 0 4px; font-size: 1.2rem; font-weight: 800; }
.pr-close-text p { margin: 0; color: var(--text2); line-height: 1.55; }

.pr-checkout-overlay { z-index: 99999; }
.pr-checkout { width: 100%; max-width: 440px; max-height: 92vh; overflow-y: auto; }

@media (max-width: 760px) {
  .pr-pair { grid-template-columns: minmax(0, 1fr); }
  .pr-rest > .pr-group:last-child { margin-top: var(--space-6); }
}
@media (max-width: 640px) {
  .pr-plan { padding: var(--space-5) var(--space-4); }
  .pr-price { font-size: 2.6rem; }
  .pr-blurb { margin: var(--space-3) 0 var(--space-4); }
  .pr-row { grid-template-columns: minmax(0, 1.5fr) minmax(0, 0.75fr) minmax(0, 0.75fr); gap: var(--space-2); padding: var(--space-3) var(--space-4); font-size: 0.88rem; }
  .pr-what small { display: none; }
  .pr-have { padding: var(--space-4); }
  .pr-have-actions, .pr-have-actions .ds-btn { width: 100%; justify-content: center; }
  .pr-close { flex-direction: column; text-align: center; }
  .pr-close .ds-btn { width: 100%; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .pr-faq-item summary::after { transition: none; } }
`;
