'use client';
import { useEffect, useState } from 'react';
import { SubscribeCard } from '@/components/SubscribeCard';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'promo_popup_shown';

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [slots, setSlots] = useState(0);

  useEffect(() => {
    // Fetch real early-bird slot count so SubscribeCard shows the correct
    // plans (all four when slots > 0, yearly-only when sold out) and the
    // correct "X slots left" badge — not a guessed number.
    fetch('/api/slots')
      .then(res => res.json())
      .then(data => {
        if (typeof data.slots === 'number') setSlots(data.slots);
      })
      .catch(() => {
        // Leave slots at 0 (yearly-only) rather than guessing a number
        // that might overstate availability.
      });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Only logged-out visitors can see this — on this site, being logged in
    // means being subscribed, so any active session hides the popup entirely.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return; // logged in → subscribed → never show

      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
      timer = setTimeout(() => setVisible(true), 1200);
    });

    // If someone logs in while the popup is already showing (or about to),
    // close it immediately rather than leaving it up for a now-subscribed user.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (timer) clearTimeout(timer);
        setVisible(false);
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!visible) return null;

  const close = () => {
    setVisible(false);
    setShowSubscribe(false);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeInOverlay 0.25s ease',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpCard { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .promo-card { animation: slideUpCard 0.3s ease; }
        .promo-close-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .promo-subscribe-btn:hover { background: #1d4ed8 !important; }
        .promo-feature-row:hover { background: rgba(255,255,255,0.02) !important; }

        /* Mobile-first: stacked, matches the original vertical layout */
        .promo-card {
          max-width: 520px;
        }
        .promo-columns {
          display: flex;
          flex-direction: column;
        }
        .promo-col-left {
          flex: none;
        }
        .promo-col-right {
          flex: none;
        }
        .promo-divider {
          height: 1px;
          background: #161616;
          margin: 0 1.75rem;
        }

        /* Desktop: side-by-side columns, no scroll needed */
        @media (min-width: 900px) {
          .promo-card {
            max-width: 900px;
            max-height: 88vh;
          }
          .promo-columns {
            flex-direction: row;
            align-items: stretch;
          }
          .promo-col-left {
            flex: 0 0 340px;
            border-right: 0.5px solid #161616;
          }
          .promo-col-right {
            flex: 1 1 auto;
            min-width: 0;
            overflow-y: auto;
            scrollbar-width: none;
            max-height: 88vh;
          }
          .promo-divider {
            display: none;
          }
        }
      `}</style>

      <div
        className="promo-card"
        style={{
          background: '#0a0a0a',
          border: '0.5px solid #1f1f1f',
          borderRadius: 18,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          position: 'relative',
        }}
      >
        <button
          className="promo-close-btn"
          onClick={close}
          style={{
            position: 'absolute', top: '1rem', right: '1rem', zIndex: 1,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          aria-label="Close"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1l-9 9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="promo-columns">
          {/* Left column — header, heading, testimonial */}
          <div className="promo-col-left">
            <div style={{ padding: '1.75rem 1.75rem 1.4rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(59,130,246,0.12)',
                border: '0.5px solid rgba(59,130,246,0.25)',
                borderRadius: 20, padding: '3px 12px', marginBottom: '0.9rem',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#60a5fa"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span style={{ fontSize: 10, fontWeight: 500, color: '#60a5fa', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Go Premium</span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#f0f0f0', margin: '0 0 0.35rem', lineHeight: 1.3 }}>
                Start serious.<br />Start early.
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                Every day without the right tool is a day wasted.
              </p>

              {/* Testimonial screenshot */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: '1.1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonial.png"
                  alt="Real aspirant testimonial"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>

              {/* Pricing + CTA, or the actual subscribe flow once triggered */}
              {showSubscribe ? (
                <SubscribeCard
                  slots={slots}
                  fingerprint={null}
                  onSuccess={close}
                  onClose={() => setShowSubscribe(false)}
                />
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#111', border: '0.5px solid #1f1f1f',
                    borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.9rem',
                  }}>
                    <div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>Starting at</p>
                      <p style={{ fontSize: 19, fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
                        {"\u20B949"} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/day</span>
                      </p>
                    </div>
                    <div style={{ width: 1, height: 32, background: '#1f1f1f' }} />
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>Best value</p>
                      <p style={{ fontSize: 19, fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
                        {"\u20B95,999"} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/year</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSubscribe(true)}
                    className="promo-subscribe-btn"
                    style={{
                      display: 'block', width: '100%', padding: '0.78rem',
                      background: '#2563eb', border: 'none', borderRadius: 9,
                      fontSize: 14, fontWeight: 600, color: '#fff',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'background 0.15s',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Subscribe now {"\u2192"}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '0.6rem 0 0' }}>
                    Secure payment via Razorpay {"\u00B7"} Cancel anytime
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="promo-divider" />

          {/* Right column — features */}
          <div className="promo-col-right">
            {/* Features */}
            <div style={{ padding: '1.1rem 1.75rem 0' }}>
              <p style={{
                fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 0.75rem',
              }}>What you unlock</p>

              <div style={{ border: '0.5px solid #1f1f1f', borderRadius: 10, overflow: 'hidden' }}>
                {[
                  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Unlimited answer evaluations', sub: 'Free: 1 total. Premium: no cap, every answer graded.' },
                  { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Unlimited AI chat', sub: 'Free: 3 messages. Premium: ask anything, anytime.' },
                  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Chat with books', sub: 'Ask questions from Upinder Singh, Sekhar Bandhopadhyay, and 23 other books.' },
                  { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Model answers for PYQs', sub: 'AI-generated ideal answers for every previous year question.' },
                  { icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', label: 'Map evaluation', sub: 'Upload your map attempts and get instant AI feedback.' },
                  { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Full-length paper evaluation', sub: 'Upload an entire answer sheet PDF for complete analysis.' },
                  { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'PDF upload and chat', sub: 'Upload any PDF - notes, handouts, articles - and chat with it.' },
                  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'Brainstorm mode', sub: 'Generate arguments, dimensions, and essay structures for any topic.' },
                ].map((f, i, arr) => (
                  <div
                    key={i}
                    className="promo-feature-row"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '0.75rem 1rem',
                      borderBottom: i < arr.length - 1 ? '0.5px solid #1a1a1a' : 'none',
                      transition: 'background 0.12s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d={f.icon} />
                    </svg>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0', margin: '0 0 2px' }}>{f.label}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
