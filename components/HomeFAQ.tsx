'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Is this platform completely reliable?',
    a: 'We are a true one stop solution for History Optional. We cover Notes, PYQ bank, flashcards, interactive timeline, mapping, AI chat engine with multiple modes, unlimited answer evaluations, individual Topper Answers (extracted from topper copies) mapped with PYQs, test series taker and evaluator, and the full Model Answer Bank. Basically everything History Optional',
  },
  {
    q: 'What does the AI answer evaluator actually check?',
    a: 'It evaluates your answer against UPSC History Optional rubrics — introduction quality, argument structure, use of historians and historiography, factual accuracy, and conclusion. You get a score breakdown, detailed analysis of your answer, separate historiography card to site historians, and a detailed model answer which would yield complete marks against UPSC rubric.',
  },
  {
    q: 'How is the AI Chat different from just asking ChatGPT?',
    a: 'The AI here is fine-tuned on UPSC History Optional syllabus and source material inclusive of 25+ standard recommended History optional books, our notes and multiple topper copies across years. It cites relevant historiography, structures answers in the UPSC format, and understands the in-depth demand of the two papers.',
  },
  {
    q: 'Do I need to make an account to use the platform?',
    a: 'Yes, login (Google sign-in) is required.',
  },
  {
    q: 'How are the notes structured?',
    a: 'Notes follow the official UPSC History Optional syllabus — Paper I covers Ancient and Medieval India, Paper II covers Modern India and World History. Each topic includes embedded historiography, key arguments, and is cross-referenced with frequent PYQs.',
  },
  {
    q: 'What is Mentor Mode? Where can I access it?',
    a: 'Mentor Mode is a premium AI chat mode that goes deeper — it uses the TADA framework (Theme, Argument, Data, Analysis) to structure responses, gives color-coded concept breakdowns, and pushes you to think like an examiner rather than just recall facts. You can access it on "AI Chat" page.',
  },
  {
    q: 'What is Brainstorm Mode? Where can I access it?',
    a: 'Brainstorm Mode is also a premium AI chat mode that Brainstorms on the prompted topic by running semantic search through our standard History books database and then generates an analytical response grounded on those standard books. You can access it on "AI Chat" page.',
  },
  {
    q: 'What is Chat with Books?',
    a: 'Chat with Books is a carefully engineered mode wherein the aspirant can chat with any of the 25+ standard History books. He can ask his question and the Chat engine responds with an answer grounded on the passages fetched from the respective book(s)',
  },
  {
    q: 'How often is the content updated?',
    a: 'Notes and PYQs are updated after each UPSC Mains cycle. The AI model and evaluation pipeline get updated as we refine them based on user feedback and new exam patterns.',
  },
  {
    q: 'What are the premium subscription plans?',
    a: 'Availaible plans are : daily, half-yearly, and yearly. The only subscription you would need for History Optional preparation is ours. Spending 60,000 to 1,00,000 Rupees is not worth when you are getting everything at just Rs. 2,999 (90-95% more affordable price)',
    action: { label: 'View plans →' },
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
                  {faq.action && (
                    <>
                      {' '}
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}
                        style={{
                          color: 'var(--accent)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        {faq.action.label}
                      </button>
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
