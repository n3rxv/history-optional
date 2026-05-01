'use client';
import { useState } from 'react';

interface Book {
  title: string;
  author: string;
  category: 'Ancient' | 'Medieval' | 'Modern' | 'World';
  description: string;
  coverUrl: string;
  archiveUrl?: string;
  buyUrl: string;
}

const BOOKS: Book[] = [
  // ── ANCIENT ──────────────────────────────────────────────────────────────────
  {
    title: 'Ancient India',
    author: 'R.S. Sharma',
    category: 'Ancient',
    description: 'The essential starting point — clear timeline, analytical grounding, and the foundational story of ancient India from Harappa to the Gupta empire.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8174505067-L.jpg',
    archiveUrl: 'https://archive.org/details/AncientIndiaRSSharmaNCERT/page/n19/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Ancient+India+RS+Sharma+NCERT',
  },
  {
    title: 'A History of Ancient and Early Medieval India',
    author: 'Upinder Singh',
    category: 'Ancient',
    description: 'The current gold standard — covers sources, polity, economy, society, religion and art from prehistoric times through the early medieval period. Indispensable for UPSC.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788131716779-L.jpg',
    archiveUrl: 'https://archive.org/details/1118-singh-upinder.-a-history-of-ancient-and-early-medieval-india-2nd-ed.-easy-reading-1',
    buyUrl: 'https://www.amazon.in/s?k=Upinder+Singh+History+Ancient+Early+Medieval+India',
  },
  {
    title: 'Exploring Early India',
    author: 'Ranbir Chakravarti',
    category: 'Ancient',
    description: 'A sharper, shorter alternative to Upinder Singh — especially strong on economic history, trade networks, and urban centres of ancient India.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788131602898-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1T-xNpAQ8iG1464X3-EqJ1x5h8pE3Vmtn/view',
    buyUrl: 'https://www.amazon.in/s?k=Ranbir+Chakravarti+Exploring+Early+India',
  },
  {
    title: 'The Wonder That Was India',
    author: 'A.L. Basham',
    category: 'Ancient',
    description: 'A magisterial work on the civilisational depth of ancient India — religion, philosophy, science, literature and art. Irreplaceable for cultural questions.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8172232977-L.jpg',
    archiveUrl: 'https://archive.org/details/wonderthatwasind00bash',
    buyUrl: 'https://www.amazon.in/s?k=Wonder+That+Was+India+AL+Basham',
  },
  {
    title: 'Prehistory and Protohistory of India',
    author: 'V.K. Jain',
    category: 'Ancient',
    description: 'The go-to for prehistory and Harappan civilisation — rich with high-quality maps and material culture evidence that most textbooks skip.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788121507226-L.jpg',
    archiveUrl: undefined,
    buyUrl: 'https://www.amazon.in/s?k=Prehistory+Protohistory+India+VK+Jain',
  },
  {
    title: 'A History of South India',
    author: 'K.A. Nilakanta Sastri',
    category: 'Ancient',
    description: 'The definitive connected narrative of South Indian history from ancient polities through the fall of Vijayanagar. No other source matches its depth on the Deccan.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0195605519-L.jpg',
    archiveUrl: 'https://archive.org/details/dli.ernet.448836/page/3/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=History+South+India+Nilakanta+Sastri',
  },
  {
    title: 'Early India',
    author: 'Romila Thapar',
    category: 'Ancient',
    description: 'A comprehensive but dense read — covers ancient India through the lens of social formation and historiography. Largely supplementary if you have Upinder Singh.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0520242254-L.jpg',
    archiveUrl: 'https://archive.org/details/earlyindiaromilathapar_58_M/page/n21/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Early+India+Romila+Thapar',
  },
  {
    title: 'Ancient India: In Historical Outline',
    author: 'D.N. Jha',
    category: 'Ancient',
    description: 'Lucid and accessible overview of ancient India with a materialist perspective. Older source but useful for quick revision of key themes.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8173044619-L.jpg',
    archiveUrl: 'https://archive.org/details/AncientIndiaInHistoricalOutlineByD.N.Jha/page/n5/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Ancient+India+Historical+Outline+DN+Jha',
  },

  // ── MEDIEVAL ─────────────────────────────────────────────────────────────────
  {
    title: 'Medieval India (Part 1 & 2)',
    author: 'Satish Chandra',
    category: 'Medieval',
    description: 'The backbone of medieval preparation — detailed political, administrative and socio-economic coverage of Sultanate and Mughal periods across two volumes.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788125024491-L.jpg',
    archiveUrl: 'https://archive.org/details/history-of-medieval-india-800-1700_202303/page/1/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Medieval+India+Satish+Chandra',
  },
  {
    title: 'Advanced Study in the History of Medieval India (Vol. 3)',
    author: 'J.L. Mehta',
    category: 'Medieval',
    description: 'Volume 3 is essential — the best source for Mughal culture, architecture, and personality-based debates like Akbar\'s religious policy and Amir Khusrau.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8121503566-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1TbQkfr7jeRserCy6HkN_X6X7ijnC28Xp/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Advanced+Study+History+Medieval+India+JL+Mehta+Volume+3',
  },
  {
    title: 'Interpreting Medieval India (Vol. 1)',
    author: 'Vipul Singh',
    category: 'Medieval',
    description: 'Strong on Delhi Sultanate debates and early medieval historiography. Good for understanding different schools of interpretation on state and society.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9789350980101-L.jpg',
    archiveUrl: 'https://www.scribd.com/document/730516827/Vipul-Singh-Interpreting-Medieval-India-Early-Medieval-Delhi-Sultanate-And-Regions-Circa-750-1550-01-Macmillan-2009',
    buyUrl: 'https://www.amazon.in/s?k=Interpreting+Medieval+India+Vipul+Singh',
  },
  {
    title: 'The Sultanate of Delhi',
    author: 'Aniruddha Ray',
    category: 'Medieval',
    description: 'An updated and detailed treatment of the Delhi Sultanate — can replace Satish Chandra\'s first volume with more current historiography and analysis.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788131602317-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1egq708YzMvrxSpQpqEWu6eeRG1UzSwkX/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Sultanate+Delhi+Aniruddha+Ray',
  },
  {
    title: 'The Wonder That Was India (Part 2)',
    author: 'S.A.A. Rizvi',
    category: 'Medieval',
    description: 'The standard reference for medieval religion, Sufi and Bhakti movements, philosophy and fine arts. A backup to IGNOU for cultural questions.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0283992166-L.jpg',
    archiveUrl: 'https://archive.org/details/TheWonderThatWasIndiaVol2SAARizvi',
    buyUrl: 'https://www.amazon.in/s?k=Wonder+That+Was+India+Part+2+Rizvi',
  },

  // ── MODERN ───────────────────────────────────────────────────────────────────
  {
    title: 'From Plassey to Partition',
    author: 'Sekhar Bandyopadhyay',
    category: 'Modern',
    description: 'The star book for Modern India — updated historiography, comprehensive narration from colonial conquest through independence. Non-negotiable for History Optional.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788125027980-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1cOR56Qn1Ojw0nKQflFercEO-ZLK9vENf/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=Plassey+to+Partition+Sekhar+Bandyopadhyay',
  },
  {
    title: "India's Struggle for Independence",
    author: 'Bipan Chandra',
    category: 'Modern',
    description: 'Narrative-driven and deeply readable — the best source for the freedom movement\'s drama and ideology. Its conclusions are safe and well-accepted for UPSC.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0140107819-L.jpg',
    archiveUrl: 'https://archive.org/details/indias-struggle-for-independence-bipan-chandra',
    buyUrl: 'https://www.amazon.in/s?k=India+Struggle+Independence+Bipan+Chandra',
  },
  {
    title: 'Modern India 1885–1947',
    author: 'Sumit Sarkar',
    category: 'Modern',
    description: 'Dense and fact-heavy — indispensable for specific statements, precise dates, and quotes that appear in UPSC questions. Use alongside Bandyopadhyay.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0333904257-L.jpg',
    archiveUrl: 'https://archive.org/details/modernindia1885100sark/page/n5/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Modern+India+1885+1947+Sumit+Sarkar',
  },
  {
    title: 'A New Look at Modern Indian History',
    author: 'Grover & Mehta',
    category: 'Modern',
    description: 'Excellent reference for the policies of Governor Generals and the pre-Congress colonial era — fills gaps that other modern history books leave.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8121906067-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1iFHcop_uVBjMI1TbhsUcj0L5NTiylNTq/view?usp=drive_link',
    buyUrl: 'https://www.amazon.in/s?k=New+Look+Modern+Indian+History+Grover+Mehta',
  },

  // ── WORLD ────────────────────────────────────────────────────────────────────
  {
    title: 'A History of the Modern World',
    author: 'Ranjan Chakrabarti',
    category: 'World',
    description: 'The strongest source for 18th and 19th century world history — many UPSC questions come directly from this book. Start here for Paper 1 World section.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788131731765-L.jpg',
    archiveUrl: 'https://drive.google.com/file/d/1otp1NFebUS92LcVUZOJ13Q7Ul_Be4hvg/view?usp=sharing',
    buyUrl: 'https://www.amazon.in/s?k=History+Modern+World+Ranjan+Chakrabarti',
  },
  {
    title: 'Mastering Modern World History',
    author: 'Norman Lowe',
    category: 'World',
    description: 'The definitive source for 20th century world history — wars, revolutions, Cold War, decolonisation. UK-centric but comprehensive. Pair with Arjun Dev for balance.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780230580633-L.jpg',
    archiveUrl: 'https://archive.org/details/NormanLoweMasteringModernWorldHistoryzLib.org/page/n215/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Mastering+Modern+World+History+Norman+Lowe',
  },
  {
    title: 'The Story of Civilization',
    author: 'Arjun Dev (Old NCERT)',
    category: 'World',
    description: 'Balances Norman Lowe\'s Western bias with a Third World perspective — essential for decolonisation, nationalism in Asia and Africa, and non-European history.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/8174504915-L.jpg',
    archiveUrl: 'https://archive.org/details/the-story-of-civilization-vol-ii/page/306/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Story+Civilization+Arjun+Dev+NCERT',
  },
  {
    title: 'A Concise History of Modern Europe',
    author: 'David Mason',
    category: 'World',
    description: 'Short and academic — the perfect primer for European history from the French Revolution to the 20th century. Read before Lowe for context.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780742562653-L.jpg',
    archiveUrl: 'https://archive.org/search?query=Concise+History+Modern+Europe+David+Mason',
    buyUrl: 'https://www.amazon.in/s?k=Concise+History+Modern+Europe+David+Mason',
  },
  {
    title: 'Europe Since Napoleon',
    author: 'David Thomson',
    category: 'World',
    description: 'High-quality nuanced analysis of European history — best for understanding the intellectual and political undercurrents behind major events. Time-consuming but rewarding.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/0140136053-L.jpg',
    archiveUrl: 'https://archive.org/details/europe-since-napoleon-david-thomson/page/682/mode/2up',
    buyUrl: 'https://www.amazon.in/s?k=Europe+Since+Napoleon+David+Thomson',
  },
];

const CATEGORY_META: Record<string, { color: string; label: string }> = {
  Ancient:  { color: '#c9993a', label: 'Ancient India' },
  Medieval: { color: '#7c9e6e', label: 'Medieval India' },
  Modern:   { color: '#6e8eb8', label: 'Modern India' },
  World:    { color: '#a07bbf', label: 'World History' },
};

const CATEGORIES = ['All', 'Ancient', 'Medieval', 'Modern', 'World'] as const;

export default function ResourcesPage() {
  const [active, setActive] = useState<string>('All');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filtered = active === 'All' ? BOOKS : BOOKS.filter(b => b.category === active);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      paddingBottom: '4rem',
    }}>
      {/* Hero */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '3rem 1.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'repeating-linear-gradient(0deg, var(--text) 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, var(--text) 0px, transparent 1px, transparent 40px)',
          pointerEvents: 'none',
        }} />
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
          marginBottom: '0.75rem',
        }}>History Optional · Reading List</p>
        <h1 style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          margin: '0 0 0.75rem',
          lineHeight: 1.2,
        }}>Additional Reads &amp; Basic Resources</h1>
        <p style={{
          color: 'var(--text2)',
          fontSize: '0.9rem',
          maxWidth: 480,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Every book you need for UPSC History Optional — curated, with free reading links and buy options.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        padding: '1.25rem 1.5rem',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map(cat => {
          const isActive = active === cat;
          const color = cat === 'All' ? 'var(--text2)' : CATEGORY_META[cat].color;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 20,
                border: isActive ? `1px solid ${color}` : '1px solid var(--border)',
                background: isActive ? `${color}18` : 'transparent',
                color: isActive ? color : 'var(--text3)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              {cat === 'All' ? 'All Books' : CATEGORY_META[cat].label}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text3)' }}>
            {filtered.length} books
          </span>
        </div>
      </div>

      {/* Books grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
        gap: '1px',
        background: 'var(--border)',
        margin: '0',
      }}>
        {filtered.map((book) => {
          const meta = CATEGORY_META[book.category];
          const hasImgError = imgErrors[book.title];
          return (
            <div
              key={book.title}
              style={{
                background: 'var(--bg)',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2, rgba(255,255,255,0.03))')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
            >
              {/* Cover */}
              <div style={{
                flexShrink: 0,
                width: 72,
                height: 104,
                borderRadius: 4,
                overflow: 'hidden',
                background: `${meta.color}15`,
                border: `1px solid ${meta.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '4px 4px 12px rgba(0,0,0,0.3)',
              }}>
                {!hasImgError ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={() => setImgErrors(e => ({ ...e, [book.title]: true }))}
                  />
                ) : (
                  <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>📖</div>
                    <p style={{ fontSize: '0.5rem', color: meta.color, lineHeight: 1.3, fontWeight: 600 }}>{book.title.slice(0, 30)}</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {/* Category tag */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.58rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: meta.color,
                  fontWeight: 700,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                  {meta.label}
                </span>

                {/* Title */}
                <h2 style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                }}>{book.title}</h2>

                {/* Author */}
                <p style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  color: 'var(--text3)',
                  fontStyle: 'italic',
                }}>{book.author}</p>

                {/* Description */}
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: 'var(--text2)',
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{book.description}</p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.35rem', flexWrap: 'wrap' }}>
                  {book.archiveUrl && (
                    <a
                      href={book.archiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: 4,
                        border: `1px solid ${meta.color}50`,
                        background: `${meta.color}12`,
                        color: meta.color,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'background 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${meta.color}22`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${meta.color}12`)}
                    >
                      <span style={{ fontSize: '0.65rem' }}>📖</span> Read Free
                    </a>
                  )}
                  <a
                    href={book.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: 4,
                      border: '1px solid var(--border2, rgba(255,255,255,0.12))',
                      background: 'transparent',
                      color: 'var(--text2)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'border-color 0.15s, color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text3)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2, rgba(255,255,255,0.12))'; e.currentTarget.style.color = 'var(--text2)'; }}
                  >
                    <span style={{ fontSize: '0.65rem' }}>🛒</span> Buy
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{
        padding: '1.5rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        marginTop: 0,
      }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
          Free links go to Archive.org — open library, no login needed for most books. Buy links go to Flipkart.
        </p>
      </div>
    </main>
  );
}
