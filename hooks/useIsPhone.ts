'use client';
import { useSyncExternalStore } from 'react';

/** The width at which the site's sidebars become drawers and the tab bar shows. */
export const PHONE_QUERY = '(max-width: 768px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Whether the screen is phone-sized, for state that depends on it, such as
 * whether a sidebar starts open.
 *
 * Reading window.innerWidth in a useState initialiser is the tempting way, and
 * it broke pages: the server cannot know the width, so on a phone the first
 * render disagreed with the server's HTML, React threw that HTML away and
 * rebuilt the page, and the rebuild cleared data-theme off <html>, turning
 * light-mode pages dark. Setting it in an effect instead avoids the crash
 * but shows the desktop state for a frame first.
 *
 * useSyncExternalStore renders the server's answer (not a phone) while
 * hydrating and the real one straight after, and follows rotation. Pair it
 * with CSS for the first paint, which happens before any of this runs.
 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}
