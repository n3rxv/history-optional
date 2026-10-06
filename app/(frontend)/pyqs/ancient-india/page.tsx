import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: { absolute: 'Ancient India PYQs: UPSC History Optional Previous Year Questions' },
  description: 'All UPSC History Optional Previous Year Questions on Ancient India (Paper I) from 1979–2026. Covers Harappan Civilization, Vedic Period, Mauryas, Guptas, and more.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/ancient-india' },
};

export default function AncientIndiaPyqs() {
  return <PyqSectionPage slug="ancient-india" />;
}
