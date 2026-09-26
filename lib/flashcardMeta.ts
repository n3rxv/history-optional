/**
 * Flashcard metadata with no card data attached.
 *
 * This exists so the client can name the card types without importing
 * lib/flashcards.ts. That module's `flashcardSections` is derived from the
 * card array, so any import from it — even of a single string constant —
 * pulls all ~173 KB of card text into the browser bundle, which is the exact
 * cost moving flashcards into Postgres was meant to remove.
 *
 * Sections are not listed here: they come from the index the API returns, so
 * the filter only ever offers sections that actually have cards.
 */

export const FLASHCARD_TYPES = [
  'historian',
  'comparison',
  'cause-effect',
  'quote',
  'concept',
] as const;

export type FlashCardType = (typeof FLASHCARD_TYPES)[number];
