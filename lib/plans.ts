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

export type PlanId = 'daily' | 'sixmonths' | 'yearly';

export const PLANS: Record<PlanId, { amountPaise: number; label: string }> = {
  daily:     { amountPaise:   4900, label: 'Daily'    },
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

/** Returns a new Date — does not mutate `from`. */
export function addPlanDuration(from: Date, plan: PlanId): Date {
  const next = new Date(from.getTime());
  if (plan === 'daily') next.setDate(next.getDate() + 1);
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
  sixmonths: '6 months',
  yearly:    'year',
};

/** Days each plan is worth, used only for the per-month comparison. */
const PLAN_DAYS: Record<PlanId, number> = { daily: 1, sixmonths: 182, yearly: 365 };

/**
 * Effective monthly cost, for comparing a six-month plan against an annual
 * one. Returns null for `daily`, where a monthly figure would be misleading
 * rather than helpful.
 */
export function planPerMonthLabel(plan: PlanId): string | null {
  if (plan === 'daily') return null;
  const perMonth = (PLANS[plan].amountPaise / 100) / (PLAN_DAYS[plan] / 30.44);
  return '₹' + Math.round(perMonth).toLocaleString('en-IN') + '/month';
}

/** Ordered cheapest to dearest, which is the order they are shown in. */
export const PLAN_ORDER: PlanId[] = ['daily', 'sixmonths', 'yearly'];
