'use client';
import Link from 'next/link';

export default function AnnouncementBanner() {
  return (
    <div style={{
      backgroundColor: '#c8410b',
      color: '#fff',
      textAlign: 'center',
      padding: '8px 16px',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1200,
    }}>
      <span style={{
        backgroundColor: '#fff',
        color: '#c8410b',
        fontWeight: 700,
        fontSize: '11px',
        padding: '2px 7px',
        borderRadius: '4px',
        letterSpacing: '0.05em',
      }}>LIVE</span>
      <span>UPSC Prelims 2026 — History Questions Decoded</span>
      <Link
        href="/prelims-2026"
        style={{
          backgroundColor: '#fff',
          color: '#c8410b',
          fontWeight: 600,
          fontSize: '12px',
          padding: '3px 12px',
          borderRadius: '4px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        View Now →
      </Link>
    </div>
  );
}
