'use client';
import Script from 'next/script';
import { auth } from '@/lib/firebase';

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
      alert('Payment SDK not loaded. Please refresh and try again.');
      return;
    }
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/razorpay/topper-order', {
      method: 'POST',
      headers: { 'x-user-token': token },
    });
    const order = await res.json();
    if (!res.ok) {
      alert('Order creation failed: ' + (order.error || 'Unknown error'));
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
    <div style={{
      background: 'var(--bg)',
      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
      borderRadius: 'var(--radius-xl)', padding: 'var(--space-10) var(--space-8)', maxWidth: 420, width: '100%',
      textAlign: 'center', margin: '0 auto',
      boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent), 0 24px 60px color-mix(in srgb, var(--text) 18%, transparent)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-circle)',
        background: 'var(--accent-dim)',
        border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', margin: '0 auto var(--space-5)',
      }}>📋</div>
      <h3 style={{
        color: 'var(--text)', fontFamily: 'var(--font-display)',
        fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)',
      }}>Topper Copies are Locked</h3>
      <p style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: 'var(--space-3)', lineHeight: 1.65 }}>
        {message ?? 'Get unlimited access to all topper copies'}
      </p>
      <div style={{
        background: 'var(--accent-dim)',
        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-5)',
        marginBottom: 'var(--space-6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
      }}>
        <span style={{ color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹799</span>
        <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/year · one-time unlock</span>
      </div>
      <button
        onClick={unlock}
        style={{
          background: 'var(--accent)', border: 'none',
          color: 'var(--accent-on)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-8)',
          fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-mono)', width: '100%',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)',
        }}
      >
        🔓 Unlock for ₹799/year
      </button>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 'var(--space-2)', background: 'none', border: 'none',
            color: 'var(--text3)', fontSize: '0.78rem', cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      )}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );
}
