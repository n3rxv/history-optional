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

    const registerDevice = async (session: any) => {
      const deviceInfo = `${navigator.platform} — ${navigator.userAgent.slice(0, 80)}`;
      console.log('[device] registering session for', session.user.id);
      try {
        const res = await fetch('/api/device-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: session.user.id,
            session_id: session.access_token.slice(-32),
            device_info: deviceInfo,
            user_name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null,
            user_email: session.user.email ?? null,
          }),
        });
        const json = await res.json();
        console.log('[device] response:', json);
      } catch (e) {
        console.error('[device] fetch error:', e);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await registerDevice(session);
        router.replace(next);
      } else {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!error && data.session) {
          await registerDevice(data.session);
        }
        router.replace(error ? '/auth/error' : next);
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
