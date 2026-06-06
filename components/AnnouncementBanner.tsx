'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);

  const hide = () => {
    setVisible(false);
  };

  if (!visible) return null;

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
      <button
        onClick={hide}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          opacity: 0.8,
          position: 'absolute',
          right: '12px',
        }}
        aria-label="Close banner"
      >
        ×
      </button>
    </div>
  );
}
