'use client';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import { useLang } from '@/lib/i18n/LangContext';

/** The 404: the owl, still searching with its glass, and the ways back in. */
export default function NotFoundBody() {
  const { langHi } = useLang();
  const links = [
    { href: '/paper1', label: langHi ? 'नोट्स' : 'Notes' },
    { href: '/pyqs', label: 'PYQs' },
    { href: '/chat', label: langHi ? 'AI चैट' : 'AI Chat' },
    { href: '/evaluate', label: langHi ? 'उत्तर मूल्यांकन' : 'Evaluate an answer' },
  ];
  return (
    <main className="nf">
      <style>{NF_CSS}</style>
      <Mascot pose="peek" width={170} className="nf-owl" preload />
      <div className="nf-code">404</div>
      <h1>{langHi ? 'यह पन्ना पाठ्यक्रम में नहीं है' : "This page isn't in the syllabus"}</h1>
      <p>
        {langHi
          ? 'हमने हर पेपर में ढूँढा, पर यह पन्ना नहीं मिला। शायद यह हट गया है, या लिंक में कोई गलती है।'
          : 'We searched every paper and could not find it. It may have moved, or the link may have a typo in it.'}
      </p>
      <Link href="/" className="nf-home">{langHi ? 'होम पर जाएँ' : 'Back to the home page'}</Link>
      <div className="nf-links">
        <span>{langHi ? 'या सीधे जाएँ:' : 'Or go straight to'}</span>
        {links.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
      </div>
    </main>
  );
}

const NF_CSS = `
.nf { min-height: calc(100vh - 200px); max-width: 620px; margin: 0 auto; padding: var(--space-10) var(--space-5) var(--space-12);
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.nf-owl { height: auto; margin-bottom: var(--space-4); }
.nf-code { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.3em; color: var(--accent-text); margin-bottom: var(--space-2); }
.nf h1 { font-family: var(--font-body); font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 700; line-height: 1.25; margin: 0 0 var(--space-3); color: var(--text); }
.nf p { font-size: 1rem; line-height: 1.7; color: var(--text2); margin: 0 0 var(--space-6); }
.nf-home { display: inline-flex; align-items: center; padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
  background: var(--accent); color: var(--accent-on); font-weight: 600; text-decoration: none; }
.nf-home:hover { background: color-mix(in srgb, var(--accent) 88%, var(--text)); }
.nf-links { margin-top: var(--space-6); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); font-size: 0.88rem; color: var(--text3); }
.nf-links a { padding: var(--space-1) var(--space-3); border: 1px solid var(--border2); border-radius: var(--radius-pill); color: var(--text2); text-decoration: none; }
.nf-links a:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent-text); }
`;
