import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Map Practice: UPSC History Optional' },
  description: 'All 992 places in the UPSC History Optional map syllabus, chapter by chapter, with the ones UPSC has asked marked. Browse them on the map or quiz yourself.',
  alternates: { canonical: 'https://historyoptional.xyz/mapping' },
  openGraph: {
    title: 'Map Practice: UPSC History Optional',
    description: 'All 992 places in the UPSC History Optional map syllabus, chapter by chapter, with the ones UPSC has asked marked. Browse them on the map or quiz yourself.',
    url: 'https://historyoptional.xyz/mapping',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
