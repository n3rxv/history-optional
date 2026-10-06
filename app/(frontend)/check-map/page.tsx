import { redirect } from 'next/navigation';

/**
 * An early map checker, never linked and built in styles the site does not
 * use. Map answers are checked on the evaluate page now, so an old link
 * lands there on the map question.
 */
export default function CheckMapPage() {
  redirect('/evaluate?mode=map');
}
