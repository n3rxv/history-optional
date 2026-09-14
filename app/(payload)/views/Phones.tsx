import React from 'react';
import { Shell } from './Shell';
import { readTable, relative } from './data';
import { PhonesTable, type Profile } from './PhonesTable';

type Row = {
  user_id?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firebase_uid?: string | null;
  visitor_id?: string | null;
  source?: string | null;
  verified?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default async function PhonesView() {
  const { rows, error } = await readTable<Row>('user_profiles', '*', { column: 'updated_at' }, 1000);

  // relative() reads Date.now(), so it is resolved here rather than in the
  // client component, where server and client would disagree and break
  // hydration.
  const profiles: Profile[] = rows.map((r, i) => ({
    phone: r.phone ?? null,
    name: [r.first_name, r.last_name].filter(Boolean).join(' ') || null,
    source: r.source ?? null,
    verified: Boolean(r.verified),
    signedIn: Boolean(r.firebase_uid),
    updated: relative(r.updated_at ?? r.created_at),
    key: r.firebase_uid ?? r.visitor_id ?? r.user_id ?? r.phone ?? String(i),
  }));

  return (
    <Shell title="Phone Numbers" count={`${profiles.length} profiles`} error={error}>
      <PhonesTable rows={profiles} />
    </Shell>
  );
}
