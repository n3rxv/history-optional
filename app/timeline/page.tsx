'use client';
import { useState } from 'react';

type Event = {
  year: number;
  yearLabel: string;
  title: string;
  description: string;
  category: string;
  paper: 1 | 2;
  section: string;
};

const events: Event[] = [
  { year: -2600, yearLabel: '2600 BCE', title: 'Indus Valley Civilization', description: 'Peak phase of IVC — Mohenjo-daro and Harappa flourish with advanced town planning', category: 'Ancient India', paper: 1, section: 'Ancient India' },
  { year: -1500, yearLabel: '1500 BCE', title: 'Aryan Migration & Rig Veda', description: 'Composition of the Rig Veda; Aryan expansion into the Indian subcontinent', category: 'Ancient India', paper: 1, section: 'Ancient India' },
  { year: -600, yearLabel: '600 BCE', title: 'Period of Mahajanapadas', description: '16 Mahajanapadas emerge; rise of urban centers, trade routes, coinage', category: 'Ancient India', paper: 1, section: 'Ancient India' },
  { year: -563, yearLabel: '563 BCE', title: 'Birth of Gautama Buddha', description: 'Siddhartha Gautama born in Lumbini (Nepal)', category: 'Ancient India', paper: 1, section: 'Ancient India' },
  { year: -540, yearLabel: '540 BCE', title: 'Birth of Mahavira', description: 'Vardhamana Mahavira born; later becomes 24th Tirthankara of Jainism', category: 'Ancient India', paper: 1, section: 'Ancient India' },
  { year: -322, yearLabel: '322 BCE', title: 'Foundation of Mauryan Empire', description: 'Chandragupta Maurya overthrows Nanda dynasty with Kautilya\'s guidance', category: 'Mauryan', paper: 1, section: 'Ancient India' },
  { year: -268, yearLabel: '268 BCE', title: 'Ashoka becomes Emperor', description: 'Ashoka ascends the Mauryan throne; later converts to Buddhism after Kalinga War', category: 'Mauryan', paper: 1, section: 'Ancient India' },
  { year: -261, yearLabel: '261 BCE', title: 'Kalinga War', description: 'Ashoka\'s conquest of Kalinga; transformation in his worldview leads to Dhamma policy', category: 'Mauryan', paper: 1, section: 'Ancient India' },
  { year: -185, yearLabel: '185 BCE', title: 'End of Mauryan Empire', description: 'Pushyamitra Shunga kills last Maurya king; Shunga dynasty begins', category: 'Mauryan', paper: 1, section: 'Ancient India' },
  { year: 320, yearLabel: '320 CE', title: 'Gupta Empire Founded', description: 'Chandragupta I founds Gupta dynasty; beginning of the "Golden Age" of India', category: 'Gupta', paper: 1, section: 'Ancient India' },
  { year: 380, yearLabel: '380 CE', title: 'Samudragupta\'s Expansion', description: 'Military campaigns across India; Allahabad Pillar inscription records conquests', category: 'Gupta', paper: 1, section: 'Ancient India' },
  { year: 750, yearLabel: '750 CE', title: 'Tripartite Struggle Begins', description: 'Palas, Pratiharas and Rashtrakutas contest for Kannauj', category: 'Medieval', paper: 1, section: 'Medieval India' },
  { year: 1192, yearLabel: '1192 CE', title: 'Second Battle of Tarain', description: 'Muhammad Ghori defeats Prithviraj Chauhan; Ghurian conquest of India established', category: 'Sultanate', paper: 1, section: 'Medieval India' },
  { year: 1206, yearLabel: '1206 CE', title: 'Foundation of Delhi Sultanate', description: 'Qutb-ud-din Aibak becomes sultan; start of 320-year Sultanate period', category: 'Sultanate', paper: 1, section: 'Medieval India' },
  { year: 1296, yearLabel: '1296 CE', title: 'Alauddin Khalji becomes Sultan', description: 'Khalji Revolution; agrarian and market reforms transform Delhi Sultanate', category: 'Sultanate', paper: 1, section: 'Medieval India' },
  { year: 1336, yearLabel: '1336 CE', title: 'Vijayanagara Empire Founded', description: 'Harihara and Bukka Raya found Vijayanagara in South India; major Hindu kingdom', category: 'Vijayanagara', paper: 1, section: 'Medieval India' },
  { year: 1526, yearLabel: '1526 CE', title: 'First Battle of Panipat', description: 'Babur defeats Ibrahim Lodi; Mughal Empire established in India', category: 'Mughal', paper: 1, section: 'Medieval India' },
  { year: 1556, yearLabel: '1556 CE', title: 'Akbar becomes Emperor', description: 'Akbar begins reign; builds largest Indian empire and introduces Din-i-Ilahi', category: 'Mughal', paper: 1, section: 'Medieval India' },
  { year: 1600, yearLabel: '1600 CE', title: 'East India Company Founded', description: 'British East India Company established by royal charter; enters Indian trade', category: 'Modern', paper: 2, section: 'Modern India' },
  { year: 1658, yearLabel: '1658 CE', title: 'Aurangzeb becomes Emperor', description: 'Aurangzeb imprisons father Shahjahan; reign marks beginning of Mughal decline', category: 'Mughal', paper: 1, section: 'Medieval India' },
  { year: 1757, yearLabel: '1757 CE', title: 'Battle of Plassey', description: 'Clive defeats Siraj-ud-Daula; British power established in Bengal', category: 'Modern', paper: 2, section: 'Modern India' },
  { year: 1764, yearLabel: '1764 CE', title: 'Battle of Buxar', description: 'British decisively defeat combined forces; complete political control over Bengal', category: 'Modern', paper: 2, section: 'Modern India' },
  { year: 1793, yearLabel: '1793 CE', title: 'Permanent Settlement', description: 'Cornwallis introduces Permanent Settlement in Bengal; zamindari system created', category: 'Modern', paper: 2, section: 'Modern India' },
  { year: 1857, yearLabel: '1857 CE', title: 'The Great Revolt', description: 'Revolt of 1857 — first major uprising against British rule', category: 'Modern', paper: 2, section: 'Modern India' },
  { year: 1885, yearLabel: '1885 CE', title: 'Indian National Congress Founded', description: 'INC founded; A.O. Hume; beginning of organized nationalist movement', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1905, yearLabel: '1905 CE', title: 'Partition of Bengal & Swadeshi', description: 'Curzon partitions Bengal; Swadeshi Movement begins; Tilak leads Extremists', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1919, yearLabel: '1919 CE', title: 'Rowlatt Act & Jallianwala Bagh', description: 'Gandhi launches Rowlatt Satyagraha; Jallianwala Bagh massacre — turning point', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1920, yearLabel: '1920 CE', title: 'Non-Cooperation Movement', description: 'Gandhi launches Non-Cooperation and Khilafat Movement; mass mobilisation', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1930, yearLabel: '1930 CE', title: 'Civil Disobedience Movement', description: 'Gandhi\'s Dandi March; Salt Satyagraha; Civil Disobedience Movement launched', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1942, yearLabel: '1942 CE', title: 'Quit India Movement', description: 'Gandhi gives "Do or Die" call; Quit India Movement — most mass uprising since 1857', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1947, yearLabel: '1947 CE', title: 'Indian Independence & Partition', description: 'India and Pakistan gain independence; Partition and transfer of power', category: 'National Movement', paper: 2, section: 'Modern India' },
  { year: 1789, yearLabel: '1789 CE', title: 'French Revolution', description: 'Fall of Bastille; Declaration of Rights of Man; end of Ancien Régime', category: 'World History', paper: 2, section: 'World History' },
  { year: 1776, yearLabel: '1776 CE', title: 'American Revolution', description: 'Declaration of Independence; foundation of the United States of America', category: 'World History', paper: 2, section: 'World History' },
  { year: 1848, yearLabel: '1848 CE', title: 'Revolutions across Europe', description: 'Wave of revolutions in France, Germany, Austria-Hungary, Italy', category: 'World History', paper: 2, section: 'World History' },
  { year: 1871, yearLabel: '1871 CE', title: 'Unification of Germany & Italy', description: 'Bismarck unifies Germany; Italian Risorgimento culminates in unified Italy', category: 'World History', paper: 2, section: 'World History' },
  { year: 1914, yearLabel: '1914 CE', title: 'World War I Begins', description: 'Assassination of Franz Ferdinand; alliance system drags Europe into total war', category: 'World History', paper: 2, section: 'World History' },
  { year: 1917, yearLabel: '1917 CE', title: 'Russian Revolution', description: 'February Revolution; October Revolution; Bolsheviks seize power under Lenin', category: 'World History', paper: 2, section: 'World History' },
  { year: 1939, yearLabel: '1939 CE', title: 'World War II Begins', description: 'Germany invades Poland; Britain and France declare war', category: 'World History', paper: 2, section: 'World History' },
  { year: 1945, yearLabel: '1945 CE', title: 'World War II Ends', description: 'Germany surrenders; atomic bombs on Japan; UN founded; Cold War begins', category: 'World History', paper: 2, section: 'World History' },
  { year: 1949, yearLabel: '1949 CE', title: 'Chinese Revolution', description: 'Mao Zedong declares People\'s Republic of China after defeating Nationalists', category: 'World History', paper: 2, section: 'World History' },
  { year: 1991, yearLabel: '1991 CE', title: 'Dissolution of Soviet Union', description: 'Soviet Union dissolves; Cold War ends; US emerges as sole superpower', category: 'World History', paper: 2, section: 'World History' },
];

const CATEGORIES = [...new Set(events.map(e => e.category))];
const SECTIONS = [...new Set(events.map(e => e.section))];

const CATEGORY_COLORS: Record<string, string> = {
  'Ancient India': '#c9a84c',
  'Mauryan': '#c97a4c',
  'Gupta': '#c9c44c',
  'Medieval': '#6a9c5a',
  'Sultanate': '#5a8a9c',
  'Vijayanagara': '#9c5a8a',
  'Mughal': '#8a6a9c',
  'Modern': '#4c8bc9',
  'National Movement': '#c94c4c',
  'World History': '#4cad7a',
};

export default function TimelinePage() {
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Event | null>(null);

  const filtered = events
    .filter(e => filterSection === 'all' || e.section === filterSection)
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .sort((a, b) => a.year - b.year);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>History Optional</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Historical Timeline</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{events.length} events from 2600 BCE to 1991 CE</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem', color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer' }}>
          <option value="all">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem', color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: 'var(--text3)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{filtered.length} events</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {CATEGORIES.filter(c => filterCategory === 'all' || c === filterCategory).map(cat => (
          <span key={cat} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.72rem', color: 'var(--text2)',
            padding: '3px 8px', borderRadius: 20,
            background: 'var(--bg2)', border: '1px solid var(--border)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] || 'var(--accent)', flexShrink: 0 }} />
            {cat}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Center line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0, bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, transparent, var(--border) 5%, var(--border) 95%, transparent)',
          transform: 'translateX(-50%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((event, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
              position: 'relative',
            }}>
              {/* Year label on center */}
              <div style={{
                position: 'absolute',
                left: '50%', transform: 'translateX(-50%)',
                top: '50%', marginTop: -12,
                background: 'var(--bg)',
                border: `2px solid ${CATEGORY_COLORS[event.category] || 'var(--accent)'}`,
                borderRadius: '50%',
                width: 12, height: 12,
                zIndex: 2,
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              onClick={() => setSelected(selected?.title === event.title ? null : event)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)'; }}
              />

              {/* Card */}
              <div style={{
                width: 'calc(50% - 2rem)',
                marginLeft: i % 2 === 0 ? 0 : 'auto',
                marginRight: i % 2 !== 0 ? 0 : 'auto',
                background: selected?.title === event.title ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${selected?.title === event.title ? CATEGORY_COLORS[event.category] : 'var(--border)'}`,
                borderRadius: 8,
                padding: '0.85rem 1.1rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => setSelected(selected?.title === event.title ? null : event)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = CATEGORY_COLORS[event.category] || 'var(--accent)'; }}
              onMouseLeave={e => { if (selected?.title !== event.title) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                    color: CATEGORY_COLORS[event.category] || 'var(--accent)',
                    background: `${CATEGORY_COLORS[event.category]}18`,
                    border: `1px solid ${CATEGORY_COLORS[event.category]}40`,
                    padding: '1px 7px', borderRadius: 3,
                  }}>{event.yearLabel}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 3 }}>{event.category}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                  {event.title}
                </div>
                {selected?.title === event.title && (
                  <div style={{ color: 'var(--text2)', fontSize: '0.82rem', lineHeight: 1.5, marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
