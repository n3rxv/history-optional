import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_ACCESS_KEY_ID:k, R2_SECRET_ACCESS_KEY:s, R2_BUCKET:b } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
const base = `https://${a}.r2.cloudflarestorage.com/${b}`;
let n=0, token='';
for(;;){
  const u=new URL(base); u.searchParams.set('list-type','2'); u.searchParams.set('max-keys','1000');
  if(token) u.searchParams.set('continuation-token', token);
  const r=await c.fetch(u.toString()); const x=await r.text();
  n += [...x.matchAll(/<Key>/g)].length;
  const t=x.match(/<NextContinuationToken>([^<]+)</); if(!t) break; token=t[1];
}
console.log(n);
