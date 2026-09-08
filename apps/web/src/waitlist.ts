/**
 * The person's own record of the groups they are waiting for.
 *
 * On-device, like everything else. There is no withdraw endpoint (decision D-4),
 * so interest lapses here rather than being decremented on the server: a token
 * the server could use to decrement would be a per-person identifier, which is
 * precisely what turns an anonymous counter into a pseudonymous store.
 */
const KEY = 'reitti.waitlist.v1';

/** Ninety days. Long enough for a group to actually form, short enough to lapse. */
const TTL_DAYS = 90;

export interface WaitlistEntry {
  topicId: string;
  region: string;
  careLanguage: string;
  /** ISO date. Stamped here — the engine stays clock-free. */
  joinedAt: string;
  expiresAt: string;
}

function read(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WaitlistEntry[];
    if (!Array.isArray(parsed)) return [];
    const now = new Date().toISOString();
    return parsed.filter((e) => e.expiresAt > now);
  } catch {
    return [];
  }
}

function write(entries: WaitlistEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* private browsing or quota — the join still worked, only the memory of it is lost */
  }
}

export function joined(topicId: string, region: string): boolean {
  return read().some((e) => e.topicId === topicId && e.region === region);
}

export function recordJoin(topicId: string, region: string, careLanguage: string): void {
  const now = new Date();
  const expires = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const entries = read().filter((e) => !(e.topicId === topicId && e.region === region));
  entries.push({
    topicId,
    region,
    careLanguage,
    joinedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  });
  write(entries);
}

export function all(): WaitlistEntry[] {
  return read();
}

export function clearWaitlist(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
