'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getVisitorId(): string {
  const key = 'ho_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    // Generate stable fingerprint-based ID
    const fp = [
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency,
    ].join('|');
    // Simple hash
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
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id, page: pathname }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}
