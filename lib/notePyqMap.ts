import { pyqs, PYQ } from './pyqData';

// Maps each note slug to relevant PYQs by keyword matching on question text
// Also maps section names to pyqData section strings
const SECTION_MAP: Record<string, string[]> = {
  'Ancient India':  ['Paper I - Ancient India'],
  'Medieval India': ['Paper I - Medieval India', 'Paper I - Early Medieval'],
  'Modern India':   ['Paper II - Modern India'],
  'World History':  ['Paper II - World History'],
};

// Keywords per slug for precise matching within a section
const SLUG_KEYWORDS: Record<string, string[]> = {
  'sources-ancient-india':          ['source', 'inscription', 'coin', 'archaeological', 'literary', 'kalhana', 'rajtarangini', 'foreign account', 'greek', 'chinese'],
  'prehistory-protohistory':        ['neolithic', 'palaeolithic', 'mesolithic', 'chalcolithic', 'prehistoric', 'megalith'],
  'indus-valley-civilization':      ['harappan', 'indus', 'harappa', 'mohenjo', 'ias civilization', 'indus valley', 'indus-saraswati'],
  'megalithic-cultures':            ['megalith', 'megalithic', 'iron age', 'burial'],
  'aryans-vedic-period':            ['vedic', 'aryan', 'rig veda', 'rigvedic', 'later vedic', 'upanishad', 'varna'],
  'mahajanapadas':                  ['mahajanapada', 'magadha', 'buddhism', 'jainism', 'buddha', 'mahavira', 'coinage', 'sixteen'],
  'mauryan-empire':                 ['maurya', 'ashoka', 'chandragupta', 'kautilya', 'arthashastra', 'dharma', 'dhamma', 'ashokan'],
  'post-mauryan-period':            ['kushana', 'kushans', 'saka', 'indo-greek', 'gandhara', 'mahayana', 'kanishka'],
  'eastern-india-deccan-south':     ['satavahana', 'sangam', 'tamil', 'kharavela', 'chera', 'chola', 'pandya'],
  'guptas-vakatakas-vardhanas':     ['gupta', 'golden age', 'nalanda', 'vikramshila', 'harsha', 'vakataka', 'feudalism'],
  'regional-states-gupta-era':      ['pallava', 'chalukya', 'rashtrakuta', 'pala', 'chola', 'temple architecture', 'regional'],
  'early-indian-cultural-history':  ['sanskrit', 'science', 'mathematics', 'aryabhatta', 'brahmagupta', 'philosophy', 'art'],
  'early-medieval-india':           ['rajput', 'tripartite struggle', 'agrarian', 'trade', 'women', 'early medieval'],
  'cultural-traditions-750-1200':   ['shankaracharya', 'bhakti', 'sufi', 'advaita', 'literature 750', 'temple 750'],
  'thirteenth-century':             ['delhi sultanate', 'iltutmish', 'balban', 'ghurian', 'slave dynasty', 'thirteenth'],
  'fourteenth-century':             ['alauddin khalji', 'muhammad tughluq', 'firuz tughluq', 'khalji', 'tughluq', 'ibn battuta', 'fourteenth'],
  'society-culture-economy-13-14c': ['sultanate society', 'persian literature', 'sultanate architecture', 'amir khusrau'],
  'fifteenth-sixteenth-century-political': ['vijayanagara', 'lodi', 'babur', 'humayun', 'sher shah', 'provincial dynasty', 'portuguese'],
  'fifteenth-sixteenth-century-society':   ['regional culture', 'kabir', 'nanak', 'bhakti 15th', 'provincial architecture'],
  'akbar':                          ['akbar', 'mansabdari', 'jagir', 'rajput policy', 'sulh-i-kul', 'din-i-ilahi', 'abul fazl'],
  'mughal-empire-17th-century':     ['jahangir', 'shahjahan', 'aurangzeb', 'shivaji', 'maratha', 'zamindar', 'ahom', 'mughal 17th'],
  'economy-society-16-17c':         ['mughal economy', 'european company', 'sikh', 'agriculture 16th', 'trade 16th'],
  'mughal-culture':                 ['mughal architecture', 'mughal painting', 'taj mahal', 'persian history', 'music mughal'],
  'eighteenth-century':             ['mughal decline', 'maratha 18th', 'battle of panipat 1761', 'regional power', 'nadir shah', 'eighteenth'],
  'european-penetration-india':     ['plassey', 'carnatic', 'portuguese', 'dutch', 'french', 'european', 'east india company'],
  'british-expansion-india':        ['buxar', 'mysore war', 'anglo-maratha', 'punjab', 'british expansion', 'subsidiary alliance'],
  'early-british-raj':              ['regulating act', "pitt's india act", 'charter act', 'utilitarian', 'cornwallis', 'wellesley'],
  'economic-impact-british-rule':   ['drain of wealth', 'deindustrializ', 'permanent settlement', 'ryotwari', 'mahalwari', 'commercializ', 'land revenue'],
  'social-cultural-developments':   ['education policy', 'orientalist', 'anglicist', 'macaulay', 'wood dispatch', 'press', 'missionary'],
  'social-religious-reform':        ['ram mohan roy', 'brahmo', 'dayananda', 'wahabi', 'sati', 'widow remarriage', 'vidyasagar', 'reform movement'],
  'indian-response-british-rule':   ['1857', 'revolt of 1857', 'sepoy mutiny', 'tribal uprising', 'peasant uprising', 'indigo'],
  'birth-indian-nationalism':       ['indian national congress', 'moderates', 'extremists', 'swadeshi', 'partition of bengal', 'tilak', 'gokhale'],
  'gandhian-nationalism':           ['gandhi', 'non-cooperation', 'civil disobedience', 'quit india', 'khilafat', 'rowlatt', 'dandi', 'salt march'],
  'constitutional-developments':    ['morley-minto', 'montagu-chelmsford', 'dyarchy', 'government of india act', 'simon commission'],
  'other-strands-national-movement':['revolutionary', 'bhagat singh', 'subhash', 'bose', 'communist', 'socialist', 'left'],
  'politics-separatism-partition':  ['muslim league', 'jinnah', 'partition', 'communalism', 'two-nation', 'cabinet mission', 'transfer of power'],
  'post-independence-consolidation':['nehru', 'foreign policy', 'linguistic reorganisation', 'princely states', 'integration', 'panchsheel'],
  'caste-ethnicity-post-1947':      ['dalit', 'backward caste', 'tribal', 'ambedkar', 'reservation'],
  'economic-development-political-change': ['land reform', 'planning', 'green revolution', 'science technology india'],
  'enlightenment-modern-ideas':     ['enlightenment', 'rousseau', 'voltaire', 'kant', 'marxism', 'socialism', 'locke'],
  'origins-modern-politics':        ['french revolution', 'american revolution', 'american civil war', 'british democracy', 'european states'],
  'industrialization':              ['industrial revolution', 'industrialisation', 'capitalism', 'factory system'],
  'nation-state-system':            ['nationalism 19th', 'german unification', 'italian unification', 'bismarck', 'garibaldi', 'mazzini'],
  'imperialism-colonialism':        ['imperialism', 'colonialism', 'scramble for africa', 'latin america colonial', 'neo-imperialism'],
  'revolution-counter-revolution':  ['russian revolution', 'bolshevik', 'fascism', 'nazism', 'chinese revolution', '1848 revolution'],
  'world-wars':                     ['world war', 'first world war', 'second world war', 'wwi', 'wwii', 'treaty of versailles', 'league of nations'],
  'world-after-wwii':               ['cold war', 'non-alignment', 'uno', 'united nations', 'nato', 'warsaw pact', 'two blocs'],
  'liberation-colonial-rule':       ['decolonization', 'vietnam', 'egypt', 'africa independence', 'apartheid', 'bolivar', 'latin america independence'],
  'decolonization-underdevelopment':['underdevelopment', 'third world', 'dependency', 'latin america develop', 'africa develop'],
  'unification-europe':             ['european union', 'european community', 'nato europe', 'marshall plan', 'schuman'],
  'disintegration-soviet-union':    ['soviet union', 'ussr', 'cold war end', 'gorbachev', 'unipolar', 'east europe', 'berlin wall'],
};

export function getPYQsForNote(slug: string, section: string): PYQ[] {
  const sectionFilters = SECTION_MAP[section] || [];
  const keywords = SLUG_KEYWORDS[slug] || [];
  
  if (keywords.length === 0) {
    // Fall back to section-level match
    return pyqs.filter(q => sectionFilters.includes(q.section)).slice(0, 8);
  }

  const sectionPyqs = pyqs.filter(q => sectionFilters.includes(q.section));
  
  const matched = sectionPyqs.filter(q => {
    const qLower = q.question.toLowerCase();
    return keywords.some(kw => qLower.includes(kw.toLowerCase()));
  });

  return matched.slice(0, 10);
}

export function getPYQCountForNote(slug: string, section: string): number {
  return getPYQsForNote(slug, section).length;
}

// For the frequency badge on paper1/paper2 pages
export function getPYQFrequency(slug: string, section: string): { count: number; label: string; color: string } {
  const count = getPYQCountForNote(slug, section);
  if (count >= 8)  return { count, label: 'Very High', color: '#ef4444' };
  if (count >= 5)  return { count, label: 'High',      color: '#f97316' };
  if (count >= 3)  return { count, label: 'Medium',    color: '#eab308' };
  if (count >= 1)  return { count, label: 'Low',       color: '#6b7280' };
  return { count: 0, label: 'Rare', color: '#374151' };
}
