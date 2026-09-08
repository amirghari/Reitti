/**
 * The follow-up reminder (C3) — on-device, and genuinely so.
 *
 * There is no push token, no subscription and no server-side schedule. The
 * reminder is a date in localStorage that the app checks when it is next opened.
 * No endpoint anywhere knows that a reminder exists, which is what makes
 * "on-device" a description of the mechanism rather than a promise about intent.
 *
 * If the person answers, exactly one of three integers on the server goes up.
 * No rung, no band, no domain, no region, no timestamp, no session id — see
 * decision D-6 for why the more useful-looking versions of this are not built.
 */
const KEY = 'reitti.followup.v1';

/** Six weeks: long enough for a referral to have moved, short enough to remember. */
const REMIND_AFTER_DAYS = 42;

export type OutcomeBucket = 'got-in' | 'still-waiting' | 'gave-up';

export interface FollowUpState {
  /** ISO date after which the prompt may appear. */
  remindAt: string;
  /** Answered or dismissed — either way, never ask twice. */
  answered: boolean;
  dismissed: boolean;
}

function read(): FollowUpState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FollowUpState;
    if (typeof parsed?.remindAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(state: FollowUpState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* the reminder is a convenience; losing it must never block anything */
  }
}

/** Called when a result is saved. Sets the date; sends nothing. */
export function scheduleFollowUp(): void {
  if (read()) return; // already scheduled — do not push the date out on every run
  const remindAt = new Date(Date.now() + REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000);
  write({ remindAt: remindAt.toISOString(), answered: false, dismissed: false });
}

export function followUpDue(now: Date = new Date()): boolean {
  const state = read();
  if (!state || state.answered || state.dismissed) return false;
  return now.toISOString() >= state.remindAt;
}

export function markAnswered(): void {
  const state = read();
  if (state) write({ ...state, answered: true });
}

export function dismissFollowUp(): void {
  const state = read();
  if (state) write({ ...state, dismissed: true });
}

export function clearFollowUp(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Tests and the a11y suite need to reach the due state without waiting six weeks. */
export function forceDueForTesting(): void {
  write({ remindAt: new Date(0).toISOString(), answered: false, dismissed: false });
}
