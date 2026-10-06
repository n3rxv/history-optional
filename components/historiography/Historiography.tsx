'use client';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { tintFor } from '@/components/pyq/sections';
import type { Debate, DebateInput, Position } from '@/lib/debates';

/**
 * The historiography bank: each debate or reading with the historians on it,
 * their stance, their book and their school, and a tip on using it in an
 * answer. The page arrives with the bank in it; readers do not fetch it
 * again. The owner can add, edit and delete entries, through
 * /api/admin/debates.
 */

const PERIODS = ['Ancient India', 'Early Medieval', 'Medieval India', '18th Century / Early Modern', 'Modern India', 'World History'];
const PERIODS_HI: Record<string, string> = { 'Ancient India': 'प्राचीन भारत', 'Early Medieval': 'प्रारंभिक मध्यकाल', 'Medieval India': 'मध्यकालीन भारत', '18th Century / Early Modern': '18वीं सदी / प्रारंभिक आधुनिक', 'Modern India': 'आधुनिक भारत', 'World History': 'विश्व इतिहास' };
const PERIOD_KEY: Record<string, 'ancient' | 'medieval' | 'modern' | 'world'> = { 'Ancient India': 'ancient', 'Early Medieval': 'medieval', 'Medieval India': 'medieval', '18th Century / Early Modern': 'modern', 'Modern India': 'modern', 'World History': 'world' };
const SCHOOLS = ['Marxist', 'Nationalist', 'Revisionist', 'Subaltern', 'Cambridge School', 'Colonial', 'Postcolonial', 'Feminist', 'Liberal', 'Islamic History', 'Social History', 'Economic History', 'Cultural History', 'Dalit', 'Archaeological'];
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

/**
 * The schools of thought historiography courses teach, in the order they
 * arose. The bank also tags some positions with a field or a stance
 * (Revisionist, Social History, Liberal); those are not schools, so the side
 * panel leaves them out.
 */
const SCHOOL_GUIDE: { name: string; hi: string; en: string; enHi: string; names: string }[] = [
  { name: 'Colonial', hi: 'औपनिवेशिक', en: 'British officials and scholars, who often wrote India as unchanging until British rule.', enHi: 'ब्रिटिश अधिकारी और विद्वान, जो अक्सर भारत को ब्रिटिश शासन तक अपरिवर्तित बताते थे।', names: 'James Mill, V.A. Smith' },
  { name: 'Nationalist', hi: 'राष्ट्रवादी', en: 'Answered the colonial accounts with India’s past achievements and the drain of wealth.', enHi: 'औपनिवेशिक विवरणों का उत्तर भारत की पुरानी उपलब्धियों और धन की निकासी से दिया।', names: 'R.C. Dutt, R.C. Majumdar' },
  { name: 'Marxist', hi: 'मार्क्सवादी', en: 'Reads the past through class, production and material change.', enHi: 'अतीत को वर्ग, उत्पादन और भौतिक परिवर्तन के ज़रिए पढ़ता है।', names: 'D.D. Kosambi, R.S. Sharma, Irfan Habib' },
  { name: 'Cambridge School', hi: 'कैम्ब्रिज स्कूल', en: 'Sees Indian nationalism as a contest among elites for power and patronage.', enHi: 'भारतीय राष्ट्रवाद को सत्ता और संरक्षण के लिए अभिजात वर्गों की होड़ मानता है।', names: 'Anil Seal, Judith Brown' },
  { name: 'Subaltern', hi: 'सबाल्टर्न', en: 'History from below: peasants, tribals and workers acting for themselves.', enHi: 'नीचे से इतिहास: किसान, आदिवासी और मज़दूर अपने बल पर।', names: 'Ranajit Guha, Shahid Amin' },
  { name: 'Postcolonial', hi: 'उत्तर-औपनिवेशिक', en: 'Asks how colonial knowledge shaped categories like caste and religion.', enHi: 'पूछता है कि औपनिवेशिक ज्ञान ने जाति और धर्म जैसी श्रेणियाँ कैसे गढ़ीं।', names: 'Edward Said, Nicholas Dirks' },
  { name: 'Feminist', hi: 'नारीवादी', en: 'Brings women and gender, left out of older accounts, to the centre.', enHi: 'पुराने विवरणों से छूटी महिलाओं और जेंडर को केंद्र में लाता है।', names: 'Uma Chakravarti, Lata Mani' },
  { name: 'Dalit', hi: 'दलित', en: 'Writes caste and its history from the side of those it held down.', enHi: 'जाति और उसके इतिहास को दबाए गए लोगों की ओर से लिखता है।', names: 'Jotirao Phule, B.R. Ambedkar' },
];

const BLANK_POSITION: Position = { historian_name: '', stance: '', key_work: '', argument: '', school: '' };
const blank = (): DebateInput => ({ title: '', period: 'Ancient India', paper: 'Paper I', topics: [], type: 'debate', upsc_tip: '', positions: [{ ...BLANK_POSITION }] });

const Chevron = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

/** The owner's form for one entry. */
function EntryForm({ value, onChange, onSave, onCancel, saving, error }: {
  value: DebateInput; onChange: (v: DebateInput) => void; onSave: () => void; onCancel: () => void; saving: boolean; error: string;
}) {
  const [tag, setTag] = useState('');
  const setPos = (i: number, patch: Partial<Position>) => onChange({ ...value, positions: value.positions.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <div className="hg-form">
      <div className="hg-form-grid">
        <label className="wide"><span>Title</span><input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="The Indian feudalism debate" /></label>
        <label><span>Period</span><select value={value.period} onChange={(e) => onChange({ ...value, period: e.target.value })}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label><span>Paper</span><select value={value.paper} onChange={(e) => onChange({ ...value, paper: e.target.value })}><option>Paper I</option><option>Paper II</option></select></label>
        <label><span>Kind</span><select value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value as Debate['type'] })}><option value="debate">A debate</option><option value="topic">A reading</option></select></label>
        <label>
          <span>Topics (Enter to add)</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add a topic"
            onKeyDown={(e) => { if (e.key === 'Enter' && tag.trim()) { e.preventDefault(); onChange({ ...value, topics: [...value.topics, tag.trim()] }); setTag(''); } }} />
          {value.topics.length > 0 && (
            <span className="hg-form-tags">{value.topics.map((t, i) => <button key={`${t}-${i}`} type="button" onClick={() => onChange({ ...value, topics: value.topics.filter((_, j) => j !== i) })}>{t} ✕</button>)}</span>
          )}
        </label>
        <label className="wide"><span>Tip for an answer</span><textarea rows={2} value={value.upsc_tip} onChange={(e) => onChange({ ...value, upsc_tip: e.target.value })} placeholder="How to use this in an answer" /></label>
      </div>
      <div className="hg-form-head"><strong>Historians</strong><button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => onChange({ ...value, positions: [...value.positions, { ...BLANK_POSITION }] })}>Add a historian</button></div>
      {value.positions.map((p, i) => (
        <div key={i} className="hg-form-pos">
          <div className="hg-form-grid">
            <label><span>Historian</span><input value={p.historian_name} onChange={(e) => setPos(i, { historian_name: e.target.value })} /></label>
            <label><span>School</span><select value={p.school} onChange={(e) => setPos(i, { school: e.target.value })}><option value="">None</option>{SCHOOLS.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label><span>Stance</span><input value={p.stance} onChange={(e) => setPos(i, { stance: e.target.value })} /></label>
            <label><span>Key work</span><input value={p.key_work} onChange={(e) => setPos(i, { key_work: e.target.value })} /></label>
            <label className="wide"><span>Argument</span><textarea rows={2} value={p.argument} onChange={(e) => setPos(i, { argument: e.target.value })} /></label>
          </div>
          {value.positions.length > 1 && <button type="button" className="hg-form-remove" onClick={() => onChange({ ...value, positions: value.positions.filter((_, j) => j !== i) })}>Remove this historian</button>}
        </div>
      ))}
      {error && <p className="hg-form-err" role="alert">{error}</p>}
      <div className="hg-form-actions">
        <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

export default function Historiography({ initialDebates }: { initialDebates: Debate[] }) {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const [debates, setDebates] = useState(initialDebates);
  const [search, setSearch] = useState('');
  // The site search links here with ?q=, a debate's title; read once the page
  // is in the browser, since the server draws the unfiltered bank.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearch(q.slice(0, 200));
  }, []);
  const [kind, setKind] = useState<'all' | 'debate' | 'topic'>('all');
  const [paper, setPaper] = useState<'all' | 'Paper I' | 'Paper II'>('all');
  const [period, setPeriod] = useState('all');
  const [school, setSchool] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // The owner's tools appear for the owner's account; the server checks it
  // again on every write.
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => onAuthStateChanged(auth, (u) => setIsOwner(Boolean(u?.email && OWNER_EMAIL && u.email === OWNER_EMAIL))), []);
  const [editing, setEditing] = useState<{ id: string | null; form: DebateInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const call = async (method: 'POST' | 'PUT' | 'DELETE', body?: unknown, id?: string) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/admin/debates${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
      method, headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'That did not save.');
    setDebates(data.debates);
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true); setFormError('');
    try {
      await call(editing.id ? 'PUT' : 'POST', editing.id ? { ...editing.form, id: editing.id } : editing.form);
      setEditing(null);
    } catch (e) { setFormError(e instanceof Error ? e.message : 'That did not save.'); }
    setSaving(false);
  };
  const remove = async (d: Debate) => {
    if (!window.confirm(`Delete “${d.title}”?`)) return;
    try { await call('DELETE', undefined, d.id); } catch (e) { alert(e instanceof Error ? e.message : 'That did not delete.'); }
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return debates.filter((d) => {
      if (kind !== 'all' && d.type !== kind) return false;
      if (paper !== 'all' && d.paper !== paper) return false;
      if (period !== 'all' && d.period !== period) return false;
      if (school && !d.positions.some((p) => p.school === school)) return false;
      if (!q) return true;
      return d.title.toLowerCase().includes(q) || d.topics.some((t) => t.toLowerCase().includes(q))
        || d.positions.some((p) => p.historian_name.toLowerCase().includes(q) || p.argument.toLowerCase().includes(q) || p.school.toLowerCase().includes(q));
    });
  }, [debates, search, kind, paper, period, school]);
  // The side panel: each school with the number of debates it has a voice in.
  const schools = useMemo(() => SCHOOL_GUIDE
    .map((g) => ({ ...g, n: debates.filter((d) => d.positions.some((p) => p.school === g.name)).length }))
    .filter((g) => g.n > 0), [debates]);

  return (
    <div className="hg ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="hg-hero">
        <div className="ds-container">
          <h1 className="ds-h1 hg-h1">{T('Historiography', 'इतिहास-लेखन')}</h1>
          <p className="ds-lede hg-lede">
            {T('The big debates of the syllabus and who said what in them. Each one names the book to cite and how to use it in an answer.', 'पाठ्यक्रम की बड़ी बहसें और उनमें किसने क्या कहा। हर बहस में लिखा है कि कौन-सी पुस्तक उद्धृत करें और उत्तर में इसे कैसे लिखें।')}
          </p>
        </div>
      </header>

      <div className="ds-container">
        <div className="hg-controls">
          <label className="hg-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T('A debate, historian or school', 'कोई बहस, इतिहासकार या स्कूल')} aria-label={T('Search the bank', 'खोजें')} />
          </label>
          <div className="hg-filters">
            <div className="hg-seg" role="radiogroup" aria-label={T('Kind', 'प्रकार')}>
              {([['all', T('All', 'सभी')], ['debate', T('Debates', 'बहसें')], ['topic', T('Readings', 'पाठ')]] as const).map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{label}</button>
              ))}
            </div>
            <div className="hg-seg" role="radiogroup" aria-label={T('Paper', 'पेपर')}>
              {([['all', T('Both papers', 'दोनों पेपर')], ['Paper I', T('Paper I', 'पेपर I')], ['Paper II', T('Paper II', 'पेपर II')]] as const).map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={paper === k} className={paper === k ? 'on' : ''} onClick={() => setPaper(k)}>{label}</button>
              ))}
            </div>
            <select className={`hg-select${period !== 'all' ? ' set' : ''}`} value={period} onChange={(e) => setPeriod(e.target.value)} aria-label={T('Period', 'काल')}>
              <option value="all">{T('Every period', 'सभी काल')}</option>
              {PERIODS.map((p) => <option key={p} value={p}>{hi ? PERIODS_HI[p] : p}</option>)}
            </select>
            <span className="hg-count">{T(`${shown.length} shown`, `${shown.length} दिख रहे`)}</span>
            {isOwner && !editing && <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={() => { setFormError(''); setEditing({ id: null, form: blank() }); }}>Add an entry</button>}
          </div>
        </div>

        {isOwner && editing && editing.id === null && (
          <section className="hg-card hg-editing"><h2 className="hg-edit-title">A new entry</h2>
            <EntryForm value={editing.form} onChange={(form) => setEditing({ ...editing, form })} onSave={save} onCancel={() => setEditing(null)} saving={saving} error={formError} />
          </section>
        )}

        <div className="hg-layout">
        <div className="hg-list">
          {shown.map((d) => {
            const isOpen = open === d.id;
            const key = PERIOD_KEY[d.period];
            if (isOwner && editing?.id === d.id) {
              return (
                <section key={d.id} className="hg-card hg-editing"><h2 className="hg-edit-title">Editing “{d.title}”</h2>
                  <EntryForm value={editing.form} onChange={(form) => setEditing({ ...editing, form })} onSave={save} onCancel={() => setEditing(null)} saving={saving} error={formError} />
                </section>
              );
            }
            return (
              <section key={d.id} className={`hg-card${isOpen ? ' open' : ''}`} style={tintFor(key)}>
                <button type="button" className="hg-head" aria-expanded={isOpen}
                  onClick={() => { if (requireLogin('Sign in free to explore historiographical debates.')) setOpen(isOpen ? null : d.id); }}>
                  <span className="hg-head-main">
                    <span className="hg-badges">
                      <span className={`hg-kind ${d.type}`}>{d.type === 'debate' ? T('Debate', 'बहस') : T('Reading', 'पाठ')}</span>
                      <span className="hg-period">{hi ? PERIODS_HI[d.period] ?? d.period : d.period}</span>
                      <span className="hg-paper">{d.paper}</span>
                    </span>
                    <span className="hg-title">{hi && d.title_hi ? d.title_hi : d.title}</span>
                    <span className="hg-meta">
                      {T(`${d.positions.length} ${d.positions.length === 1 ? 'historian' : 'historians'}`, `${d.positions.length} इतिहासकार`)}
                      {d.positions.length > 0 && <span className="hg-names"> · {d.positions.slice(0, 3).map((p) => p.historian_name).join(', ')}{d.positions.length > 3 ? '…' : ''}</span>}
                    </span>
                  </span>
                  <span className="hg-chev"><Chevron /></span>
                </button>
                {isOpen && (
                  <div className="hg-body">
                    {d.upsc_tip && <p className="hg-tip"><strong>{T('In an answer', 'उत्तर में')}</strong>{hi && d.upsc_tip_hi ? d.upsc_tip_hi : d.upsc_tip}</p>}
                    <div className="hg-positions">
                      {d.positions.map((p, i) => (
                        <article key={p.id ?? i} className="hg-pos">
                          <div className="hg-pos-top">
                            <h3>{p.historian_name}</h3>
                            {p.school && <span className="hg-school">{p.school}</span>}
                          </div>
                          {p.stance && <p className="hg-stance">{hi && p.stance_hi ? p.stance_hi : p.stance}</p>}
                          {p.key_work && <p className="hg-work">{hi && p.key_work_hi ? p.key_work_hi : p.key_work}</p>}
                          <p className="hg-arg">{hi && p.argument_hi ? p.argument_hi : p.argument}</p>
                        </article>
                      ))}
                    </div>
                    {d.topics.length > 0 && <div className="hg-topics">{d.topics.map((t) => <span key={t}>{t}</span>)}</div>}
                  </div>
                )}
                {isOwner && (
                  <div className="hg-admin">
                    <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => { setFormError(''); setEditing({ id: d.id, form: { title: d.title, period: d.period, paper: d.paper, topics: d.topics, type: d.type, upsc_tip: d.upsc_tip, positions: d.positions.map((p) => ({ ...p })) } }); }}>Edit</button>
                    <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm hg-del" onClick={() => remove(d)}>Delete</button>
                  </div>
                )}
              </section>
            );
          })}
          {shown.length === 0 && (
            <div className="hg-empty">
              <strong>{debates.length ? T('Nothing matches', 'कुछ नहीं मिला') : T('The bank did not load', 'बैंक लोड नहीं हुआ')}</strong>
              <p>{debates.length ? T('Try another word, or widen the filters.', 'कोई दूसरा शब्द आज़माएँ या फ़िल्टर हटाएँ।') : T('Please try again in a little while.', 'कुछ देर बाद फिर कोशिश करें।')}</p>
            </div>
          )}
        </div>
        {debates.length > 0 && (
          <aside className="hg-aside" aria-label={T('Ways into the bank', 'बैंक में खोजने के रास्ते')}>
            <div className="hg-side">
              <div className="hg-side-head">
                <h2>{T('Schools of thought', 'विचार-धाराएँ')}</h2>
                {school && <button type="button" className="hg-clear" onClick={() => setSchool(null)}>{T('Show all', 'सभी दिखाएँ')}</button>}
              </div>
              <p className="hg-side-note">{T('Pick one to see the debates where it has a say.', 'किसी एक को चुनें और वे बहसें देखें जिनमें उसकी राय है।')}</p>
              <ol className="hg-schools">
                {schools.map((g) => (
                  <li key={g.name}>
                    <button type="button" aria-pressed={school === g.name} className={school === g.name ? 'on' : ''} onClick={() => setSchool(school === g.name ? null : g.name)}>
                      <span className="hg-school-top"><strong>{hi ? g.hi : g.name}</strong><span>{T(`${g.n} ${g.n === 1 ? 'debate' : 'debates'}`, `${g.n} बहसें`)}</span></span>
                      <span className="hg-school-names">{g.names}</span>
                      {school === g.name && <span className="hg-school-about">{hi ? g.enHi : g.en}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
        </div>
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.hg { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.hg-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.hg-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.hg-lede { max-width: 700px; }
.hg-controls { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) 0 var(--space-5); }
.hg-search { display: flex; align-items: center; gap: var(--space-2); max-width: 640px; height: 48px; padding: 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); }
.hg-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.hg-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font: inherit; font-size: 1rem; }
.hg-filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
.hg-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.hg-seg button { padding: 6px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.hg-seg button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.hg-select { appearance: none; -webkit-appearance: none; height: 40px; max-width: 260px; padding: 0 32px 0 14px; background: var(--ds-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center; border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text); font: inherit; font-size: 0.88rem; cursor: pointer; }
.hg-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.hg-count { margin-left: auto; font-size: 0.88rem; color: var(--text3); }

.hg-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: var(--space-6); align-items: start; }
.hg-list { display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; }
.hg-aside { position: sticky; top: 84px; display: flex; flex-direction: column; gap: var(--space-3); max-height: calc(100vh - 104px); overflow-y: auto; scrollbar-width: none; }
.hg-aside::-webkit-scrollbar { display: none; }
.hg-side { padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.hg-side h2 { margin: 0 0 var(--space-3); font-size: 0.95rem; font-weight: 800; }
.hg-side-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.hg-side-head h2 { margin: 0; }
.hg-side-note { margin: 4px 0 var(--space-3); font-size: 0.84rem; line-height: 1.45; color: var(--text3); }
.hg-clear { padding: 0; border: none; background: none; font: inherit; font-size: 0.84rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
/* Each school a row on a rail, in the order the schools arose. */
.hg-schools { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; position: relative; }
.hg-schools::before { content: ''; position: absolute; left: 4px; top: 14px; bottom: 14px; width: 2px; border-radius: 2px; background: var(--border); }
.hg-schools button { position: relative; width: 100%; display: flex; flex-direction: column; gap: 2px; padding: 7px 8px 7px 22px; border: none; border-radius: var(--radius-md); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.hg-schools button::before { content: ''; position: absolute; left: 0; top: 12px; width: 10px; height: 10px; border-radius: 50%; background: var(--ds-card); border: 2px solid var(--border2); box-sizing: border-box; }
.hg-schools button:hover { background: var(--ds-soft); }
.hg-schools button:hover::before { border-color: var(--accent); }
.hg-schools button.on { background: var(--accent-dim); }
.hg-schools button.on::before { background: var(--accent); border-color: var(--accent); }
.hg-school-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.hg-school-top strong { font-size: 0.9rem; font-weight: 700; }
.hg-schools button.on .hg-school-top strong { color: var(--accent-text); }
.hg-school-top span { flex-shrink: 0; font-size: 0.76rem; color: var(--text3); font-variant-numeric: tabular-nums; }
.hg-school-about { margin-top: 4px; font-size: 0.82rem; line-height: 1.45; color: var(--text2); }
.hg-school-names { font-size: 0.76rem; font-weight: 600; color: var(--text3); }
.hg-card { background: var(--ds-card); border: 1px solid var(--border); border-left: 3px solid var(--t); border-radius: var(--radius-xl); }
.hg-card.open { box-shadow: var(--elev-1); }
.hg-head { width: 100%; display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: none; border-radius: var(--radius-xl); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.hg-head:hover { background: var(--ds-soft); }
.hg-head-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.hg-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.hg-kind { padding: 2px 10px; border-radius: var(--radius-full); font-size: 0.76rem; font-weight: 700; background: var(--accent-dim); color: var(--accent-text); }
.hg-kind.debate { background: var(--danger-wash); color: var(--danger-text); }
.hg-period { padding: 2px 10px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-size: 0.76rem; font-weight: 700; }
.hg-paper { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.76rem; font-weight: 600; }
.hg-title { font-size: 1.06rem; font-weight: 800; line-height: 1.35; }
.hg-meta { font-size: 0.86rem; color: var(--text3); }
.hg-chev { flex-shrink: 0; margin-top: 4px; color: var(--text3); transition: transform 0.2s; }
.hg-card.open .hg-chev { transform: rotate(180deg); }
.hg-body { display: flex; flex-direction: column; gap: var(--space-3); padding: 0 var(--space-5) var(--space-5); }
.hg-tip { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--warning-wash); line-height: 1.6; font-size: 0.94rem; }
.hg-tip strong { display: block; margin-bottom: 2px; font-size: 0.82rem; color: var(--warning-text); }
.hg-positions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.hg-pos { display: flex; flex-direction: column; gap: 6px; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg); min-width: 0; }
.hg-pos-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px var(--space-2); }
.hg-pos-top h3 { margin: 0; font-size: 1rem; font-weight: 800; }
.hg-school { padding: 1px 9px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.76rem; font-weight: 700; }
.hg-stance { margin: 0; font-weight: 600; color: var(--t); line-height: 1.45; }
.hg-work { margin: 0; font-size: 0.86rem; font-style: italic; color: var(--text3); }
.hg-arg { margin: 0; font-size: 0.94rem; line-height: 1.65; color: var(--text2); }
.hg-topics { display: flex; flex-wrap: wrap; gap: 6px; }
.hg-topics span { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.8rem; }
.hg-admin { display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-5) var(--space-3); border-top: 1px solid var(--border); }
.hg-del { color: var(--danger-text); }
.hg-empty { padding: var(--space-8) var(--space-5); border-radius: var(--radius-xl); background: var(--ds-soft); text-align: center; }
.hg-empty p { margin: 4px 0 0; color: var(--text2); }

.hg-editing { padding: var(--space-5); border-left-color: var(--accent); }
.hg-edit-title { margin: 0 0 var(--space-4); font-size: 1.05rem; font-weight: 800; }
.hg-form { display: flex; flex-direction: column; gap: var(--space-3); }
.hg-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.hg-form-grid label { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.hg-form-grid label.wide { grid-column: 1 / -1; }
.hg-form-grid label > span { font-size: 0.82rem; font-weight: 700; color: var(--text2); }
.hg-form input, .hg-form select, .hg-form textarea { width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid var(--border2); border-radius: var(--radius-md); background: var(--bg); color: var(--text); font: inherit; font-size: 0.92rem; }
.hg-form textarea { resize: vertical; }
.hg-form-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.hg-form-tags button { padding: 2px 8px; border: none; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font: inherit; font-size: 0.78rem; cursor: pointer; }
.hg-form-head { display: flex; align-items: center; justify-content: space-between; padding-top: var(--space-3); border-top: 1px solid var(--border); }
.hg-form-pos { padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-soft); }
.hg-form-remove { margin-top: var(--space-2); padding: 0; border: none; background: none; color: var(--danger-text); font: inherit; font-size: 0.84rem; cursor: pointer; }
.hg-form-err { margin: 0; color: var(--danger-text); font-size: 0.9rem; }
.hg-form-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }

@media (max-width: 1000px) { .hg-layout { grid-template-columns: minmax(0, 1fr); } .hg-aside { display: none; } }
@media (max-width: 760px) { .hg-positions, .hg-form-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .hg-filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: calc(-1 * var(--space-4)); padding-right: var(--space-4); }
  .hg-filters::-webkit-scrollbar { display: none; }
  .hg-filters > * { flex-shrink: 0; }
  .hg-count { margin-left: var(--space-2); }
  .hg-head { padding: var(--space-4); }
  .hg-body { padding: 0 var(--space-4) var(--space-4); }
  .hg-names { display: none; }
}
@media (prefers-reduced-motion: reduce) { .hg-chev { transition: none; } }
`;
