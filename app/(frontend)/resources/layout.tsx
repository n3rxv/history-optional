import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Books: The Reading List for History Optional' },
  description: 'The standard books for each part of the UPSC History Optional syllabus, with free copies where they exist and where to buy them.',
  alternates: { canonical: 'https://historyoptional.xyz/resources' },
  openGraph: {
    title: 'Books: The Reading List for History Optional',
    description: 'The standard books for each part of the UPSC History Optional syllabus, with free copies where they exist and where to buy them.',
    url: 'https://historyoptional.xyz/resources',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
