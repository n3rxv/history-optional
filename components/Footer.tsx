'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import owlArt from '@/public/mascot/owl.svg';
import Link from '@/components/Link';
import { usePathname } from 'next/navigation';
import { TELEGRAM_URL } from '@/lib/contact';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * The site footer, rendered once by the frontend layout.
 *
 * It publishes its own height as --footer-h, for pages that size a shell to
 * the viewport and have to subtract it. On a phone it is hidden under the
 * chat, which fills the screen and has the bottom bar beneath it.
 */
export default function Footer() {
  const pathname = usePathname();
  const { langHi } = useLang();
  const ref = useRef<HTMLElement>(null);
  const isChat = pathname === '/chat';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--footer-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <footer className={`ft ds site-footer${isChat ? ' site-footer--chat' : ''}`} ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_CSS }} />
      <div className="ft-inner">
        <a href="https://distilledcrux.com" target="_blank" rel="noopener" className="ft-brand" aria-label={langHi ? 'Distilled Crux, distilledcrux.com खुलेगा' : 'Distilled Crux, opens distilledcrux.com'}>
          <Image src={owlArt} alt="" width={26} height={25} />
          <span>Distilled Crux</span>
        </a>

        <nav className="ft-links" aria-label={langHi ? 'फ़ुटर' : 'Footer'}>
          <Link href="/pricing">{langHi ? 'क़ीमतें' : 'Pricing'}</Link>
          <Link href="/contact">{langHi ? 'संपर्क' : 'Contact'}</Link>
          <Link href="/privacy">{langHi ? 'गोपनीयता' : 'Privacy'}</Link>
          <Link href="/terms">{langHi ? 'शर्तें' : 'Terms'}</Link>
          <Link href="/refund">{langHi ? 'रिफ़ंड' : 'Refund'}</Link>
        </nav>

        <div className="ft-end">
          <a className="ft-tg" href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
            </svg>
            Telegram
          </a>
        </div>
      </div>
      <p className="ft-copy">
        © {new Date().getFullYear()} historyoptional.xyz · {langHi ? (
          <><a href="https://distilledcrux.com" target="_blank" rel="noopener">DistilledCrux.com</a> का एक उत्पाद</>
        ) : (
          <>A product of{' '}<a href="https://distilledcrux.com" target="_blank" rel="noopener">DistilledCrux.com</a></>
        )}
      </p>
    </footer>
  );
}

const FOOTER_CSS = `
.ft { border-top: 1px solid var(--border); background: var(--bg); }
.ft-inner {
  max-width: 1200px; margin: 0 auto; padding: var(--space-5) var(--space-6) var(--space-3);
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--space-4);
}
.ft-brand { display: inline-flex; align-items: center; gap: var(--space-2); justify-self: start; color: var(--text); text-decoration: none; font-weight: 800; font-size: 0.95rem; letter-spacing: -0.01em; }
.ft-links { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-1) var(--space-5); }
.ft-links a { color: var(--text2); text-decoration: none; font-size: 0.88rem; transition: color 0.15s; }
.ft-links a:hover { color: var(--accent-text); }
.ft-end { justify-self: end; }
.ft-tg {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 var(--space-3);
  border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card);
  color: var(--text2); text-decoration: none; font-size: 0.86rem; transition: border-color 0.15s, color 0.15s;
}
.ft-tg:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent-text); }
.ft-copy { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-6) var(--space-5); font-family: var(--font-ui); font-size: 0.78rem; color: var(--text3); text-align: center; }
.ft-copy a { color: var(--text2); text-decoration: underline; text-decoration-color: var(--border3); text-underline-offset: 3px; }
.ft-copy a:hover { color: var(--accent-text); text-decoration-color: currentColor; }
@media (max-width: 860px) {
  .ft-inner { grid-template-columns: 1fr; justify-items: center; text-align: center; padding: var(--space-6) var(--space-4) var(--space-3); }
  .ft-brand, .ft-end { justify-self: center; }
  .ft-links { gap: var(--space-3) var(--space-5); }
  .ft-links a { padding: 4px 0; }
}
`;
