/**
 * The in-progress assessment, so an accidental refresh at question 12 of PHQ-9
 * does not throw away everything the person just did. Someone who took the
 * effort to start is exactly who we must not make start over.
 *
 * `sessionStorage`, deliberately — not `localStorage`, which is where completed
 * results live (`store.ts`). A finished summary is something the person chose to
 * keep and can delete on demand. A half-finished set of symptom answers is not:
 * it would outlive the tab on a shared, family or library device, with nobody
 * having decided to keep it. Session storage dies with the tab, which is the
 * behaviour a draft should have.
 *
 * Same rule as store.ts: nothing in this module may gain a network call.
 */
import type { Answers, ScoreResult } from '@reitti/engine';

const KEY = 'reitti.draft.v1';

export interface DraftContext {
  statedDomain: string;
  duration: string;
  budget: string;
  language: string;
}

export interface Draft {
  version: 1;
  /** Only mid-flow screens are worth restoring; home and result are not drafts. */
  screen: 'context' | 'questions';
  /** The finished context answers. Null while they are still being given. */
  context: DraftContext | null;
  /** Position inside the context questions, before they are complete. */
  contextProgress: { answers: Partial<DraftContext>; index: number } | null;
  completed: ScoreResult[];
  skipped: string[];
  currentId: string | null;
  /**
   * Position inside the instrument being answered. Never contains an answer that
   * tripped a crisis item: those are held un-committed until the person has seen
   * the crisis panel, so a refresh mid-hold re-asks the item and the crisis path
   * fires again rather than being silently swallowed by the restore.
   */
  inProgress: { answers: Answers; index: number } | null;
}

export function saveDraft(draft: Draft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private browsing, quota, or storage disabled. The session still works in
    // memory; only refresh-durability is lost. Silence is the right behaviour.
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (parsed.version !== 1) return null;
    if (parsed.screen !== 'context' && parsed.screen !== 'questions') return null;
    if (!Array.isArray(parsed.completed) || !Array.isArray(parsed.skipped)) return null;
    // A questions draft without an instrument is not restorable.
    if (parsed.screen === 'questions' && !parsed.currentId) return null;
    return parsed;
  } catch {
    // A corrupted draft must never block someone from starting again.
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
