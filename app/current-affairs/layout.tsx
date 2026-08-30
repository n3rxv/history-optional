import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Current Affairs — The Dispatch | History Optional',
  description: 'The Dispatch — current affairs and new-note updates curated for UPSC History Optional aspirants, with newspaper cuttings and analysis.',
  alternates: { canonical: 'https://historyoptional.xyz/current-affairs' },
  openGraph: {
    title: 'Current Affairs — The Dispatch | History Optional',
    description: 'The Dispatch — current affairs and new-note updates curated for UPSC History Optional aspirants, with newspaper cuttings and analysis.',
    url: 'https://historyoptional.xyz/current-affairs',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
