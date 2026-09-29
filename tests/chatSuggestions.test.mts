import { cleanSuggestion, nextSuggestion, graphemes } from '../lib/chatSuggestions';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};

console.log('\ncleanSuggestion');
eq('a clean question passes', cleanSuggestion('How did Dhamma shape Mauryan administration?'), 'How did Dhamma shape Mauryan administration?');
eq('quotes come off', cleanSuggestion('"What does Thapar argue about Dhamma?"'), 'What does Thapar argue about Dhamma?');
eq('a label comes off', cleanSuggestion('Follow-up question: Why did the Mauryas decline?'), 'Why did the Mauryas decline?');
eq('numbering comes off', cleanSuggestion('1. Why did the Mauryas decline?'), 'Why did the Mauryas decline?');
eq('only the first line is kept', cleanSuggestion('Why did the Mauryas decline?\nAnother one?'), 'Why did the Mauryas decline?');
eq('bold markers come off', cleanSuggestion('What did **Kautilya** advise?'), 'What did Kautilya advise?');
eq('Hindi keeps its question mark', cleanSuggestion('मौर्य साम्राज्य का पतन क्यों हुआ?'), 'मौर्य साम्राज्य का पतन क्यों हुआ?');
eq('a statement is refused', cleanSuggestion('You could look at Mauryan administration next.'), null);
eq('too short is refused', cleanSuggestion('Why?'), null);
eq('too long is refused', cleanSuggestion('Why ' + 'really '.repeat(30) + 'did it happen?'), null);
eq('nothing is refused', cleanSuggestion(''), null);
eq('a non-string is refused', cleanSuggestion(undefined), null);

console.log('\nnextSuggestion');
{
  let changed = true;
  for (let i = 0; i < 500; i++) { const prev = i % 24; if (nextSuggestion(prev, 24) === prev) changed = false; }
  eq('never repeats the one just shown', changed, true);
  let inRange = true;
  for (let i = 0; i < 500; i++) { const n = nextSuggestion(i % 24, 24); if (n < 0 || n > 23) inRange = false; }
  eq('stays inside the list', inRange, true);
  eq('a list of one stays put', nextSuggestion(0, 1), 0);
}

console.log('\ngraphemes');
eq('English splits by letter', graphemes('Why?'), ['W', 'h', 'y', '?']);
eq('a Devanagari syllable stays whole', graphemes('का').length, 1);

console.log(fails ? `\n${fails} failing\n` : '\nall passing\n');
process.exit(fails ? 1 : 0);
