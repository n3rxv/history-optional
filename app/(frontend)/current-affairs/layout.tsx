import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Current Affairs: History Optional' },
  description: 'News that touches the UPSC History Optional syllabus, and what each piece means for the answers you write.',
  alternates: { canonical: 'https://historyoptional.xyz/current-affairs' },
  openGraph: {
    title: 'Current Affairs: History Optional',
    description: 'News that touches the UPSC History Optional syllabus, and what each piece means for the answers you write.',
    url: 'https://historyoptional.xyz/current-affairs',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
