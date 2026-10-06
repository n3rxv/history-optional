import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: 'Early Medieval India PYQs: UPSC History Optional Previous Year Questions',
  description: 'All UPSC History Optional Previous Year Questions on Early Medieval India (Paper I) from 1979–2026.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/early-medieval' },
};

export default function EarlyMedievalPyqs() {
  return <PyqSectionPage slug="early-medieval" />;
}
