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
