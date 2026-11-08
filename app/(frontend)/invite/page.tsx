import type { Metadata } from 'next';
import InvitePage from '@/components/invite/InvitePage';

export const metadata: Metadata = {
  title: { absolute: 'Invite a friend: History Optional' },
  robots: { index: false },
};

export default function Invite() {
  return <InvitePage />;
}
