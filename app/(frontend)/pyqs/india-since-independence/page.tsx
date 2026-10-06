import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: 'India Since Independence PYQs: UPSC History Optional Previous Year Questions',
  description: 'All UPSC History Optional Previous Year Questions on India Since Independence (Paper II) from 1979–2026: national integration, foreign policy, developmental economics and social movements.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/india-since-independence' },
};

export default function IndiaSinceIndependencePyqs() {
  return <PyqSectionPage slug="india-since-independence" />;
}
