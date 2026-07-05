'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

async function getVisitorId(): Promise<string> {
  const cached = localStorage.getItem('fp');
  if (cached) return cached;
  const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
  const { visitorId } = await FP.get();
  localStorage.setItem('fp', visitorId);
  return visitorId;
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
    (async () => {
      try {
        const visitor_id = await getVisitorId();
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
    })();
  }, [pathname]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    (async () => {
      try {
        const visitor_id = await getVisitorId();
        sendHeartbeat(visitor_id);
        interval = setInterval(() => sendHeartbeat(visitor_id), 30000);
        const onVisibility = () => sendHeartbeat(visitor_id);
        document.addEventListener('visibilitychange', onVisibility);
        const onUnload = () => sendHeartbeat(visitor_id);
        window.addEventListener('beforeunload', onUnload);
      } catch {}
    })();
    return () => clearInterval(interval);
  }, []);

  return null;
}
