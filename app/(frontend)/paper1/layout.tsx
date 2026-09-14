import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paper I Notes — Ancient & Medieval India | History Optional UPSC',
  description: 'Complete UPSC History Optional Paper 1 notes covering Ancient India (Indus Valley to Vijayanagara) and Medieval India (Delhi Sultanate to 18th century). Structured by syllabus.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
