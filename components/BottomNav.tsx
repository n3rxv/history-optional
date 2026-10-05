'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n/LangContext';
import { tr, t } from '@/lib/i18n/ui';

/**
 * The tab bar on phones, where most readers are. Five places a thumb reaches
 * without the menu; everything else is in the menu behind the burger.
 */

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const Icons = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M3 10.2 12 3l9 7.2" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></svg>,
  notes: <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M4 4.5C4 3.7 4.7 3 5.5 3H17l3 3v13.5c0 .8-.7 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>,
  evaluate: <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="m9 11 2.5 2.5L20 5" /><path d="M21 12v6.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4H15" /></svg>,
  chat: <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  you: <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></svg>,
};

export default function BottomNav() {
  const pathname = usePathname();
  const { langHi } = useLang();

  const tabs: Tab[] = [
    { href: '/', label: langHi ? 'होम' : 'Home', icon: Icons.home, match: (p) => p === '/' },
    { href: '/paper1', label: tr(t.notes, langHi), icon: Icons.notes, match: (p) => p.startsWith('/paper1') || p.startsWith('/paper2') || p.startsWith('/notes') },
    { href: '/evaluate', label: tr(t.evaluate, langHi), icon: Icons.evaluate, match: (p) => p.startsWith('/evaluate') },
    { href: '/chat', label: tr(t.chat, langHi), icon: Icons.chat, match: (p) => p.startsWith('/chat') },
    { href: '/dashboard', label: langHi ? 'प्रोफाइल' : 'Profile', icon: Icons.you, match: (p) => p.startsWith('/dashboard') },
  ];

  return (
    <nav className="bn ds" aria-label="Primary">
      <style dangerouslySetInnerHTML={{ __html: BN_CSS }} />
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link key={tab.href} href={tab.href} className={`bn-tab${active ? ' on' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="bn-icon">{tab.icon}</span>
            <span className="bn-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const BN_CSS = `
.bn { display: none; }
@media (max-width: 768px) {
  .bn {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 1300;
    padding: 4px var(--space-2) calc(4px + env(safe-area-inset-bottom, 0px));
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: saturate(1.4) blur(14px); -webkit-backdrop-filter: saturate(1.4) blur(14px);
    border-top: 1px solid var(--border);
  }
  .bn-tab {
    flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    min-height: 54px; color: var(--text3); text-decoration: none; -webkit-tap-highlight-color: transparent;
  }
  .bn-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 30px; border-radius: var(--radius-full); transition: background 0.15s, transform 0.12s; }
  .bn-label { font-family: var(--font-ui); font-size: 0.68rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .bn-tab.on { color: var(--accent-text); }
  .bn-tab.on .bn-icon { background: var(--accent-dim); }
  .bn-tab:active .bn-icon { transform: scale(0.92); }
  .bn-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: var(--radius-md); }
}
@media (prefers-reduced-motion: reduce) { .bn-icon { transition: none; } }
`;
