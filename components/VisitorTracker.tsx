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

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'tablet';
  else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) device = 'mobile';

  let os = 'unknown';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'Mac';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'unknown';
  if ((navigator as any).brave?.isBrave) browser = 'Brave';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

async function sendHeartbeat(visitor_id: string) {
  await fetch('/api/track-visit', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_id }),
  }).catch(() => {});
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const visitor_id = getVisitorId();
      const isFirstVisit = !localStorage.getItem('ho_visited');
      const referrer = isFirstVisit ? (document.referrer || 'direct') : undefined;
      if (isFirstVisit) localStorage.setItem('ho_visited', '1');
      const { device, os, browser } = getDeviceInfo();

      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id, page: pathname, referrer, device, os, browser, is_first_visit: isFirstVisit }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  useEffect(() => {
    try {
      const visitor_id = getVisitorId();
      // Fire immediately on mount
      sendHeartbeat(visitor_id);
      // Then every 30s
      const interval = setInterval(() => sendHeartbeat(visitor_id), 30000);
      return () => clearInterval(interval);
    } catch {}
  }, []);

  return null;
}
