import { allNotes, Note } from './notes';

// Keyword map: slug -> extra keywords beyond the title/subtopics
const EXTRA_KEYWORDS: Record<string, string[]> = {
  'mauryan-empire': ['maurya', 'ashoka', 'chandragupta', 'kautilya', 'arthashastra', 'dhamma', 'pataliputra', 'magadha'],
  'indus-valley-civilization': ['harappan', 'harappa', 'mohenjo', 'indus', 'harappan civilization'],
  'aryans-vedic-period': ['vedic', 'rigveda', 'rig veda', 'upanishad', 'varna', 'aryan'],
  'guptas-vakatakas-vardhanas': ['gupta', 'samudragupta', 'chandragupta ii', 'harsha', 'nalanda', 'golden age'],
  'akbar': ['akbar', 'mansabdari', 'sulh-i-kul', 'din-i-ilahi', 'rajput policy', 'todar mal'],
  'mughal-empire-17th-century': ['jahangir', 'shahjahan', 'aurangzeb', 'mughal', 'shivaji', 'maratha', 'ahom'],
  'eighteenth-century': ['mughal decline', '18th century', 'maratha', 'panipat 1761', 'regional powers'],
  'thirteenth-century': ['iltutmish', 'balban', 'slave dynasty', 'delhi sultanate', 'ghurid', 'qutb'],
  'fourteenth-century': ['alauddin khalji', 'muhammad tughluq', 'firuz tughluq', 'khalji', 'tughlaq'],
  'gandhian-nationalism': ['gandhi', 'non-cooperation', 'civil disobedience', 'quit india', 'dandi', 'khilafat', 'rowlatt'],
  'birth-indian-nationalism': ['congress', 'moderates', 'extremists', 'bal gangadhar tilak', 'swadeshi', 'partition of bengal'],
  'indian-response-british-rule': ['1857', 'revolt', 'sepoy mutiny', 'great rebellion', 'tribal uprising', 'peasant revolt'],
  'economic-impact-british-rule': ['drain of wealth', 'de-industrialisation', 'permanent settlement', 'ryotwari', 'mahalwari', 'naoroji'],
  'social-religious-reform': ['ram mohan roy', 'brahmo', 'dayananda', 'wahabi', 'arya samaj', 'social reform'],
  'enlightenment-modern-ideas': ['enlightenment', 'rousseau', 'kant', 'marxism', 'socialism', 'locke'],
  'origins-modern-politics': ['french revolution', 'american revolution', 'declaration of independence', 'napoleon'],
  'industrialization': ['industrial revolution', 'industrialization', 'capitalism', 'factory', 'british industry'],
  'revolution-counter-revolution': ['russian revolution', 'bolshevik', 'fascism', 'nazism', 'chinese revolution', 'mussolini', 'hitler'],
  'world-wars': ['world war', 'wwi', 'wwii', 'versailles', 'league of nations', 'holocaust', 'hiroshima'],
  'imperialism-colonialism': ['imperialism', 'colonialism', 'scramble for africa', 'colonization'],
  'nation-state-system': ['german unification', 'italian unification', 'bismarck', 'cavour', 'nationalism 19th'],
  'disintegration-soviet-union': ['soviet union', 'cold war', 'gorbachev', 'ussr collapse', 'perestroika'],
  'early-medieval-india': ['rajput', 'chola', 'feudalism', 'bhakti', 'early medieval'],
  'post-mauryan-period': ['kushana', 'kanishka', 'satavahana', 'gandhara', 'indo-greek', 'saka'],
  'regional-states-gupta-era': ['pallava', 'chalukya', 'rashtrakuta', 'pala', 'temple architecture'],
};

export function detectTopic(question: string): { slug: string; title: string } | null {
  const q = question.toLowerCase();

  let bestSlug = '';
  let bestScore = 0;

  for (const note of allNotes) {
    let score = 0;

    // Title words
    const titleWords = note.title.toLowerCase().split(/\s+/);
    for (const w of titleWords) {
      if (w.length > 4 && q.includes(w)) score += 2;
    }

    // Subtopics
    for (const sub of (note.subtopics || [])) {
      if (q.includes(sub.toLowerCase())) score += 3;
    }

    // Extra keywords
    const extras = EXTRA_KEYWORDS[note.slug] || [];
    for (const kw of extras) {
      if (q.includes(kw.toLowerCase())) score += 4;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSlug = note.slug;
    }
  }

  if (bestScore < 2) return null;
  const note = allNotes.find(n => n.slug === bestSlug);
  return note ? { slug: note.slug, title: note.title } : null;
}
