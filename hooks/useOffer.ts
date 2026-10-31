'use client';
import { useSyncExternalStore } from 'react';
import { liveOffer, type Offer } from '@/lib/plans';

const noop = () => () => {};
const now = () => liveOffer();

/**
 * The offer running now, if any. The server snapshot is the same check, so a
 * page built while an offer runs hydrates with the sale price and doesn't
 * flash the list price first. The order route decides what is charged.
 */
export function useOffer(): Offer | null {
  return useSyncExternalStore(noop, now, now);
}
