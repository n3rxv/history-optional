'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { auth } from '@/lib/firebase';

const R2_BASE = 'https://pub-163b2186589649f4a759ed969e0779e0.r2.dev';

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
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [scale, setScale] = useState(1.5);
  const [rendering, setRendering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      unsub(); // only need first emission
      if (!currentUser) {
        setAccessAllowed(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/topper-access', {
        headers: { 'x-user-token': token },
      });
      const data = await res.json();
      if (data.access && !data.isPremium && !data.hasTopperAccess) {
        // free user — increment click count
        await fetch('/api/topper-click', {
          method: 'POST',
          headers: { 'x-user-token': token },
          body: JSON.stringify({ tcId: id }),
        });
      }
      setAccessAllowed(data.access === true);
    });
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { setAccessAllowed(false); return; }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/topper-access', { headers: { 'x-user-token': token } });
      const data = await res.json();
      setAccessAllowed(data.access === true);
    };
    checkAccess();
  }, []);

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

  const renderPages = async (pdf: any, s: number) => {
    if (!containerRef.current) return;
    setRendering(true);
    containerRef.current.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: s });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.display = 'block';
      canvas.style.marginBottom = '4px';

      containerRef.current.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    setRendering(false);
  };

  useEffect(() => {
    if (!copy) return;
    const pdfUrl = `${R2_BASE}/${copy.drive_file_id}`;

    const loadPdf = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPdfLoading(false);
        await renderPages(pdf, 1.5);
      } catch (err) {
        console.error('PDF load error:', err);
        setPdfLoading(false);
      }
    };

    loadPdf();
  }, [copy, accessAllowed]);

  const handleZoom = async (delta: number) => {
    if (!pdfRef.current || rendering) return;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3);
    setScale(newScale);
    await renderPages(pdfRef.current, newScale);
  };

  const btnStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    color: 'var(--text2)',
    cursor: rendering ? 'not-allowed' : 'pointer',
    width: 28, height: 28,
    borderRadius: 6,
    fontSize: '1rem',
    lineHeight: 1,
    opacity: rendering ? 0.5 : 1,
  };

  if (accessAllowed === null) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
      Checking access…
    </div>
  );

  if (accessAllowed === false) return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: 16, padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
        textAlign: 'center',
        boxShadow: '0 0 0 1px rgba(167,139,250,0.1), 0 24px 60px rgba(0,0,0,0.5)',
      }}>
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
        }}>Topper Copies are Locked</h3>
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
          <span style={{ color: '#a78bfa', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹365</span>
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
                if (v.ok) setAccessAllowed(true);
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
          🔓 Unlock for ₹365/year
        </button>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: '0.6rem', background: 'none', border: 'none',
            color: 'var(--text3)', fontSize: '0.78rem', cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
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
            {/* Toolbar */}
            <div style={{
              padding: '0.6rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg3)',
            }}>
              <span style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text3)', letterSpacing: '0.08em',
              }}>
                HANDWRITTEN ANSWER {numPages > 0 && `· ${numPages} pages`}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!pdfLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button style={btnStyle} onClick={() => handleZoom(-0.25)}>−</button>
                    <span style={{
                      fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--text3)', minWidth: 38, textAlign: 'center',
                    }}>
                      {Math.round((scale / 1.5) * 100)}%
                    </span>
                    <button style={btnStyle} onClick={() => handleZoom(0.25)}>+</button>
                  </div>
                )}
                <a
                  href={`${R2_BASE}/${copy.drive_file_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem', color: 'var(--accent)',
                    textDecoration: 'none', fontFamily: 'var(--font-mono)',
                  }}
                >Open PDF &#8599;</a>
              </div>
            </div>

            {pdfLoading && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Loading PDF&#8230;
              </div>
            )}

            <div
              ref={containerRef}
              style={{ background: '#1a1a1a', padding: '8px', height: '80vh', overflowY: 'auto' }}
            />
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/pyqs?topper=1" style={{
              color: 'var(--text3)', fontSize: '0.8rem',
              textDecoration: 'none', fontFamily: 'var(--font-mono)',
            }}>&#8592; Browse Topper Copies</Link>
          </div>
        </div>
      )}
    </div>
  );
}
