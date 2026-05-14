'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function PrelimsLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.4 + 0.1 });
    }
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.opacity})`; ctx.fill();
      });
      particles.forEach((a, i) => { particles.slice(i+1).forEach(b => { const dist = Math.hypot(a.x - b.x, a.y - b.y); if (dist < 120) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist/120)})`; ctx.lineWidth = 0.5; ctx.stroke(); } }); });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const features = [
    { icon: '💡', label: 'Solution Breakdown',   desc: 'Step-by-step reasoning for every answer'         },
    { icon: '⚙️', label: 'Technique Detection',  desc: 'LINCHPIN · ODD-ONE-OUT · PAIR ELIMINATION'       },
    { icon: '🧠', label: 'Smart Guess Strategy', desc: "Reason your way when you don't know the answer"  },
    { icon: '📌', label: 'Concept Mapping',      desc: 'Minimum knowledge needed — nothing more'          },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, width: '100%', textAlign: 'center' }}>

        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, padding: '0.35rem 1rem', marginBottom: '2.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b82f6' }}>History Optional · Prelims</span>
        </div>

        {/* Main heading — editorial style, smaller, tighter */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>Smart MCQ Practice</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0 }}>
            Master the art of intelligent<br />
            <span style={{ color: '#3b82f6' }}>elimination & reasoning</span> —<br />
            even when you're unsure.
          </h1>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.88rem', lineHeight: 1.8, margin: '1.25rem auto 2.5rem', maxWidth: 440 }}>
          Every question comes with a full breakdown of how a sharp aspirant thinks through it — technique, smart guess, and concept map.
        </p>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '2.5rem', textAlign: 'left' }}>
          {features.map(f => (
            <div key={f.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.9rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', marginTop: 1 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.2rem' }}>{f.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
          <Link href="/prelims/practice" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', padding: '0.85rem 2.25rem', borderRadius: 9, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.02em', boxShadow: '0 0 28px rgba(59,130,246,0.28)' }}>
            Begin Practice →
          </Link>
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)' }}>no login required</span>
        </div>

      </div>
    </div>
  );
}
