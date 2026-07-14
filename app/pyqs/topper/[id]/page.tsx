'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TopperCopy {
  id: string;
  question: string;
  drive_file_id: string;
  note: string | null;
  created_at: string;
}

export default function TopperCopyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copy, setCopy] = useState<TopperCopy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/topper-copies/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.data) setError('Copy not found.');
        else setCopy(d.data);
      })
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <style>{`
        @media (max-width: 640px) {
          .topper-iframe { height: 70vh !important; }
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}
        >&#8592; Back</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
          Loading&#8230;
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {copy && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: '0.5rem',
            }}>
              &#127942; Topper Copy
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem',
              fontWeight: 700, color: 'var(--text)', lineHeight: 1.5,
              marginBottom: '0.75rem',
            }}>
              {copy.question}
            </h1>
            {copy.note && (
              <div style={{
                background: 'rgba(167,139,250,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 8, padding: '0.65rem 1rem',
                color: 'var(--text2)', fontSize: '0.85rem',
                display: 'inline-block', marginTop: '0.25rem',
              }}>
                &#128221; {copy.note}
              </div>
            )}
          </div>

          <div style={{
            border: '1px solid var(--border)', borderRadius: 10,
            overflow: 'hidden', background: 'var(--bg2)',
          }}>
            <div style={{
              padding: '0.6rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg3)',
            }}>
              <span style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text3)', letterSpacing: '0.08em',
              }}>HANDWRITTEN ANSWER</span>
              <a
                href={`https://drive.google.com/file/d/${copy.drive_file_id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem', color: 'var(--accent)',
                  textDecoration: 'none', fontFamily: 'var(--font-mono)',
                }}
              >Open in Drive &#8599;</a>
            </div>
            <iframe
              src={`/api/drive-proxy?id=${copy.drive_file_id}`}
              className="topper-iframe"
              style={{
                width: '100%', height: '80vh',
                border: 'none', display: 'block',
              }}
            />
            <div style={{
              padding: '1rem', textAlign: 'center',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg3)',
            }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginRight: '1rem' }}>
                Not loading?
              </span>
              <a
                href={`https://drive.google.com/file/d/${copy.drive_file_id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  color: '#a78bfa', borderRadius: 6,
                  padding: '0.4rem 1rem', fontSize: '0.8rem',
                  textDecoration: 'none', fontFamily: 'var(--font-mono)',
                }}
              >
                Open in Google Drive &#8599;
              </a>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/pyqs" style={{
              color: 'var(--text3)', fontSize: '0.8rem',
              textDecoration: 'none', fontFamily: 'var(--font-mono)',
            }}>&#8592; Back to PYQs</Link>
          </div>
        </div>
      )}
    </div>
  );
}
