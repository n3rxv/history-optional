import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — History Optional",
  description: "Refund Policy for historyoptional.xyz premium subscriptions.",
  alternates: { canonical: "https://historyoptional.xyz/refund" },
};

export default function RefundPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>Refund Policy</h1>
        <p className="legal-meta">Last updated: 29 June 2026 · Effective: 29 June 2026</p>

        <p>
          This Refund Policy applies to all premium subscription purchases made on{" "}
          <strong>historyoptional.xyz</strong>.
        </p>

        <h2>1. No-Refund Policy</h2>
        <p>
          All subscription purchases are <strong>final and non-refundable</strong>. Once a
          payment is processed via Razorpay, we do not offer refunds, partial refunds,
          or credits — regardless of usage.
        </p>
        <p>
          We strongly recommend using the <strong>free plan</strong> to evaluate the platform
          before subscribing. The free plan includes access to Notes (Paper I &amp; II),
          PYQ bank, Timeline &amp; Historiography, 3 AI chat messages, and 1 answer evaluation.
        </p>

        <h2>2. Subscription Plans</h2>
        <ul>
          <li><strong>Daily</strong> — ₹49/day</li>
          <li><strong>Weekly</strong> — ₹299/week</li>
          <li><strong>Monthly</strong> — ₹999/month</li>
          <li><strong>Annual</strong> — ₹5,999/year</li>
        </ul>

        <h2>3. Exceptions</h2>
        <p>
          We will consider refund or credit requests only in the following circumstances:
        </p>
        <ul>
          <li>
            <strong>Duplicate payment</strong> — if you were charged more than once for the
            same plan due to a technical error
          </li>
          <li>
            <strong>Extended service outage</strong> — if premium features were inaccessible
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
          Email: <a href="mailto:historyoptional.xyz@gmail.com">historyoptional.xyz@gmail.com</a><br />
          Response time: within 5 business days
        </p>
      </div>
    </main>
  );
}
