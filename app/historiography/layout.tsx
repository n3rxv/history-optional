import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historiography Bank — UPSC History Optional',
  description: 'Historiographical debates, contested interpretations and schools of thought for UPSC History Optional. Marxist, Nationalist, Subaltern, Cambridge School and more.',
  alternates: { canonical: 'https://historyoptional.xyz/historiography' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
