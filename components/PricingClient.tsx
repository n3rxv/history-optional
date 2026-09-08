'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import { SubscribeCard } from '@/components/SubscribeCard';
import AutopaySheet from '@/components/AutopaySheet';
import { FEATURES, ONE_OFF } from '@/lib/features';
import { daysToMains } from '@/lib/examDates';
import {
  PLANS, PLAN_ORDER, PLAN_DURATION,
  planPriceLabel, planValueLine, AUTOPAY_PLAN, type PlanId,
} from '@/lib/plans';

const GOLD = '#d4a843';

/**
 * Every price on this page is formatted from lib/plans.ts, which is the same
 * table /api/razorpay/order bills from. Nothing here is typed by hand.
 */
export default function PricingClient() {
  const { langHi } = useLang();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [autopayOpen, setAutopayOpen] = useState(false);
  const [status, setStatus] = useState<{ isPremium: boolean; plan?: string; expires_at?: string; autoRenew?: boolean } | null>(null);
  // Computed after mount: rendering Date.now() on the server and again on the
  // client is a hydration mismatch waiting for midnight.
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => { setDays(daysToMains()); }, []);


  useEffect(() => {
    (async () => {
      try {
        const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
        setFingerprint((await FP.get()).visitorId);
      } catch { /* fingerprint is optional; checkout works without it */ }
    })();
  }, []);

  // Someone who is already subscribed should not be sold to. Show them what
  // they have instead of three buy buttons.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async user => {
      if (!user) { setStatus({ isPremium: false }); return; }
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/sub-status', { headers: { 'x-user-token': token } });
        setStatus(await res.json());
      } catch { setStatus({ isPremium: false }); }
    });
    return () => unsub();
  }, []);


  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(2rem, 6vw, 3.5rem) 1.25rem 5rem' }}>
      <style>{`
        .pr-h1 { font-size: clamp(1.9rem, 5vw, 2.7rem);
          line-height: 1.15; letter-spacing: -0.02em; color: var(--text); margin: 0 0 0.6rem; text-wrap: balance; }
        .pr-sub { color: var(--text2); font-size: 1.02rem; line-height: 1.6; max-width: 46ch; margin: 0 auto 2.4rem; text-wrap: balance; }
        .pr-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
        .pr-card { position: relative; display: flex; flex-direction: column; gap: 10px;
          border: 1px solid var(--border); border-radius: 14px; padding: 22px 20px 20px;
          background: var(--bg2); transition: border-color .18s, transform .18s; }
        .pr-card:hover { border-color: var(--border2); transform: translateY(-2px); }
        .pr-card[data-best="1"] { border-color: rgba(212,168,67,0.45);
          background: linear-gradient(165deg, rgba(212,168,67,0.07), var(--bg2) 62%); }
        .pr-buy { margin-top: auto; width: 100%; padding: 11px; border-radius: 8px; cursor: pointer;
          font-weight: 700; font-size: 0.86rem; font-family: var(--font-ui, inherit);
          border: 1px solid var(--border2); background: var(--bg3); color: var(--text);
          transition: filter .15s, background .15s; }
        .pr-buy:hover { filter: brightness(1.18); }
        .pr-buy[data-best="1"] { border: none; color: #000;
          background: linear-gradient(135deg, #c49a2c, #e8b84b 45%, #f5cc5e 55%, #b8881e); }
        .pr-tbl { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .pr-tbl th { text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text3); font-weight: 600; padding: 0 10px 10px 0; border-bottom: 1px solid var(--border); }
        .pr-tbl td { padding: 11px 10px 11px 0; border-bottom: 1px solid var(--bg3); vertical-align: top; }
        .pr-tbl td.c { text-align: center; width: 88px; font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.8rem; padding-right: 0; }
        .pr-detail { display: block; color: var(--text3); font-size: 0.78rem; line-height: 1.5; margin-top: 3px; }
        .pr-q { font-weight: 600; color: var(--text); margin: 0 0 0.35rem; }
        .pr-a { color: var(--text2); font-size: 0.9rem; line-height: 1.65; margin: 0; }
        .pr-a a { color: var(--accent); }

        /* Phones get the same words, laid out differently.
           A three-column table squeezed into 335px either clips the feature
           names or hides the descriptions, and the descriptions are the part
           that actually sells. So below 560px each row becomes a block: name,
           description, then the two values as labelled chips. */
        .pr-auto { display: flex; flex-wrap: wrap; gap: 20px; align-items: center;
          justify-content: space-between; border: 1px solid rgba(212,168,67,0.45); border-radius: 16px;
          padding: 22px 24px; background: linear-gradient(150deg, rgba(212,168,67,0.09), var(--bg2) 65%); }
        .pr-auto-left { display: flex; flex-direction: column; gap: 6px; }
        .pr-auto-right { display: flex; flex-direction: column; gap: 8px; align-items: flex-start;
          max-width: 340px; }
        .pr-auto-right .pr-buy { width: auto; align-self: flex-start; padding: 11px 26px; margin-top: 0; }
        .pr-auto-tag { font-size: 0.64rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #d4a843; }
        .pr-auto-price { display: flex; align-items: baseline; gap: 7px;
          font-family: var(--font-mono, ui-monospace, monospace); }
        .pr-auto-price > span:first-child { font-size: 2.3rem; font-weight: 700; line-height: 1; color: var(--text); }
        .pr-auto-per { color: var(--text3); font-size: 0.85rem; }
        .pr-auto-line { color: var(--text3); font-size: 0.82rem; }
        .pr-auto-fine { color: var(--text3); font-size: 0.72rem; line-height: 1.5; }
        .pr-or { display: flex; align-items: center; gap: 16px; margin: 26px 0 22px; }
        .pr-or::before, .pr-or::after { content: ""; flex: 1; height: 1px; background: var(--border); }
        .pr-or span { color: var(--text3); font-size: 0.78rem; letter-spacing: 0.14em;
          text-transform: uppercase; }
        .pr-once { color: var(--text3); font-size: 0.74rem; letter-spacing: 0.1em;
          text-transform: uppercase; margin: 0 0 12px; text-align: center; }
        @media (max-width: 560px) {
          .pr-auto { padding: 18px; }
          .pr-auto-right { max-width: none; width: 100%; }
          .pr-auto-right .pr-buy { width: 100%; }
          .pr-h1 { font-size: clamp(1.6rem, 7.5vw, 2.1rem); }
          .pr-sub { font-size: 0.95rem; }
          .pr-tbl, .pr-tbl tbody, .pr-tbl tr, .pr-tbl td { display: block; width: auto; }
          .pr-tbl thead { display: none; }
          .pr-tbl tr { padding: 14px 0; border-bottom: 1px solid var(--bg3); }
          .pr-tbl td { border: none; padding: 0; }
          .pr-tbl td.c { display: inline-flex; align-items: baseline; gap: 6px;
            width: auto; text-align: left; margin: 9px 16px 0 0; font-size: 0.8rem; }
          .pr-tbl td.c::before { content: attr(data-label); font-family: var(--font-ui, inherit);
            font-size: 0.58rem; font-weight: 600; letter-spacing: 0.09em;
            text-transform: uppercase; color: var(--text3); }
          .pr-detail { font-size: 0.82rem; margin-top: 5px; }
        }
      `}</style>

      <header style={{ textAlign: 'center' }}>
        <h1 className="pr-h1">
          {langHi ? 'LBSNAA एक सपना है, इसे हकीकत बनाइए!'
                  : 'LBSNAA is a dream, make it a reality!'}
        </h1>
        <p className="pr-sub">
          {langHi
            ? 'UPSC योजना के अनुसार असीमित मूल्यांकन। मॉडल उत्तर, मेंटर मोड और टॉपर कॉपियाँ।'
            : 'Unlimited marking against the UPSC scheme. Model answers, mentor mode and topper copies.'}
        </p>
        {days !== null && days > 0 && (
          <p style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.74rem',
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)',
            margin: '-1.6rem 0 2.4rem',
          }}>
            {days.toLocaleString('en-IN')} days to Mains
          </p>
        )}
      </header>

      {status?.isPremium && (
        <div style={{
          border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.06)',
          borderRadius: 12, padding: '14px 18px', marginBottom: '2rem',
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            <strong style={{ color: '#4ade80' }}>You are on Premium.</strong>{' '}
            {status.expires_at && (
              <span style={{ color: 'var(--text2)' }}>
                {status.autoRenew ? 'Renews' : 'Access runs to'}{' '}
                {new Date(status.expires_at).toLocaleDateString('en-IN',
                  { day: 'numeric', month: 'long', year: 'numeric' })}.
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {status.autoRenew && (
              <button onClick={async () => {
                if (!auth.currentUser) return;
                if (!window.confirm('Stop the weekly renewal? You keep access for the remaining days you\u2019ve already paid for.')) return;
                const token = await auth.currentUser.getIdToken();
                const res = await fetch('/api/razorpay/subscription/cancel', {
                  method: 'POST', headers: { 'x-user-token': token },
                });
                if (res.ok) setStatus(s => (s ? { ...s, autoRenew: false } : s));
              }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7,
                  color: 'var(--text3)', fontSize: '0.78rem', padding: '5px 12px', cursor: 'pointer' }}>
                Cancel auto-renewal
              </button>
            )}
            <Link href="/evaluate" style={{ color: GOLD, fontSize: '0.86rem', fontWeight: 600 }}>
              Go and use it &rarr;
            </Link>
          </div>
        </div>
      )}


      {/* ── Weekly autopay, the entry commitment ───────────────── */}
      <section aria-label="Weekly subscription" className="pr-auto">
        <div className="pr-auto-left">
          <div className="pr-auto-tag">Weekly subscription &middot; renews weekly</div>
          <div className="pr-auto-price">
            <span>{planPriceLabel(AUTOPAY_PLAN)}</span>
            <span className="pr-auto-per">/week</span>
          </div>
          <div className="pr-auto-line">{planValueLine(AUTOPAY_PLAN)}</div>
        </div>
        <div className="pr-auto-right">
          <button className="pr-buy" data-best="1" onClick={() => setAutopayOpen(true)}>
            {status?.isPremium ? 'Switch to weekly' : 'Subscribe \u2192'}
          </button>
          <div className="pr-auto-fine">
            Renews every 7 days until you stop it. Cancel in one click from your
            profile menu; you keep access for the remaining days you&rsquo;ve paid for.
          </div>
        </div>
      </section>

      <div className="pr-or"><span>or</span></div>

      {/* ── Pay once ──────────────────────────────────────────── */}
      <p className="pr-once">Pay once, no renewal</p>
      <section aria-label="One-time plans" className="pr-grid">
        {PLAN_ORDER.map(id => {
          const best = id === 'yearly';
          return (
            <div key={id} className="pr-card" data-best={best ? '1' : '0'}>
              {best && (
                <span style={{
                  position: 'absolute', top: -9, left: 20, background: `linear-gradient(90deg, ${GOLD}, #f0e68c)`,
                  color: '#000', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.09em',
                  textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20,
                }}>{langHi ? 'सर्वोत्तम मूल्य' : 'Best value'}</span>
              )}
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: best ? GOLD : 'var(--text3)',
              }}>{PLANS[id].label}</div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '2rem',
                  fontWeight: 700, lineHeight: 1, color: 'var(--text)',
                }}>{planPriceLabel(id)}</span>
                <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/{PLAN_DURATION[id]}</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', minHeight: '1.2em' }}>
                {planValueLine(id)}
              </div>

              <button className="pr-buy" data-best={best ? '1' : '0'}
                onClick={() => setCheckoutPlan(id)}>
                {status?.isPremium
                  ? `Extend by ${PLAN_DURATION[id]}`
                  : `Get ${PLANS[id].label} →`}
              </button>
            </div>
          );
        })}
      </section>


      <p style={{
        textAlign: 'center', color: 'var(--text3)', fontSize: '0.76rem', marginTop: 18,
        fontFamily: 'var(--font-mono, ui-monospace, monospace)', letterSpacing: '0.04em',
      }}>
        Secure &middot; Razorpay &middot; these three are one-time payments
      </p>

      {/* ── Comparison ────────────────────────────────────────── */}
      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem', color: 'var(--text)' }}>
          What you are working without
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', margin: '0 0 1.4rem', maxWidth: '62ch', lineHeight: 1.65 }}>
          The left column is where most people stall: one evaluation, three questions, and then
          months of writing into a void with nothing coming back.
        </p>
        <table className="pr-tbl">
          <thead>
            <tr><th>Feature</th><th style={{ textAlign: 'center' }}>Without</th><th style={{ textAlign: 'center' }}>Premium</th></tr>
          </thead>
          <tbody>
            {FEATURES.map(f => (
              <tr key={f.name}>
                <td>
                  <span style={{ color: 'var(--text)' }}>{f.name}</span>
                  {f.detail && <span className="pr-detail">{f.detail}</span>}
                </td>
                <td className="c" data-label="Without"
                    style={{ color: f.free === '—' ? 'var(--border2)' : 'var(--text2)' }}>{f.free}</td>
                <td className="c" data-label="Premium" style={{ color: GOLD }}>{f.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── One-off purchases ─────────────────────────────────── */}
      <section style={{ marginTop: '3.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem', color: 'var(--text)' }}>
          Bought separately
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', margin: '0 0 1.2rem', maxWidth: '62ch', lineHeight: 1.65 }}>
          Topper copies come with every subscription; they can also be bought on their own.
          Map evaluation is charged per map and is <strong>not</strong> part of any plan.
        </p>
        <div className="pr-grid">
          {ONE_OFF.map(o => (
            <div key={o.name} className="pr-card" style={{ gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text3)' }}>
                  {o.name}
                </span>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 20,
                  color: o.inPremium ? '#4ade80' : GOLD,
                  background: o.inPremium ? 'rgba(74,222,128,0.1)' : 'rgba(212,168,67,0.08)',
                  border: `1px solid ${o.inPremium ? 'rgba(74,222,128,0.28)' : 'rgba(212,168,67,0.28)'}`,
                }}>{o.inPremium ? 'in premium' : 'pay per use'}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                {`₹${(o.pricePaise / 100).toLocaleString('en-IN')}`}
              </div>
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{o.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ marginTop: '3.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', margin: '0 0 1.2rem', color: 'var(--text)' }}>
          Before you pay
        </h2>
        <div style={{ display: 'grid', gap: '1.4rem', maxWidth: '68ch' }}>
          <div>
            <p className="pr-q">Does it renew automatically?</p>
            <p className="pr-a">No. Every plan is a one-time payment. When it runs out, access simply stops
              until you choose to buy again. Nothing is charged to your card in the background.</p>
          </div>
          <div>
            <p className="pr-q">Can I see the marking before I pay?</p>
            <p className="pr-a">Yes. Signing in gives you <strong>one evaluation</strong> and{' '}
              <strong>three questions</strong> — enough to judge whether the feedback is worth having,
              and not enough to prepare on.</p>
          </div>
          <div>
            <p className="pr-q">Is map evaluation included?</p>
            <p className="pr-a">No. Maps are charged at <strong>₹49 each</strong>, whether or not you
              subscribe. Topper copies are the other way round: they come with every plan, and can
              also be bought on their own for ₹365.</p>
          </div>
          <div>
            <p className="pr-q">What happens if I buy again while a plan is still running?</p>
            <p className="pr-a">The new period is added to the end of the current one. You do not lose the days
              you have already paid for.</p>
          </div>
          <div>
            <p className="pr-q">Are refunds available?</p>
            <p className="pr-a">Purchases are final. Duplicate payments and extended outages are the two
              exceptions. The full terms are in the{' '}
              <Link href="/refund">Refund Policy</Link>, and the{' '}
              <Link href="/terms">Terms</Link> cover the rest.</p>
          </div>
          <div>
            <p className="pr-q">Something went wrong with a payment.</p>
            <p className="pr-a">Write to us from the <Link href="/contact">contact page</Link> with the Razorpay
              payment id and it will be sorted out.</p>
          </div>
        </div>
      </section>

      {autopayOpen && <AutopaySheet onClose={() => setAutopayOpen(false)} />}

      {checkoutPlan && <CheckoutModal
        plan={checkoutPlan}
        fingerprint={fingerprint}
        onClose={() => setCheckoutPlan(null)}
      />}
    </main>
  );
}

/** Thin wrapper so checkout stays in SubscribeCard rather than being forked here. */
function CheckoutModal({ plan, fingerprint, onClose }: {
  plan: PlanId; fingerprint: string | null; onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="Checkout"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, padding: '1rem',
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--bg2)',
        border: '1px solid var(--border)', borderRadius: 16, padding: 'clamp(1rem, 4vw, 1.4rem)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)', maxHeight: '92vh', overflowY: 'auto',
      }}>
        <SubscribeCard
          fingerprint={fingerprint}
          initialPlan={plan}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * Weekly autopay checkout.
 *
 * Razorpay Checkout takes a `subscription_id` here rather than an
 * `order_id`: the customer is authorising a mandate, not paying once. No
 * access is granted on the handler firing — a mandate can be authorised and
 * still fail to debit — so the page waits for the first charge, which the
 * webhook records.
 */
