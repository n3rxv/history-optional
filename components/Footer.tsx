'use client';
import Link from 'next/link';

const linkStyle = {
  color: '#888',
  textDecoration: 'none' as const,
};

const hoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = '#fff';
};
const hoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = '#888';
};

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #1a1a1a',
      backgroundColor: '#050505',
      padding: '20px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#888',
    }}>
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
