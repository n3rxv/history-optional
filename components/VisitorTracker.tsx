'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
function getVisitorId(): string {
  const key = 'ho_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    const fp = [
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency,
    ].join('|');
    let hash = 0;
    for (let i = 0; i < fp.length; i++) hash = (Math.imul(31, hash) + fp.charCodeAt(i)) | 0;
    id = Math.abs(hash).toString(36) + '-' + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}
export default function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const visitor_id = getVisitorId();
      const isFirstVisit = !localStorage.getItem('ho_visited');
      const referrer = isFirstVisit ? (document.referrer || 'direct') : undefined;
      if (isFirstVisit) localStorage.setItem('ho_visited', '1');
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id, page: pathname, referrer }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}
