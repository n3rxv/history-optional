import { NextResponse } from 'next/server';

/**
 * The weekly autopay plan is no longer sold, so no new mandate is created.
 *
 * Mandates bought before it was withdrawn keep working: the webhook still
 * grants each week's charge, and /api/razorpay/subscription/cancel still stops
 * them. Only the start of a new one is refused here.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'plan_withdrawn', message: 'The weekly plan is no longer offered. Choose the day, 6-month or yearly plan instead.' },
    { status: 410 },
  );
}
