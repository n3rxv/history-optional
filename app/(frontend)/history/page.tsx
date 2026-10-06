import { redirect } from 'next/navigation';

/**
 * The old answer-history page. Past evaluations now live in a drawer on the
 * evaluate page, in the current design, so an old link or bookmark lands
 * there with the drawer open.
 */
export default function HistoryPage() {
  redirect('/evaluate?past=1');
}
