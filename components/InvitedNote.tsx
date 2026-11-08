'use client';
import { useSyncExternalStore } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { readRef } from '@/lib/referralClient';
import { REFERRED_DAYS } from '@/lib/referral';

const noop = () => () => {};

/** Tells a visitor who came through an invite link what it gets them. */
export default function InvitedNote({ className }: { className?: string }) {
  const { langHi } = useLang();
  const code = useSyncExternalStore(noop, readRef, () => null);
  if (!code) return null;
  return (
    <p className={className}>
      {langHi
        ? `आपको एक दोस्त ने बुलाया है: अपने पहले 6 महीने या एक साल के प्लान के साथ ${REFERRED_DAYS} दिन अतिरिक्त पाएँ।`
        : `A friend invited you: get ${REFERRED_DAYS} extra days with your first 6-month or yearly plan.`}
    </p>
  );
}
