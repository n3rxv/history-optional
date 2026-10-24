'use client';
import Script from 'next/script';
import { auth } from '@/lib/firebase';
import { toast } from '@/components/ui/Toast';

type Props = {
  /** Called once a Topper Copies purchase is verified. */
  onUnlocked: () => void;
  /** A secondary "Maybe later" action, e.g. going back. */
  onDismiss?: () => void;
  /** Overrides the line under the title, e.g. to say the free views are used. */
  message?: string;
};

/**
 * The Topper Copies paywall: the ₹799/year unlock, paid through Razorpay.
 * Shown by the copy viewer and by each pane of the Compare page.
 */
export default function TopperLocked({ onUnlocked, onDismiss, message }: Props) {
  const unlock = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const w = window as unknown as { Razorpay?: new (opts: object) => { open: () => void } };
    if (!w.Razorpay) {
      toast('Payment is still loading. Refresh the page and try again.', 'error');
      return;
    }
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/razorpay/topper-order', {
      method: 'POST',
      headers: { 'x-user-token': token },
    });
    const order = await res.json();
    if (!res.ok) {
      toast(order.error || 'Could not start the payment.', 'error');
      return;
    }
    const rzp = new w.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'History Optional',
      description: 'Topper Copies Access — 1 Year',
      handler: async (response: object) => {
        const verifyRes = await fetch('/api/razorpay/topper-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-token': token },
          body: JSON.stringify(response),
        });
        const v = await verifyRes.json();
        if (v.ok) onUnlocked();
      },
    });
    rzp.open();
  };

  return (
    <div className="tl ds">
      <style>{TL_CSS}</style>
      <span className="tl-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      </span>
      <h3 className="tl-title">Topper copies are locked</h3>
      <p className="tl-text">{message ?? 'One payment opens every topper copy for a year, and the side-by-side comparisons.'}</p>
      <div className="tl-price"><strong>₹799</strong><span>for a year, paid once</span></div>
      <button type="button" className="ds-btn ds-btn-solid ds-btn-block" onClick={unlock}>Unlock for ₹799</button>
      {onDismiss && <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm tl-later" onClick={onDismiss}>Maybe later</button>}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );
}

const TL_CSS = `
.tl { width: 100%; max-width: 420px; margin: 0 auto; padding: var(--space-8) var(--space-6); text-align: center; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); box-shadow: var(--elev-3); }
.tl-icon { width: 52px; height: 52px; margin: 0 auto var(--space-4); display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--premium-wash); color: var(--premium-text); }
.tl-title { margin: 0 0 var(--space-2); font-size: 1.25rem; font-weight: 800; letter-spacing: -0.01em; }
.tl-text { margin: 0 0 var(--space-4); font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
.tl-price { display: flex; align-items: baseline; justify-content: center; gap: var(--space-2); margin-bottom: var(--space-5); padding: var(--space-3); border-radius: var(--radius-lg); background: var(--ds-soft); }
.tl-price strong { font-size: 1.5rem; font-weight: 800; color: var(--text); }
.tl-price span { font-size: 0.86rem; color: var(--text3); }
.tl-later { margin-top: var(--space-2); }
`;
