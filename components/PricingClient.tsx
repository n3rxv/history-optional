'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { SubscribeCard } from '@/components/SubscribeCard';
import Mascot from '@/components/Mascot';
import { FEATURES, ONE_OFF, TOPPER_PRICE } from '@/lib/features';
import { daysToMains, NEXT_MAINS } from '@/lib/examDates';
import { PLANS, PLAN_DURATION, planPriceLabel, planPricePaise, type PlanId } from '@/lib/plans';
import { useOffer } from '@/hooks/useOffer';
import { OfferNote } from '@/components/OfferPrice';
import InvitedNote from '@/components/InvitedNote';
import { toast } from '@/components/ui/Toast';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * The plans, grouped by what each is for, as in the Go Premium panel: the
 * whole preparation paid once, and a single day to try it. Every price is
 * formatted from lib/plans.ts, the table the order
 * routes bill from, and every free allowance from lib/features.ts, which the
 * gates read. Nothing here is typed by hand.
 */

type Status = { isPremium: boolean; plan?: string; expires_at?: string };

const rupees = (id: PlanId) => PLANS[id].amountPaise / 100;
/** The line under the price, from the price charged now (a sale price while an offer runs). */
const PER = (id: PlanId, r: number) => ({
  yearly: `about ₹${Math.round(r / 12)} a month`,
  sixmonths: `about ₹${Math.round(r / 6)} a month`,
  daily: 'for 24 hours',
})[id];
const BLURB: Record<PlanId, string> = {
  yearly: 'A full year: enough for the whole run to Mains, with time to revise.',
  sixmonths: 'One focused run up to Mains.',
  daily: 'Everything open for a day: for a test day, or to see the marking properly before a longer plan.',
};
const CTA: Record<PlanId, string> = { yearly: 'Get a year', sixmonths: 'Get 6 months', daily: 'Get a day' };
const EXTEND: Record<PlanId, string> = { yearly: 'Extend by a year', sixmonths: 'Extend by 6 months', daily: 'Extend by a day' };
const NAME: Record<PlanId, string> = { yearly: 'A year', sixmonths: '6 months', daily: 'A day' };

/** The same plan copy in Hindi. Prices and allowances are still read from lib/plans.ts and lib/features.ts. */
const PER_HI = (id: PlanId, r: number) => ({
  yearly: `लगभग ₹${Math.round(r / 12)} प्रति माह`,
  sixmonths: `लगभग ₹${Math.round(r / 6)} प्रति माह`,
  daily: '24 घंटे के लिए',
})[id];
const BLURB_HI: Record<PlanId, string> = {
  yearly: 'पूरा एक साल: मुख्य परीक्षा तक की पूरी तैयारी के लिए काफ़ी, दोहराने के समय के साथ।',
  sixmonths: 'मुख्य परीक्षा तक एक केंद्रित दौर।',
  daily: 'एक दिन के लिए सब कुछ खुला: टेस्ट वाले दिन के लिए, या लंबे प्लान से पहले मूल्यांकन ठीक से देखने के लिए।',
};
const CTA_HI: Record<PlanId, string> = { yearly: 'एक साल लें', sixmonths: '6 महीने लें', daily: 'एक दिन लें' };
const EXTEND_HI: Record<PlanId, string> = { yearly: 'एक साल बढ़ाएँ', sixmonths: '6 महीने बढ़ाएँ', daily: 'एक दिन बढ़ाएँ' };
const NAME_HI: Record<PlanId, string> = { yearly: 'एक साल', sixmonths: '6 महीने', daily: 'एक दिन' };

/**
 * The comparison table in Hindi, keyed by the English name in lib/features.ts
 * (another file's table, read here and not edited). A row missing from this
 * map falls back to its English.
 */
const FEATURE_HI: Record<string, { name: string; detail: string }> = {
  'Notes (Paper I & II)': { name: 'नोट्स (प्रश्नपत्र I और II)', detail: 'दोनों प्रश्नपत्रों के पूरे पाठ्यक्रम के नोट्स।' },
  'PYQ bank': { name: 'पिछले प्रश्नों का संग्रह', detail: 'हर पिछला प्रश्नपत्र, विषय और वर्ष के अनुसार।' },
  'Timeline & Historiography': { name: 'समयरेखा और इतिहास-लेखन', detail: 'घटनाक्रम और इतिहासकारों की बहसें, संदर्भ के लिए।' },
  'Answer evaluation': { name: 'उत्तर मूल्यांकन', detail: 'लिखे गए उत्तर UPSC की अंक-योजना पर जाँचे जाते हैं, अंक और ठीक-ठीक सुधारों के साथ।' },
  'AI Chat': { name: 'AI चैट', detail: 'पाठ्यक्रम पर कुछ भी पूछें और स्रोत पुस्तकों पर आधारित उत्तर पाएँ।' },
  'Model answers': { name: 'आदर्श उत्तर', detail: 'किसी भी प्रश्न का पूरे अंकों वाला उत्तर, जिसे सामने रखकर आप लिख सकें।' },
  'Prelims PYQ analysis': { name: 'प्रिलिम्स PYQ विश्लेषण', detail: 'प्रश्नों का अभ्यास सबके लिए खुला है। उनका गहरा विश्लेषण नहीं: चरण-दर-चरण हल, उस तरह के प्रश्न को खोलने वाली विलोपन तकनीक, उसके पीछे की अवधारणाएँ, और सच में पता न हो तो समझदारी से अनुमान लगाने का तरीक़ा।' },
  'Chat with Books': { name: 'पुस्तकों से चैट', detail: 'मानक पुस्तकों से प्रश्न पूछें और वह अंश पाएँ जहाँ से उत्तर आता है।' },
  'Map evaluation': { name: 'मैप मूल्यांकन', detail: 'अलग से बिकता है, किसी प्लान में शामिल नहीं। भरा हुआ मैप अपलोड करें, ₹49 दें, और अंकन जँचवाएँ।' },
  'FLT / Full paper eval': { name: 'FLT / पूरे पेपर का मूल्यांकन', detail: 'पूरा पेपर एक बार में जाँचा जाता है, एक-एक प्रश्न करके नहीं।' },
  'PDF upload & chat': { name: 'PDF अपलोड और चैट', detail: 'अपने नोट्स लाएँ और उनसे भी इसी तरह प्रश्न पूछें।' },
  'Brainstorm mode': { name: 'ब्रेनस्टॉर्म मोड', detail: 'लिखने से पहले उत्तर का ढाँचा तय करें।' },
  'Mentor mode': { name: 'मेंटर मोड', detail: 'आपके प्रश्न पर TADA फ़्रेमवर्क, और लिखने के लिए 350 शब्दों की योजना।' },
  'Flashcards': { name: 'फ़्लैशकार्ड', detail: 'हर कार्ड का सामने वाला हिस्सा खुला है, और पहले सौ उत्तर निःशुल्क हैं।' },
  'Topper copies': { name: 'टॉपर कॉपियाँ', detail: 'टॉपरों की उत्तर पुस्तिकाओं से स्कैन किए गए उत्तर, प्रश्न-दर-प्रश्न।' },
};
/** A table value in Hindi: "1 total", "100 answers", "Unlimited", "₹49 each". The figures come from the table itself. */
const valueHi = (v: string) => {
  if (v === 'Unlimited') return 'असीमित';
  let m = v.match(/^(\d+) total$/);
  if (m) return `कुल ${m[1]}`;
  m = v.match(/^(\d+) answers$/);
  if (m) return `${m[1]} उत्तर`;
  m = v.match(/^(\d+) copies$/);
  if (m) return `${m[1]} कॉपियाँ`;
  m = v.match(/^(₹[\d,]+) each$/);
  if (m) return `${m[1]} प्रति मैप`;
  return v;
};

const Check = ({ label }: { label: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-label={label}><path d="M20 6 9 17l-5-5" /></svg>;
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const cell = (v: string, hi: boolean) => (v === '✓'
  ? <Check label={hi ? 'शामिल' : 'Included'} />
  : v === '—' ? <span className="pr-none" aria-label={hi ? 'शामिल नहीं' : 'Not included'}>-</span>
  : hi ? valueHi(v) : v);
const fmtLong = (iso: string, hi: boolean) => new Date(iso).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const noop = () => () => {};

export default function PricingClient() {
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);
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
  const offer = useOffer();

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
    if (!RZP) { toast(L('Payment is still loading. Give it a moment and try again.', 'भुगतान अभी लोड हो रहा है। थोड़ा रुककर फिर कोशिश करें।'), 'error'); return; }
    setTopperBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/razorpay/topper-order', { method: 'POST', headers: { 'x-user-token': token } });
      const order = await res.json();
      // The route's own words are English and technical, so Hindi mode shows a plain line instead.
      if (!res.ok) { toast(langHi ? 'भुगतान शुरू नहीं हो सका। फिर कोशिश करें।' : order.error || 'Could not start the payment.', 'error'); setTopperBusy(false); return; }
      new RZP({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'History Optional',
        description: L('Topper copies, one year', 'टॉपर कॉपियाँ, एक साल'),
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
      toast(L('Could not start the payment.', 'भुगतान शुरू नहीं हो सका। फिर कोशिश करें।'), 'error');
      setTopperBusy(false);
    }
  };

  const premium = Boolean(status?.isPremium);
  const free = (name: string) => FEATURES.find((f) => f.name === name)?.free.replace(' total', '') ?? '';
  /** The number alone ("5" from "5 copies"), for sentences that name the thing themselves. */
  const count = (name: string) => free(name).match(/\d+/)?.[0] ?? free(name);

  /** A plan's button. On Premium it extends, since buying again adds the time on top. */
  const oneTime = (id: PlanId, solid: boolean) => (
    <button type="button" className={`ds-btn ${solid ? 'ds-btn-solid' : 'ds-btn-line'} pr-buy`} onClick={() => setCheckoutPlan(id)}>
      {premium ? (langHi ? EXTEND_HI : EXTEND)[id] : (langHi ? CTA_HI : CTA)[id]}
    </button>
  );
  const plan = (id: PlanId, opts: { featured?: boolean; unit?: string } = {}) => {
    const now = planPricePaise(id, offer) / 100;
    const sale = now !== rupees(id);
    return (
    <article className={`pr-plan${opts.featured ? ' featured' : ''}`}>
      <div className="pr-plan-top">
        <h3 className="pr-plan-name">{langHi ? NAME_HI[id] : NAME[id]}</h3>
        {sale && offer ? <span className="offer-off">{L(`${offer.percentOff}% off`, `${offer.percentOff}% छूट`)}</span>
          : opts.featured && <span className="pr-tag">{L('Most chosen', 'सबसे ज़्यादा चुना गया')}</span>}
      </div>
      {sale && <div className="pr-was"><s>₹{rupees(id).toLocaleString('en-IN')}</s> {offer && L(`${offer.name}, till ${offer.until}`, `${offer.nameHi}, ${offer.untilHi} तक`)}</div>}
      <div className="pr-price"><span className="pr-rs">₹</span>{now.toLocaleString('en-IN')}<span className="pr-unit">{opts.unit ?? ''}</span></div>
      <div className="pr-period">{(langHi ? PER_HI : PER)(id, now)}</div>
      <p className="pr-blurb">{(langHi ? BLURB_HI : BLURB)[id]}</p>
      {oneTime(id, Boolean(opts.featured))}
    </article>
    );
  };

  return (
    <div className="pr ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pr-hero">
        <div className="ds-container">
          <h1 className="ds-h1 pr-h1">{L('Plans and pricing', 'प्लान और क़ीमतें')}</h1>
          <p className="ds-lede pr-lede">
            {L('Everything you read here is free once you sign in. Premium is for practice, when you want every answer checked and the AI tutor without limits.',
              'साइन इन करने के बाद यहाँ पढ़ने की हर चीज़ निःशुल्क है। प्रीमियम अभ्यास के लिए है, जब आप हर उत्तर जँचवाना चाहें और AI ट्यूटर बिना किसी सीमा के।')}
          </p>
          {days !== null && days > 0 && <span className="pr-chip">{langHi
            ? `मुख्य परीक्षा ${NEXT_MAINS.slice(0, 4)} में ${days.toLocaleString('en-IN')} दिन बाक़ी`
            : `${days.toLocaleString('en-IN')} days to Mains ${NEXT_MAINS.slice(0, 4)}`}</span>}
        </div>
      </header>

      <div className="ds-container">
        {premium && (
          <div className="pr-have" role="status">
            <div>
              <strong>{L('You’re on Premium.', 'आप प्रीमियम पर हैं।')}</strong>{' '}
              {status?.expires_at && (langHi
                ? <span>{`यह ${fmtLong(status.expires_at, true)} तक चलेगा।`}</span>
                : <span>It runs to {fmtLong(status.expires_at, false)}.</span>)}{' '}
              <span>{L('Buying again adds the time on top.', 'फिर से ख़रीदने पर समय आगे जुड़ जाता है।')}</span>
            </div>
            <div className="pr-have-actions">
              <Link href="/evaluate" className="ds-btn ds-btn-line ds-btn-sm">{L('Check an answer', 'उत्तर जँचवाएँ')} <Arrow /></Link>
            </div>
          </div>
        )}

        <OfferNote className="offer-note pr-offer" />
        <InvitedNote className="offer-note pr-offer" />

        <section className="pr-group" aria-labelledby="pr-g1">
          <div className="pr-group-head"><h2 id="pr-g1" className="pr-h2">{L('For your whole preparation', 'पूरी तैयारी के लिए')}</h2><span>{L('Paid once, never renews', 'एक बार भुगतान, अपने-आप रिन्यू नहीं होता')}</span></div>
          <div className="pr-pair">
            {plan('yearly', { featured: true })}
            {plan('sixmonths')}
          </div>
        </section>

        <div className="pr-pair pr-rest">
          <section className="pr-group" aria-labelledby="pr-g3">
            <div className="pr-group-head"><h2 id="pr-g3" className="pr-h2">{L('Just to try it', 'बस आज़माने के लिए')}</h2><span>{L('24 hours, paid once', '24 घंटे, एक बार भुगतान')}</span></div>
            {plan('daily')}
          </section>
        </div>

        <p className="pr-rzp">{L('Payments go through Razorpay: UPI, cards and net banking. Every plan is a single payment, and nothing renews on its own.',
          'भुगतान Razorpay से होता है: UPI, कार्ड और नेट बैंकिंग। हर प्लान एक बार का भुगतान है, और कुछ भी अपने-आप रिन्यू नहीं होता।')}</p>

        <section className="pr-section" aria-labelledby="pr-compare">
          <h2 id="pr-compare" className="pr-h2">{L('Free account and Premium', 'निःशुल्क खाता और प्रीमियम')}</h2>
          <div className="pr-compare" role="table" aria-label={L('Free account and Premium compared', 'निःशुल्क खाते और प्रीमियम की तुलना')}>
            <div className="pr-row pr-row-head" role="row">
              <span role="columnheader">{L('What you get', 'आपको क्या मिलता है')}</span>
              <span role="columnheader">{L('Free', 'निःशुल्क')}</span>
              <span role="columnheader" className="pr-col-premium">{L('Premium', 'प्रीमियम')}</span>
            </div>
            {FEATURES.map((f) => {
              const hi = langHi ? FEATURE_HI[f.name] : undefined;
              return (
                <div key={f.name} className="pr-row" role="row">
                  <span role="cell" className="pr-what"><strong>{hi?.name ?? f.name}</strong>{f.detail && <small>{hi?.detail ?? f.detail}</small>}</span>
                  <span role="cell" className="pr-val">{cell(f.free, langHi)}</span>
                  <span role="cell" className="pr-val pr-col-premium">{cell(f.premium, langHi)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pr-section" aria-labelledby="pr-once">
          <h2 id="pr-once" className="pr-h2">{L('Bought on their own', 'अलग से ख़रीदें')}</h2>
          <p className="pr-section-lede">{L('Every plan includes topper copies, or you can buy them on their own. Map checks are paid per map and aren’t part of any plan.',
            'हर प्लान में टॉपर कॉपियाँ शामिल हैं, या आप उन्हें अलग से ख़रीद सकते हैं। मैप जाँच का भुगतान हर मैप का अलग होता है, और यह किसी प्लान का हिस्सा नहीं है।')}</p>
          <div className="pr-pair">
            {ONE_OFF.map((o) => (
              <article key={o.name} className="pr-plan pr-one">
                <div className="pr-plan-top">
                  <h3 className="pr-plan-name">{o.name === 'Map evaluation' ? L('A map check', 'एक मैप जाँच') : langHi ? (FEATURE_HI[o.name]?.name ?? o.name) : o.name}</h3>
                  <span className={`pr-badge${o.inPremium ? ' in' : ''}`}>{o.inPremium ? L('Also in Premium', 'प्रीमियम में भी') : L('Per map', 'प्रति मैप')}</span>
                </div>
                <div className="pr-price small"><span className="pr-rs">₹</span>{(o.pricePaise / 100).toLocaleString('en-IN')}<span className="pr-unit">{o.inPremium ? L('/year', '/साल') : ''}</span></div>
                {o.inPremium && TOPPER_PRICE.was && <div className="pr-was"><s>₹{TOPPER_PRICE.was}</s><span className="pr-off">{TOPPER_PRICE.off}% {L('off', 'छूट')}</span></div>}
                <p className="pr-blurb">{o.inPremium
                  ? L(`Answers scanned from toppers’ copies, question by question. A free account opens ${count('Topper copies')} of them.`, `टॉपरों की कॉपियों से स्कैन किए गए उत्तर, प्रश्न-दर-प्रश्न। निःशुल्क खाते में इनमें से ${count('Topper copies')} खुलती हैं।`)
                  : L('Your filled map checked place by place: the name for 1.5 marks and your note for 1. Paid when you upload it.', 'आपका भरा हुआ मैप हर स्थान पर जाँचा जाता है: नाम के 1.5 अंक और आपकी टिप्पणी का 1 अंक। भुगतान अपलोड करते समय होता है।')}</p>
                {/* Map checks cannot be bought here: the ₹49 is charged
                    against an uploaded map, so this card goes to where the
                    map is uploaded. */}
                {o.inPremium ? (
                  <button type="button" className="ds-btn ds-btn-line pr-buy" onClick={buyTopper} disabled={topperOwned === true || topperBusy}>
                    {topperOwned === true ? L('You have these already', 'ये आपके पास पहले से हैं') : topperBusy ? L('Opening the payment…', 'भुगतान खुल रहा है…') : langHi ? `₹${(o.pricePaise / 100).toLocaleString('en-IN')} में ख़रीदें` : `Buy for ₹${(o.pricePaise / 100).toLocaleString('en-IN')}`}
                  </button>
                ) : (
                  <Link href="/evaluate?mode=map" className="ds-btn ds-btn-line pr-buy">{L('Check a map', 'मैप जँचवाएँ')} <Arrow /></Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="pr-section" aria-labelledby="pr-faq">
          <h2 id="pr-faq" className="pr-h2">{L('Before you pay', 'भुगतान से पहले')}</h2>
          <div className="pr-faq-list">
            {(langHi ? [
              { q: 'क्या यह अपने-आप रिन्यू होता है?', a: <>नहीं। एक दिन, 6 महीने और एक साल के प्लान एक बार के भुगतान हैं। प्लान ख़त्म होने पर पहुँच बस रुक जाती है, जब तक आप फिर से न ख़रीदें।</> },
              { q: 'क्या भुगतान से पहले मूल्यांकन देखा जा सकता है?', a: <>हाँ। निःशुल्क खाते में <strong>{free('Answer evaluation')} उत्तर जाँच</strong> और <strong>{free('AI Chat')} चैट</strong> मिलती हैं, यह परखने के लिए काफ़ी कि प्रतिक्रिया काम की है या नहीं। {planPriceLabel('daily')} का एक दिन 24 घंटे के लिए सब कुछ खोल देता है।</> },
              { q: 'प्लान चलते हुए ख़रीदें तो क्या होगा?', a: <>नया समय मौजूदा प्लान के अंत में जुड़ जाता है। जिन दिनों का भुगतान हो चुका है, वे नहीं जाते।</> },
              { q: 'क्या मैप जाँच शामिल है?', a: <>नहीं। मैप जाँच {`₹${ONE_OFF[1].pricePaise / 100}`} प्रति मैप है, सदस्यता हो या न हो। टॉपर कॉपियाँ इसका उल्टा हैं: हर प्लान में शामिल हैं, और अलग से {`₹${(ONE_OFF[0].pricePaise / 100).toLocaleString('en-IN')}`} में ख़रीदी जा सकती हैं।</> },
              { q: 'क्या रिफ़ंड मिलता है?', a: <>ख़रीद अंतिम है, दो अपवादों के साथ: दोहरा भुगतान और साइट का लंबे समय तक बंद रहना। पूरी जानकारी <Link href="/refund">रिफ़ंड नीति</Link> में है, और बाक़ी सब <Link href="/terms">शर्तों</Link> में।</> },
              { q: 'भुगतान में कोई गड़बड़ हुई?', a: <>Razorpay पेमेंट ID के साथ <Link href="/contact">संपर्क पेज</Link> से हमें लिखें, और इसे सुलझा दिया जाएगा।</> },
            ] : [
              { q: 'Does it renew on its own?', a: <>No. The day, 6-month and yearly plans are single payments. When one runs out, access simply stops until you buy again.</> },
              { q: 'Can I see the marking before I pay?', a: <>Yes. A free account gets <strong>{free('Answer evaluation')} answer check</strong> and <strong>{free('AI Chat')} chats</strong>, enough to judge whether the feedback is worth having. A day at {planPriceLabel('daily')} opens everything for 24 hours.</> },
              { q: 'What happens if I buy while a plan is running?', a: <>The new time is added to the end of the current plan. You don’t lose the days already paid for.</> },
              { q: 'Is the map check included?', a: <>No. Map checks are {`₹${ONE_OFF[1].pricePaise / 100}`} each, whether or not you subscribe. Topper copies are the other way round: every plan includes them, and they can be bought on their own for {`₹${(ONE_OFF[0].pricePaise / 100).toLocaleString('en-IN')}`}.</> },
              { q: 'Are refunds available?', a: <>Purchases are final, with two exceptions: a duplicate payment and an extended outage. The <Link href="/refund">refund policy</Link> has the details and the <Link href="/terms">terms</Link> cover the rest.</> },
              { q: 'Something went wrong with a payment?', a: <>Write to us from the <Link href="/contact">contact page</Link> with the Razorpay payment id, and it will be sorted out.</> },
            ]).map((f) => (
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
            <h2>{L('Not sure yet?', 'अभी तय नहीं कर पाए?')}</h2>
            {langHi
              ? <p>निःशुल्क खाते से शुरू करें: हर नोट और हर पिछला प्रश्न, {count('AI Chat')} चैट, {count('Answer evaluation')} उत्तर जाँच, {count('Topper copies')} टॉपर कॉपियाँ और {count('Flashcards')} फ़्लैशकार्ड उत्तर।</p>
              : <p>Start with the free account: every note and past question, {count('AI Chat')} chats, {count('Answer evaluation')} answer check, {count('Topper copies')} topper copies and {count('Flashcards')} flashcard answers.</p>}
          </div>
          {signedIn
            ? <Link href="/dashboard" className="ds-btn ds-btn-line">{L('Go to your dashboard', 'अपने डैशबोर्ड पर जाएँ')}</Link>
            : <button type="button" className="ds-btn ds-btn-line" onClick={() => signInWithGoogle().catch(() => {})}>{L('Sign in free', 'निःशुल्क साइन इन करें')}</button>}
        </section>
      </div>

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} fingerprint={fingerprint} onClose={() => setCheckoutPlan(null)} />}
    </div>
  );
}

/** Checkout stays in SubscribeCard, the same card as the Go Premium panel, rather than being forked here. */
function CheckoutModal({ plan, fingerprint, onClose }: { plan: PlanId; fingerprint: string | null; onClose: () => void }) {
  const { langHi } = useLang();
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
      <div className="ds-modal pr-checkout" role="dialog" aria-modal="true" aria-label={langHi ? `चेकआउट, ${NAME_HI[plan]}` : `Checkout, ${PLANS[plan].label} (${PLAN_DURATION[plan]})`}>
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
.pr-was { margin-bottom: var(--space-2); font-size: 0.9rem; font-weight: 600; color: var(--premium-text); }
.pr-was s { margin-right: var(--space-1); color: var(--text3); font-size: 1.1rem; font-weight: 700; }
.pr-offer { margin-top: var(--space-6); }
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
