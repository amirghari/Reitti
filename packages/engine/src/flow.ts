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

export function requireInstrument(instruments: Instrument[], id: string): Instrument {
  const found = instruments.find((i) => i.id === id);
  if (!found) throw new ConfigError(`No instrument config with id "${id}"`);
  return found;
}
