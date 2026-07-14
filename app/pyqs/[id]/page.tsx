'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { pyqs, type PYQ } from '@/lib/pyqData';
import { auth } from '@/lib/firebase';

interface AnswerEntry {
  id: string;
  display_name: string;
  storage_path: string;
  answer_number: number;
  created_at: string;
  firebase_uid: string;
  public_url: string;
}

export default function PYQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pyq = pyqs.find((q: PYQ) => q.id === parseInt(id));

  const handleTopperClick = async (tcId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) { router.push('/pyqs/topper/' + tcId); return; }
    const token = await currentUser.getIdToken();
    const res = await fetch('/api/topper-click', {
      method: 'POST',
      headers: { 'x-user-token': token },
    });
    const data = await res.json();
    if (data.allowed) {
      router.push('/pyqs/topper/' + tcId);
    } else {
      setShowTopperPaywall(true);
    }
  };

  const [answers, setAnswers]         = useState<AnswerEntry[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [uploadErr, setUploadErr]     = useState<string | null>(null);
  const [uploadOk, setUploadOk]       = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [file, setFile]               = useState<File | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);
  const [topperCopies, setTopperCopies] = useState<{ id: string; question: string; note: string | null }[]>([]);
  const [topperLoading, setTopperLoading] = useState(true);
  const [showTopperPaywall, setShowTopperPaywall] = useState(false);

  useEffect(() => {
    if (!pyq) return;
    fetch(`/api/pyq-answers?pyq_id=${pyq.id}`)
      .then(r => r.json())
      .then(d => setAnswers(d.answers ?? []))
      .finally(() => setLoadingAnswers(false));
  }, [pyq?.id]);

  useEffect(() => {
    if (!pyq) return;
    fetch(`/api/topper-copies?pyq_id=${pyq.id}`)
      .then(r => r.json())
      .then(d => setTopperCopies(d.data ?? []))
      .finally(() => setTopperLoading(false));
  }, [pyq?.id]);

  if (!pyq) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
      Question not found.{' '}
      <Link href="/pyqs" style={{ color: 'var(--accent)' }}>← Back to PYQs</Link>
    </div>
  );

  const isP1 = pyq.section.startsWith('Paper I');
  const accentClr = isP1 ? 'var(--accent)' : 'var(--blue, #4c8bc9)';

  const handleUpload = async () => {
    setUploadErr(null);
    if (!file)               { setUploadErr('Please select a PDF file.'); return; }
    if (!displayName.trim()) { setUploadErr('Please enter your name.'); return; }

    setUploading(true);

    const form = new FormData();
    form.append('pyq_id', String(pyq.id));
    form.append('display_name', displayName.trim());
    form.append('file', file);

    const res  = await fetch('/api/pyq-answers', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      setUploadErr(data.error ?? 'Upload failed.');
    } else {
      setAnswers(prev => [...prev, data.answer]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setUploadOk(true);
      setTimeout(() => setUploadOk(false), 3500);
    }
    setUploading(false);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.55rem 0.85rem',
    color: 'var(--text)', fontSize: '0.88rem',
    fontFamily: 'var(--font-body)', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
    <div>
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        .ans-card:hover{background:var(--bg3)!important;}
      `}</style>

      {/* Back */}
      <Link href="/pyqs" style={{
        color: 'var(--text3)', fontSize: '0.8rem', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.75rem',
      }}>← Back to PYQs</Link>

      {/* Question Card */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '1.75rem 2rem', marginBottom: '2rem',
        borderLeft: `4px solid ${accentClr}`,
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {[
            pyq.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · '),
            `${pyq.marks}M`,
            String(pyq.year),
            pyq.topic,
          ].map((badge, i) => (
            <span key={i} style={{
              background: i === 0 ? (isP1 ? 'rgba(59,130,246,0.1)' : 'rgba(76,139,201,0.12)') : 'var(--bg3)',
              color: i === 0 ? accentClr : 'var(--text3)',
              border: `1px solid ${i === 0 ? (isP1 ? 'rgba(59,130,246,0.3)' : 'rgba(76,139,201,0.3)') : 'var(--border)'}`,
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
              padding: '2px 8px', borderRadius: 3,
            }}>{badge}</span>
          ))}
        </div>
        <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.75, margin: 0 }}>
          {pyq.question}
        </p>
      </div>

      {/* Upload Section */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '1.75rem 2rem', marginBottom: '2.5rem',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: '1.25rem',
        }}>Submit Your Answer</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ color: 'var(--text3)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem' }}>
                Your Name
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text3)', fontSize: '0.75rem', display: 'block', marginBottom: '0.35rem' }}>
                Answer PDF <span style={{ color: 'var(--text3)' }}>(max 5 MB)</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ color: 'var(--text2)', fontSize: '0.85rem' }}
              />
            </div>
            {uploadErr && (
              <div style={{ color: 'var(--red)', fontSize: '0.83rem' }}>{uploadErr}</div>
            )}
            {uploadOk && (
              <div style={{ color: 'var(--green)', fontSize: '0.83rem' }}>✓ Answer submitted successfully!</div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                alignSelf: 'flex-start',
                background: uploading ? 'var(--bg3)' : 'var(--accent)',
                color: uploading ? 'var(--text3)' : '#fff',
                border: 'none', borderRadius: 6,
                padding: '0.55rem 1.4rem', fontSize: '0.88rem',
                fontFamily: 'var(--font-ui)', fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {uploading ? 'Uploading…' : 'Submit Answer'}
            </button>
          </div>
      </div>

      {/* Answers Grid */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--text3)', marginBottom: '1rem',
        }}>
          Community Answers{answers.length > 0 ? ` · ${answers.length}` : ''}
        </div>

        {loadingAnswers ? (
          <div style={{ display: 'flex', gap: 6, padding: '2rem 0' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                display: 'inline-block',
              }} />
            ))}
          </div>
        ) : answers.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', border: '1px dashed var(--border)',
            borderRadius: 8, padding: '2.5rem', textAlign: 'center',
            color: 'var(--text3)', fontSize: '0.88rem',
          }}>
            No answers yet. Be the first to submit!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.85rem',
          }}>
            {answers.map(ans => (
              <a
                key={ans.id}
                href={ans.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ans-card"
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '1.1rem 1.25rem',
                  textDecoration: 'none', display: 'block',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  fontSize: '1.4rem', marginBottom: '0.5rem',
                  lineHeight: 1,
                }}>📄</div>
                <div style={{
                  color: 'var(--text)', fontSize: '0.88rem',
                  fontWeight: 600, marginBottom: '0.25rem',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{ans.display_name}</div>
                <div style={{
                  color: 'var(--text3)', fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Answer #{ans.answer_number}
                </div>
                <div style={{
                  color: 'var(--text3)', fontSize: '0.68rem',
                  marginTop: '0.4rem',
                }}>
                  {new Date(ans.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>{/* left col */}

    {/* RIGHT SIDEBAR — Topper Copies */}
    <div style={{ position: 'sticky', top: '5rem' }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '1.5rem',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          🏆 Topper Copies
        </div>
        {topperLoading ? (
          <div style={{ color: 'var(--text3)', fontSize: '0.8rem', padding: '1rem 0' }}>Loading…</div>
        ) : topperCopies.length === 0 ? (
          <>
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              High-scoring answers by UPSC toppers for this question.
            </div>
            <div style={{
              background: 'var(--bg3)', border: '1px dashed var(--border)',
              borderRadius: 8, padding: '2rem 1rem', textAlign: 'center',
              color: 'var(--text3)', fontSize: '0.8rem',
            }}>
              Coming soon
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topperCopies.map(tc => (
              <div
                key={tc.id}

                style={{
                  display: 'block', cursor: 'pointer',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '0.85rem 1rem',
                  borderLeft: '3px solid rgba(167,139,250,0.5)',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => handleTopperClick(tc.id)}
              >
                <div style={{ color: 'var(--text)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: tc.note ? '0.35rem' : 0 }}>
                  {tc.question}
                </div>
                {tc.note && (
                  <div style={{ color: 'var(--text3)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                    📝 {tc.note}
                  </div>
                )}
                <div style={{ color: 'rgba(167,139,250,0.8)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>
                  View Copy →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    </div>{/* grid */}

    {showTopperPaywall && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }} onClick={() => setShowTopperPaywall(false)}>
        <div style={{
          background: 'var(--bg)',
          border: '1px solid rgba(167,139,250,0.25)',
          borderRadius: 16, padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
          textAlign: 'center',
          boxShadow: '0 0 0 1px rgba(167,139,250,0.1), 0 24px 60px rgba(0,0,0,0.5)',
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 1.25rem',
          }}>📋</div>
          <h3 style={{
            color: 'var(--text)', fontFamily: 'var(--font-display)',
            fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem',
          }}>5 free previews used</h3>
          <p style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.65 }}>
            Get unlimited access to all topper copies
          </p>
          <div style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 10, padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            <span style={{ color: '#a78bfa', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹99</span>
            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/year · one-time unlock</span>
          </div>
          <button
            onClick={async () => {
              const currentUser = auth.currentUser;
              if (!currentUser) return;
              if (!(window as any).Razorpay) {
                alert('Payment SDK not loaded. Please refresh and try again.');
                return;
              }
              const token = await currentUser.getIdToken();
              const res = await fetch('/api/razorpay/topper-order', {
                method: 'POST',
                headers: { 'x-user-token': token },
              });
              const order = await res.json();
              if (!res.ok) {
                alert('Order creation failed: ' + (order.error || 'Unknown error'));
                return;
              }
              const rzp = new (window as any).Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'History Optional',
                description: 'Topper Copies Access — 1 Year',
                handler: async (response: any) => {
                  const verifyRes = await fetch('/api/razorpay/topper-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-token': token },
                    body: JSON.stringify(response),
                  });
                  const v = await verifyRes.json();
                  if (v.ok) setShowTopperPaywall(false);
                },
              });
              rzp.open();
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              border: 'none',
              color: '#fff', borderRadius: 10, padding: '0.85rem 2rem',
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', width: '100%',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
            }}
          >
            🔓 Unlock for ₹99/year
          </button>
          <button
            onClick={() => setShowTopperPaywall(false)}
            style={{
              marginTop: '0.6rem', background: 'none', border: 'none',
              color: 'var(--text3)', fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    )}

    </div>
  );
}
