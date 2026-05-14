'use client';
import Link from 'next/link';
import { prelimsQuestions } from '@/lib/prelimsData';

export default function PrelimsLanding() {
  const topicCount = Array.from(new Set(prelimsQuestions.map(q => q.topic))).length;
  const pyqCount = prelimsQuestions.filter(q => q.type === 'pyq').length;
  const practiceCount = prelimsQuestions.filter(q => q.type === 'practice').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: 600 }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1rem' }}>UPSC PRELIMS · HISTORY OPTIONAL</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.1 }}>Prelims Practice</h1>
        <p style={{ color: 'var(--text2)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>Smart explanations, guessing techniques, and elimination strategies — built for serious UPSC aspirants.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { value: prelimsQuestions.length, label: 'Total Questions', color: 'var(--accent)' },
          { value: pyqCount,                label: 'PYQs',            color: 'var(--red)'    },
          { value: practiceCount,           label: 'MCQs',        color: 'var(--yellow)' },
          { value: topicCount,              label: 'Topics',          color: 'var(--green)'  },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.25rem 2rem', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: 700, width: '100%', marginBottom: '3rem' }}>
        {[
          { icon: '💡', title: 'Step-by-step Solution',   desc: 'Full breakdown of the correct answer with reasoning.',          color: 'var(--accent)'  },
          { icon: '⚙️', title: 'Technique Identification', desc: 'LINCHPIN, ODD-ONE-OUT, PAIR ELIMINATION and more.',             color: 'var(--yellow)' },
          { icon: '🧠', title: 'Smart Guess Strategy',     desc: 'How to reason your way to the answer even without knowing it.', color: 'var(--green)'  },
          { icon: '📌', title: 'Minimum Concepts',         desc: 'Exactly what you need to know to never miss this again.',       color: 'var(--red)'    },
        ].map(f => (
          <div key={f.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.3rem' }}>{f.icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: f.color }}>{f.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <Link href="/prelims/practice" style={{ background: 'var(--accent)', color: '#000', padding: '1rem 3rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.03em' }}>
        Start Practice →
      </Link>
      <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text3)' }}>No login required to attempt questions</p>
    </div>
  );
}
