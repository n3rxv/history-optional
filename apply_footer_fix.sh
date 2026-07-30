#!/usr/bin/env bash
set -e

REPO="${1:-.}"
cd "$REPO"

echo "==> Writing components/Footer.tsx"
python3 - << 'PYEOF'
content = r"""'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkStyle = {
  color: 'var(--text3)',
  textDecoration: 'none' as const,
};

const hoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = 'var(--accent)';
};
const hoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = 'var(--text3)';
};

export default function Footer() {
  const pathname = usePathname();
  const isChat = pathname === '/chat';

  return (
    <footer
      className={isChat ? 'site-footer site-footer--chat' : 'site-footer'}
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: 'var(--text3)',
      }}
    >
      <span>© {new Date().getFullYear()} historyoptional.xyz</span>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/contact" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Contact</Link>
        <Link href="/privacy" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Privacy Policy</Link>
        <Link href="/terms" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Terms</Link>
        <Link href="/refund" style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Refund Policy</Link>
        <a
          href="https://t.me/historyoptionalxyz"
          target="_blank"
          rel="noopener noreferrer"
          title="Join Telegram"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'rgba(44,165,224,0.08)',
            border: '1px solid rgba(44,165,224,0.2)',
            color: '#2CA5E0', textDecoration: 'none',
            fontSize: '11px', fontWeight: 600,
            letterSpacing: '0.03em', transition: 'all 0.18s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(44,165,224,0.18)';
            el.style.borderColor = 'rgba(44,165,224,0.6)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(44,165,224,0.08)';
            el.style.borderColor = 'rgba(44,165,224,0.2)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
          </svg>
          Join Telegram
        </a>
      </div>
    </footer>
  );
}
"""
with open("components/Footer.tsx", "w") as f:
    f.write(content)
print("  done.")
PYEOF

echo "==> Appending to app/globals.css"
python3 - << 'PYEOF'
css_snippet = """

/* ── Hide footer on /chat page for mobile ── */
@media (max-width: 768px) {
  .site-footer--chat {
    display: none !important;
  }
}
"""
# Only append if not already present
with open("app/globals.css", "r") as f:
    existing = f.read()

if "site-footer--chat" in existing:
    print("  already patched, skipping.")
else:
    with open("app/globals.css", "a") as f:
        f.write(css_snippet)
    print("  done.")
PYEOF

echo "==> Git commit"
git add components/Footer.tsx app/globals.css
git commit -m "fix: hide footer on /chat page for mobile (≤768px)"

echo ""
echo "✅ Done! Run: git push"
