/**
 * Demand pooling — the one Reitti mechanism a directory competitor cannot copy.
 *
 * A therapist directory inverts nothing: supply exists and people are matched to
 * it. Pooling runs the other way — aggregated demand *creates* capacity that did
 * not exist. "Fourteen people in Uusimaa are waiting for a low-cost anxiety
 * group" is an offer to a provider.
 *
 * Everything here is pure. The privacy properties are enforced by
 * `poolInterestBody` being the ONLY thing the client is allowed to send, and by
 * invariant 11 asserting its shape over the whole flow. There is no withdraw
 * endpoint by design (decision D-4): a withdraw token would be a per-person
 * identifier, which is exactly what turns an anonymous counter into a
 * pseudonymous health-adjacent database.
 */
import { ConfigError } from './scoring.js';

export interface GroupTopic {
  id: string;
  nameRef: string;
  descriptionRef: string;
  rungs: string[];
  formThreshold: number;
  because: string;
}

export interface GroupsConfig {
  version: string;
  defaultThreshold: number;
  regions: string[];
  languages: string[];
  topics: GroupTopic[];
}

/**
 * The complete request body. Three values, all chosen from fixed enums in config,
 * none of them derived from a score, a band, an answer or a device.
 *
 * This type is the privacy contract. Adding a field to it — "just the rung, so we
 * can segment" — is a change to invariant 11 and has to be argued as one.
 */
export interface PoolInterestBody {
  topicId: string;
  region: string;
  careLanguage: string;
}

export const POOL_BODY_KEYS = ['topicId', 'region', 'careLanguage'] as const;

export interface PoolCount {
  count: number;
  threshold: number;
  ready: boolean;
}

/** The threshold for a topic, falling back to the config-wide default. */
export function thresholdFor(config: GroupsConfig, topicId: string): number {
  const topic = config.topics.find((t) => t.id === topicId);
  if (!topic) throw new ConfigError(`No group topic "${topicId}"`);
  return topic.formThreshold ?? config.defaultThreshold;
}

export function readyToForm(count: number, threshold: number): boolean {
  return count >= threshold;
}

/**
 * Build the request body, validating every value against config before it can
 * leave. An unknown region or language is a bug on our side, and it fails here
 * rather than becoming a free-text field on the wire.
 */
export function poolInterestBody(
  config: GroupsConfig,
  input: { topicId: string; region: string; careLanguage: string },
): PoolInterestBody {
  if (!config.topics.some((t) => t.id === input.topicId)) {
    throw new ConfigError(`No group topic "${input.topicId}"`);
  }
  if (!config.regions.includes(input.region)) {
    throw new ConfigError(`Region "${input.region}" is not one of the declared regions`);
  }
  if (!config.languages.includes(input.careLanguage)) {
    throw new ConfigError(`Language "${input.careLanguage}" is not one of the declared languages`);
  }
  // Constructed key by key rather than spread, so a caller cannot smuggle an
  // extra property through by passing a wider object.
  return {
    topicId: input.topicId,
    region: input.region,
    careLanguage: input.careLanguage,
  };
}

/** The counter key. Coarse by construction: topic × region × language, nothing finer. */
export function poolKey(body: PoolInterestBody): string {
  return `${body.topicId}|${body.region}|${body.careLanguage}`;
}

/**
 * Waitlist promotion: first in, first promoted, within a topic.
 *
 * Computed from positions the client already holds. The server never orders
 * people because it does not know that people exist — it knows a number.
 */
export function promoteNext<T extends { joinedAt: string }>(waiting: T[], seats: number): T[] {
  return [...waiting].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)).slice(0, Math.max(0, seats));
}

/** Topics offered on a rung, in config order — the clinician's ordering. */
export function topicsForRung(config: GroupsConfig, rungId: string): GroupTopic[] {
  return config.topics.filter((t) => t.rungs.includes(rungId));
}
