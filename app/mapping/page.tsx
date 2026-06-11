'use client';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { bookData, BookChapter, BookSite } from '@/lib/bookData';

const MappingMap = dynamic(() => import('@/components/MappingMap'), { ssr: false });

const PART_ORDER = [
  'Reference',
  'Pre-Historic Era',
  'Proto-Historic Era',
  'Historic Era',
  'Theme-Based Sites',
];

const ACCENT = '#a78bfa';

function ChapterSection({ chapter, isOpen, onToggle, selectedSite, onSiteClick }: {
  chapter: BookChapter;
  isOpen: boolean;
  onToggle: () => void;
  selectedSite: string | null;
  onSiteClick: (name: string) => void;
}) {
  const sitesWithCoords = chapter.sites.filter(s => s.lat != null && s.lng != null);

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
      background: 'var(--bg3)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '14px 18px',
          background: isOpen ? 'rgba(167,139,250,0.08)' : 'var(--bg3)',
          border: 'none',
          borderBottom: isOpen ? `1px solid ${ACCENT}33` : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span>
          <span style={{ color: ACCENT, fontWeight: 600, marginRight: 10 }}>
            Ch {chapter.chapter}
          </span>
          <span style={{ fontWeight: 600 }}>{chapter.topic}</span>
          <span style={{ color: 'var(--text3)', marginLeft: 10, fontSize: 13 }}>
            ({chapter.sites.length} sites)
          </span>
        </span>
        <span style={{ color: ACCENT, fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: 18 }}>
          {chapter.chapter === 0 && chapter.topic === 'Introduction & How to Use' ? (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>
              <p style={{ marginBottom: 12 }}>
                This page is your visual companion to the entire <strong style={{ color: 'var(--text)' }}>Map syllabus</strong> for
                UPSC History Optional — <strong style={{ color: ACCENT }}>940 sites</strong> across <strong style={{ color: ACCENT }}>26 chapters</strong>.
              </p>
              <p style={{ marginBottom: 12 }}>
                Each chapter below opens into an interactive map and a list of sites. Click any
                site (on the map or in the list) to see its location and significance.
              </p>
              <p style={{ marginBottom: 12 }}>
                Sites with a{' '}
                <span style={{
                  fontSize: 11, color: '#eab308', background: 'rgba(234,179,8,0.1)',
                  padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                }}>
                  PYQ badge
                </span>{' '}
                have appeared in actual UPSC Mains map questions — these deserve extra attention
                while revising.
              </p>
              <p style={{ marginBottom: 0 }}>
                Use the <strong style={{ color: 'var(--text)' }}>search bar</strong> above to jump
                directly to any site by name or location, or browse chapter-by-chapter using the{' '}
                <strong style={{ color: 'var(--text)' }}>Part tabs</strong> (Pre-Historic, Proto-Historic,
                Historic, and Theme-Based).
              </p>
            </div>
          ) : chapter.sites.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>No sites in this chapter.</p>
          ) : (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px', minWidth: 300 }}>
                <MappingMap
                  sites={sitesWithCoords}
                  selectedSite={selectedSite}
                  onSiteClick={onSiteClick}
                />
              </div>
              <div style={{ flex: '1 1 350px', minWidth: 280, maxHeight: 420, overflowY: 'auto' }}>
                {chapter.sites.map((site) => {
                  const isSelected = selectedSite === site.name;
                  const hasPYQ = site.pyqYears && site.pyqYears.length > 0;
                  const chapterKey = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
                  return (
                    <div
                      key={site.name}
                      id={`site-${chapterKey}-${site.name}`}
                      onClick={() => onSiteClick(site.name)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 6,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(167,139,250,0.12)' : 'var(--bg4)',
                        border: isSelected ? `1px solid ${ACCENT}` : '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
                          {site.name}
                        </strong>
                        {hasPYQ && (
                          <span style={{
                            fontSize: 10,
                            color: '#eab308',
                            background: 'rgba(234,179,8,0.1)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontFamily: 'var(--font-ui)',
                            whiteSpace: 'nowrap',
                            marginLeft: 8,
                          }}>
                            PYQ {site.pyqYears.join(', ')}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                        {site.location}
                      </div>
                      {isSelected && (
                        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                          {site.majorAspect}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MappingPage() {
  const [activePart, setActivePart] = useState(PART_ORDER[1]); // default Pre-Historic Era

  useEffect(() => {
    let prevRestoration: ScrollRestoration | undefined;
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      prevRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    return () => {
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history && prevRestoration) {
        window.history.scrollRestoration = prevRestoration;
      }
    };
  }, []);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const chaptersByPart = useMemo(() => {
    const map: Record<string, BookChapter[]> = {};
    for (const ch of bookData) {
      if (!map[ch.part]) map[ch.part] = [];
      map[ch.part].push(ch);
    }
    return map;
  }, []);

  // Global search across all 940 sites
  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    const q = search.trim().toLowerCase();
    const results: { site: BookSite; chapter: BookChapter }[] = [];
    for (const ch of bookData) {
      for (const site of ch.sites) {
        if (site.name.toLowerCase().includes(q) || site.location.toLowerCase().includes(q)) {
          results.push({ site, chapter: ch });
        }
      }
    }
    return results.slice(0, 20);
  }, [search]);

  const toggleChapter = (key: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const jumpToSite = (chapter: BookChapter, site: BookSite) => {
    const key = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
    const siteKey = `site-${key}-${site.name}`;
    setActivePart(chapter.part);
    setOpenChapters(prev => new Set(prev).add(key));
    setSelectedSite(site.name);
    setSearch('');
    setTimeout(() => {
      const siteEl = document.getElementById(siteKey);
      if (siteEl) {
        siteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 60px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: 8,
        color: 'var(--text)',
      }}>
        Map Reference — All Sites
      </h1>
      <p style={{ color: 'var(--text2)', marginBottom: 20, fontSize: 15 }}>
        Browse all 940 archaeological & historical sites organized by syllabus chapter.
        <span style={{ color: '#eab308' }}> Yellow </span> markers indicate sites that have appeared in past UPSC PYQs.
      </p>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any site by name or location..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${ACCENT}55`,
            background: 'var(--bg3)',
            color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--bg3)',
            border: `1px solid ${ACCENT}55`,
            borderRadius: 8,
            maxHeight: 320,
            overflowY: 'auto',
            zIndex: 50,
          }}>
            {searchResults.map(({ site, chapter }) => (
              <div
                key={`${chapter.chapter}-${site.name}`}
                onClick={() => jumpToSite(chapter, site)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-ui)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <strong style={{ color: 'var(--text)', fontSize: 14 }}>{site.name}</strong>
                <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>
                  {chapter.topic} · {site.location}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Part tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {PART_ORDER.map((part) => (
          <button
            key={part}
            onClick={() => setActivePart(part)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: activePart === part ? `1px solid ${ACCENT}` : '1px solid var(--border)',
              background: activePart === part ? 'rgba(167,139,250,0.12)' : 'var(--bg3)',
              color: activePart === part ? ACCENT : 'var(--text2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {part}
          </button>
        ))}
      </div>

      {/* Chapters for active part */}
      {(chaptersByPart[activePart] || []).map((chapter) => {
        const key = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
        return (
          <div id={key} key={key}>
            <ChapterSection
              chapter={chapter}
              isOpen={openChapters.has(key)}
              onToggle={() => toggleChapter(key)}
              selectedSite={selectedSite}
              onSiteClick={(name) => setSelectedSite(prev => prev === name ? null : name)}
            />
          </div>
        );
      })}
    </div>
  );
}
