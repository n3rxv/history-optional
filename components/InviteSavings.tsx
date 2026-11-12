'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import { readRef } from '@/lib/referralClient';
import { formatPaise } from '@/lib/referral';

/**
 * What invites take off a yearly plan at checkout: the friend's ₹100 for a
 * reader who came through a link, then their own balance, behind a switch
 * that starts on. Shared by the two checkouts, SubscribeCard and the
 * navbar's extend dialog. The order route works both out again for itself,
 * so this only shows what will happen.
 */
export type InviteQuote = { friendDiscountPaise: number; balancePaise: number };

/** The signed-in reader's quote from /api/referral/quote, or null while unknown or signed out. */
export function useInviteQuote(signedIn: boolean): InviteQuote | null {
  const [quote, setQuote] = useState<InviteQuote | null>(null);
  useEffect(() => {
    const user = auth.currentUser;
    if (!signedIn || !user) return;
    let live = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const ref = readRef();
        const res = await fetch(`/api/referral/quote${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`, { headers: { 'x-user-token': token } });
        if (res.ok && live) setQuote(await res.json());
      } catch { /* the plain price shows */ }
    })();
    return () => { live = false; };
  }, [signedIn]);
  return quote;
}

/** The friend's discount, the balance used, and what is left to pay. */
export function invitePay(pricePaise: number, quote: InviteQuote | null, useBalance: boolean) {
  const friend = quote?.friendDiscountPaise ?? 0;
  const afterFriend = pricePaise - friend;
  const spend = useBalance ? Math.min(quote?.balancePaise ?? 0, afterFriend) : 0;
  return { friend, spend, balance: quote?.balancePaise ?? 0, pay: afterFriend - spend };
}

export default function InviteSavings({ pricePaise, quote, useBalance, onToggle, className = '' }: {
  pricePaise: number;
  quote: InviteQuote | null;
  useBalance: boolean;
  onToggle: (on: boolean) => void;
  className?: string;
}) {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const p = invitePay(pricePaise, quote, useBalance);
  if (!p.friend && !p.balance) return null;

  return (
    <div className={`isv ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {p.friend > 0 && (
        <div className="isv-row"><span>{T('Your friend’s invite', 'दोस्त का आमंत्रण')}</span><span>−{formatPaise(p.friend)}</span></div>
      )}
      {p.balance > 0 && (
        <label className="isv-row isv-use">
          <span>
            <input type="checkbox" checked={useBalance} onChange={(e) => onToggle(e.target.checked)} />{' '}
            {T(`Use my ${formatPaise(p.balance)} balance`, `मेरा ${formatPaise(p.balance)} बैलेंस इस्तेमाल करें`)}
          </span>
          <span>{p.spend > 0 ? `−${formatPaise(p.spend)}` : ''}</span>
        </label>
      )}
      <div className="isv-row isv-pay"><span>{T('You pay', 'आप देंगे')}</span><strong>{formatPaise(p.pay)}</strong></div>
    </div>
  );
}

const CSS = `
.isv { display: flex; flex-direction: column; gap: 6px; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-family: var(--font-ui); font-size: 0.88rem; color: var(--text2); }
.isv-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.isv-use { cursor: pointer; }
.isv-use input { width: 16px; height: 16px; margin: 0 4px 0 0; vertical-align: -3px; accent-color: var(--accent); }
.isv-pay { padding-top: 6px; border-top: 1px solid var(--border); color: var(--text); }
.isv-pay strong { font-size: 1.02rem; }
`;
