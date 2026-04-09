import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paper II Notes — Modern India & World History | History Optional UPSC',
  description: 'Complete UPSC History Optional Paper 2 notes covering Modern India (British expansion to Independence) and World History (Enlightenment to Cold War). Structured by syllabus.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
