import { describe, expect, it } from 'vitest';
import { MemoryCounterStore } from '../src/counters.js';
import {
  handleOutcome,
  handlePoolInterest,
  handlePoolRead,
  OUTCOME_BUCKETS,
  type PoolConfig,
} from '../src/handler.js';

const config: PoolConfig = {
  topics: [
    { id: 'anxiety', formThreshold: 3 },
    { id: 'burnout', formThreshold: 2 },
  ],
  regions: ['helsinki', 'pirkanmaa'],
  languages: ['fi', 'sv', 'en'],
  defaultThreshold: 8,
};

const valid = { topicId: 'anxiety', region: 'helsinki', careLanguage: 'fi' };

describe('POST /pool/interest', () => {
  it('increments and reports progress toward the threshold', async () => {
    const store = new MemoryCounterStore();
    const first = await handlePoolInterest(store, config, valid);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ count: 1, threshold: 3, ready: false });

    await handlePoolInterest(store, config, valid);
    const third = await handlePoolInterest(store, config, valid);
    expect(third.body).toEqual({ count: 3, threshold: 3, ready: true });
  });

  it('stores one integer per topic, region and language — no per-person row', async () => {
    const store = new MemoryCounterStore();
    await handlePoolInterest(store, config, valid);
    await handlePoolInterest(store, config, valid);
    await handlePoolInterest(store, config, { ...valid, region: 'pirkanmaa' });

    // The whole data model, asserted. If a row ever appears here, the privacy
    // claim in the README stopped being true.
    expect(store.snapshot()).toEqual({
      'anxiety|helsinki|fi': 2,
      'anxiety|pirkanmaa|fi': 1,
    });
  });

  it('rejects an extra key instead of silently ignoring it', async () => {
    // Silently ignoring is how a field ends up being sent for months before
    // anyone notices — and what is not sent is the entire claim.
    const store = new MemoryCounterStore();
    const result = await handlePoolInterest(store, config, { ...valid, severity: 4 });
    expect(result.status).toBe(400);
    expect(store.snapshot()).toEqual({});
  });

  it('rejects a missing key', async () => {
    const store = new MemoryCounterStore();
    expect((await handlePoolInterest(store, config, { topicId: 'anxiety' })).status).toBe(400);
  });

  it('rejects values that are not declared, so nothing free-typed is ever stored', async () => {
    const store = new MemoryCounterStore();
    expect((await handlePoolInterest(store, config, { ...valid, topicId: 'x' })).status).toBe(400);
    expect((await handlePoolInterest(store, config, { ...valid, region: 'x' })).status).toBe(400);
    expect((await handlePoolInterest(store, config, { ...valid, careLanguage: 'de' })).status).toBe(
      400,
    );
    expect(store.snapshot()).toEqual({});
  });

  it('rejects a body that is not an object', async () => {
    const store = new MemoryCounterStore();
    for (const body of [null, 'anxiety', 42, ['anxiety'], undefined]) {
      expect((await handlePoolInterest(store, config, body)).status, String(body)).toBe(400);
    }
  });
});

describe('GET /pool/:topicId', () => {
  it('reads without incrementing', async () => {
    const store = new MemoryCounterStore();
    await handlePoolInterest(store, config, valid);
    const read = await handlePoolRead(store, config, valid);
    expect(read.body).toEqual({ count: 1, threshold: 3, ready: false });
    expect(store.snapshot()['anxiety|helsinki|fi']).toBe(1);
  });

  it('reports zero for a topic nobody has joined', async () => {
    const store = new MemoryCounterStore();
    expect((await handlePoolRead(store, config, valid)).body).toEqual({
      count: 0,
      threshold: 3,
      ready: false,
    });
  });
});

describe('POST /outcome', () => {
  it('accepts exactly the three buckets and stores three integers', async () => {
    const store = new MemoryCounterStore();
    for (const bucket of OUTCOME_BUCKETS) {
      expect((await handleOutcome(store, { bucket })).status).toBe(204);
    }
    expect(store.snapshot()).toEqual({
      'outcome|got-in': 1,
      'outcome|still-waiting': 1,
      'outcome|gave-up': 1,
    });
  });

  it('returns nothing back, so the size of the pilot does not leak', async () => {
    const store = new MemoryCounterStore();
    const result = await handleOutcome(store, { bucket: 'got-in' });
    expect(result.status).toBe(204);
    expect(result.body).toBeUndefined();
  });

  it('rejects any other bucket', async () => {
    const store = new MemoryCounterStore();
    expect((await handleOutcome(store, { bucket: 'other' })).status).toBe(400);
    expect((await handleOutcome(store, { bucket: 42 })).status).toBe(400);
  });

  it('rejects a rung, a band or a timestamp riding along', async () => {
    // Decision D-6: these are the fields somebody will ask for first.
    const store = new MemoryCounterStore();
    for (const extra of [{ rung: 'group-therapy' }, { bandId: 'severe' }, { at: '2026-09-08' }]) {
      const result = await handleOutcome(store, { bucket: 'got-in', ...extra });
      expect(result.status, JSON.stringify(extra)).toBe(400);
    }
    expect(store.snapshot()).toEqual({});
  });
});
