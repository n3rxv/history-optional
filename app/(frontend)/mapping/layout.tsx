import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Map Practice: UPSC History Optional' },
  description: 'All 992 places in the UPSC History Optional map syllabus, chapter by chapter, and every map question UPSC has set since 2013, year by year. Browse on a political or physical map, see what UPSC repeats, and test yourself.',
  alternates: { canonical: 'https://historyoptional.xyz/mapping' },
  openGraph: {
    title: 'Map Practice: UPSC History Optional',
    description: 'All 992 places in the UPSC History Optional map syllabus, chapter by chapter, and every map question UPSC has set since 2013, year by year. Browse on a political or physical map, see what UPSC repeats, and test yourself.',
    url: 'https://historyoptional.xyz/mapping',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
