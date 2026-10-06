import type { Metadata } from 'next';
import PyqSectionPage from '@/components/pyq/PyqSectionPage';

export const metadata: Metadata = {
  title: { absolute: 'Modern India PYQs: UPSC History Optional Previous Year Questions' },
  description: 'All UPSC History Optional Previous Year Questions on Modern India (Paper II) from 1979–2026.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/modern-india' },
};

export default function ModernIndiaPyqs() {
  return <PyqSectionPage slug="modern-india" />;
}
