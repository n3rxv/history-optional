'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SubscribeSuccessPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get('plan') || 'yearly';
    const amountPaise = parseInt(searchParams.get('amount') || '0', 10);
    const amountINR = amountPaise / 100;
    const txn = searchParams.get('txn') || '';

    if (typeof window !== 'undefined' && (window as any).gtag) {
      // GA4 purchase event — picked up by Google Ads conversion tracking
      (window as any).gtag('event', 'purchase', {
        transaction_id: txn,
        value: amountINR,
        currency: 'INR',
        items: [{
          item_id: plan,
          item_name: `History Optional – ${plan} plan`,
          price: amountINR,
          quantity: 1,
        }],
      });
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 480,
        padding: '3rem 2.5rem',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 16,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          color: 'var(--text)',
          marginBottom: '0.75rem',
        }}>
          You&apos;re now Premium!
        </h1>
        <p style={{
          color: 'var(--text2)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
          fontFamily: 'var(--font-ui)',
        }}>
          Unlimited AI evaluations, chat with 25+ history books, topper copies — all unlocked. Start serious. Start now.
        </p>
        <Link href="/evaluate" style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: '#fff',
          padding: '0.75rem 2rem',
          borderRadius: 8,
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          Start Evaluating →
        </Link>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/chat" style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}>
            Or chat with your books →
          </Link>
        </div>
      </div>
    </div>
  );
}
