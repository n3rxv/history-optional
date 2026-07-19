import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historical Map Quiz — UPSC History Optional',
  description: 'Interactive map-based quiz for UPSC History Optional. Identify ancient, medieval, and modern historical sites of India.',
  alternates: { canonical: 'https://historyoptional.xyz/mapping' },
  openGraph: {
    title: 'Historical Map Quiz — UPSC History Optional',
    description: 'Interactive map-based quiz for UPSC History Optional. Identify ancient, medieval, and modern historical sites of India.',
    url: 'https://historyoptional.xyz/mapping',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
