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
      </div>
    </footer>
  );
}
