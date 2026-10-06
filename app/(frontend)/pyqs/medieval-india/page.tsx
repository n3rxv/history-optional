import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: { absolute: 'Medieval India PYQs: UPSC History Optional Previous Year Questions' },
  description: 'All UPSC History Optional Previous Year Questions on Medieval India (Paper I) from 1979–2026.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/medieval-india' },
};

export default function MedievalIndiaPyqs() {
  return <PyqSectionPage slug="medieval-india" />;
}
