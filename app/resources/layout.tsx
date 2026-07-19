import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources — Books & Study Material for History Optional',
  description: 'Curated books, PDFs, and study resources for UPSC History Optional aspirants.',
  alternates: { canonical: 'https://historyoptional.xyz/resources' },
  openGraph: {
    title: 'Resources — Books & Study Material for History Optional',
    description: 'Curated books, PDFs, and study resources for UPSC History Optional aspirants.',
    url: 'https://historyoptional.xyz/resources',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
