'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import TopperPdf, { type TopperCopyDetail } from '@/components/TopperPdf';
import TopperLocked from '@/components/TopperLocked';

export default function TopperCopyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copy, setCopy] = useState<TopperCopyDetail | null>(null);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);

  // Decides between the paywall and the copy before any PDF is asked for.
  // Opening the copy is what spends a free view, and the server does that
  // when TopperPdf fetches it; nothing here counts.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      unsub(); // only need first emission
      if (!currentUser) {
        setAccessAllowed(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/topper-access', {
        headers: { 'x-user-token': token },
      });
      const data = await res.json();
      setAccessAllowed(data.access === true);
    });
  }, []);

  if (accessAllowed === null) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
      Checking access…
    </div>
  );

  if (accessAllowed === false) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <TopperLocked
        onUnlocked={() => { setAccessAllowed(true); router.refresh(); }}
        onDismiss={() => router.back()}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-8) var(--space-6) var(--space-12)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: 'var(--space-1) var(--space-4)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}
        >&#8592; Back</button>
      </div>

      {copy && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: 'var(--space-2)',
          }}>
            &#127942; Topper Copy
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.4rem',
            fontWeight: 700, color: 'var(--text)', lineHeight: 1.5,
            marginBottom: 'var(--space-3)',
          }}>
            {copy.question}
          </h1>
          {copy.note && (
            <div style={{
              background: 'var(--accent-dim)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)',
              color: 'var(--text2)', fontSize: '0.85rem',
              display: 'inline-block', marginTop: 'var(--space-1)',
            }}>
              &#128221; {copy.note}
            </div>
          )}
        </div>
      )}

      <TopperPdf key={id} copyId={id} height="80vh" onLoad={setCopy} onDenied={() => setAccessAllowed(false)} />

      {copy && (
        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <Link href="/pyqs?topper=1" style={{
            color: 'var(--text3)', fontSize: '0.8rem',
            textDecoration: 'none', fontFamily: 'var(--font-mono)',
          }}>&#8592; Browse Topper Copies</Link>
        </div>
      )}
    </div>
  );
}
