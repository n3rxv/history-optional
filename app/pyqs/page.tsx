'use client';
import { useState } from 'react';
import Link from 'next/link';
import { pyqs, pyqYears, pyqSections } from '@/lib/pyqData';

const TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Paper I - Ancient India' },
  { label: 'Medieval', value: 'Paper I - Medieval India' },
  { label: 'Modern',   value: 'Paper II - Modern India' },
  { label: 'World',    value: 'Paper II - World History' },
];

export default function PYQsPage() {
  const [activeTab, setActiveTab]     = useState<string>('all');
  const [filterYear, setFilterYear]   = useState<number | 'all'>('all');
  const [filterMarks, setFilterMarks] = useState<number | 'all'>('all');
  const [search, setSearch]           = useState('');

  const filtered = pyqs.filter(q => {
    if (activeTab !== 'all' && q.section !== activeTab) return false;
    if (filterYear !== 'all' && q.year !== filterYear) return false;
    if (filterMarks !== 'all' && q.marks !== filterMarks) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.question.toLowerCase().includes(s) && !q.topic.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const isP1 = (section: string) => section.startsWith('Paper I');
  const markOptions = [10, 15, 20, 25, 30, 60];

  const clearAll = () => { setActiveTab('all'); setFilterYear('all'); setFilterMarks('all'); setSearch(''); };
  const hasFilters = activeTab !== 'all' || filterYear !== 'all' || filterMarks !== 'all' || search;

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          History Optional
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              Previous Year Questions
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
              UPSC Mains 1979–2025 · {pyqs.length} questions
            </p>
          </div>
          <Link href="/test" style={{
            background: 'var(--accent)', color: '#fff',
            padding: '0.55rem 1.25rem', borderRadius: 6,
            fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            flexShrink: 0, marginTop: '0.25rem',
          }}>
            Start Test →
          </Link>
        </div>
      </div>

      {/* Quick-filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.value === 'all'
            ? pyqs.length
            : pyqs.filter(q => q.section === tab.value).length;
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 6,
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: active ? 'rgba(180,140,60,0.12)' : 'var(--bg2)',
                color: active ? 'var(--accent)' : 'var(--text2)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '0.68rem',
                background: active ? 'rgba(180,140,60,0.2)' : 'var(--bg3)',
                color: active ? 'var(--accent)' : 'var(--text3)',
                padding: '1px 6px', borderRadius: 10,
                fontFamily: 'var(--font-mono)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions or topics..."
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.5rem 0.85rem',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Years</option>
          {pyqYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMarks} onChange={e => setFilterMarks(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Marks</option>
          {markOptions.map(m => <option key={m} value={m}>{m} marks</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearAll} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.8rem',
          }}>Clear ✕</button>
        )}
      </div>

      {/* Count */}
      <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        Showing {filtered.length} of {pyqs.length} questions
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map(q => (
          <div key={q.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '1.25rem 1.5rem',
            borderLeft: `3px solid ${isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: isP1(q.section) ? 'rgba(180,140,60,0.12)' : 'rgba(76,139,201,0.12)',
                  color: isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)',
                  border: `1px solid ${isP1(q.section) ? 'rgba(180,140,60,0.3)' : 'rgba(76,139,201,0.3)'}`,
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3, letterSpacing: '0.04em',
                }}>
                  {q.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}
                </span>
                <span style={{
                  background: 'var(--bg3)', color: 'var(--text3)',
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                }}>{q.marks}M</span>
                {q.source !== 'UPSC' && (
                  <span style={{
                    background: 'rgba(100,180,100,0.1)', color: '#6ab46a',
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(100,180,100,0.25)',
                  }}>{q.source}</span>
                )}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{q.year}</span>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
              {q.question}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.73rem' }}>{q.topic}</span>
              <Link href={`/chat?q=${encodeURIComponent(q.question)}`} style={{
                marginLeft: 'auto', color: 'var(--accent)',
                fontSize: '0.78rem', textDecoration: 'none',
                background: 'rgba(180,140,60,0.08)',
                border: '1px solid rgba(180,140,60,0.25)',
                padding: '3px 10px', borderRadius: 4,
              }}>Ask AI →</Link>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            No questions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
