import type { Metadata } from 'next';
import Dashboard from '@/components/dashboard/Dashboard';
import { getDailyQuestions } from '@/lib/dailyQuestions';
import { istDay } from '@/lib/istDay';

export const metadata: Metadata = {
  title: 'Your dashboard: History Optional',
  robots: { index: false },
};

/**
 * The reader's dashboard. The page is static: the only thing worked out here
 * is today's question, the first of the home page's daily five, and the
 * browser asks for another day's when the page is opened on a later one.
 */
export default function DashboardPage() {
  return <Dashboard day={istDay()} question={getDailyQuestions()[0] ?? null} />;
}
