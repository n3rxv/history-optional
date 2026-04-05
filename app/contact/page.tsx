'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

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
    const { error } = await sb.from('contact_submissions').insert({
      type: 'contact',
      name: form.name,
      email: form.email,
      message: form.message,
    });
    if (error) { setStatus('error'); return; }
    setStatus('done');
    setForm({ name: '', email: '', message: '' });
  }

  async function handleBug(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await sb.from('contact_submissions').insert({
      type: 'bug',
      page: bugForm.page,
      message: bugForm.description,
      email: bugForm.email || null,
    });
    if (error) { setStatus('error'); return; }
    setStatus('done');
    setBugForm({ page: '', description: '', email: '' });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #ddd8d0',
    borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
    color: '#2d1f14', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a3e2b',
    marginBottom: '6px', fontFamily: 'Inter, sans-serif',
  };
  const btnStyle: React.CSSProperties = {
    padding: '10px 28px', backgroundColor: '#3d2b1f', color: '#fff', border: 'none',
    borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer', marginTop: '8px',
  };

  return (
    <div style={{ maxWidth: '560px', margin: '48px auto', padding: '0 24px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '28px', color: '#2d1f14', marginBottom: '8px' }}>
        {tab === 'contact' ? 'Contact Us' : 'Report a Bug'}
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
        {tab === 'contact' ? 'Questions, feedback, or suggestions — write to us.' : 'Found something broken? Tell us what happened.'}
      </p>

      <div style={{ display: 'flex', marginBottom: '32px', borderBottom: '2px solid #e5e0d8' }}>
        {(['contact', 'bug'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setStatus('idle'); }} style={{
            padding: '8px 20px', background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid #3d2b1f' : '2px solid transparent',
            marginBottom: '-2px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
            fontWeight: tab === t ? 600 : 400, color: tab === t ? '#3d2b1f' : '#888', cursor: 'pointer',
          }}>
            {t === 'contact' ? 'Contact' : 'Bug Report'}
          </button>
        ))}
      </div>

      {status === 'done' ? (
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '15px', textAlign: 'center' }}>
          ✓ Submitted successfully. We'll get back to you soon.
        </div>
      ) : (
        <>
          {tab === 'contact' ? (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your message here..." />
              </div>
              <button type="submit" style={btnStyle} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBug} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Which page / feature?</label>
                <input required style={inputStyle} value={bugForm.page} onChange={e => setBugForm(f => ({ ...f, page: e.target.value }))} placeholder="e.g. Historiography Bank, Notes — Paper I" />
              </div>
              <div>
                <label style={labelStyle}>What happened?</label>
                <textarea required rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={bugForm.description} onChange={e => setBugForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the bug — what you did, what you expected, what actually happened..." />
              </div>
              <div>
                <label style={labelStyle}>Your email <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                <input type="email" style={inputStyle} value={bugForm.email} onChange={e => setBugForm(f => ({ ...f, email: e.target.value }))} placeholder="So we can follow up if needed" />
              </div>
              <button type="submit" style={btnStyle} disabled={status === 'sending'}>
                {status === 'sending' ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          )}
          {status === 'error' && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>Something went wrong. Please try again.</p>}
        </>
      )}
    </div>
  );
}

export default function ContactPage() {
  return <Suspense><ContactForm /></Suspense>;
}
