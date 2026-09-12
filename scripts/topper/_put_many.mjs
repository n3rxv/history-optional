
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
const names = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const dir = process.argv[3];
let done = 0;
for (const name of names) {
  const body = fs.readFileSync(`${dir}/${name}`);
  const key = encodeURIComponent(name);
  const put = await c.fetch(`${base}/${key}`, { method:'PUT', body,
    headers:{'content-type':'application/pdf'} });
  if (!put.ok) { console.log(`FAIL ${name} PUT ${put.status}`); process.exit(1); }
  const head = await c.fetch(`${base}/${key}`, { method:'HEAD' });
  if (head.status !== 200) { console.log(`FAIL ${name} HEAD ${head.status}`); process.exit(1); }
  done++;
  if (done % 25 === 0) console.log(`  uploaded ${done}/${names.length}`);
}
console.log(`OK ${done}`);
