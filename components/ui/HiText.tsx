'use client';

import type { ReactNode } from 'react';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * Words for a server-drawn page in both languages. The server sends the
 * English, which is what search engines read, and in Hindi mode the reader
 * sees the Hindi.
 */
export function HiText({ en, hi }: { en: ReactNode; hi: ReactNode }) {
  const { langHi } = useLang();
  return <>{langHi ? hi : en}</>;
}
