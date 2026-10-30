'use client';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import { useLang } from '@/lib/i18n/LangContext';

/** The 404: the owl, still searching with its glass, and the ways back in. */
export default function NotFoundBody() {
  const { langHi } = useLang();
  const links = [
    { href: '/notes', label: langHi ? 'नोट्स' : 'Notes' },
    { href: '/pyqs', label: langHi ? 'पिछले प्रश्न' : 'PYQs' },
    { href: '/chat', label: langHi ? 'AI चैट' : 'AI Chat' },
    { href: '/evaluate', label: langHi ? 'उत्तर जँचवाएँ' : 'Get an answer checked' },
  ];
  return (
    <main className="nf ds">
      <style>{NF_CSS}</style>
      <Mascot pose="peek" width={160} className="nf-owl" preload />
      <h1>{langHi ? 'यह पन्ना पाठ्यक्रम में नहीं है' : 'This page isn’t in the syllabus'}</h1>
      <p>
        {langHi
          ? 'हमने हर पेपर में ढूँढा, पर यह पन्ना नहीं मिला। शायद यह हट गया है, या लिंक में कोई ग़लती है।'
          : 'We searched every paper and couldn’t find it. It may have moved, or the link may have a typo in it.'}
      </p>
      <Link href="/" className="ds-btn ds-btn-solid">{langHi ? 'होम पर जाएँ' : 'Back to the home page'}</Link>
      <div className="nf-links">
        <span>{langHi ? 'या सीधे जाएँ' : 'Or go straight to'}</span>
        {links.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
      </div>
    </main>
  );
}

const NF_CSS = `
.nf { min-height: 70vh; max-width: 640px; margin: 0 auto; padding: var(--space-10) var(--space-5) var(--space-12);
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.nf-owl { height: auto; margin-bottom: var(--space-5); }
.nf h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 var(--space-3); color: var(--text); }
.nf p { font-size: 1.02rem; line-height: 1.7; color: var(--text2); margin: 0 0 var(--space-6); }
.nf-links { margin-top: var(--space-6); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); font-size: 0.9rem; color: var(--text3); }
.nf-links span { width: 100%; margin-bottom: 2px; }
.nf-links a { padding: 6px var(--space-4); border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); text-decoration: none; transition: border-color 0.15s, color 0.15s; }
.nf-links a:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent-text); }
`;
