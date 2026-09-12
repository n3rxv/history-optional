import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_WRITE_ACCESS_KEY_ID:k, R2_WRITE_SECRET_ACCESS_KEY:s, R2_BUCKET:b } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
let token = '', keys = [];
do {
  const u = `https://${a}.r2.cloudflarestorage.com/${b}?list-type=2&max-keys=1000` +
            (token ? `&continuation-token=${encodeURIComponent(token)}` : '');
  const t = await (await c.fetch(u)).text();
  keys.push(...[...t.matchAll(/<Key>([^<]+)<\/Key>/g)].map(m => m[1]));
  token = (t.match(/<NextContinuationToken>([^<]+)</) || [])[1] || '';
} while (token);
fs.writeFileSync(process.argv[2], JSON.stringify(keys));
console.log(keys.length);
