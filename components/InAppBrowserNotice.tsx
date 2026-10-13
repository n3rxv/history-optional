'use client';
import { useEffect, useState } from 'react';
import { IN_APP_BROWSER_EVENT, isAndroid } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * Shown when a reader tries to sign in from the browser built into Telegram,
 * WhatsApp or another app, where Google refuses to sign anyone in. It says why
 * and how to open the site in a real browser: one tap into Chrome on Android,
 * the Safari steps on iPhone, and a copy-link fallback for both.
 */
export default function InAppBrowserNotice() {
  const { langHi: hi } = useLang();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const show = () => { setCopied(false); setOpen(true); };
    window.addEventListener(IN_APP_BROWSER_EVENT, show);
    return () => window.removeEventListener(IN_APP_BROWSER_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const android = isAndroid();
  const url = new URL(window.location.href);
  // Asks Android to open this page in Chrome, or the default browser without it.
  const chrome = `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.href)};end`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url.href); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <div className="ds ds-overlay iab-overlay" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <style>{CSS}</style>
      <div className="ds-modal iab" role="dialog" aria-modal="true" aria-labelledby="iab-title">
        <div className="ds-modal-head">
          <div>
            <h2 id="iab-title">
              {hi
                ? `साइन इन के लिए यह पेज ${android ? 'Chrome' : 'Safari या Chrome'} में खोलें`
                : `Open this page in ${android ? 'Chrome' : 'Safari or Chrome'} to sign in`}
            </h2>
            <p>
              {hi
                ? 'Google, Telegram, WhatsApp और दूसरे ऐप्स के अंदर बने ब्राउज़र में साइन इन की अनुमति नहीं देता।'
                : 'Google doesn’t allow signing in inside the browser built into Telegram, WhatsApp and other apps.'}
            </p>
          </div>
          <button type="button" className="ds-x" onClick={() => setOpen(false)} aria-label={hi ? 'बंद करें' : 'Close'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {android ? (
          <a className="ds-btn ds-btn-solid iab-go" href={chrome}>{hi ? 'Chrome में खोलें' : 'Open in Chrome'}</a>
        ) : (
          <p className="iab-steps">
            {hi
              ? <>स्क्रीन के ऊपर या नीचे <b>⋯</b> या शेयर बटन दबाएँ, फिर <b>Open in Safari</b> या <b>Open in browser</b> चुनें।</>
              : <>Tap the <b>⋯</b> or share button at the top or bottom of this screen, then choose <b>Open in Safari</b> or <b>Open in browser</b>.</>}
          </p>
        )}
        <button type="button" className="iab-copy" onClick={copy}>
          {copied
            ? (hi ? 'लिंक कॉपी हो गया, इसे अपने ब्राउज़र में पेस्ट करें' : 'Link copied, paste it in your browser')
            : (hi ? 'इसकी जगह लिंक कॉपी करें' : 'Copy the link instead')}
        </button>
      </div>
    </div>
  );
}

const CSS = `
.iab-overlay { z-index: 100001; }
.iab { max-width: 440px; display: flex; flex-direction: column; gap: var(--space-4); }
.iab-go { align-self: stretch; justify-content: center; min-height: 48px; text-decoration: none; }
.iab-steps { margin: 0; color: var(--text2); line-height: 1.6; }
.iab-copy { align-self: center; background: none; border: none; padding: 0; font: inherit; font-weight: 700; color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
`;
