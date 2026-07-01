'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SubscribeCard } from '@/components/SubscribeCard';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'promo_popup_shown';

const FEATURES = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Unlimited answer evaluations', sub: 'Free: 1 total. Premium: no cap, every answer graded.' },
  { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Unlimited AI chat', sub: 'Free: 3 messages. Premium: ask anything, anytime.' },
  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Chat with books', sub: 'Ask questions from Upinder Singh, Sekhar Bandhopadhyay, and 23 other books.' },
  { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'Model answers for PYQs', sub: 'AI-generated ideal answers for every previous year question.' },
  { icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', label: 'Map evaluation', sub: 'Upload your map attempts and get instant AI feedback.' },
  { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Full-length paper evaluation', sub: 'Upload an entire answer sheet PDF for complete analysis.' },
  { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'PDF upload and chat', sub: 'Upload any PDF - notes, handouts, articles - and chat with it.' },
  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'Brainstorm mode', sub: 'Generate arguments, dimensions, and essay structures for any topic.' },
];

const COACHING_PROBLEMS = [
  { icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'No evaluation on time — answers pile up for weeks' },
  { icon: 'M16 17l5-5-5-5M21 12H9m4 9H5a2 2 0 01-2-2V5a2 2 0 012-2h8', text: 'Mentors leave mid-course, no continuity' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Fixed hours only, not available when you actually study' },
];

const US_ADVANTAGES = [
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: 'Every answer evaluated, always — no backlog' },
  { icon: 'M12 15a4 4 0 004-4V5a4 4 0 00-8 0v6a4 4 0 004 4zm6-4a6 6 0 01-12 0M12 19v3m-3 0h6', text: 'Available 24/7, for anything about your Optional' },
  { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.71-.71M6.34 6.34l-.71-.71m12.02 0l-.71.71M6.34 17.66l-.71.71M12 8a4 4 0 100 8 4 4 0 000-8z', text: 'Never leaves mid-course. It doesn\u2019t sleep.' },
];

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [slots, setSlots] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const comparisonMeasureRef = useRef<HTMLDivElement>(null);

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
    // Loop: features shown for 5s, then the coaching-cost comparison for 6s,
    // repeating for as long as the popup stays mounted. Runs independently
    // of `visible` so that by the time the entrance timer fires and the
    // popup actually appears, it's always on the "features" state first —
    // not a random mid-cycle point.
    const FEATURES_MS = 10000;
    const COMPARISON_MS = 10000;
    let toggleTimer: ReturnType<typeof setTimeout>;

    const cycle = (showingComparison: boolean) => {
      setShowComparison(showingComparison);
      toggleTimer = setTimeout(
        () => cycle(!showingComparison),
        showingComparison ? COMPARISON_MS : FEATURES_MS
      );
    };
    cycle(false);

    return () => clearTimeout(toggleTimer);
  }, []);

  useEffect(() => {
    // Mobile-only loop: 8 individual feature slides (one at a time), then
    // the comparison card, then the pricing box — then repeats. This is a
    // separate state/timer from the desktop showComparison loop above,
    // because mobile shows one slide at a time (10 total) while desktop
    // only ever toggles between two (features-list vs comparison).
    // Paused entirely while showSubscribe is true, so the loop doesn't
    // keep advancing underneath the user while they're mid sign-in/payment.
    if (showSubscribe) return;

    const FEATURE_SLIDE_MS = 3000;
    const COMPARISON_SLIDE_MS = 8000;
    const PRICING_SLIDE_MS = 6000;
    const TOTAL_SLIDES = 10; // 8 features + 1 comparison + 1 pricing

    const durationFor = (index: number) => {
      if (index === 8) return COMPARISON_SLIDE_MS;
      if (index === 9) return PRICING_SLIDE_MS;
      return FEATURE_SLIDE_MS;
    };

    let slideTimer: ReturnType<typeof setTimeout>;
    const advance = (index: number) => {
      setMobileSlideIndex(index);
      slideTimer = setTimeout(() => advance((index + 1) % TOTAL_SLIDES), durationFor(index));
    };
    advance(0);

    return () => clearTimeout(slideTimer);
  }, [showSubscribe]);

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
        @keyframes mobileSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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

        /* Mobile (<900px) gets its own dedicated single-slide-at-a-time
           layout — not the desktop 2-column view collapsed into a stack.
           Toggling between the two views is done with display, driven by
           the same breakpoint used everywhere else in this file, so the
           two views never both render visibly at once. */
        .promo-desktop-view {
          display: none;
        }
        .promo-mobile-view {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 900px) {
          .promo-desktop-view {
            display: flex;
          }
          .promo-mobile-view {
            display: none;
          }
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

        <div className="promo-columns promo-desktop-view">
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
                  className="promo-testimonial"
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

          {/* Right column — features, looping with an animated coaching-cost comparison */}
          <div className="promo-col-right">
            <div style={{ padding: '1.1rem 1.75rem 0' }}>
              <style>{`
                @keyframes glowDrift {
                  0%   { background-position: 0% 30%; }
                  50%  { background-position: 100% 70%; }
                  100% { background-position: 0% 30%; }
                }
                @keyframes rowRise {
                  from { opacity: 0; transform: translateY(10px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes cardExitFeatures {
                  from { opacity: 1; transform: scale(1); filter: blur(0px); }
                  to   { opacity: 0; transform: scale(0.96); filter: blur(3px); }
                }
                @keyframes cardEnterComparison {
                  from { opacity: 0; transform: scale(0.96); filter: blur(3px); }
                  to   { opacity: 1; transform: scale(1); filter: blur(0px); }
                }
                @keyframes cardExitComparison {
                  from { opacity: 1; transform: scale(1); filter: blur(0px); }
                  to   { opacity: 0; transform: scale(0.96); filter: blur(3px); }
                }
                @keyframes cardEnterFeatures {
                  from { opacity: 0; transform: scale(0.96); filter: blur(3px); }
                  to   { opacity: 1; transform: scale(1); filter: blur(0px); }
                }
                .promo-glow-red {
                  background: radial-gradient(circle at center, rgba(248,113,113,0.22), transparent 65%);
                  background-size: 180% 180%;
                  animation: glowDrift 6s ease-in-out infinite;
                }
                .promo-glow-blue {
                  background: radial-gradient(circle at center, rgba(59,130,246,0.24), transparent 65%);
                  background-size: 180% 180%;
                  animation: glowDrift 7s ease-in-out infinite;
                }
                .promo-row-anim {
                  opacity: 0;
                  animation: rowRise 0.45s ease forwards;
                }
              `}</style>

              {/* Fixed-height wrapper: both states overlap here so the card
                  transition doesn't reflow the column height as it swaps. */}
              <div style={{ position: 'relative', minHeight: 420 }}>

                {/* State 1: feature list */}
                <div
                  key={showComparison ? 'features-exit' : 'features-enter'}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    animation: `${showComparison ? 'cardExitFeatures' : 'cardEnterFeatures'} 0.5s ease forwards`,
                    pointerEvents: showComparison ? 'none' : 'auto',
                  }}
                >
                  <p style={{
                    fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 0.75rem',
                  }}>What you unlock</p>

                  <div style={{ border: '0.5px solid #1f1f1f', borderRadius: 10, overflow: 'hidden' }}>
                    {FEATURES.map((f, i, arr) => (
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

                {/* State 2: animated coaching-cost comparison */}
                <div
                  key={showComparison ? 'comparison-enter' : 'comparison-exit'}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    animation: `${showComparison ? 'cardEnterComparison' : 'cardExitComparison'} 0.5s ease forwards`,
                    pointerEvents: showComparison ? 'auto' : 'none',
                  }}
                >
                  <p style={{
                    fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 0.75rem',
                  }}>The real comparison</p>

                  {/* Coaching institutes — red glow card */}
                  <div
                    className="promo-glow-red"
                    style={{
                      position: 'relative', border: '0.5px solid rgba(248,113,113,0.3)',
                      borderRadius: 12, padding: '1.1rem', marginBottom: '0.85rem',
                      overflow: 'hidden',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#f87171', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 0.7rem', position: 'relative' }}>
                      Coaching institutes
                    </p>
                    <p className={showComparison ? 'promo-row-anim' : ''} style={{ animationDelay: '0.05s', fontSize: 22, fontWeight: 700, color: '#f87171', margin: '0 0 0.7rem', position: 'relative' }}>
                      <CountUp target={60000} prefix="₹" active={showComparison} durationMs={900} /> <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>per course</span>
                    </p>
                    {COACHING_PROBLEMS.map((row, i) => (
                      <div
                        key={i}
                        className={showComparison ? 'promo-row-anim' : ''}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 9,
                          marginBottom: i < 2 ? 9 : 0, position: 'relative',
                          animationDelay: showComparison ? `${0.15 + i * 0.09}s` : undefined,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d={row.icon} />
                        </svg>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{row.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* History Optional — blue glow card */}
                  <div
                    className="promo-glow-blue"
                    style={{
                      position: 'relative', border: '0.5px solid rgba(59,130,246,0.4)',
                      borderRadius: 12, padding: '1.1rem', overflow: 'hidden',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 0.7rem', position: 'relative' }}>
                      History Optional
                    </p>
                    <p className={showComparison ? 'promo-row-anim' : ''} style={{ animationDelay: '0.45s', fontSize: 22, fontWeight: 700, color: '#60a5fa', margin: '0 0 0.7rem', position: 'relative' }}>
                      <CountUp target={5999} prefix="₹" active={showComparison} durationMs={700} /> <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/year — 90% cheaper</span>
                    </p>
                    {US_ADVANTAGES.map((row, i) => (
                      <div
                        key={i}
                        className={showComparison ? 'promo-row-anim' : ''}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 9,
                          marginBottom: i < 2 ? 9 : 0, position: 'relative',
                          animationDelay: showComparison ? `${0.55 + i * 0.09}s` : undefined,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d={row.icon} />
                        </svg>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Mobile view: one slide at a time (8 features → comparison →
            pricing, looping), with the header/testimonial static up top
            and "Subscribe now" pinned at the bottom throughout the loop. */}
        <div className="promo-mobile-view">
          <div style={{ padding: '1.5rem 1.5rem 0.9rem', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(59,130,246,0.12)',
              border: '0.5px solid rgba(59,130,246,0.25)',
              borderRadius: 20, padding: '3px 12px', marginBottom: '0.8rem',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#60a5fa"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#60a5fa', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Go Premium</span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', margin: '0 0 0.3rem', lineHeight: 1.3 }}>
              Start serious. Start early.
            </h2>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
              Every day without the right tool is a day wasted.
            </p>
          </div>

          {showSubscribe ? (
            <div style={{ padding: '0 1.5rem 1.5rem', overflowY: 'auto', flex: '1 1 auto' }}>
              <SubscribeCard
                slots={slots}
                fingerprint={null}
                onSuccess={close}
                onClose={() => setShowSubscribe(false)}
              />
            </div>
          ) : (
            <>
              {/* Fixed-height slide zone — exactly one of the 10 slides
                  renders at a time, so the card never needs to scroll. */}
              {/* Hidden measurement clone — lives here (not in a fixed-
                  position outer wrapper) so it inherits the exact same
                  computed width as the real slide-zone. visibility:hidden
                  keeps it out of sight; position:absolute + height:0 on the
                  outer shell means it contributes 0px to the flex column
                  height while still letting scrollHeight report the content's
                  true height via the inner ref. */}
              <div aria-hidden="true" style={{ position: 'relative', visibility: 'hidden', pointerEvents: 'none', height: 0, overflow: 'hidden', padding: '0 1.5rem' }}>
                <div ref={comparisonMeasureRef} style={{ padding: '0 0.25rem' }}>
                  <ComparisonCards active={false} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: comparisonMeasureRef.current?.scrollHeight ?? 0, padding: '0 1.5rem', position: 'relative' }}>
                <MobileSlide index={mobileSlideIndex} />
              </div>

              {/* Static bottom bar — always visible regardless of which
                  slide is showing. */}
              <div style={{ padding: '0.9rem 1.5rem 1.4rem', flexShrink: 0 }}>
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
                <p style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.2)', margin: '0.5rem 0 0' }}>
                  Secure payment via Razorpay {"\u00B7"} Cancel anytime
                </p>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  );
}

function CountUp({ target, prefix = '', durationMs = 800, active }: { target: number; prefix?: string; durationMs?: number; active: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // Ease-out cubic — starts fast, settles gently, feels premium rather
      // than a linear mechanical tick-up.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs]);

  return <>{prefix}{value.toLocaleString('en-IN')}</>;
}

function ComparisonCards({ active }: { active: boolean }) {
  return (
    <>
      <div className="promo-glow-red" style={{
        position: 'relative', border: '0.5px solid rgba(248,113,113,0.3)',
        borderRadius: 12, padding: '0.7rem 0.8rem', marginBottom: '0.5rem', overflow: 'hidden',
      }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: '#f87171', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 0.5rem', position: 'relative' }}>
          Coaching institutes
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#f87171', margin: '0 0 0.5rem', position: 'relative' }}>
          <CountUp target={60000} prefix="₹" active={active} durationMs={900} /> <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>per course</span>
        </p>
        {COACHING_PROBLEMS.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, position: 'relative', marginBottom: i < COACHING_PROBLEMS.length - 1 ? 6 : 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d={row.icon} />
            </svg>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{row.text}</span>
          </div>
        ))}
      </div>

      <div className="promo-glow-blue" style={{
        position: 'relative', border: '0.5px solid rgba(59,130,246,0.4)',
        borderRadius: 12, padding: '0.7rem 0.8rem', overflow: 'hidden',
      }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 0.5rem', position: 'relative' }}>
          History Optional
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa', margin: '0 0 0.5rem', position: 'relative' }}>
          <CountUp target={5999} prefix="₹" active={active} durationMs={700} /> <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/year — 90% cheaper</span>
        </p>
        {US_ADVANTAGES.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, position: 'relative', marginBottom: i < US_ADVANTAGES.length - 1 ? 6 : 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d={row.icon} />
            </svg>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{row.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function MobileSlide({ index }: { index: number }) {
  // index 0-7: one feature at a time. index 8: comparison. index 9: pricing.
  const isFeature = index >= 0 && index <= 7;
  const isComparison = index === 8;
  const isPricing = index === 9;

  return (
    <div
      key={index}
      style={{
        display: 'flex', flexDirection: 'column', flex: '1 1 auto',
        justifyContent: isComparison ? 'flex-start' : 'center',
        animation: 'mobileSlideIn 0.4s ease',
      }}
    >
      {isFeature && (() => {
        const f = FEATURES[index];
        return (
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem',
              background: 'rgba(59,130,246,0.12)', border: '0.5px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', margin: '0 0 0.5rem' }}>{f.label}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{f.sub}</p>
            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', margin: '1rem 0 0', letterSpacing: '0.04em' }}>
              {index + 1} / 8
            </p>
          </div>
        );
      })()}

      {isComparison && (
        <div style={{ padding: '0 0.25rem' }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 0.6rem',
          }}>The real comparison</p>

          <ComparisonCards active={true} />
        </div>
      )}

      {isPricing && (() => {
        const now = new Date();
        const isJulyOffer = now.getFullYear() === 2026 && now.getMonth() === 6;
        return isJulyOffer ? (
          <div style={{ textAlign: 'center', padding: '0 0.25rem' }}>
            {/* July offer badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.35)',
              borderRadius: 20, padding: '3px 10px', marginBottom: '0.7rem',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                🎉 July Offer — Ends Jul 31
              </span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 7 }}>
                <span style={{
                  fontSize: 38, fontWeight: 800, color: '#fbbf24', lineHeight: 1,
                  textShadow: '0 0 28px rgba(251,191,36,0.45)',
                }}>₹2,999</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/year</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>₹5,999</span>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, color: '#4ade80',
                  background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.25)',
                  borderRadius: 10, padding: '1px 6px',
                }}>50% OFF</span>
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              {['Unlimited evals', 'AI Chat 24/7', 'Map eval', 'Model answers'].map(f => (
                <span key={f} style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, padding: '2px 7px',
                }}>{f}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 1.1rem',
            }}>Simple pricing</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>Starting at</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#f0f0f0', margin: 0 }}>
                  {"\u20B9299"} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/week</span>
                </p>
              </div>
              <div style={{ width: 1, background: '#1f1f1f' }} />
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>Best value</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#f0f0f0', margin: 0 }}>
                  {"\u20B95,999"} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/year</span>
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
