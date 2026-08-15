/**
 * On-device storage. Architecture v2 §5: answers, bands and timestamps live here
 * and are never transmitted. "Clear my data" is real and instant.
 *
 * Nothing in this module may gain a network call. If a future feature needs a
 * server, it goes through the share-code service with explicit consent instead.
 */
import type { ScoreResult } from '@reitti/engine';

const KEY = 'reitti.v1';

export interface StoredSession {
  /** ISO timestamp, stamped here — the engine stays clock-free. */
  completedAt: string;
  context: {
    statedDomain: string;
    duration: string;
    budget: string;
    language: string;
  };
  results: ScoreResult[];
  suggestedRungId: string | null;
  rulesVersion: string;
}

interface StoreShape {
  version: 1;
  sessions: StoredSession[];
}

const empty = (): StoreShape => ({ version: 1, sessions: [] });

function read(): StoreShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as StoreShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) return empty();
    return parsed;
  } catch {
    // A corrupted or unavailable store must never block someone from getting help.
    return empty();
  }
}

function write(store: StoreShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Private browsing, quota, or storage disabled. The session still works in
    // memory; only history is lost. Silence is the right behaviour here.
  }
}

export function saveSession(session: StoredSession): void {
  const store = read();
  store.sessions.push(session);
  write(store);
}

export function loadSessions(): StoredSession[] {
  return read().sessions;
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export function hasStoredData(): boolean {
  return read().sessions.length > 0;
}
