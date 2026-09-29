import { mergePyq, mergeSyllabus } from '../lib/progressMerge';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};

console.log('\nmergeSyllabus');

eq('empty on both sides',
  mergeSyllabus(undefined, undefined),
  { completed: {}, completionDates: {} });

eq('a device with nothing stored does not erase the other',
  mergeSyllabus({ completed: { a: true }, completionDates: { a: '2026-01-01' } }, {}),
  { completed: { a: true }, completionDates: { a: '2026-01-01' } });

eq('ticks from both devices are kept',
  mergeSyllabus(
    { completed: { a: true }, completionDates: { a: '2026-01-01' } },
    { completed: { b: true }, completionDates: { b: '2026-02-01' } },
  ),
  { completed: { a: true, b: true }, completionDates: { a: '2026-01-01', b: '2026-02-01' } });

// completionDates records when a topic was first finished, and the dashboard's
// "not revised in 30+ days" prompt measures from it, so the earlier date wins.
eq('the earlier completion date wins',
  mergeSyllabus(
    { completed: { a: true }, completionDates: { a: '2026-03-01' } },
    { completed: { a: true }, completionDates: { a: '2026-01-01' } },
  ),
  { completed: { a: true }, completionDates: { a: '2026-01-01' } });

eq('a date present on only one side is kept',
  mergeSyllabus({ completed: { a: true } }, { completed: { a: true }, completionDates: { a: '2026-01-01' } }),
  { completed: { a: true }, completionDates: { a: '2026-01-01' } });

// The store deletes the key rather than writing false, but an older or
// hand-edited document could hold one, and false is not a completion.
eq('an explicit false is not a completion',
  mergeSyllabus({ completed: { a: false } }, { completed: { a: false } }),
  { completed: {}, completionDates: {} });

eq('true on one side beats false on the other',
  mergeSyllabus({ completed: { a: false } }, { completed: { a: true } }),
  { completed: { a: true }, completionDates: {} });

eq('junk is treated as absent, not as a crash',
  mergeSyllabus('nonsense', { completed: { a: true } }),
  { completed: { a: true }, completionDates: {} });

console.log('\nmergePyq');

eq('empty on both sides', mergePyq(undefined, undefined), {});

eq('attempts from both devices are kept',
  mergePyq({ '1': '2026-01-01' }, { '2': '2026-02-01' }),
  { '1': '2026-01-01', '2': '2026-02-01' });

eq('the earlier attempt date wins',
  mergePyq({ '1': '2026-03-01' }, { '1': '2026-01-01' }),
  { '1': '2026-01-01' });

// useAttemptedPyqs still accepts an array of ids from an older release. If the
// merge did not, a long-standing reader would sync as empty and lose the lot.
eq('the older array shape is understood',
  mergePyq([1, 2], { '3': '2026-01-01' }),
  { '1': '', '2': '', '3': '2026-01-01' });

eq('an array on one side keeps dates from the other',
  mergePyq([1], { '1': '2026-01-01' }),
  { '1': '2026-01-01' });

eq('non-numeric keys are dropped',
  mergePyq({ oops: '2026-01-01', '5': '2026-01-01' }, {}),
  { '5': '2026-01-01' });

console.log(fails ? `\n${fails} failing\n` : '\nall passing\n');
process.exit(fails ? 1 : 0);
