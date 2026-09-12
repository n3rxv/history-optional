
import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_WRITE_ACCESS_KEY_ID:k, R2_WRITE_SECRET_ACCESS_KEY:s,
        R2_BUCKET:b } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
const base = `https://${a}.r2.cloudflarestorage.com/${b}`;
let n = 0;
for (const name of JSON.parse(fs.readFileSync(process.argv[2],'utf8'))) {
  const r = await c.fetch(`${base}/${encodeURIComponent(name)}`, { method:'DELETE' });
  if (!r.ok && r.status !== 404) { console.log(`FAIL ${name} ${r.status}`); process.exit(1); }
  n++;
}
console.log(`OK ${n}`);
