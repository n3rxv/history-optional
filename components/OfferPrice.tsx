'use client';
import { useLang } from '@/lib/i18n/LangContext';
import { useOffer } from '@/hooks/useOffer';
import { PLANS, planPricePaise, type Offer, type PlanId } from '@/lib/plans';

const inr = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN');

/** A plan's price, with the list price struck through while an offer covers it. */
export function OfferPrice({ id, className }: { id: PlanId; className?: string }) {
  const offer = useOffer();
  const now = planPricePaise(id, offer);
  const list = PLANS[id].amountPaise;
  return (
    <span className={className}>
      {now !== list && <s className="offer-was">{inr(list)}</s>}
      {inr(now)}
    </span>
  );
}

const PLAN_WORDS: Partial<Record<PlanId, { en: string; hi: string }>> = {
  sixmonths: { en: '6-month', hi: '6 महीने' },
  yearly: { en: 'yearly', hi: 'एक साल' },
};

/** "Diwali offer: 33% off the 6-month and yearly plans, till 10 November." */
export function offerLine(offer: Offer, hi: boolean): string {
  const ids = (Object.keys(offer.amountPaise) as PlanId[]).filter((id) => PLAN_WORDS[id]);
  const names = ids.map((id) => PLAN_WORDS[id]![hi ? 'hi' : 'en']);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} ${hi ? 'और' : 'and'} ${names[names.length - 1]}` : names[0];
  return hi
    ? `${offer.nameHi}: ${list} के प्लान पर ${offer.percentOff}% की छूट, ${offer.untilHi} तक।`
    : `${offer.name}: ${offer.percentOff}% off the ${list} plan${names.length > 1 ? 's' : ''}, till ${offer.until}.`;
}

/** The running offer in one line, or nothing. */
export function OfferNote({ className }: { className?: string }) {
  const { langHi } = useLang();
  const offer = useOffer();
  if (!offer) return null;
  return <p className={className}><span className="offer-spark" aria-hidden="true">✦</span>{offerLine(offer, langHi)}</p>;
}
