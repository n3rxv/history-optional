const fs = require('fs');
const f = 'app/notes/[slug]/NoteReader.tsx';
let c = fs.readFileSync(f, 'utf8');

// Normalize line endings just in case
c = c.replace(/\r\n/g, '\n');

const OLD = [
  '            ) : (',
  '              <>',
  '                <TableOfContents contentHtml={processedContent} />',
  '                <div',
  '                  ref={noteContentRef}',
  '                  className="note-content"',
  '                  dangerouslySetInnerHTML={{ __html: processedContent }}',
  '                />',
  '              </>',
].join('\n');

const NEW = [
  '            ) : (',
  '              <>',
  '                <TableOfContents contentHtml={processedContent} />',
  '                <div style={{ position: \'relative\' }}>',
  '                  <div',
  '                    ref={noteContentRef}',
  '                    className="note-content"',
  '                    dangerouslySetInnerHTML={{ __html: processedContent }}',
  '                    style={!user && !authLoading ? { maxHeight: \'28vh\', overflow: \'hidden\', pointerEvents: \'none\', userSelect: \'none\' } : undefined}',
  '                  />',
  '                  {!user && !authLoading && (',
  '                    <div style={{ position: \'absolute\', bottom: 0, left: 0, right: 0, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', paddingBottom: \'2.5rem\', paddingTop: \'6rem\', background: \'linear-gradient(to bottom, transparent 0%, var(--bg) 38%)\' }}>',
  '                      <div style={{ background: \'var(--bg2)\', border: \'1px solid var(--border)\', borderRadius: 12, padding: \'1.5rem 2rem\', textAlign: \'center\', maxWidth: 360, boxShadow: \'0 8px 32px rgba(0,0,0,0.4)\' }}>',
  '                        <div style={{ fontSize: \'1.4rem\', marginBottom: \'0.5rem\' }}>\u{1F512}</div>',
  '                        <div style={{ fontFamily: \'var(--font-ui)\', fontWeight: 700, color: \'var(--text)\', fontSize: \'0.95rem\', marginBottom: \'0.4rem\' }}>Sign in to continue reading</div>',
  '                        <div style={{ color: \'var(--text3)\', fontSize: \'0.78rem\', marginBottom: \'1.1rem\', lineHeight: 1.5 }}>Free account \u2014 full notes, highlights & progress tracking.</div>',
  '                        <button onClick={() => requireLogin(\'Sign in free to read full notes and save your progress.\')} style={{ background: \'var(--accent)\', color: \'#fff\', border: \'none\', borderRadius: 8, padding: \'0.55rem 1.5rem\', fontFamily: \'var(--font-ui)\', fontWeight: 600, fontSize: \'0.85rem\', cursor: \'pointer\', width: \'100%\' }}>Sign in free \u2192</button>',
  '                      </div>',
  '                    </div>',
  '                  )}',
  '                </div>',
  '              <>'.replace('<>', '</>'),
].join('\n');

const count = c.split(OLD).length - 1;
if (count !== 1) {
  console.error('Pattern found ' + count + ' times');
  // Debug: show what's actually around line 1272
  const lines = c.split('\n');
  console.log('Lines 1270-1283:');
  lines.slice(1269, 1283).forEach((l, i) => console.log((1270+i) + ': ' + JSON.stringify(l)));
  process.exit(1);
}

fs.writeFileSync(f, c.replace(OLD, NEW));
console.log('Done! Content gate added.');
