'use client';
import { useState, useEffect, useRef } from 'react';

interface Book {
  title: string;
  author: string;
  category: 'Ancient' | 'Medieval' | 'Modern' | 'World';
  description: string;
  coverQuery: string;
  archiveUrl?: string;
  buyUrl: string;
}

const BOOKS: Book[] = [
  {
    title: 'Ancient India',
    author: 'R.S. Sharma',
    category: 'Ancient',
    description: 'The essential starting point — clear timeline, analytical grounding, and the foundational story of ancient India from Harappa to the Gupta empire.',
    coverQuery: 'Ancient India RS Sharma NCERT',
    archiveUrl: 'https://archive.org/details/AncientIndiaRSSharmaNCERT/page/n19/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Ancient+India+RS+Sharma+NCERT',
  },
  {
    title: 'A History of Ancient and Early Medieval India',
    author: 'Upinder Singh',
    category: 'Ancient',
    description: 'The current gold standard — covers sources, polity, economy, society, religion and art from prehistoric times through the early medieval period.',
    coverQuery: 'History Ancient Early Medieval India Upinder Singh',
    archiveUrl: 'https://archive.org/details/1118-singh-upinder.-a-history-of-ancient-and-early-medieval-india-2nd-ed.-easy-reading-1',
    buyUrl: 'https://www.amazon.in/s?k=Upinder+Singh+History+Ancient+Early+Medieval+India',
  },
  {
    title: 'Exploring Early India',
    author: 'Ranbir Chakravarti',
    category: 'Ancient',
    description: 'A sharper, shorter alternative — especially strong on economic history, trade networks, and urban centres of ancient India.',
    coverQuery: 'Exploring Early India Ranbir Chakravarti',
    archiveUrl: 'https://drive.google.com/file/d/1T-xNpAQ8iG1464X3-EqJ1x5h8pE3Vmtn/view',
    buyUrl: 'https://www.amazon.in/s?k=Ranbir+Chakravarti+Exploring+Early+India',
  },
  {
    title: 'The Wonder That Was India',
    author: 'A.L. Basham',
    category: 'Ancient',
    description: 'A magisterial work on the civilisational depth of ancient India — religion, philosophy, science, literature and art. Irreplaceable for cultural questions.',
    coverQuery: 'Wonder That Was India Basham',
    archiveUrl: 'https://archive.org/details/wonderthatwasind00bash',
    buyUrl: 'https://www.amazon.in/s?k=Wonder+That+Was+India+AL+Basham',
  },
  {
    title: 'Prehistory and Protohistory of India',
    author: 'V.K. Jain',
    category: 'Ancient',
    description: 'The go-to for prehistory and Harappan civilisation — rich with high-quality maps and material culture evidence that most textbooks skip.',
    coverQuery: 'Prehistory Protohistory India VK Jain',
    archiveUrl: undefined,
    buyUrl: 'https://www.amazon.in/s?k=Prehistory+Protohistory+India+VK+Jain',
  },
  {
    title: 'A History of South India',
    author: 'K.A. Nilakanta Sastri',
    category: 'Ancient',
    description: 'The definitive connected narrative of South Indian history — from ancient polities through the fall of Vijayanagar.',
    coverQuery: 'History South India Nilakanta Sastri',
    archiveUrl: 'https://archive.org/details/dli.ernet.448836/page/3/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=History+South+India+Nilakanta+Sastri',
  },
  {
    title: 'Early India',
    author: 'Romila Thapar',
    category: 'Ancient',
    description: 'A comprehensive but dense read — covers ancient India through the lens of social formation and historiography.',
    coverQuery: 'Early India Romila Thapar',
    archiveUrl: 'https://archive.org/details/earlyindiaromilathapar_58_M/page/n21/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Early+India+Romila+Thapar',
  },
  {
    title: 'Ancient India: In Historical Outline',
    author: 'D.N. Jha',
    category: 'Ancient',
    description: 'Lucid and accessible overview with a materialist perspective. Older source but useful for quick revision of key themes.',
    coverQuery: 'Ancient India Historical Outline DN Jha',
    archiveUrl: 'https://archive.org/details/AncientIndiaInHistoricalOutlineByD.N.Jha/page/n5/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Ancient+India+Historical+Outline+DN+Jha',
  },
  {
    title: 'Medieval India (Part 1 & 2)',
    author: 'Satish Chandra',
    category: 'Medieval',
    description: 'The backbone of medieval preparation — detailed political, administrative and socio-economic coverage of Sultanate and Mughal periods.',
    coverQuery: 'Medieval India Satish Chandra',
    archiveUrl: 'https://archive.org/details/history-of-medieval-india-800-1700_202303/page/1/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Medieval+India+Satish+Chandra',
  },
  {
    title: 'Advanced Study in the History of Medieval India (Vol. 3)',
    author: 'J.L. Mehta',
    category: 'Medieval',
    description: "Volume 3 is essential — the best source for Mughal culture, architecture, and personality debates like Akbar's religious policy.",
    coverQuery: 'Advanced Study History Medieval India JL Mehta',
    archiveUrl: 'https://drive.google.com/file/d/1TbQkfr7jeRserCy6HkN_X6X7ijnC28Xp/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Advanced+Study+History+Medieval+India+JL+Mehta+Volume+3',
  },
  {
    title: 'Interpreting Medieval India (Vol. 1)',
    author: 'Vipul Singh',
    category: 'Medieval',
    description: 'Strong on Delhi Sultanate debates and early medieval historiography — different schools of interpretation on state and society.',
    coverQuery: 'Interpreting Medieval India Vipul Singh',
    archiveUrl: 'https://www.scribd.com/document/730516827/Vipul-Singh-Interpreting-Medieval-India-Early-Medieval-Delhi-Sultanate-And-Regions-Circa-750-1550-01-Macmillan-2009',
    buyUrl: 'https://www.amazon.in/s?k=Interpreting+Medieval+India+Vipul+Singh',
  },
  {
    title: 'The Sultanate of Delhi',
    author: 'Aniruddha Ray',
    category: 'Medieval',
    description: "An updated and detailed treatment — can replace Satish Chandra's first volume with more current historiography.",
    coverQuery: 'Sultanate Delhi Aniruddha Ray',
    archiveUrl: 'https://drive.google.com/file/d/1egq708YzMvrxSpQpqEWu6eeRG1UzSwkX/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Sultanate+Delhi+Aniruddha+Ray',
  },
  {
    title: 'The Wonder That Was India (Part 2)',
    author: 'S.A.A. Rizvi',
    category: 'Medieval',
    description: 'The standard reference for medieval religion, Sufi and Bhakti movements, philosophy and fine arts.',
    coverQuery: 'Wonder That Was India Part 2 Rizvi medieval',
    archiveUrl: 'https://archive.org/details/TheWonderThatWasIndiaVol2SAARizvi',
    buyUrl: 'https://www.amazon.in/s?k=Wonder+That+Was+India+Part+2+Rizvi',
  },
  {
    title: 'From Plassey to Partition',
    author: 'Sekhar Bandyopadhyay',
    category: 'Modern',
    description: 'The star book for Modern India — updated historiography, comprehensive narration from colonial conquest through independence.',
    coverQuery: 'From Plassey to Partition Sekhar Bandyopadhyay',
    archiveUrl: 'https://drive.google.com/file/d/1cOR56Qn1Ojw0nKQflFercEO-ZLK9vENf/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Plassey+to+Partition+Sekhar+Bandyopadhyay',
  },
  {
    title: "India's Struggle for Independence",
    author: 'Bipan Chandra',
    category: 'Modern',
    description: "Narrative-driven and deeply readable — the best source for the freedom movement's drama and ideology.",
    coverQuery: "India Struggle Independence Bipan Chandra",
    archiveUrl: 'https://archive.org/details/indias-struggle-for-independence-bipan-chandra',
    buyUrl: 'https://www.amazon.in/s?k=India+Struggle+Independence+Bipan+Chandra',
  },
  {
    title: 'Modern India 1885–1947',
    author: 'Sumit Sarkar',
    category: 'Modern',
    description: 'Dense and fact-heavy — indispensable for specific statements, precise dates, and quotes that appear in UPSC questions.',
    coverQuery: 'Modern India 1885 Sumit Sarkar',
    archiveUrl: 'https://archive.org/details/modernindia1885100sark/page/n5/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Modern+India+1885+1947+Sumit+Sarkar',
  },
  {
    title: 'A New Look at Modern Indian History',
    author: 'Grover & Mehta',
    category: 'Modern',
    description: 'Excellent reference for the policies of Governor Generals and the pre-Congress colonial era — fills gaps that other books leave.',
    coverQuery: 'New Look Modern Indian History Grover Mehta',
    archiveUrl: 'https://drive.google.com/file/d/1iFHcop_uVBjMI1TbhsUcj0L5NTiylNTq/view?usp=drive_link',
    buyUrl: 'https://www.amazon.in/s?k=New+Look+Modern+Indian+History+Grover+Mehta',
  },
  {
    title: 'A History of the Modern World',
    author: 'Ranjan Chakrabarti',
    category: 'World',
    description: 'The strongest source for 18th and 19th century world history — many UPSC questions come directly from this book.',
    coverQuery: 'History Modern World Ranjan Chakrabarti',
    archiveUrl: 'https://drive.google.com/file/d/1otp1NFebUS92LcVUZOJ13Q7Ul_Be4hvg/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=History+Modern+World+Ranjan+Chakrabarti',
  },
  {
    title: 'Mastering Modern World History',
    author: 'Norman Lowe',
    category: 'World',
    description: 'The definitive source for 20th century world history — wars, revolutions, Cold War, decolonisation.',
    coverQuery: 'Mastering Modern World History Norman Lowe',
    archiveUrl: 'https://archive.org/details/NormanLoweMasteringModernWorldHistoryzLib.org/page/n215/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Mastering+Modern+World+History+Norman+Lowe',
  },
  {
    title: 'The Story of Civilization',
    author: 'Arjun Dev (Old NCERT)',
    category: 'World',
    description: "Balances Norman Lowe's Western bias with a Third World perspective — essential for decolonisation and non-European history.",
    coverQuery: 'Story of Civilization Arjun Dev NCERT',
    archiveUrl: 'https://archive.org/details/the-story-of-civilization-vol-ii/page/306/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Story+Civilization+Arjun+Dev+NCERT',
  },
  {
    title: 'A Concise History of Modern Europe',
    author: 'David Mason',
    category: 'World',
    description: 'Short and academic — the perfect primer for European history from the French Revolution to the 20th century.',
    coverQuery: 'Concise History Modern Europe David Mason',
    archiveUrl: 'https://drive.google.com/file/d/1zS2sY2-ksOSxOB_kCVzYpmll5cY7dIl1/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Concise+History+Modern+Europe+David+Mason',
  },
  {
    title: 'Europe Since Napoleon',
    author: 'David Thomson',
    category: 'World',
    description: 'High-quality nuanced analysis of European history — best for understanding the intellectual undercurrents behind major events.',
    coverQuery: 'Europe Since Napoleon David Thomson',
    archiveUrl: 'https://archive.org/details/europe-since-napoleon-david-thomson/page/682/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Europe+Since+Napoleon+David+Thomson',
  },
];

const CAT = {
  Ancient:  { color: '#c9993a', bg: 'rgba(201,153,58,0.09)',  border: 'rgba(201,153,58,0.22)',  label: 'Ancient India' },
  Medieval: { color: '#7c9e6e', bg: 'rgba(124,158,110,0.09)', border: 'rgba(124,158,110,0.22)', label: 'Medieval India' },
  Modern:   { color: '#6e8eb8', bg: 'rgba(110,142,184,0.09)', border: 'rgba(110,142,184,0.22)', label: 'Modern India' },
  World:    { color: '#a07bbf', bg: 'rgba(160,123,191,0.09)', border: 'rgba(160,123,191,0.22)', label: 'World History' },
};

const CATEGORIES = ['All', 'Ancient', 'Medieval', 'Modern', 'World'] as const;

function BookCover({ query, title, color }: { query: string; title: string; color: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    const q = encodeURIComponent(query);
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
      .then(r => r.json())
      .then(d => {
        const img = d?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (img) setSrc(img.replace('http:', 'https:').replace('zoom=1', 'zoom=3'));
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [query]);

  if (!failed && src) {
    return (
      <img
        src={src}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }

  if (!failed && !src) {
    return (
      <div style={{ width: '100%', height: '100%', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: `2px solid ${color}35`,
          borderTopColor: color,
          animation: 'bookspin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  const initials = title.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `${color}10`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0.6rem', gap: 8,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 7,
        background: `${color}20`, border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.78rem', fontWeight: 700, color,
        fontFamily: 'Georgia, serif',
      }}>{initials}</div>
      <p style={{
        fontSize: '0.46rem', color, lineHeight: 1.35,
        textAlign: 'center', fontFamily: 'Georgia, serif',
        fontWeight: 600, margin: 0,
      }}>{title.slice(0, 40)}</p>
    </div>
  );
}

export default function ResourcesPage() {
  const [active, setActive] = useState<string>('All');
  const filtered = active === 'All' ? BOOKS : BOOKS.filter(b => b.category === active);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '5rem' }}>
      <style>{`
        @keyframes bookspin { to { transform: rotate(360deg); } }
        .bcard { transition: background 0.18s; }
        .bcard:hover { background: var(--bg2, rgba(255,255,255,0.025)) !important; }
        .bcard:hover .bcover { box-shadow: 5px 10px 28px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05) !important; transform: translateY(-2px) rotate(-1deg); }
        .bcover { transition: box-shadow 0.22s, transform 0.22s; }
        .rbtn { transition: opacity 0.12s; }
        .rbtn:hover { opacity: 0.82; }
        .bbtn { transition: background 0.12s, color 0.12s; }
        .bbtn:hover { background: rgba(255,255,255,0.05) !important; color: var(--text2) !important; }
        .ftab { transition: all 0.14s; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{
        padding: 'clamp(2.5rem,6vw,4rem) 1.5rem 2.5rem',
        borderBottom: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: `
            repeating-linear-gradient(0deg, var(--text) 0, var(--text) 1px, transparent 0, transparent 48px),
            repeating-linear-gradient(90deg, var(--text) 0, var(--text) 1px, transparent 0, transparent 48px)`,
        }} />
        {/* decorative roman numeral */}
        <div style={{
          position: 'absolute', right: '-1rem', top: '50%', transform: 'translateY(-50%)',
          fontSize: 'clamp(6rem,15vw,12rem)', fontFamily: 'Georgia, serif',
          color: 'var(--text)', opacity: 0.018, fontWeight: 700,
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.05em',
        }}>MMXXVI</div>

        <div style={{ maxWidth: 580, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <div style={{ width: 28, height: 1, background: 'var(--text3)' }} />
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--text3)', margin: 0,
            }}>History Optional · Curated Reading List</p>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 'clamp(2rem, 5.5vw, 3.2rem)',
            fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            margin: '0 0 1.1rem',
          }}>Additional Reads &amp;<br />Basic Resources</h1>
          <p style={{
            color: 'var(--text2)', fontSize: '0.87rem',
            lineHeight: 1.7, maxWidth: 440, margin: 0,
          }}>
            Every book you need for UPSC History Optional — with free reading links and Amazon listings.
          </p>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0.65rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        overflowX: 'auto', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map(cat => {
          const isAll = cat === 'All';
          const meta = isAll ? null : CAT[cat as keyof typeof CAT];
          const color = isAll ? 'var(--text2)' : meta!.color;
          const isActive = active === cat;
          return (
            <button
              key={cat}
              className="ftab"
              onClick={() => setActive(cat)}
              style={{
                padding: '0.32rem 0.9rem',
                borderRadius: 20,
                border: isActive ? `1px solid ${color}` : '1px solid var(--border)',
                background: isActive ? (meta ? meta.bg : 'rgba(255,255,255,0.05)') : 'transparent',
                color: isActive ? color : 'var(--text3)',
                fontSize: '0.73rem',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit', flexShrink: 0,
              }}
            >{isAll ? 'All Books' : meta!.label}</button>
          );
        })}
        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text3)',
        }}>
          {filtered.length} books
        </span>
      </div>

      {/* ── BOOK GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))',
        gap: '1px',
        background: 'var(--border)',
      }}>
        {filtered.map((book) => {
          const meta = CAT[book.category];
          return (
            <div
              key={book.title}
              className="bcard"
              style={{
                background: 'var(--bg)',
                padding: '1.4rem 1.25rem',
                display: 'flex', gap: '1.1rem',
              }}
            >
              {/* cover */}
              <div
                className="bcover"
                style={{
                  flexShrink: 0, width: 84, height: 120,
                  borderRadius: 5, overflow: 'hidden',
                  border: `1px solid ${meta.border}`,
                  boxShadow: `4px 7px 20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)`,
                  position: 'relative',
                }}
              >
                <BookCover query={book.coverQuery} title={book.title} color={meta.color} />
                {/* spine shadow */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 10,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: '0.57rem', fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.13em', textTransform: 'uppercase',
                  color: meta.color, fontWeight: 700,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
                  {meta.label}
                </span>

                <h2 style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '0.9rem', fontWeight: 700,
                  color: 'var(--text)', lineHeight: 1.3,
                  letterSpacing: '-0.015em',
                }}>{book.title}</h2>

                <p style={{
                  margin: 0, fontSize: '0.7rem',
                  color: 'var(--text3)', fontStyle: 'italic',
                }}>{book.author}</p>

                <div style={{ width: 22, height: 1, background: `${meta.color}45`, margin: '0.1rem 0 0.2rem' }} />

                <p style={{
                  margin: 0, fontSize: '0.75rem',
                  color: 'var(--text2)', lineHeight: 1.62,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{book.description}</p>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.55rem', flexWrap: 'wrap' }}>
                  {book.archiveUrl && (
                    <a
                      href={book.archiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rbtn"
                      style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: 4,
                        background: meta.color,
                        color: '#0c0c0c',
                        fontSize: '0.67rem', fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        whiteSpace: 'nowrap', flexShrink: 0,
                        letterSpacing: '0.01em',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5a4 4 0 108 0 4 4 0 00-8 0z" stroke="#0c0c0c" strokeWidth="1.1"/>
                        <path d="M3.5 5h3M5 3.5l1.5 1.5L5 6.5" stroke="#0c0c0c" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Read Free
                    </a>
                  )}
                  <a
                    href={book.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bbtn"
                    style={{
                      padding: '0.3rem 0.85rem',
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent',
                      color: 'var(--text3)',
                      fontSize: '0.67rem', fontWeight: 500,
                      textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M1 1h1l1.4 5.5h4.2l.9-3.5H3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="4.5" cy="8.5" r="0.7" fill="currentColor"/>
                      <circle cx="7.5" cy="8.5" r="0.7" fill="currentColor"/>
                    </svg>
                    Buy on Amazon
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '2rem 1.5rem', textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '0.6rem' }}>
          <div style={{ height: 1, width: 32, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)' }}>Note</span>
          <div style={{ height: 1, width: 32, background: 'var(--border)' }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text3)', lineHeight: 1.75, margin: 0, maxWidth: 480, marginInline: 'auto' }}>
          Free links go to Archive.org, Google Drive, or Scribd — no login needed for most.<br />
          Buy links search Amazon India for the paperback edition.
        </p>
      </div>
    </main>
  );
}
