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
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.opacity})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i+1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist/120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const features = [
    { icon: '💡', label: 'Solution Breakdown',     desc: 'Step-by-step reasoning for every answer'       },
    { icon: '⚙️', label: 'Technique Detection',    desc: 'LINCHPIN · ODD-ONE-OUT · PAIR ELIMINATION'     },
    { icon: '🧠', label: 'Smart Guess Strategy',   desc: 'Reason your way when you don\'t know the answer' },
    { icon: '📌', label: 'Concept Mapping',        desc: 'Minimum knowledge needed — nothing more'        },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Radial glow */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, width: '100%', textAlign: 'center' }}>

        {/* Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, padding: '0.35rem 1rem', marginBottom: '2rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b82f6' }}>History Optional · Prelims</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          Think. Eliminate.<br />
          <span style={{ background: 'linear-gradient(135deg, #3b82f6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Crack Prelims.</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '3rem', maxWidth: 460, margin: '0 auto 3rem' }}>
          Not just answers — the exact reasoning a sharp aspirant uses to navigate uncertainty in the exam hall.
        </p>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2.5rem', textAlign: 'left' }}>
          {features.map(f => (
            <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: 2 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '0.2rem' }}>{f.label}</div>
                <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/prelims/practice" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff', padding: '0.9rem 2.5rem', borderRadius: 10,
            textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
            letterSpacing: '0.02em', boxShadow: '0 0 30px rgba(59,130,246,0.3)',
            transition: 'box-shadow 0.2s ease',
          }}>
            Begin Practice <span style={{ fontSize: '1.1rem' }}>→</span>
          </Link>
          <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>no login required</span>
        </div>
      </div>
    </div>
  );
}
