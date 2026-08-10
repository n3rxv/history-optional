'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Is this platform completely free?',
    a: 'Notes, PYQ bank, flashcards, interactive timeline, and the map tool are completely free — no account needed. A premium subscription unlocks unlimited AI chat, unlimited answer evaluations, PDF test upload, and the full Model Answer Bank.',
  },
  {
    q: 'What does the AI answer evaluator actually check?',
    a: 'It evaluates your answer against UPSC History Optional rubrics — introduction quality, argument structure, use of historians and historiography, factual accuracy, and conclusion. You get a score breakdown and specific feedback, not just a generic grade.',
  },
  {
    q: 'How is the AI different from just asking ChatGPT?',
    a: 'The AI here is fine-tuned on UPSC History Optional syllabus and source material. It cites relevant historians (Romila Thapar, Irfan Habib, Bipin Chandra, etc.), structures answers in the UPSC format, and understands the difference between what Paper I and Paper II demand.',
  },
  {
    q: 'Do I need to make an account to use the platform?',
    a: 'No — you can read all notes, browse PYQs, and use flashcards without signing up. Login (Google sign-in) is required to use AI chat, answer evaluation, and to save your annotations and progress.',
  },
  {
    q: 'How are the notes structured?',
    a: 'Notes follow the official UPSC History Optional syllabus — Paper I covers Ancient and Medieval India, Paper II covers Modern India and World History. Each topic includes embedded historiography, key arguments, and is cross-referenced with frequent PYQs.',
  },
  {
    q: 'What is Mentor Mode?',
    a: 'Mentor Mode is a premium AI chat mode that goes deeper — it uses the TADA framework (Theme, Argument, Data, Analysis) to structure responses, gives color-coded concept breakdowns, and pushes you to think like an examiner rather than just recall facts.',
  },
  {
    q: 'How often is the content updated?',
    a: 'Notes and PYQs are updated after each UPSC Mains cycle. The AI model and evaluation pipeline get updated as we refine them based on user feedback and new exam patterns.',
  },
  {
    q: 'What are the premium subscription plans?',
    a: 'Plans are available daily, weekly, monthly, and yearly. The yearly plan has early-bird pricing for the first 45 slots. You can see live slot availability and current pricing on the Subscribe page.',
    link: { href: '/subscribe', label: 'View plans →' },
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen(prev => (prev === i ? null : i));

  return (
    <section style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        color: 'var(--text)',
        marginBottom: '1.25rem',
        fontWeight: 600,
      }}>
        Frequently Asked Questions
      </h2>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--bg2)',
      }}>
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          const isLast = i === faqs.length - 1;

          return (
            <div
              key={i}
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '1rem',
                  transition: 'background 0.15s',
                }}
                className="faq-btn"
              >
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: isOpen ? 'var(--accent)' : 'var(--text)',
                  lineHeight: 1.4,
                  transition: 'color 0.15s',
                }}>
                  {faq.q}
                </span>
                <span style={{
                  color: isOpen ? 'var(--accent)' : 'var(--text3)',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                  transition: 'color 0.15s, transform 0.2s',
                  display: 'inline-block',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                }}>
                  +
                </span>
              </button>

              <div style={{
                maxHeight: isOpen ? '400px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.28s ease',
              }}>
                <div style={{
                  padding: '0 1.25rem 1.1rem',
                  color: 'var(--text2)',
                  fontSize: '0.875rem',
                  lineHeight: 1.75,
                  fontFamily: 'var(--font-body)',
                }}>
                  {faq.a}
                  {faq.link && (
                    <>
                      {' '}
                      <a
                        href={faq.link.href}
                        style={{
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {faq.link.label}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .faq-btn:hover { background: var(--bg3) !important; }
      `}</style>
    </section>
  );
}
