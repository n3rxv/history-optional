'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!copy) return;

    const pdfUrl = `${R2_BASE}/${copy.drive_file_id}`;

    const loadPdf = async () => {
      try {
        // Load PDF.js from CDN
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
        setNumPages(pdf.numPages);
        setPdfLoading(false);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });

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
      } catch (err) {
        console.error('PDF load error:', err);
        setPdfLoading(false);
      }
    };

    loadPdf();
  }, [copy]);

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
            <div style={{
              padding: '0.6rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg3)',
            }}>
              <span style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text3)', letterSpacing: '0.08em',
              }}>HANDWRITTEN ANSWER {numPages > 0 && `· ${numPages} pages`}</span>
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

            {pdfLoading && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Loading PDF&#8230;
              </div>
            )}

            <div
              ref={containerRef}
              style={{ background: "#1a1a1a", padding: "8px", height: "80vh", overflowY: "auto" }}
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
