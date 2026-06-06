'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(400%) skewX(-12deg); }
        }
        .banner-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmer 2.5s infinite;
        }
      `}</style>
      <div
        className="banner-shimmer"
        style={{
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
          overflow: 'hidden',
        }}
      >
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
          onClick={() => setVisible(false)}
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
    </>
  );
}
