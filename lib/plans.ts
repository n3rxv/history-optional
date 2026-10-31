/**
 * Single source of truth for subscription pricing.
 *
 * The price table used to be inlined in /api/razorpay/order while
 * /api/razorpay/verify took the plan and the amount from the request body.
 * That meant a caller could pay for `daily` (₹49) and then ask verify for
 * `yearly`, because nothing server-side ever compared the two. Both routes
 * now read the plan from here, and verify reads which plan was bought from
 * the Razorpay order itself rather than from the client.
 */

export type PlanId = 'daily' | 'weekly' | 'sixmonths' | 'yearly';

export const PLANS: Record<PlanId, { amountPaise: number; label: string }> = {
  daily:     { amountPaise:   4900, label: 'Daily'    },
  weekly:    { amountPaise:   9900, label: 'Weekly'   },
  sixmonths: { amountPaise: 199900, label: '6 Months' },
  yearly:    { amountPaise: 299900, label: 'Annual'   },
};

export const DEFAULT_PLAN: PlanId = 'yearly';

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANS, value);
}

/** Falls back to the most expensive plan, so a bad value can never underbill. */
export function toPlanId(value: unknown): PlanId {
  return isPlanId(value) ? value : DEFAULT_PLAN;
}

export function planAmountPaise(plan: PlanId): number {
  return PLANS[plan].amountPaise;
}

/**
 * Sales: some plans at a lower price for a while.
 *
 * The order route charges the sale price while an offer runs and writes the
 * offer's id into the Razorpay order's notes. The grant then accepts either
 * the list price or the sale price of the offer named there, so an order made
 * on the last evening still grants when it is paid after midnight. PLANS keeps
 * the list prices, which the terms, the refund policy and search results show.
 */
export type Offer = {
  id: string;
  name: string;
  nameHi: string;
  /** The last day, as the pages state it. */
  until: string;
  untilHi: string;
  percentOff: number;
  startsAt: string;
  /** The first moment the offer is over. */
  endsAt: string;
  amountPaise: Partial<Record<PlanId, number>>;
};

export const OFFERS: Offer[] = [
  {
    id: 'diwali-2026', name: 'Diwali offer', nameHi: 'दिवाली ऑफ़र', until: '10 November', untilHi: '10 नवंबर', percentOff: 33,
    startsAt: '2026-10-31T00:00:00+05:30', endsAt: '2026-11-11T00:00:00+05:30',
    // 33% off, to the rupee below: ₹1,999 and ₹2,999. The day stays at ₹49.
    amountPaise: { sixmonths: 133900, yearly: 200900 },
  },
];

/** The offer running now, if any. The same object each time, so React can compare it. */
export function liveOffer(now = Date.now()): Offer | null {
  return OFFERS.find((o) => now >= Date.parse(o.startsAt) && now < Date.parse(o.endsAt)) ?? null;
}

/** What a plan costs now, and the offer that sets it. */
export function planChargeNow(plan: PlanId, now = Date.now()): { amountPaise: number; offer: Offer | null } {
  const offer = liveOffer(now);
  const sale = offer?.amountPaise[plan];
  return sale ? { amountPaise: sale, offer } : { amountPaise: PLANS[plan].amountPaise, offer: null };
}

/** Whether an order's amount is a price the plan was sold at: its list price, or the sale price of the offer in the order's notes. */
export function orderAmountOk(plan: PlanId, amountPaise: number, offerId?: unknown): boolean {
  if (amountPaise === PLANS[plan].amountPaise) return true;
  const offer = OFFERS.find((o) => o.id === offerId);
  return offer?.amountPaise[plan] === amountPaise;
}

/** The plan's price under an offer, or its list price. */
export function planPricePaise(plan: PlanId, offer: Offer | null): number {
  return offer?.amountPaise[plan] ?? PLANS[plan].amountPaise;
}

/** Returns a new Date — does not mutate `from`. */
export function addPlanDuration(from: Date, plan: PlanId): Date {
  const next = new Date(from.getTime());
  if (plan === 'daily') next.setDate(next.getDate() + 1);
  else if (plan === 'weekly') next.setDate(next.getDate() + 7);
  else if (plan === 'sixmonths') next.setMonth(next.getMonth() + 6);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

/**
 * Display helpers.
 *
 * The pricing page, the subscribe card and the navbar each used to carry their
 * own hand-typed price strings. One of those copies drifted: the navbar's
 * extend-plan modal still offers "Weekly" and "Monthly" at ₹1,999, neither of
 * which is a plan the server recognises. Anything that shows a price to a
 * person should format it from PLANS rather than retyping it.
 */

/** "₹2,999" — Indian digit grouping, no decimals. */
export function planPriceLabel(plan: PlanId): string {
  return '₹' + (PLANS[plan].amountPaise / 100).toLocaleString('en-IN');
}

/** How long the plan lasts, for use after a slash: "₹49/day". */
export const PLAN_DURATION: Record<PlanId, string> = {
  daily:     'day',
  weekly:    'week',
  sixmonths: '6 months',
  yearly:    'year',
};

/** Days each plan is worth, used only for the per-month comparison. */
const PLAN_DAYS: Record<PlanId, number> = { daily: 1, weekly: 7, sixmonths: 182, yearly: 365 };

/**
 * The line under the price, in whatever unit that plan is actually reasoned
 * in. A six-month plan is compared against an annual one per month; a weekly
 * plan is compared against nothing, because what a buyer wants to know is
 * what a day of it costs.
 */
export function planValueLine(plan: PlanId): string {
  if (plan === 'daily') return 'a single day, to try it properly';
  const rupees = PLANS[plan].amountPaise / 100;
  if (plan === 'weekly') {
    return '₹' + Math.round(rupees / PLAN_DAYS[plan]) + ' a day, cancel any time';
  }
  const perMonth = Math.round(rupees / (PLAN_DAYS[plan] / 30.44));
  return 'works out to ₹' + perMonth.toLocaleString('en-IN') + '/month';
}

/** Ordered cheapest to dearest, which is the order they are shown in. */
/** The plans on sale, cheapest first. 'weekly' is not one of them: the
 *  mandate was withdrawn, and the id stays in PlanId only for subscriptions
 *  bought before then, which still renew until cancelled. */
export const PLAN_ORDER: PlanId[] = ['daily', 'sixmonths', 'yearly'];
