/**
 * The counter store. Integers keyed by a coarse string, and nothing else.
 *
 * Kept as an interface so the preview can run in memory and production can put
 * an EU-hosted durable store behind the same three methods without touching the
 * handler.
 */
export interface CounterStore {
  increment(key: string): Promise<number>;
  read(key: string): Promise<number>;
}

export class MemoryCounterStore implements CounterStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string): Promise<number> {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  async read(key: string): Promise<number> {
    return this.counts.get(key) ?? 0;
  }

  /** Tests only. */
  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counts);
  }
}
