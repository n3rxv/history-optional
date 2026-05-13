'use client';
import Link from 'next/link';

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
      <span>© {new Date().getFullYear()} www.historyoptional.xyz</span>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link href="/contact" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Contact</Link>
        <Link href="/contact?tab=bug" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>Report a Bug</Link>
        <a href="https://t.me/historyoptionalxyz" target="_blank" rel="noopener noreferrer" title="Join Telegram" style={{ color: '#888', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#2CA5E0')} onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
          </svg>
        </a>
      </div>
    </footer>
  );
}
