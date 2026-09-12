import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_ACCESS_KEY_ID:k, R2_SECRET_ACCESS_KEY:s, R2_BUCKET:b,
        NEXT_PUBLIC_SUPABASE_URL:su, SUPABASE_SECRET_KEY:sk } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
const base = `https://${a}.r2.cloudflarestorage.com/${b}`;

// R2 me kya-kya hai
const keys = new Set(); let token='';
for(;;){
  const u=new URL(base); u.searchParams.set('list-type','2'); u.searchParams.set('max-keys','1000');
  if(token) u.searchParams.set('continuation-token', token);
  const r=await c.fetch(u.toString()); const x=await r.text();
  for (const m of x.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.add(decodeURIComponent(m[1]));
  const t=x.match(/<NextContinuationToken>([^<]+)</); if(!t) break; token=t[1];
}

// DB me kya-kya hai
const rows=[];
for (let off=0;;off+=1000){
  const r=await fetch(`${su}/rest/v1/topper_copies?select=drive_file_id,note&limit=1000&offset=${off}`,
    {headers:{apikey:sk, Authorization:'Bearer '+sk}});
  const d=await r.json(); rows.push(...d); if(d.length<1000) break;
}
const missing = rows.filter(r => !keys.has(r.drive_file_id));
const orphan  = [...keys].filter(k => !rows.some(r => r.drive_file_id===k));
console.log(`DB rows           : ${rows.length}`);
console.log(`R2 objects        : ${keys.size}`);
console.log(`rows bina PDF ke  : ${missing.length}`);
missing.slice(0,5).forEach(r=>console.log('   ', r.drive_file_id));
console.log(`PDFs bina row ke  : ${orphan.length}`);
orphan.slice(0,5).forEach(k=>console.log('   ', k));
