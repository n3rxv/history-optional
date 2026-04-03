'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Visiting this page signs the current user out and redirects to home.
// Share the URL with users, or redirect everyone to it via middleware.
export default function SignOutPage() {
  useEffect(() => {
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
  }, []);

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid #333', borderTopColor: '#3b82f6',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#555', letterSpacing: '0.1em' }}>
        Signing you out…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
