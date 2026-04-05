'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────
type Position = {
  id?: string;
  debate_id?: string;
  historian_name: string;
  stance: string;
  key_work: string;
  argument: string;
  school: string;
};

type Debate = {
  id: string;
  title: string;
  period: string;
  paper: string;
  topics: string[];
  type: 'debate' | 'topic';
  upsc_tip: string;
  positions: Position[];
};

const OWNER_EMAIL = 'nirxv03@gmail.com';

const PERIODS = ['All', 'Ancient India', 'Early Medieval', 'Medieval India', '18th Century / Early Modern', 'Modern India', 'World History'];
const PAPERS  = ['All', 'Paper I', 'Paper II'];
const TYPES   = ['All', 'debate', 'topic'];
const SCHOOLS = ['Marxist', 'Nationalist', 'Revisionist', 'Subaltern', 'Cambridge School', 'Colonial', 'Postcolonial', 'Feminist', 'Liberal', 'Islamic History', 'Social History', 'Economic History', 'Cultural History', 'Dalit', 'Archaeological'];

const BLANK_POSITION: Position = { historian_name: '', stance: '', key_work: '', argument: '', school: '' };
const BLANK_DEBATE: Omit<Debate, 'id' | 'positions'> & { positions: Position[] } = {
  title: '', period: 'Ancient India', paper: 'Paper I', topics: [], type: 'debate', upsc_tip: '', positions: [{ ...BLANK_POSITION }],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function SchoolBadge({ school }: { school: string }) {
  const colors: Record<string, string> = {
    'Marxist': '#ef4444', 'Nationalist': '#f59e0b', 'Revisionist': '#8b5cf6',
    'Subaltern': '#06b6d4', 'Cambridge School': '#64748b', 'Colonial': '#6b7280',
    'Postcolonial': '#ec4899', 'Feminist': '#f472b6', 'Liberal': '#22c55e',
    'Islamic History': '#10b981', 'Social History': '#3b82f6', 'Economic History': '#f97316',
    'Cultural History': '#a78bfa', 'Dalit': '#0ea5e9', 'Archaeological': '#84cc16',
  };
  const c = colors[school] || '#6b7280';
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 20,
      fontSize: '0.6rem', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', background: `${c}18`, color: c,
      border: `1px solid ${c}40`,
    }}>{school}</span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20,
      fontSize: '0.6rem', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      background: type === 'debate' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
      color: type === 'debate' ? '#ef4444' : '#3b82f6',
      border: `1px solid ${type === 'debate' ? '#ef444430' : '#3b82f630'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: type === 'debate' ? '#ef4444' : '#3b82f6', display: 'inline-block' }} />
      {type === 'debate' ? 'Contested Debate' : 'Contextual Historiography'}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HistoriographyPage() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [filterPaper, setFilterPaper]   = useState('All');
  const [filterType, setFilterType]     = useState('All');
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [isOwner, setIsOwner]           = useState(false);

  // Admin state
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editForm, setEditForm]         = useState<typeof BLANK_DEBATE | null>(null);
  const [addingNew, setAddingNew]       = useState(false);
  const [newForm, setNewForm]           = useState<typeof BLANK_DEBATE>({ ...BLANK_DEBATE, positions: [{ ...BLANK_POSITION }] });
  const [saving, setSaving]             = useState(false);
  const [topicInput, setTopicInput]     = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === OWNER_EMAIL) setIsOwner(true);
      await loadDebates();
    })();
  }, []);

  async function loadDebates() {
    setLoading(true);
    const { data: debatesData } = await supabase.from('debates').select('*').order('created_at', { ascending: false });
    const { data: positionsData } = await supabase.from('positions').select('*');
    if (debatesData) {
      const merged: Debate[] = debatesData.map((d: any) => ({
        ...d,
        positions: (positionsData || []).filter((p: any) => p.debate_id === d.id),
      }));
      setDebates(merged);
    }
    setLoading(false);
  }

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = debates.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q)
      || d.topics.some(t => t.toLowerCase().includes(q))
      || d.positions.some(p => p.historian_name.toLowerCase().includes(q) || p.argument.toLowerCase().includes(q));
    const matchPeriod = filterPeriod === 'All' || d.period === filterPeriod;
    const matchPaper  = filterPaper  === 'All' || d.paper  === filterPaper;
    const matchType   = filterType   === 'All' || d.type   === filterType;
    return matchSearch && matchPeriod && matchPaper && matchType;
  });

  // ── Admin: Save new ────────────────────────────────────────────────────
  async function saveNew() {
    if (!newForm.title.trim()) return;
    setSaving(true);
    const { data: ins, error } = await supabase.from('debates').insert({
      title: newForm.title, period: newForm.period, paper: newForm.paper,
      topics: newForm.topics, type: newForm.type, upsc_tip: newForm.upsc_tip,
    }).select().single();
    if (ins) {
      const posRows = newForm.positions.filter(p => p.historian_name.trim()).map(p => ({ ...p, debate_id: ins.id }));
      if (posRows.length) await supabase.from('positions').insert(posRows);
    }
    setSaving(false);
    setAddingNew(false);
    setNewForm({ ...BLANK_DEBATE, positions: [{ ...BLANK_POSITION }] });
    await loadDebates();
  }

  // ── Admin: Save edit ───────────────────────────────────────────────────
  async function saveEdit() {
    if (!editForm || !editingId) return;
    setSaving(true);
    await supabase.from('debates').update({
      title: editForm.title, period: editForm.period, paper: editForm.paper,
      topics: editForm.topics, type: editForm.type, upsc_tip: editForm.upsc_tip,
    }).eq('id', editingId);
    await supabase.from('positions').delete().eq('debate_id', editingId);
    const posRows = editForm.positions.filter(p => p.historian_name.trim()).map(p => ({ historian_name: p.historian_name, stance: p.stance, key_work: p.key_work, argument: p.argument, school: p.school, debate_id: editingId }));
    if (posRows.length) await supabase.from('positions').insert(posRows);
    setSaving(false);
    setEditingId(null);
    setEditForm(null);
    await loadDebates();
  }

  // ── Admin: Delete ──────────────────────────────────────────────────────
  async function deleteDebate(id: string) {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('positions').delete().eq('debate_id', id);
    await supabase.from('debates').delete().eq('id', id);
    await loadDebates();
  }

  // ── Form helpers ───────────────────────────────────────────────────────
  function updatePos(form: typeof BLANK_DEBATE, setForm: any, idx: number, field: keyof Position, val: string) {
    const positions = form.positions.map((p, i) => i === idx ? { ...p, [field]: val } : p);
    setForm({ ...form, positions });
  }
  function addPos(form: typeof BLANK_DEBATE, setForm: any) {
    setForm({ ...form, positions: [...form.positions, { ...BLANK_POSITION }] });
  }
  function removePos(form: typeof BLANK_DEBATE, setForm: any, idx: number) {
    setForm({ ...form, positions: form.positions.filter((_, i) => i !== idx) });
  }

  // ── Render form ────────────────────────────────────────────────────────
  function DebateForm({ form, setForm, topicInp, setTopicInp, onSave, onCancel }: any) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Indian Feudalism Debate" />
          </div>
          <div>
            <label style={labelStyle}>Period</label>
            <select style={inputStyle} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
              {PERIODS.filter(p => p !== 'All').map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Paper</label>
            <select style={inputStyle} value={form.paper} onChange={e => setForm({ ...form, paper: e.target.value })}>
              {PAPERS.filter(p => p !== 'All').map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="debate">Contested Debate</option>
              <option value="topic">Contextual Historiography</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Topics (press Enter)</label>
            <input style={inputStyle} value={topicInp} placeholder="Add tag..." onKeyDown={e => { if (e.key === 'Enter' && topicInp.trim()) { setForm({ ...form, topics: [...form.topics, topicInp.trim()] }); setTopicInp(''); }}} onChange={e => setTopicInp(e.target.value)} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {form.topics.map((t: string, i: number) => (
                <span key={i} onClick={() => setForm({ ...form, topics: form.topics.filter((_: any, j: number) => j !== i) })} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer' }}>{t} ×</span>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>UPSC Tip</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.upsc_tip} onChange={e => setForm({ ...form, upsc_tip: e.target.value })} placeholder="Practical advice for writing answers..." />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text2)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Positions / Historians</span>
            <button onClick={() => addPos(form, setForm)} style={smallBtnStyle}>+ Add Position</button>
          </div>
          {form.positions.map((pos: Position, idx: number) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text3)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>POSITION {idx + 1}</span>
                {form.positions.length > 1 && <button onClick={() => removePos(form, setForm, idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>Remove</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input style={inputStyle} value={pos.historian_name} onChange={e => updatePos(form, setForm, idx, 'historian_name', e.target.value)} placeholder="Historian Name" />
                <input style={inputStyle} value={pos.stance} onChange={e => updatePos(form, setForm, idx, 'stance', e.target.value)} placeholder="Their Stance" />
                <input style={inputStyle} value={pos.key_work} onChange={e => updatePos(form, setForm, idx, 'key_work', e.target.value)} placeholder="Key Work / Book" />
                <select style={inputStyle} value={pos.school} onChange={e => updatePos(form, setForm, idx, 'school', e.target.value)}>
                  <option value="">Select School</option>
                  {SCHOOLS.map(s => <option key={s}>{s}</option>)}
                </select>
                <textarea style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: 56, resize: 'vertical' }} value={pos.argument} onChange={e => updatePos(form, setForm, idx, 'argument', e.target.value)} placeholder="Their core argument..." />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ ...smallBtnStyle, background: 'transparent', color: 'var(--text3)' }}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ ...smallBtnStyle, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 };
  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.45rem 0.65rem', color: 'var(--text)', fontSize: '0.83rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' };
  const smallBtnStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.7rem', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--font-body)' };

  return (
    <>
      <style>{`
        .hb-wrap { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .hb-header { margin-bottom: 2.5rem; }
        .hb-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
        .hb-title span { color: #3b82f6; }
        .hb-sub { color: var(--text3); font-size: 0.82rem; margin-top: 0.4rem; font-family: var(--font-body); line-height: 1.6; }
        .hb-controls { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-bottom: 1.5rem; }
        .hb-search { flex: 1; min-width: 200px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 0.55rem 0.9rem; color: var(--text); font-size: 0.85rem; font-family: var(--font-body); outline: none; }
        .hb-search:focus { border-color: rgba(59,130,246,0.4); }
        .hb-select { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.75rem; color: var(--text2); font-size: 0.78rem; font-family: var(--font-body); outline: none; cursor: pointer; }
        .hb-count { color: var(--text3); font-size: 0.72rem; font-family: var(--font-mono); letter-spacing: 0.08em; margin-left: auto; }
        
        .hb-card { background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 0.75rem; overflow: hidden; transition: border-color 0.2s; }
        .hb-card:hover { border-color: rgba(59,130,246,0.25); }
        .hb-card-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.2rem; cursor: pointer; }
        .hb-card-left { flex: 1; min-width: 0; }
        .hb-card-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; align-items: center; }
        .hb-card-title { font-family: var(--font-display); font-size: 0.98rem; font-weight: 600; color: var(--text); line-height: 1.35; margin-bottom: 0.35rem; }
        .hb-card-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .hb-meta-pill { font-size: 0.63rem; font-family: var(--font-mono); color: var(--text3); letter-spacing: 0.06em; }
        .hb-meta-dot { color: var(--border2); }
        .hb-card-chevron { color: var(--text3); font-size: 0.7rem; flex-shrink: 0; margin-top: 2px; transition: transform 0.2s; }
        .hb-card-chevron.open { transform: rotate(180deg); }
        
        .hb-card-body { border-top: 1px solid var(--border); padding: 1rem 1.2rem; }
        .hb-tip { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 0.65rem 0.9rem; margin-bottom: 1rem; display: flex; gap: 0.6rem; align-items: flex-start; }
        .hb-tip-label { font-size: 0.58rem; font-family: var(--font-mono); letter-spacing: 0.12em; text-transform: uppercase; color: #f59e0b; flex-shrink: 0; margin-top: 1px; }
        .hb-tip-text { font-size: 0.8rem; color: #d4a93a; line-height: 1.6; }
        
        .hb-positions { display: flex; flex-direction: column; gap: 0.6rem; }
        .hb-position { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem 1rem; }
        .hb-pos-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
        .hb-pos-name { font-family: var(--font-display); font-size: 0.88rem; font-weight: 600; color: var(--text); }
        .hb-pos-stance { font-size: 0.72rem; color: var(--text2); margin-top: 2px;  }
        .hb-pos-work { font-size: 0.68rem; font-family: var(--font-mono); color: var(--text3); margin-bottom: 0.5rem; }
        .hb-pos-work span { color: #60a5fa; }
        .hb-pos-arg { font-size: 0.8rem; color: var(--text2); line-height: 1.65; }
        
        .hb-topics { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.6rem; }
        .hb-topic-tag { font-size: 0.6rem; padding: 2px 8px; border-radius: 20px; background: rgba(59,130,246,0.08); color: var(--text3); border: 1px solid var(--border); font-family: var(--font-mono); }
        
        .hb-admin-bar { display: flex; gap: 0.5rem; padding: 0.6rem 1.2rem; border-top: 1px solid var(--border); background: rgba(255,255,255,0.01); }
        .hb-add-form { background: rgba(255,255,255,0.02); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
        .hb-add-form-title { font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: #60a5fa; margin-bottom: 1rem; }
        
        @media (max-width: 600px) { .hb-controls { flex-direction: column; } .hb-count { margin-left: 0; } }
      `}</style>

      <div className="hb-wrap">
        {/* Header */}
        <div className="hb-header">
          <h1 className="hb-title">Historiography <span>Bank</span></h1>
          <p className="hb-sub">
            Debates, contested interpretations, and historiographical schools — organized for UPSC History Optional.
            <br />Browse by period, filter by paper, search by historian.
          </p>
        </div>

        {/* Controls */}
        <div className="hb-controls">
          <input className="hb-search" placeholder="Search debates, historians, topics…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="hb-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="debate">🔥 Debates</option>
            <option value="topic">📚 Topics</option>
          </select>
          <select className="hb-select" value={filterPaper} onChange={e => setFilterPaper(e.target.value)}>
            {PAPERS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="hb-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
            {PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
          <span className="hb-count">{filtered.length} entries</span>
          {isOwner && (
            <button onClick={() => setAddingNew(true)} style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '0.5rem 0.9rem', color: '#60a5fa', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
              + Add Entry
            </button>
          )}
        </div>

        {/* Add New Form */}
        {addingNew && isOwner && (
          <div className="hb-add-form">
            <div className="hb-add-form-title">New Entry</div>
            <DebateForm form={newForm} setForm={setNewForm} topicInp={newTopicInput} setTopicInp={setNewTopicInput} onSave={saveNew} onCancel={() => setAddingNew(false)} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            Loading…
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.map(debate => (
          <div key={debate.id} className="hb-card">
            {/* Edit form */}
            {editingId === debate.id && editForm && isOwner ? (
              <div style={{ padding: '1.25rem' }}>
                <div className="hb-add-form-title">Editing: {debate.title}</div>
                <DebateForm form={editForm} setForm={setEditForm} topicInp={topicInput} setTopicInp={setTopicInput} onSave={saveEdit} onCancel={() => { setEditingId(null); setEditForm(null); }} />
              </div>
            ) : (
              <>
                {/* Card header (clickable) */}
                <div className="hb-card-header" onClick={() => setExpanded(expanded === debate.id ? null : debate.id)}>
                  <div className="hb-card-left">
                    <div className="hb-card-badges">
                      <TypeBadge type={debate.type} />
                      <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 20 }}>{debate.paper}</span>
                    </div>
                    <div className="hb-card-title">{debate.title}</div>
                    <div className="hb-card-meta">
                      <span className="hb-meta-pill">{debate.period}</span>
                      <span className="hb-meta-dot">·</span>
                      <span className="hb-meta-pill">{debate.positions.length} position{debate.positions.length !== 1 ? 's' : ''}</span>
                      {debate.topics.slice(0, 3).map(t => (
                        <span key={t} className="hb-topic-tag">{t}</span>
                      ))}
                      {debate.topics.length > 3 && <span className="hb-topic-tag">+{debate.topics.length - 3}</span>}
                    </div>
                  </div>
                  <span className={`hb-card-chevron ${expanded === debate.id ? 'open' : ''}`}>▼</span>
                </div>

                {/* Expanded content */}
                {expanded === debate.id && (
                  <div className="hb-card-body">
                    {/* UPSC Tip */}
                    {debate.upsc_tip && (
                      <div className="hb-tip">
                        <span className="hb-tip-label">UPSC Tip</span>
                        <span className="hb-tip-text">{debate.upsc_tip}</span>
                      </div>
                    )}

                    {/* Positions */}
                    <div className="hb-positions">
                      {debate.positions.map((pos, i) => (
                        <div key={i} className="hb-position">
                          <div className="hb-pos-top">
                            <div>
                              <div className="hb-pos-name">{pos.historian_name}</div>
                              <div className="hb-pos-stance">"{pos.stance}"</div>
                            </div>
                            {pos.school && <SchoolBadge school={pos.school} />}
                          </div>
                          {pos.key_work && (
                            <div className="hb-pos-work">Key Work: <span>{pos.key_work}</span></div>
                          )}
                          <div className="hb-pos-arg">{pos.argument}</div>
                        </div>
                      ))}
                    </div>

                    {/* All topics */}
                    {debate.topics.length > 0 && (
                      <div className="hb-topics">
                        {debate.topics.map(t => <span key={t} className="hb-topic-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin bar */}
                {isOwner && (
                  <div className="hb-admin-bar">
                    <button onClick={() => { setEditingId(debate.id); setEditForm({ title: debate.title, period: debate.period, paper: debate.paper, topics: debate.topics, type: debate.type, upsc_tip: debate.upsc_tip, positions: debate.positions.map(p => ({ ...p })) }); setTopicInput(''); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.25rem 0.6rem', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>Edit</button>
                    <button onClick={() => deleteDebate(debate.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '0.25rem 0.6rem', color: '#f87171', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>Delete</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
            No entries found
          </div>
        )}
      </div>
    </>
  );
}
