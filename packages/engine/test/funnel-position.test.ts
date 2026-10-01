/**
 * "Part 2 of up to 3": the progress line may never promise fewer parts than the
 * funnel then asks.
 *
 * The funnel decides as it goes, which is the whole point of it, so the count
 * shown on the first question is a ceiling and not a number. These tests walk
 * every domain against a spread of answer patterns and hold the ceiling to what
 * actually happened at every step of every run.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deeperScreeners,
  funnelPosition,
  nextInstrumentId,
  whyOpened,
  type FlowState,
  type FunnelPosition,
} from '../src/flow.js';
import { scaleFor, scoreInstrument } from '../src/scoring.js';
import type { Answers, Instrument } from '../src/types.js';
import { CONFIG_DIR, flow, instrument, instruments } from './helpers.js';

/** Every domain the context step offers, plus the ones only the triggers name. */
const DOMAINS = [
  ...new Set([
    'mood', 'anxiety', 'work', 'social', 'grief', 'substance', 'general',
    ...flow.domainTriggers.flatMap((t) => t.ifDomainIn),
  ]),
];

/** Which option each item gets, by position in its scale. */
const PATTERNS: Record<string, (itemIndex: number, options: number) => number> = {
  lowest: () => 0,
  highest: (_, n) => n - 1,
  middle: (_, n) => Math.floor((n - 1) / 2),
  alternate: (i, n) => (i % 2 === 0 ? n - 1 : 0),
  firstHalfHigh: (i, n) => (i < 2 ? n - 1 : 0),
  secondHalfHigh: (i, n) => (i >= 2 ? n - 1 : 0),
};

const answer = (inst: Instrument, pick: (i: number, n: number) => number): Answers => {
  const out: Answers = {};
  inst.items.forEach((item, i) => {
    const options = scaleFor(inst, item.key);
    out[item.key] = options[pick(i, options.length)].value;
  });
  return out;
};

/** One whole run: the position shown at each part, and the ids actually asked. */
function walk(domain: string, pick: (i: number, n: number) => number) {
  const state: FlowState = { completed: [], skipped: [], statedDomain: domain };
  const shown: FunnelPosition[] = [];
  const asked: string[] = [];
  for (let id = nextInstrumentId(flow, state); id; id = nextInstrumentId(flow, state)) {
    shown.push(funnelPosition(flow, instruments, state, id));
    asked.push(id);
    state.completed.push(scoreInstrument(instrument(id), answer(instrument(id), pick)));
    if (asked.length > instruments.length) throw new Error('the funnel did not terminate');
  }
  return { shown, asked, state };
}

describe('funnelPosition', () => {
  const runs = DOMAINS.flatMap((domain) =>
    Object.entries(PATTERNS).map(([name, pick]) => ({ label: `${domain} / ${name}`, ...walk(domain, pick) })),
  );

  it('walks enough different paths to mean something', () => {
    const lengths = new Set(runs.map((r) => r.asked.length));
    expect(lengths.size, 'every run asked the same number of parts').toBeGreaterThan(1);
    expect(Math.max(...lengths)).toBeGreaterThanOrEqual(3);
  });

  it('numbers the parts 1, 2, 3 in the order they are asked', () => {
    for (const run of runs) {
      expect(run.shown.map((p) => p.part), run.label).toEqual(run.asked.map((_, i) => i + 1));
    }
  });

  it('never promises fewer parts than are then asked', () => {
    for (const run of runs) {
      for (const [i, p] of run.shown.entries()) {
        expect(run.asked.length, `${run.label}, part ${i + 1}: "up to ${p.upTo}"`).toBeLessThanOrEqual(p.upTo);
      }
    }
  });

  it('only drops the "up to" when the count is certain', () => {
    for (const run of runs) {
      for (const p of run.shown) if (p.exact) expect(p.upTo, run.label).toBe(run.asked.length);
    }
    // And it does get certain: the last part of a run that ends is known to be the last.
    expect(runs.some((r) => r.shown.at(-1)?.exact)).toBe(true);
  });

  it('the ceiling only ever comes down', () => {
    for (const run of runs) {
      for (let i = 1; i < run.shown.length; i++) {
        expect(run.shown[i].upTo, run.label).toBeLessThanOrEqual(run.shown[i - 1].upTo);
      }
    }
  });
});

describe('whyOpened', () => {
  it('names the entry screener as the entry', () => {
    expect(whyOpened(flow, { completed: [], skipped: [] }, flow.entry)).toBe('entry');
  });

  it('agrees with a real run about why each deeper screener opened', () => {
    for (const domain of DOMAINS) {
      for (const pick of Object.values(PATTERNS)) {
        const { asked, state } = walk(domain, pick);
        for (const [i, id] of asked.entries()) {
          if (i === 0) continue;
          const before: FlowState = { ...state, completed: state.completed.slice(0, i) };
          const via = whyOpened(flow, before, id);
          if (via === 'branch') {
            expect(before.completed.some((r) => r.nextInstrumentIds.includes(id))).toBe(true);
          } else if (via === 'domain') {
            expect(flow.domainTriggers.some((t) => t.instrumentId === id && t.ifDomainIn.includes(domain))).toBe(true);
          } else {
            expect(via).toBe('severity');
            expect(flow.severityTriggers.some((t) => t.instrumentId === id)).toBe(true);
          }
        }
      }
    }
  });
});

describe('the milestone between parts', () => {
  const clinical = (language: string): Record<string, unknown> =>
    JSON.parse(readFileSync(join(CONFIG_DIR, 'i18n', 'clinical', `${language}.json`), 'utf8'));

  it('can name what every deeper screener looks at, in every language', () => {
    // A screener with no topic would open with no milestone at all, which reads
    // as the questionnaire restarting rather than going deeper.
    for (const language of ['en', 'fi', 'sv']) {
      const bundle = clinical(language);
      for (const { instrumentId } of deeperScreeners(flow, instrument(flow.entry))) {
        expect(bundle[`milestone.topic.${instrumentId}`], `${language}: ${instrumentId}`).toBeTruthy();
      }
      for (const via of ['branch', 'domain', 'severity', 'count.one', 'count.other']) {
        expect(bundle[`milestone.${via}`], `${language}: milestone.${via}`).toBeTruthy();
      }
    }
  });

  it('stays flagged for the clinician until it is signed off', () => {
    // The copy describes the funnel logic, which is the clinician's to approve.
    // Every milestone string is listed as provisional, and the list names
    // nothing that does not exist. Other drafted clinical copy can share the
    // list (the crisis control's label, D-32).
    for (const language of ['en', 'fi', 'sv']) {
      const bundle = clinical(language);
      const provisional = bundle._provisional as string[];
      const milestone = Object.keys(bundle).filter((k) => k.startsWith('milestone.'));
      for (const key of milestone) expect(provisional, `${language}: ${key}`).toContain(key);
      for (const key of provisional) expect(bundle[key], `${language}: ${key} is listed but missing`).toBeTruthy();
    }
  });
});
