'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawNext = searchParams.get('next') ?? '/';
    const next = rawNext.startsWith('/') ? rawNext : '/';
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(next);
      } else {
        supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
          router.replace(error ? '/auth/error' : next);
        });
      }
    });
  }, [router, searchParams]);

  return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text1)' }}>Signing you in…</p>;
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={<p style={{ padding: 40, textAlign: 'center' }}>Loading…</p>}>
      <CallbackHandler />
    </Suspense>
  );
}
