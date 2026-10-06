'use client';
import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

const AdminTools = dynamic(() => import('./AdminTools'), { ssr: false });
const PostAdmin = dynamic(() => import('./PostAdmin'), { ssr: false });

// An admin session is kept in this tab's sessionStorage. Readers have none, so
// the editor's code is never downloaded for them.
const hasSession = () => { try { return Boolean(sessionStorage.getItem('histopt_admin_v2')); } catch { return false; } };
const noop = () => () => {};

export function AdminToolsSlot() {
  const admin = useSyncExternalStore(noop, hasSession, () => false);
  return admin ? <AdminTools /> : null;
}

export function PostAdminSlot({ slug }: { slug: string }) {
  const admin = useSyncExternalStore(noop, hasSession, () => false);
  return admin ? <PostAdmin slug={slug} /> : null;
}
