import type { Metadata } from 'next';
import PricingClient from '@/components/PricingClient';
import { PLANS, planPriceLabel } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing — History Optional',
  description:
    'Notes, PYQs and the timeline are free. Premium removes the limits on answer evaluation, ' +
    'model answers, map checking and AI chat. ' +
    `${planPriceLabel('daily')} a day, ${planPriceLabel('sixmonths')} for six months, ` +
    `${planPriceLabel('yearly')} a year. One-time payment, no auto-renewal.`,
  alternates: { canonical: 'https://historyoptional.xyz/pricing' },
  openGraph: {
    title: 'Pricing — History Optional',
    description: `UPSC History Optional. Free notes and PYQs. Premium from ${planPriceLabel('daily')}.`,
    url: 'https://historyoptional.xyz/pricing',
    type: 'website',
  },
};

/**
 * Prices in the structured data are formatted from lib/plans.ts, the same
 * table the Razorpay order route bills from, so a rich result can never quote
 * a figure the checkout does not honour.
 */
const offers = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'History Optional Premium',
  description:
    'Unlimited answer evaluation, model answers, map evaluation and AI chat for UPSC History Optional.',
  brand: { '@type': 'Brand', name: 'History Optional' },
  offers: (['daily', 'sixmonths', 'yearly'] as const).map(id => ({
    '@type': 'Offer',
    name: PLANS[id].label,
    price: (PLANS[id].amountPaise / 100).toString(),
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: 'https://historyoptional.xyz/pricing',
  })),
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offers) }}
      />
      <PricingClient />
    </>
  );
}
