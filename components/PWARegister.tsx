'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n/LangContext';
import owlArt from '@/public/mascot/owl.svg';

const DISMISS_KEY = 'ho_pwa_install_dismissed_at';

/** Chrome's beforeinstallprompt event, which TypeScript's DOM types omit. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
const DISMISS_DAYS = 14;

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export default function PWARegister() {
  const { langHi } = useLang();
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Listen for Android/Chrome install prompt
  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
      setShowBanner(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    // iOS has no install prompt API — show manual instructions instead,
    // but only once, and only if not already installed.
    if (isIos()) {
      const t = setTimeout(() => setShowIosBanner(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setShowBanner(false);
    setShowIosBanner(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    setDeferredPrompt(null);
    setShowBanner(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  if (!showBanner && !showIosBanner) return null;
  // The chat's input sits at the foot of the screen, where this banner lands;
  // it covered the box a reader had come to type in. Shown on other pages.
  if (pathname?.startsWith('/chat')) return null;

  return (
    <div className="ho-pwa-banner ds" role="dialog" aria-label={langHi ? 'ऐप इंस्टॉल करें' : 'Install the app'}>
      <span className="ho-pwa-banner-icon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={owlArt.src} alt="" width={30} height={28} />
      </span>
      <div className="ho-pwa-banner-text">
        <div className="ho-pwa-banner-title">
          {langHi ? 'History Optional को ऐप की तरह रखें' : 'Keep History Optional on your home screen'}
        </div>
        <div className="ho-pwa-banner-sub">
          {showIosBanner
            ? (langHi
                ? 'शेयर बटन दबाएँ, फिर "होम स्क्रीन पर जोड़ें" चुनें'
                : 'Tap Share, then "Add to Home Screen"')
            : (langHi
                ? 'एक टैप में खुलता है, पूरी स्क्रीन पर'
                : 'It opens in one tap, full screen')}
        </div>
      </div>
      {!showIosBanner && (
        <button className="ds-btn ds-btn-solid ds-btn-sm" onClick={handleInstall}>
          {langHi ? 'जोड़ें' : 'Add'}
        </button>
      )}
      <button className="ds-x" onClick={dismiss} aria-label={langHi ? 'बंद करें' : 'Dismiss'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
