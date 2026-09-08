/**
 * Feature flags that change what a person is shown.
 *
 * `RECOMMEND_RUNG` is the important one. It governs **rendering, never
 * computation**: `route()` returns the same `RoutingOutput` whatever this says,
 * and `packages/engine` never reads it (invariant 20). That is what makes
 * switching it on later a UI change rather than a clinical one — and what keeps
 * the rules table, `rules:print` and the whole test suite meaningful while the
 * recommendation is switched off.
 *
 * Default off, because every EU/UK tool that maps questionnaire scores to a
 * suggested care level turned out to be a regulated medical device.
 */
import flagsJson from '@config/flags.json';

const declared = flagsJson.flags as Record<string, { default: boolean }>;

/**
 * The build-time override, for a future regulated release. Absent in every
 * ordinary build, so the config default is what ships.
 */
function fromEnv(name: string): boolean | undefined {
  const raw = import.meta.env[`VITE_${name}`];
  if (raw === undefined) return undefined;
  return raw === 'true' || raw === '1';
}

export function flag(name: keyof typeof declared): boolean {
  return fromEnv(name) ?? declared[name]?.default ?? false;
}

export const RECOMMEND_RUNG = flag('RECOMMEND_RUNG');
