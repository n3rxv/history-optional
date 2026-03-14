'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get('next') ?? '/';
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(next);
      } else {
        // Exchange code for session (PKCE handles this automatically)
        supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
          if (error) {
            router.replace('/auth/error');
          } else {
            router.replace(next);
          }
        });
      }
    });
  }, [router, searchParams]);

  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text1)' }}>
      <p>Signing you in…</p>
    </div>
  );
}
