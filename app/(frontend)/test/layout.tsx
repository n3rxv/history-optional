import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Test Papers: UPSC History Optional' },
  description: 'Timed test papers in the UPSC History Optional Mains format, built from real past questions, with the map question, a marking rubric and answer checking.',
  alternates: { canonical: 'https://historyoptional.xyz/test' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
