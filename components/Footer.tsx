import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #e5e0d8',
      backgroundColor: '#faf9f7',
      padding: '24px 32px',
      marginTop: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#888',
    }}>
      <span>© {new Date().getFullYear()} History Optional — UPSC Mains</span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/contact" style={{ color: '#888', textDecoration: 'none' }}>Contact</Link>
        <Link href="/contact?tab=bug" style={{ color: '#888', textDecoration: 'none' }}>Report a Bug</Link>
      </div>
    </footer>
  );
}
