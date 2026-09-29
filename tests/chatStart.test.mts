import { compose, stepsFor, stepComplete, formatFor, list, EMPTY_START, type StartState } from '../lib/chatStart';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};
const s = (over: Partial<StartState>): StartState => ({ ...EMPTY_START, ...over });

console.log('\nlist');
eq('one item', list(['a']), 'a');
eq('two items', list(['a', 'b']), 'a and b');
eq('three items', list(['a', 'b', 'c']), 'a, b and c');

console.log('\ncompose');
eq('nothing chosen writes nothing', compose(EMPTY_START), '');
eq('a goal alone writes nothing', compose(s({ goal: 'understand' })), '');
eq('understand a topic',
  compose(s({ goal: 'understand', topics: ['mauryan-empire'] })),
  'Explain Mauryan Empire');
eq('understand, narrowed and angled',
  compose(s({ goal: 'understand', topics: ['mauryan-empire'], focus: ['Ashoka', 'Administration'], angles: ['causes', "historians' views"] })),
  "Explain Ashoka and Administration (Mauryan Empire): causes and historians' views");
eq('a PYQ is quoted with its year and marks',
  compose(s({ goal: 'pyq', topics: ['akbar'], pyq: { id: 1, year: 2019, marks: 15, question: 'Discuss Sulh-i-kul.' } })),
  'Answer this PYQ (2019, 15 marks): Discuss Sulh-i-kul.');
eq('a PYQ goal writes nothing until a question is picked',
  compose(s({ goal: 'pyq', topics: ['akbar'] })), '');
eq('compare shows the gap while one topic is chosen',
  compose(s({ goal: 'compare', topics: ['akbar'] })), 'Compare Akbar and …');
eq('compare two topics on chosen dimensions',
  compose(s({ goal: 'compare', topics: ['akbar', 'mauryan-empire'], dimensions: ['polity', 'religion'] })),
  'Compare Akbar and Mauryan Empire on polity and religion');
eq('historians on a topic',
  compose(s({ goal: 'historians', topics: ['world-wars'] })),
  'What do historians argue about World Wars? Set out the main debates and who holds each view.');
eq('revise with a chosen kind',
  compose(s({ goal: 'revise', topics: ['akbar'], revision: 'facts' })),
  'Key dates and facts for Akbar');
eq('no word counts anywhere',
  /\bwords?\b/.test([
    compose(s({ goal: 'revise', topics: ['akbar'], revision: 'summary' })),
    compose(s({ goal: 'revise', topics: ['akbar'], revision: 'practice' })),
    compose(s({ goal: 'understand', topics: ['akbar'] })),
  ].join(' ')), false);

console.log('\nsteps');
eq('compare needs two topics', stepComplete('topic', s({ goal: 'compare', topics: ['akbar'] })), false);
eq('compare with two topics can go on', stepComplete('topic', s({ goal: 'compare', topics: ['akbar', 'mauryan-empire'] })), true);
eq('narrowing is optional', stepComplete('focus', s({ goal: 'understand', topics: ['akbar'] })), true);
eq('a PYQ path ends on picking the question', stepsFor('pyq'), ['goal', 'topic', 'question']);
eq('the mentor path is the PYQ path', stepsFor('mentor'), stepsFor('pyq'));
eq('past questions go out as Mains answers', formatFor(s({ goal: 'pyq' })), 'mains');
eq('other goals keep the chosen style', formatFor(s({ goal: 'understand' })), undefined);

console.log(fails ? `\n${fails} failing\n` : '\nall passing\n');
process.exit(fails ? 1 : 0);
