/**
 * The chat page's guided start: a few taps that write the question for you.
 *
 * Each goal takes its own path. "Answer a PYQ" ends on a real past question
 * from the data; "compare" needs two topics and what to compare them on;
 * "understand" narrows a topic to its subtopics and the angles UPSC asks
 * about. The text is rebuilt from the selections after every tap, so the
 * input always shows exactly what will be sent and the reader can edit it
 * before sending.
 *
 * Pure functions only, so the composition is testable without a DOM
 * (tests/chatStart.test.mts).
 */
import { allNotes, type Note } from './notes';

export type Goal = 'understand' | 'pyq' | 'compare' | 'historians' | 'revise' | 'mentor';

export type StepId = 'goal' | 'topic' | 'focus' | 'angle' | 'question' | 'dimension' | 'revision';

export type Picked = { id: number; year: number; marks: number; question: string };

export type StartState = {
  goal: Goal | null;
  /** Note slugs. One for every goal except compare, which takes two. */
  topics: string[];
  /** Subtopics of the chosen note. */
  focus: string[];
  angles: string[];
  dimensions: string[];
  revision: string | null;
  pyq: Picked | null;
};

export const EMPTY_START: StartState = {
  goal: null, topics: [], focus: [], angles: [], dimensions: [], revision: null, pyq: null,
};

type Label = { en: string; hi: string };

export const GOALS: { id: Goal; label: Label; premium?: boolean }[] = [
  { id: 'understand', label: { en: 'Understand a topic', hi: 'कोई विषय समझना' } },
  { id: 'pyq',        label: { en: 'Answer a past question', hi: 'पिछले वर्ष का प्रश्न हल करना' } },
  { id: 'compare',    label: { en: 'Compare two topics', hi: 'दो विषयों की तुलना' } },
  { id: 'historians', label: { en: 'See what historians argue', hi: 'इतिहासकारों के मत जानना' } },
  { id: 'revise',     label: { en: 'Revise quickly', hi: 'जल्दी दोहराना' } },
  { id: 'mentor',     label: { en: 'Practise with a mentor', hi: 'मेंटर के साथ अभ्यास' }, premium: true },
];

/** The angles UPSC questions are built on. */
export const ANGLES: { id: string; label: Label }[] = [
  { id: 'causes',          label: { en: 'Causes', hi: 'कारण' } },
  { id: 'character',       label: { en: 'Character', hi: 'स्वरूप' } },
  { id: 'consequences',    label: { en: 'Consequences', hi: 'परिणाम' } },
  { id: "historians' views", label: { en: "Historians' views", hi: 'इतिहासकारों के मत' } },
  { id: 'sources',         label: { en: 'Sources', hi: 'स्रोत' } },
];

export const DIMENSIONS: { id: string; label: Label }[] = [
  { id: 'polity',   label: { en: 'Polity', hi: 'राजव्यवस्था' } },
  { id: 'economy',  label: { en: 'Economy', hi: 'अर्थव्यवस्था' } },
  { id: 'society',  label: { en: 'Society', hi: 'समाज' } },
  { id: 'religion', label: { en: 'Religion', hi: 'धर्म' } },
  { id: 'culture',  label: { en: 'Culture', hi: 'संस्कृति' } },
  { id: 'legacy',   label: { en: 'Legacy', hi: 'विरासत' } },
];

export const REVISION: { id: string; label: Label }[] = [
  { id: 'facts',     label: { en: 'Key dates and facts', hi: 'मुख्य तिथियाँ और तथ्य' } },
  { id: 'summary',   label: { en: 'A one-page summary', hi: 'एक पेज का सार' } },
  { id: 'practice',  label: { en: 'Practice questions', hi: 'अभ्यास प्रश्न' } },
];

export const SECTIONS = ['Ancient India', 'Medieval India', 'Modern India', 'World History'] as const;

export function notesIn(section: string): Note[] {
  return allNotes.filter((n) => n.section === section);
}

/** The steps a goal walks through, in order. */
export function stepsFor(goal: Goal | null): StepId[] {
  switch (goal) {
    case 'understand': return ['goal', 'topic', 'focus', 'angle'];
    case 'pyq':
    case 'mentor':     return ['goal', 'topic', 'question'];
    case 'compare':    return ['goal', 'topic', 'dimension'];
    case 'historians': return ['goal', 'topic', 'focus'];
    case 'revise':     return ['goal', 'topic', 'revision'];
    default:           return ['goal'];
  }
}

/** Whether Next is allowed. Narrowing steps are optional; choices are not. */
export function stepComplete(step: StepId, s: StartState): boolean {
  switch (step) {
    case 'goal':      return s.goal !== null;
    case 'topic':     return s.goal === 'compare' ? s.topics.length === 2 : s.topics.length === 1;
    case 'question':  return s.pyq !== null;
    case 'revision':  return s.revision !== null;
    default:          return true;
  }
}

/** "a", "a and b", "a, b and c". */
export function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function title(slug: string): string {
  return allNotes.find((n) => n.slug === slug)?.title ?? slug;
}

/**
 * The question as it stands. Empty until there is enough to say something,
 * so the input keeps its placeholder rather than showing half a sentence.
 */
export function compose(s: StartState): string {
  if (!s.goal) return '';
  const topics = s.topics.map(title);
  const topic = topics[0];

  switch (s.goal) {
    case 'understand': {
      if (!topic) return '';
      let q = s.focus.length ? `Explain ${list(s.focus)} (${topic})` : `Explain ${topic}`;
      if (s.angles.length) q += `: ${list(s.angles)}`;
      return q;
    }
    case 'pyq':
    case 'mentor':
      if (s.pyq) return `Answer this PYQ (${s.pyq.year}, ${s.pyq.marks} marks): ${s.pyq.question}`;
      return '';
    case 'compare': {
      if (topics.length < 2) return topic ? `Compare ${topic} and …` : '';
      const q = `Compare ${topics[0]} and ${topics[1]}`;
      return s.dimensions.length ? `${q} on ${list(s.dimensions)}` : q;
    }
    case 'historians': {
      if (!topic) return '';
      const subject = s.focus.length ? `${list(s.focus)} (${topic})` : topic;
      return `What do historians argue about ${subject}? Set out the main debates and who holds each view.`;
    }
    case 'revise': {
      if (!topic) return '';
      switch (s.revision) {
        case 'facts':    return `Key dates and facts for ${topic}`;
        case 'summary':  return `A one-page revision summary of ${topic}`;
        case 'practice': return `Practice Mains questions on ${topic}, with a line on how to approach each`;
        default:         return `Revise ${topic}`;
      }
    }
  }
}

/**
 * Past questions ask for a Mains answer, so they go out in that format; the
 * other goals keep whatever style the reader has chosen.
 */
export function formatFor(s: StartState): 'mains' | undefined {
  return s.goal === 'pyq' || s.goal === 'mentor' ? 'mains' : undefined;
}
