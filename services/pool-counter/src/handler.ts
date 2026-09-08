/**
 * The request handler. Framework-free and pure apart from the store, so the
 * privacy properties are unit-testable rather than asserted in a README.
 *
 * The rule that matters: **an unexpected key is a 400.** Silently ignoring an
 * extra field is how a field ends up being sent for months before anyone
 * notices — and the whole claim here is about what is not sent.
 */
import type { CounterStore } from './counters.js';

export const OUTCOME_BUCKETS = ['got-in', 'still-waiting', 'gave-up'] as const;
export type OutcomeBucket = (typeof OUTCOME_BUCKETS)[number];

export interface PoolConfig {
  topics: { id: string; formThreshold: number }[];
  regions: string[];
  languages: string[];
  defaultThreshold: number;
}

export interface HandlerResult {
  status: number;
  body?: unknown;
}

const bad = (message: string): HandlerResult => ({ status: 400, body: { error: message } });

/** Exactly these keys, no more and no fewer. */
function exactKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const got = Object.keys(value);
  return got.length === keys.length && keys.every((k) => got.includes(k));
}

export async function handlePoolInterest(
  store: CounterStore,
  config: PoolConfig,
  body: unknown,
): Promise<HandlerResult> {
  if (!exactKeys(body, ['topicId', 'region', 'careLanguage'])) {
    return bad('body must be exactly { topicId, region, careLanguage }');
  }
  const { topicId, region, careLanguage } = body as Record<string, string>;

  const topic = config.topics.find((t) => t.id === topicId);
  if (!topic) return bad('unknown topicId');
  if (!config.regions.includes(region)) return bad('unknown region');
  if (!config.languages.includes(careLanguage)) return bad('unknown careLanguage');

  const key = `${topicId}|${region}|${careLanguage}`;
  const count = await store.increment(key);
  const threshold = topic.formThreshold ?? config.defaultThreshold;

  return { status: 200, body: { count, threshold, ready: count >= threshold } };
}

export async function handlePoolRead(
  store: CounterStore,
  config: PoolConfig,
  query: { topicId: string; region: string; careLanguage: string },
): Promise<HandlerResult> {
  const topic = config.topics.find((t) => t.id === query.topicId);
  if (!topic) return bad('unknown topicId');
  if (!config.regions.includes(query.region)) return bad('unknown region');
  if (!config.languages.includes(query.careLanguage)) return bad('unknown careLanguage');

  const count = await store.read(`${query.topicId}|${query.region}|${query.careLanguage}`);
  const threshold = topic.formThreshold ?? config.defaultThreshold;
  return { status: 200, body: { count, threshold, ready: count >= threshold } };
}

/**
 * C3. One key, one of three literal values. No rung, no band, no region, no
 * timestamp, no session id — see decision D-6 for why the useful-looking
 * extra dimensions are not here.
 */
export async function handleOutcome(store: CounterStore, body: unknown): Promise<HandlerResult> {
  if (!exactKeys(body, ['bucket'])) return bad('body must be exactly { bucket }');
  const { bucket } = body as { bucket: unknown };
  if (typeof bucket !== 'string' || !OUTCOME_BUCKETS.includes(bucket as OutcomeBucket)) {
    return bad(`bucket must be one of ${OUTCOME_BUCKETS.join(', ')}`);
  }
  await store.increment(`outcome|${bucket}`);
  // 204: there is nothing to tell the person back, and returning the running
  // total would leak how small the pilot is.
  return { status: 204 };
}
