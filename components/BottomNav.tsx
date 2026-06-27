'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n/LangContext';
import { tr, t } from '@/lib/i18n/ui';

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match: (path: string) => boolean;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
function NotesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5C4 3.7 4.7 3 5.5 3H17l3 3v13.5c0 .8-.7 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-15z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
function EvaluateIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l2.5 2.5L20 5" />
      <path d="M21 12v6.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4H15" />
    </svg>
  );
}
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.07" />
      <path d="M21 3l-9.5 9.5M21 3l-6 1.5M21 3l-1.5 6" />
    </svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { langHi } = useLang();

  const tabs: Tab[] = [
    { href: '/', label: langHi ? 'होम' : 'Home', icon: (a) => <HomeIcon active={a} />, match: (p) => p === '/' },
    { href: '/paper1', label: tr(t.notes, langHi), icon: (a) => <NotesIcon active={a} />, match: (p) => p.startsWith('/paper1') || p.startsWith('/paper2') || p.startsWith('/notes') },
    { href: '/evaluate', label: tr(t.evaluate, langHi), icon: (a) => <EvaluateIcon active={a} />, match: (p) => p.startsWith('/evaluate') },
    { href: '/chat', label: tr(t.chat, langHi), icon: (a) => <ChatIcon active={a} />, match: (p) => p.startsWith('/chat') },
    { href: '/dashboard', label: langHi ? 'प्रोफाइल' : 'Profile', icon: (a) => <ProfileIcon active={a} />, match: (p) => p.startsWith('/dashboard') },
  ];

  return (
    <nav className="ho-bottom-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`ho-bottom-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="ho-bottom-nav-icon">{tab.icon(active)}</span>
            <span className="ho-bottom-nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
