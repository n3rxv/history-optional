'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PhoneModal } from '@/components/PhoneModal';
import { SubscribeCard } from '@/components/SubscribeCard';

const FREE_LIMIT = 1;

interface UsageState {
  loading:    boolean;
  allowed:    boolean;
  used:       number;
  limit:      number;
  subscribed: boolean;
  owner:      boolean;
  noPhone:    boolean;
  token:      string | null;
}

function PaywallModal({
  token, mode, limit, slots, onClose, onSuccess,
}: {
  token:     string | null;
  mode:      'unauthenticated' | 'limit_reached';
  limit:     number;
  slots:     number;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={onClose}
    >
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:420, width:'100%', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom:20 }}>
          {mode === 'unauthenticated' ? (
            <>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'#3b82f6', marginBottom:10 }}>Sign in required</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'#f0f0f0', marginBottom:8 }}>Evaluate Your Answers</div>
              <div style={{ color:'#888', fontSize:'0.88rem', lineHeight:1.65 }}>
                Sign in with Google to evaluate up to <span style={{ color:'#f0f0f0' }}>{limit} answer/week</span> for free, or subscribe for unlimited access.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'#f87171', marginBottom:10 }}>Free limit reached</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'#f0f0f0', marginBottom:8 }}>Unlock Unlimited Evaluations</div>
              <div style={{ color:'#888', fontSize:'0.88rem', lineHeight:1.65 }}>
                You've used your <span style={{ color:'#f0f0f0' }}>{limit} free evaluation</span>. Subscribe to unlock unlimited evaluations.
              </div>
            </>
          )}
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', marginBottom:20 }} />
        <SubscribeCard
          slots={slots}
          fingerprint={null}
          onSuccess={() => { onClose(); onSuccess(); }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export function useSubscriptionGate(onAllowed: () => void) {
  const onAllowedRef = useRef(onAllowed);
  useEffect(() => { onAllowedRef.current = onAllowed; }, [onAllowed]);
  const [state, setState] = useState<UsageState>({
    loading:true, allowed:false, used:0, limit:FREE_LIMIT, subscribed:false, owner:false, noPhone:false, token:null,
  });
  const [modal, setModal] = useState<'none'|'phone'|'unauthenticated'|'limit_reached'>('none');
  const [slots, setSlots] = useState(45);

  useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading:true }));
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) { setState({ loading:false, allowed:false, used:0, limit:FREE_LIMIT, subscribed:false, owner:false, noPhone:false, token:null }); return; }
    const res  = await fetch('/api/eval-usage', { headers: { 'x-user-token': token } });
    const data = await res.json();
    setState({
      loading:false, token,
      allowed:    data.allowed    ?? false,
      used:       data.used       ?? 0,
      limit:      data.limit === Infinity ? Infinity : (data.limit ?? FREE_LIMIT),
      subscribed: data.subscribed ?? false,
      owner:      data.owner      ?? false,
      noPhone:    data.reason === 'no_phone',
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const increment = useCallback(async (token: string) => {
    await fetch('/api/eval-usage', { method:'POST', headers: { 'x-user-token': token } });
    refresh();
  }, [refresh]);

  const handleEvaluate = useCallback(() => {
    if (state.loading) return;
    if (!state.token)   { setModal('unauthenticated'); return; }
    if (state.noPhone)  { setModal('phone');           return; }
    if (!state.allowed) { setModal('limit_reached');   return; }
    onAllowedRef.current();
  }, [state, onAllowed]);

  const UsagePill = () => {
    if (state.loading || state.owner || state.subscribed || !state.token) return null;
    const remaining = Math.max(0, state.limit - state.used);
    const color = remaining === 0 ? '#f87171' : remaining <= 1 ? '#fbbf24' : '#4ade80';
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:12 }}>
        <div style={{ display:'flex', gap:4 }}>
          {Array.from({ length: state.limit }).map((_, i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < state.used ? '#222' : color, border:`1px solid ${i < state.used ? '#2a2a2a' : color+'66'}`, transition:'all 0.3s' }} />
          ))}
        </div>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color: remaining === 0 ? '#f87171' : '#666', letterSpacing:'0.08em' }}>
          {remaining === 0 ? 'Free limit reached' : `${remaining} free evaluation${remaining === 1 ? '' : 's'} remaining`}
        </span>
      </div>
    );
  };

  const GateModals = () => (
    <>
      {modal === 'phone' && state.token && (
        <PhoneModal token={state.token} onDone={() => { setModal('none'); refresh().then(() => onAllowedRef.current()); }} />
      )}
      {(modal === 'unauthenticated' || modal === 'limit_reached') && (
        <PaywallModal
          token={state.token}
          mode={modal}
          limit={state.limit === Infinity ? FREE_LIMIT : state.limit}
          slots={slots}
          onClose={() => setModal('none')}
          onSuccess={onAllowed}
        />
      )}
    </>
  );

  return { UsagePill, GateModals, handleEvaluate, usage:state, increment };
}
