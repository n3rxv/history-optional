'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Mascot from '@/components/Mascot';
import { useLang } from '@/lib/i18n/LangContext';

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

  const { langHi } = useLang();
  const perks = langHi
    ? ['असीमित उत्तर मूल्यांकन', 'असीमित AI चैट', '30+ पुस्तकों से चैट', 'मेंटर मोड', 'टॉपर कॉपियाँ', 'PDF पर चर्चा']
    : ['Unlimited answer evaluations', 'Unlimited AI chat', 'Chat with 30+ books', 'Mentor mode', 'Topper copies', 'Discuss your PDFs'];

  return (
    <div className="ss">
      <style>{SS_CSS}</style>
      <div className="ss-card">
        <Mascot pose="celebrate" width={168} className="ss-owl" preload />
        <h1>{langHi ? 'आप अब प्रीमियम हैं!' : "You're now Premium!"}</h1>
        <p>
          {langHi
            ? 'सब कुछ खुल गया है। पहला उत्तर आज ही जाँचें।'
            : 'Everything is unlocked. Get your first answer marked today.'}
        </p>
        <ul className="ss-perks">
          {perks.map(p => <li key={p}>{p}</li>)}
        </ul>
        <Link href="/evaluate" className="ss-primary">{langHi ? 'उत्तर मूल्यांकन करें →' : 'Evaluate an answer →'}</Link>
        <div className="ss-more">
          <Link href="/chat">{langHi ? 'पुस्तकों से चैट करें' : 'Chat with your books'}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/dashboard">{langHi ? 'अपना डैशबोर्ड देखें' : 'See your dashboard'}</Link>
        </div>
      </div>
    </div>
  );
}

const SS_CSS = `
.ss { min-height: calc(100vh - 160px); display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4); font-family: var(--font-body); }
.ss-card { width: 100%; max-width: 500px; text-align: center; padding: var(--space-8) var(--space-8) var(--space-6);
  background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ss-owl { display: block; height: auto; margin: 0 auto var(--space-3); }
.ss h1 { font-family: var(--font-body); font-size: 1.7rem; font-weight: 700; color: var(--text); margin: 0 0 var(--space-2); }
.ss p { font-size: 0.98rem; line-height: 1.6; color: var(--text2); margin: 0 0 var(--space-5); }
.ss-perks { list-style: none; padding: 0; margin: 0 0 var(--space-6); display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: center; }
.ss-perks li { font-size: 0.8rem; padding: var(--space-1) var(--space-3); border-radius: var(--radius-pill);
  color: var(--premium-text); background: var(--premium-wash); border: 1px solid color-mix(in srgb, var(--premium-text) 28%, transparent); }
.ss-primary { display: inline-flex; padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
  background: var(--accent); color: var(--accent-on); font-weight: 600; font-size: 0.95rem; text-decoration: none; }
.ss-primary:hover { background: color-mix(in srgb, var(--accent) 88%, var(--text)); }
.ss-more { margin-top: var(--space-4); display: flex; gap: var(--space-2); justify-content: center; align-items: center; font-size: 0.86rem; color: var(--text3); }
.ss-more a { color: var(--accent-text); text-decoration: none; }
.ss-more a:hover { text-decoration: underline; }
@media (max-width: 480px) { .ss-card { padding: var(--space-6) var(--space-5) var(--space-5); } .ss h1 { font-size: 1.4rem; } }
`;
