import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service: History Optional" },
  description: "Terms of Service for historyoptional.xyz: the rules for using our UPSC History Optional platform.",
  alternates: { canonical: "https://historyoptional.xyz/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc current="terms" title="Terms of Service" updated="Last updated: 17 October 2026 · Effective: 17 October 2026">
      <p>
        These Terms of Service govern your use of <strong>historyoptional.xyz</strong> operated
        by the History Optional Team. By accessing or using the site you agree to be bound by
        these terms.
      </p>

      <h2>1. Services</h2>
      <p>
        History Optional provides UPSC History Optional exam preparation resources including
        structured notes, previous year questions (PYQs), AI-powered answer evaluation,
        historiography content, timeline tools, and a premium subscription plan.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use this service. By using the site you represent
        that you meet this requirement.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>You sign in using Google OAuth. You are responsible for keeping your account secure.</li>
        <li>You must not share your account credentials or allow others to access your subscription.</li>
        <li>We reserve the right to suspend accounts that violate these terms.</li>
      </ul>

      <h2>4. Subscription &amp; Payments</h2>
      <p>
        Every plan we sell is a one-time payment. Nothing renews on its own.
      </p>

      <h3>One-time plans</h3>
      <ul>
        <li>Daily: ₹49 (1 day access)</li>
        <li>Half-Yearly: ₹1,999 (6 months access)</li>
        <li>Annual: ₹2,999 (1 year access)</li>
      </ul>
      <p>
        These are <strong>single payments</strong>. They do not renew, nothing is stored
        to charge you again, and access simply ends on the expiry date unless you choose
        to buy again. Buying again while a plan is still running adds the new period to
        the end of the current one.
      </p>
      <h3>The withdrawn weekly plan</h3>
      <p>
        We no longer sell the weekly plan (₹99 every 7 days, collected through a
        payment mandate). If you started it before 17 October 2026, it continues on the
        terms you agreed to: Razorpay collects ₹99 every 7 days, notifies you before
        each debit, and stops after at most 52 collections. You can cancel at any time
        from the profile menu on the site, in one click. Cancelling stops all future
        charges immediately and you keep access until the end of the period the last
        charge covered. Cancelling does not refund a charge already taken.
      </p>
      <p>
        All payments are processed securely by Razorpay. Prices are in Indian Rupees (INR)
        and inclusive of applicable taxes. We reserve the right to change pricing with
        reasonable prior notice.
      </p>

      <h2>5. Refund Policy</h2>
      <p>
        All purchases are final. We do not offer refunds, exchanges, or credits for any
        plan once payment has been processed. For anyone still on the withdrawn weekly
        plan this applies to each individual collection: cancelling stops the next
        charge, it does not reverse the last one. Please review the features available
        on the free plan before buying.
      </p>
      <p>
        In the event of a demonstrable technical failure on our part that prevents access
        to premium features for an extended period, we will evaluate refund or credit
        requests on a case-by-case basis. Contact us within 7 days of the issue.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        All content on this site, including notes, question banks, AI-generated evaluations
        and design, is owned by historyoptional.xyz or its licensors. You may not copy,
        redistribute, or sell any content without written permission.
      </p>

      <h2>7. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, crawl, or systematically download site content</li>
        <li>Share premium content outside your personal use</li>
        <li>Use the platform for any unlawful purpose</li>
        <li>Attempt to reverse-engineer or interfere with the platform</li>
      </ul>

      <h2>8. AI Features</h2>
      <p>
        AI-powered answer evaluation and chat features are provided as study aids only.
        They do not constitute professional coaching advice. Accuracy of AI responses
        may vary, so always cross-reference with official UPSC sources.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, historyoptional.xyz shall not be liable for
        any indirect, incidental, or consequential damages arising from your use of the
        platform. Our total liability shall not exceed the amount you paid in the 30 days
        preceding the claim.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to
        the exclusive jurisdiction of courts in India.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? Contact us at:<br />
        <strong>History Optional Team</strong><br />
        Email: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}
