import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Refund Policy: History Optional" },
  description: "Refund Policy for historyoptional.xyz premium subscriptions.",
  alternates: { canonical: "https://historyoptional.xyz/refund" },
};

export default function RefundPage() {
  return (
    <LegalDoc current="refund" title="Refund Policy" updated="Last updated: 17 October 2026 · Effective: 17 October 2026">
      <p>
        This Refund Policy applies to all premium subscription purchases made on{" "}
        <strong>historyoptional.xyz</strong>.
      </p>

      <h2>1. No-Refund Policy</h2>
      <p>
        All purchases are <strong>final and non-refundable</strong>. Once a payment is
        processed via Razorpay, we do not offer refunds, partial refunds, or credits,
        regardless of usage. For anyone still on the withdrawn weekly plan, this applies to
        each individual collection: cancelling stops the next charge, it does not reverse
        the last one.
      </p>
      <p>
        We strongly recommend using the <strong>free plan</strong> to evaluate the platform
        before subscribing. The free plan includes access to Notes (Paper I &amp; II),
        PYQ bank, Timeline &amp; Historiography, 3 AI chat messages, and 1 answer evaluation.
      </p>

      <h2>2. Subscription Plans</h2>

      <h3>One-time</h3>
      <ul>
        <li><strong>Daily:</strong> ₹49 (1 day access)</li>
        <li><strong>Half-Yearly:</strong> ₹1,999 (6 months access)</li>
        <li><strong>Annual:</strong> ₹2,999 (1 year access)</li>
      </ul>
      <p>
        These are single payments. Nothing renews and nothing further is charged, so
        there is nothing to cancel.
      </p>

      <h3>The withdrawn weekly plan</h3>
      <p>
        We no longer sell the weekly plan (₹99 every 7 days on a payment mandate). If you
        started it before 17 October 2026, cancelling is the way to stop paying, not a
        refund request. You can cancel in one click from the profile menu on the site,
        and it takes effect immediately: no further charge is taken. <strong>You keep
        access for the remainder of the period the last charge already covered.</strong>{" "}
        A charge already collected is not refunded, so cancel before the next debit
        rather than after it. Razorpay notifies you ahead of every collection.
      </p>

      <h2>3. Exceptions</h2>
      <p>
        We will consider refund or credit requests only in the following circumstances:
      </p>
      <ul>
        <li>
          <strong>Duplicate payment:</strong> if you were charged more than once for the
          same plan due to a technical error
        </li>
        <li>
          <strong>Extended service outage:</strong> if premium features were inaccessible
          for more than 5 consecutive days due to our platform failure
        </li>
      </ul>
      <p>
        Exception requests must be raised within <strong>7 days</strong> of the payment date
        by contacting us at the address below. We will respond within 5 business days.
      </p>

      <h2>4. Payment Disputes</h2>
      <p>
        If you believe an unauthorised charge has been made, please contact us before
        raising a dispute with your bank or card issuer. We will resolve legitimate issues
        promptly.
      </p>

      <h2>5. Contact</h2>
      <p>
        For refund-related queries, reach us at:<br />
        <strong>History Optional Team</strong><br />
        Email: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a><br />
        Response time: within 5 business days
      </p>
    </LegalDoc>
  );
}
