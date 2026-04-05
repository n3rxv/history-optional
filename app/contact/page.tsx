'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';


function ContactForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'contact' | 'bug'>('contact');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [bugForm, setBugForm] = useState({ page: '', description: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (searchParams.get('tab') === 'bug') setTab('bug');
  }, [searchParams]);

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'contact', name: form.name, email: form.email, message: form.message }),
    });
    if (!res.ok) { setStatus('error'); return; }
    setStatus('done');
    setForm({ name: '', email: '', message: '' });
  }

  async function handleBug(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bug', page: bugForm.page, description: bugForm.description, email: bugForm.email }),
    });
    if (!res.ok) { setStatus('error'); return; }
    setStatus('done');
    setBugForm({ page: '', description: '', email: '' });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    color: '#e0e0e0',
    backgroundColor: '#111',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '6px',
    fontFamily: 'Inter, system-ui, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '60px 24px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Header */}
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '26px',
          color: '#e0e0e0',
          marginBottom: '6px',
          fontWeight: 400,
        }}>
          {tab === 'contact' ? 'Contact Us' : 'Report a Bug'}
        </h1>
        <p style={{ color: '#444', fontSize: '14px', marginBottom: '32px' }}>
          {tab === 'contact'
            ? 'Questions, feedback, or suggestions — write to us.'
            : 'Found something broken? Tell us what happened.'}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '32px', borderBottom: '1px solid #1a1a1a' }}>
          {(['contact', 'bug'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setStatus('idle'); }} style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #d4a843' : '2px solid transparent',
              marginBottom: '-1px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#d4a843' : '#555',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {t === 'contact' ? '✉ Contact' : '🐛 Bug Report'}
            </button>
          ))}
        </div>

        {/* Success */}
        {status === 'done' ? (
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(81,207,102,0.08)',
            border: '1px solid rgba(81,207,102,0.2)',
            borderRadius: '8px',
            color: '#51cf66',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            ✓ Submitted successfully. We'll get back to you soon.
          </div>
        ) : (
          <>
            {tab === 'contact' ? (
              <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input required style={inputStyle} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input required type="email" style={inputStyle} value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Write your message here..." />
                </div>
                <button type="submit" disabled={status === 'sending'} style={{
                  padding: '10px 24px',
                  backgroundColor: status === 'sending' ? '#1a1a1a' : 'rgba(212,168,67,0.15)',
                  color: status === 'sending' ? '#555' : '#d4a843',
                  border: '1px solid rgba(212,168,67,0.3)',
                  borderRadius: '6px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: status === 'sending' ? 'default' : 'pointer',
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                }}>
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBug} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Which page / feature?</label>
                  <input required style={inputStyle} value={bugForm.page}
                    onChange={e => setBugForm(f => ({ ...f, page: e.target.value }))}
                    placeholder="e.g. Historiography Bank, Notes — Paper I" />
                </div>
                <div>
                  <label style={labelStyle}>What happened?</label>
                  <textarea required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={bugForm.description}
                    onChange={e => setBugForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What you did, what you expected, what actually happened..." />
                </div>
                <div>
                  <label style={labelStyle}>Your email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#333' }}>(optional)</span></label>
                  <input type="email" style={inputStyle} value={bugForm.email}
                    onChange={e => setBugForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="So we can follow up if needed" />
                </div>
                <button type="submit" disabled={status === 'sending'} style={{
                  padding: '10px 24px',
                  backgroundColor: status === 'sending' ? '#1a1a1a' : 'rgba(212,168,67,0.15)',
                  color: status === 'sending' ? '#555' : '#d4a843',
                  border: '1px solid rgba(212,168,67,0.3)',
                  borderRadius: '6px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: status === 'sending' ? 'default' : 'pointer',
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                }}>
                  {status === 'sending' ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p style={{ color: '#ff8080', fontSize: '13px', marginTop: '8px' }}>
                Something went wrong. Please try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return <Suspense><ContactForm /></Suspense>;
}
