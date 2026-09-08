/**
 * The only outbound call the client makes, and the only place in the app that
 * may make one.
 *
 * `store.ts` must never gain a network call; this module exists so that rule
 * stays true and the exception is in one auditable file. Everything about the
 * request is deliberately minimal:
 *
 *   - the body is built by `poolInterestBody` in the engine, which constructs it
 *     key by key from config enums, so a caller cannot smuggle a field through;
 *   - no cookie, no auth header, no device id, no nonce (decision D-4);
 *   - `credentials: 'omit'` so the browser cannot attach one on our behalf;
 *   - nothing about the person's answers, band, severity, rung or age exists in
 *     this file at all.
 *
 * Invariant 11 captures every request the app makes during a full run and
 * asserts the body against an allowlist. If a future change adds a field, that
 * test fails before a person's data does.
 */
import { poolInterestBody, type GroupsConfig, type PoolCount } from '@reitti/engine';
import { groups } from './config';

/** Empty in the preview build unless configured; pooling is then read-only. */
const BASE = import.meta.env.VITE_POOL_COUNTER_URL ?? '';

export const poolingEnabled = (): boolean => BASE !== '';

export interface PoolRequest {
  topicId: string;
  region: string;
  careLanguage: string;
}

export async function registerInterest(request: PoolRequest): Promise<PoolCount | null> {
  if (!poolingEnabled()) return null;

  // Validated against config before anything leaves. An unknown region is our
  // bug, and it fails here rather than becoming free text on the wire.
  const body = poolInterestBody(groups as GroupsConfig, request);

  const response = await fetch(`${BASE}/pool/interest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify(body),
  });

  if (!response.ok) return null;
  return (await response.json()) as PoolCount;
}

export async function readCount(request: PoolRequest): Promise<PoolCount | null> {
  if (!poolingEnabled()) return null;
  const params = new URLSearchParams({
    region: request.region,
    careLanguage: request.careLanguage,
  });
  const response = await fetch(`${BASE}/pool/${encodeURIComponent(request.topicId)}?${params}`, {
    credentials: 'omit',
  });
  if (!response.ok) return null;
  return (await response.json()) as PoolCount;
}

/** C3. One key, one of three literals. Nothing else is ever sent. */
export async function submitOutcome(bucket: 'got-in' | 'still-waiting' | 'gave-up'): Promise<boolean> {
  if (!poolingEnabled()) return false;
  const response = await fetch(`${BASE}/outcome`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ bucket }),
  });
  return response.ok;
}
