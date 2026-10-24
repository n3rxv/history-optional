/**
 * The reader's own details: name, age, attempt and target year. They are kept
 * on this device only, as they always were, and set the exam countdown.
 *
 * The navbar shows them and the profile page edits them, so a save announces
 * itself and every reader of the profile picks up the change without a reload.
 */

export type AspirantProfile = { name: string; age: string; attempt: string; year: string };

const KEY = 'ho_aspirant_profile';
export const PROFILE_EVENT = 'ho-profile-change';

const EMPTY: AspirantProfile = { name: '', age: '', attempt: '', year: '' };

export function loadAspirantProfile(): AspirantProfile {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<AspirantProfile> | null;
    return { ...EMPTY, ...(p ?? {}) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveAspirantProfile(p: AspirantProfile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode keeps it for the session only */ }
  window.dispatchEvent(new Event(PROFILE_EVENT));
}
