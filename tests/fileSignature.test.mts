/**
 * The behaviour under test: an upload is judged by its bytes, not by the
 * Content-Type the caller supplied. /api/pyq-answers serves what it stores,
 * so a spoofed type is a hosting question, not a validation nicety.
 */
import { sniffFileType, isPdf } from '../lib/fileSignature';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};

const bytes = (...b: number[]) => new Uint8Array(b);
const ascii = (s: string) => new Uint8Array([...s].map(c => c.charCodeAt(0)));
const concat = (...xs: Uint8Array[]) => {
  const out = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let o = 0; for (const x of xs) { out.set(x, o); o += x.length; }
  return out;
};

console.log('\nsniffFileType');
eq('a real PDF header',        sniffFileType(ascii('%PDF-1.7\n%âãÏÓ')), 'pdf');
eq('JPEG',                     sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0)), 'jpeg');
eq('PNG',                      sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'png');
eq('GIF',                      sniffFileType(ascii('GIF89a')), 'gif');
eq('WEBP (offset 8)',          sniffFileType(concat(ascii('RIFF'), bytes(0, 0, 0, 0), ascii('WEBP'))), 'webp');
eq('an empty file',            sniffFileType(new Uint8Array()), null);
eq('a truncated signature',    sniffFileType(bytes(0x25, 0x50)), null);

console.log('\nisPdf — the check that gates the upload');
eq('accepts a PDF',                       isPdf(ascii('%PDF-1.4 trailing content')), true);
eq('accepts a PDF behind a UTF-8 BOM',    isPdf(concat(bytes(0xef, 0xbb, 0xbf), ascii('%PDF-1.4'))), true);
eq('accepts leading whitespace',          isPdf(ascii('\n\n  %PDF-1.5')), true);

// The point of the change: these all arrive claiming Content-Type
// application/pdf, and all used to be stored and served.
eq('rejects a PNG posing as a PDF',       isPdf(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), false);
eq('rejects an ELF binary',               isPdf(concat(bytes(0x7f), ascii('ELF'))), false);
eq('rejects an HTML page',                isPdf(ascii('<!doctype html><script>alert(1)</script>')), false);
eq('rejects a ZIP (and so a JAR/APK)',    isPdf(concat(ascii('PK'), bytes(0x03, 0x04))), false);
eq('rejects plain text',                  isPdf(ascii('this is just a text file')), false);
eq('rejects an empty file',               isPdf(new Uint8Array()), false);

// %PDF- must be near the front. A file that merely mentions it far in is not
// one, or every upload containing the string would pass.
eq('rejects %PDF- buried past the window', isPdf(concat(new Uint8Array(2000), ascii('%PDF-1.4'))), false);

console.log(fails === 0 ? '\nAll file-signature checks passed.\n' : `\n${fails} FAILED\n`);
process.exit(fails === 0 ? 0 : 1);
