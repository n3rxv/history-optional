import { auditSentence, createSentenceGate } from '../lib/citationGate';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};

console.log('\nauditSentence');
eq('plain prose passes through',
  auditSentence('The Mauryan state was highly centralised.'),
  'The Mauryan state was highly centralised.');

eq('Rule A drops broad-only historian + claim verb',
  auditSentence('R.C. Majumdar argues that Alexander had no lasting impact.'),
  null);

eq('broad-only historian WITHOUT a claim verb survives',
  auditSentence('R.C. Majumdar is a well known historian.'),
  'R.C. Majumdar is a well known historian.');

eq('Source #N sentence is exempt even with a broad-only name',
  auditSentence('R.C. Majumdar argues this was limited (Source #2).'),
  'R.C. Majumdar argues this was limited (Source #2).');

eq('bare year bracket is left alone',
  auditSentence('Romila Thapar revisited this (1984).'),
  'Romila Thapar revisited this (1984).');

eq('initials do not split the name apart',
  auditSentence('R.C. Majumdar argues Alexander had no impact.'),
  null);

console.log('\ncreateSentenceGate');
{
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  'The Mauryan state was centralised. Trade flourished too.'.split('').forEach(c => g.push(c));
  g.flush();
  eq('emits per sentence, not per token', out.length, 2);
  eq('content preserved in order', out.join(''), 'The Mauryan state was centralised. Trade flourished too.');
}
{
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  g.push('Good sentence one. ');
  eq('sentence released before the stream ends', out.length, 1);
  g.push('R.C. Majumdar argues something invented. ');
  eq('condemned sentence never emitted', out.length, 1);
  g.push('Final good sentence.');
  g.flush();
  eq('later good sentence still emitted', out.length, 2);
}
{
  // Regression: the naive [.!?] split emitted "R." and "C." before the claim
  // that condemns the sentence had even arrived.
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  'R.C. Majumdar argues something invented. Real sentence follows.'
    .split('').forEach(c => g.push(c));
  g.flush();
  eq('no fragment of a condemned sentence escapes', out.join('').includes('R.'), false);
  eq('the following sentence survives', out.join('').trim(), 'Real sentence follows.');
}
{
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  g.push('Sentence with e.g. an abbreviation inside it. Next one.');
  g.flush();
  eq('abbreviation does not split a sentence', out.length, 2);
}
{
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  g.push('Complete sentence here. And this one was cut off mid');
  g.flush();
  eq('truncated tail dropped', out.join(''), 'Complete sentence here.');
}
{
  const out: string[] = [];
  const g = createSentenceGate(t => out.push(t));
  g.push('Nothing at all');
  g.flush();
  eq('emitted() reports zero when all dropped', g.emitted(), 0);
}
console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`);
process.exit(fails === 0 ? 0 : 1);
