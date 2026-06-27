'use client';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n/LangContext';

const DISMISS_KEY = 'ho_pwa_install_dismissed_at';
const DISMISS_DAYS = 14;

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
      setDeferredPrompt(e);
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

  return (
    <div className="ho-pwa-banner" role="dialog" aria-label="Install app">
      <div className="ho-pwa-banner-icon">
        <img src="/icon-192.png" alt="" width={36} height={36} style={{ borderRadius: 9, display: 'block' }} />
      </div>
      <div className="ho-pwa-banner-text">
        <div className="ho-pwa-banner-title">
          {langHi ? 'History Optional इंस्टॉल करें' : 'Install History Optional'}
        </div>
        <div className="ho-pwa-banner-sub">
          {showIosBanner
            ? (langHi
                ? 'शेयर बटन दबाएं → "होम स्क्रीन पर जोड़ें"'
                : 'Tap Share, then "Add to Home Screen"')
            : (langHi
                ? 'तेज़, फुलस्क्रीन ऐप जैसा अनुभव पाएं'
                : 'Get the full-screen app experience')}
        </div>
      </div>
      {!showIosBanner && (
        <button className="ho-pwa-banner-cta" onClick={handleInstall}>
          {langHi ? 'इंस्टॉल करें' : 'Install'}
        </button>
      )}
      <button className="ho-pwa-banner-close" onClick={dismiss} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}
