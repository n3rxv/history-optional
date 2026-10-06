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

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      // GA4 purchase event, picked up by Google Ads conversion tracking
      gtag('event', 'purchase', {
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
    <div className="ss ds">
      <style>{SS_CSS}</style>
      <div className="ss-card">
        <Mascot pose="celebrate" width={168} className="ss-owl" preload />
        <h1>{langHi ? 'आप अब प्रीमियम पर हैं' : 'You’re on Premium'}</h1>
        <p>
          {langHi
            ? 'अब सब कुछ खुला है। शुरुआत के लिए आज एक उत्तर जँचवाएँ।'
            : 'Everything is open to you now. A good place to start is getting one answer checked today.'}
        </p>
        <ul className="ss-perks">
          {perks.map(p => <li key={p}>{p}</li>)}
        </ul>
        <Link href="/evaluate" className="ds-btn ds-btn-solid ds-btn-lg">{langHi ? 'उत्तर जँचवाएँ' : 'Get an answer checked'}</Link>
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
.ss { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4); background: var(--bg); }
.ss-card { width: 100%; max-width: 520px; text-align: center; padding: var(--space-8) var(--space-8) var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.ss-owl { display: block; height: auto; margin: 0 auto var(--space-3); }
.ss h1 { font-size: clamp(1.5rem, 4vw, 1.9rem); font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin: 0 0 var(--space-2); }
.ss p { font-size: 1rem; line-height: 1.6; color: var(--text2); margin: 0 0 var(--space-5); }
.ss-perks { list-style: none; padding: 0; margin: 0 0 var(--space-6); display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: center; }
.ss-perks li { font-size: 0.84rem; font-weight: 600; padding: 4px var(--space-3); border-radius: var(--radius-full); color: var(--premium-text); background: var(--premium-wash); border: 1px solid color-mix(in srgb, var(--premium-text) 28%, transparent); }
.ss-more { margin-top: var(--space-4); display: flex; gap: var(--space-2); justify-content: center; align-items: center; flex-wrap: wrap; font-size: 0.9rem; color: var(--text3); }
.ss-more a { color: var(--accent-text); font-weight: 600; text-decoration: none; }
.ss-more a:hover { text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 480px) { .ss-card { padding: var(--space-6) var(--space-5) var(--space-5); } }
`;
