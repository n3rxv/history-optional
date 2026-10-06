import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: { absolute: 'World History PYQs: UPSC History Optional Previous Year Questions' },
  description: 'All UPSC History Optional Previous Year Questions on World History (Paper II) from 1979–2026.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/world-history' },
};

export default function WorldHistoryPyqs() {
  return <PyqSectionPage slug="world-history" />;
}
