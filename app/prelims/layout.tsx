import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prelims Practice — UPSC History Optional',
  description: 'MCQ practice for UPSC Prelims with History focus. Topic-wise questions with explanations.',
  alternates: { canonical: 'https://historyoptional.xyz/prelims' },
  openGraph: {
    title: 'Prelims Practice — UPSC History Optional',
    description: 'MCQ practice for UPSC Prelims with History focus. Topic-wise questions with explanations.',
    url: 'https://historyoptional.xyz/prelims',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
