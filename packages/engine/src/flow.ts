import type { Instrument, ScoreResult } from './types.js';
import { ConfigError } from './scoring.js';

export interface FlowConfig {
  version: string;
  entry: string;
  domainTriggers: { id: string; because: string; ifDomainIn: string[]; instrumentId: string }[];
  severityTriggers: { id: string; because: string; ifSeverityAtLeast: number; instrumentId: string }[];
}

export interface FlowState {
  completed: ScoreResult[];
  /** Instruments the person declined or whose gate they answered "no" to. */
  skipped: string[];
  statedDomain?: string;
}

/**
 * The whole tiered funnel in one pure function: given what has been answered so
 * far, what comes next? Returns null when the flow is done and it is time to route.
 */
export function nextInstrumentId(flow: FlowConfig, state: FlowState): string | null {
  const seen = new Set([...state.completed.map((r) => r.instrumentId), ...state.skipped]);

  if (!seen.has(flow.entry)) return flow.entry;

  // Branches declared on the instruments themselves (PHQ-4 → PHQ-9 / GAD-7).
  for (const result of state.completed) {
    for (const id of result.nextInstrumentIds) {
      if (!seen.has(id)) return id;
    }
  }

  if (state.statedDomain) {
    for (const trigger of flow.domainTriggers) {
      if (trigger.ifDomainIn.includes(state.statedDomain) && !seen.has(trigger.instrumentId)) {
        return trigger.instrumentId;
      }
    }
  }

  const severity = state.completed.reduce((max, r) => Math.max(max, r.severity), 0);
  for (const trigger of flow.severityTriggers) {
    if (severity >= trigger.ifSeverityAtLeast && !seen.has(trigger.instrumentId)) {
      return trigger.instrumentId;
    }
  }

  return null;
}

/**
 * Every instrument the funnel can open after the entry screener, and why.
 *
 * Derived rather than listed, because the transparency page has to name all of
 * them and a hand-written list drifts the moment a trigger is added. The first
 * version of that page named three of five: it was copied from a mockup, and
 * UCLA-3 and AUDIT-C were simply missing, so the page understated what actually
 * runs. Invariant 22 now asserts the two agree.
 */
export interface DeeperScreener {
  instrumentId: string;
  /** What opens it: a branch on the entry screener's own subscales, the domain
   *  the person named, or the severity their answers reached. */
  via: 'branch' | 'domain' | 'severity';
}

export function deeperScreeners(flow: FlowConfig, entry: Instrument): DeeperScreener[] {
  const found = new Map<string, DeeperScreener>();

  for (const branch of entry.branchesTo ?? []) {
    found.set(branch.instrumentId, { instrumentId: branch.instrumentId, via: 'branch' });
  }
  for (const trigger of flow.domainTriggers) {
    if (!found.has(trigger.instrumentId)) {
      found.set(trigger.instrumentId, { instrumentId: trigger.instrumentId, via: 'domain' });
    }
  }
  for (const trigger of flow.severityTriggers) {
    if (!found.has(trigger.instrumentId)) {
      found.set(trigger.instrumentId, { instrumentId: trigger.instrumentId, via: 'severity' });
    }
  }
  return [...found.values()];
}

export function requireInstrument(instruments: Instrument[], id: string): Instrument {
  const found = instruments.find((i) => i.id === id);
  if (!found) throw new ConfigError(`No instrument config with id "${id}"`);
  return found;
}

/**
 * Where the person is in the funnel, for the progress line: "Part 2 of up to 3".
 *
 * The funnel decides as it goes, so the number of parts is not known at the
 * start and copy must never promise one. `upTo` is a ceiling: this part, plus
 * every instrument that could still open given what is known now. Branches from
 * results already scored are certain; branches the current instrument declares,
 * the domain the person named, and every severity trigger are possible. The
 * ceiling only ever comes down. When nothing more can open it is the count, and
 * `exact` says so, so the copy can drop the "up to".
 */
export interface FunnelPosition {
  /** 1-based. */
  part: number;
  upTo: number;
  exact: boolean;
}

export function funnelPosition(
  flow: FlowConfig,
  instruments: Instrument[],
  state: FlowState,
  currentId: string,
): FunnelPosition {
  const seen = new Set([...state.completed.map((r) => r.instrumentId), ...state.skipped]);
  seen.delete(currentId);

  const possible = new Set<string>();
  const add = (id: string) => {
    if (id === currentId || seen.has(id) || possible.has(id)) return;
    possible.add(id);
    // A deeper screener may declare branches of its own.
    for (const branch of requireInstrument(instruments, id).branchesTo ?? []) add(branch.instrumentId);
  };

  for (const result of state.completed) for (const id of result.nextInstrumentIds) add(id);
  for (const branch of requireInstrument(instruments, currentId).branchesTo ?? []) add(branch.instrumentId);
  if (state.statedDomain) {
    for (const trigger of flow.domainTriggers) {
      if (trigger.ifDomainIn.includes(state.statedDomain)) add(trigger.instrumentId);
    }
  }
  for (const trigger of flow.severityTriggers) add(trigger.instrumentId);

  const part = seen.size + 1;
  return { part, upTo: part + possible.size, exact: possible.size === 0 };
}

/**
 * Why the funnel opened this instrument, in the order `nextInstrumentId` checks.
 * The milestone between parts says what the funnel is doing and why, never what
 * the person "has", and this is the "why".
 */
export type OpenedVia = 'entry' | DeeperScreener['via'];

export function whyOpened(flow: FlowConfig, state: FlowState, id: string): OpenedVia {
  if (id === flow.entry) return 'entry';
  if (state.completed.some((r) => r.nextInstrumentIds.includes(id))) return 'branch';
  if (
    state.statedDomain &&
    flow.domainTriggers.some((t) => t.instrumentId === id && t.ifDomainIn.includes(state.statedDomain!))
  ) {
    return 'domain';
  }
  return 'severity';
}

/**
 * The next instrument to put to this person, skipping any that is not offered
 * to them: in practice, one with no official translation in their language.
 *
 * The engine knows nothing about languages; the caller passes the test. A
 * skipped screener is recorded as skipped, so the funnel moves on exactly as if
 * the person had declined it, and the branch ends where any branch ends, at the
 * rungs that fit (D-36). The skipped ids are returned so the result can say
 * plainly that no questionnaire was offered for this.
 */
export function nextOfferedInstrument(
  flow: FlowConfig,
  state: FlowState,
  isOffered: (instrumentId: string) => boolean,
): { next: string | null; notOffered: string[] } {
  const notOffered: string[] = [];
  const skipped = [...state.skipped];
  for (;;) {
    const next = nextInstrumentId(flow, { ...state, skipped });
    if (next === null || isOffered(next)) return { next, notOffered };
    notOffered.push(next);
    skipped.push(next);
  }
}
