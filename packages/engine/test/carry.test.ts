/**
 * Asking the same question once — and the rules that stop it going wrong.
 *
 * The risk here is not a duplicate question; it is skipping one that should have
 * been asked. Every test below is a guard against a *wrong* carry: a different
 * recall window, a different response scale, or the crisis item.
 */
import { describe, expect, it } from 'vitest';
import { carryForward, carriedAnswers, itemsToAsk } from '../src/carry.js';
import { scoreInstrument } from '../src/scoring.js';
import type { Instrument, PriorAnswers } from '../src/index.js';
import { answerAll, en, instrument, instruments } from './helpers.js';

/** A completed instrument, as the app would hand it over. */
const prior = (id: string, answers: Record<string, number>): PriorAnswers => ({
  instrument: instrument(id),
  result: scoreInstrument(instrument(id), answers),
});

describe('carrying an answer forward', () => {
  it('PHQ-4 answers the first two items of PHQ-9', () => {
    const carried = carryForward(instrument('phq-9'), [prior('phq-4', { q1: 1, q2: 2, q3: 3, q4: 2 })]);

    expect(carried.map((c) => c.key)).toEqual(['q1', 'q2']);
    // PHQ-4 q3/q4 are the depression pair; they land on PHQ-9 q1/q2.
    expect(carriedAnswers(carried)).toEqual({ q1: 3, q2: 2 });
    expect(carried[0]).toMatchObject({ concept: 'phq.anhedonia', fromInstrumentId: 'phq-4', fromItemKey: 'q3' });
  });

  it('PHQ-4 answers the first two items of GAD-7', () => {
    const carried = carryForward(instrument('gad-7'), [prior('phq-4', { q1: 3, q2: 1, q3: 0, q4: 0 })]);

    expect(carried.map((c) => c.key)).toEqual(['q1', 'q2']);
    expect(carriedAnswers(carried)).toEqual({ q1: 3, q2: 1 });
  });

  it('leaves the remaining items to ask', () => {
    const target = instrument('phq-9');
    const carried = carryForward(target, [prior('phq-4', answerAll('phq-4', 1))]);

    const asked = itemsToAsk(target, carried);
    expect(asked).toHaveLength(target.items.length - 2);
    expect(asked.map((i) => i.key)).not.toContain('q1');
    expect(asked.map((i) => i.key)).toContain('q9');
  });

  it('the whole PHQ-4 → PHQ-9 → GAD-7 path asks four fewer questions', () => {
    const phq4 = prior('phq-4', answerAll('phq-4', 2));
    const askedPhq9 = itemsToAsk(instrument('phq-9'), carryForward(instrument('phq-9'), [phq4]));
    const askedGad7 = itemsToAsk(instrument('gad-7'), carryForward(instrument('gad-7'), [phq4]));

    const before = 4 + instrument('phq-9').items.length + instrument('gad-7').items.length;
    const after = 4 + askedPhq9.length + askedGad7.length;
    expect(before - after).toBe(4);
  });

  it('carries nothing when there is no prior', () => {
    expect(carryForward(instrument('phq-9'), [])).toEqual([]);
  });

  it('scores identically whether an answer was carried or typed again', () => {
    const answers = answerAll('phq-9', 2);
    const carried = carryForward(instrument('phq-9'), [prior('phq-4', { q1: 0, q2: 0, q3: 2, q4: 2 })]);

    const withCarry = scoreInstrument(instrument('phq-9'), {
      ...carriedAnswers(carried),
      ...Object.fromEntries(
        itemsToAsk(instrument('phq-9'), carried).map((i) => [i.key, answers[i.key]]),
      ),
    });

    expect(withCarry).toEqual(scoreInstrument(instrument('phq-9'), answers));
  });
});

describe('the guards that stop a wrong carry', () => {
  it('never carries a crisis item, however recently the concept was answered', () => {
    // Force the dangerous case: give PHQ-9's crisis item a concept, and a prior
    // that shares it. It must still be asked.
    const target: Instrument = {
      ...instrument('phq-9'),
      items: instrument('phq-9').items.map((i) =>
        i.key === 'q9' ? { ...i, concept: 'phq.self-harm' } : i,
      ),
    };
    const source: Instrument = {
      ...instrument('phq-4'),
      items: instrument('phq-4').items.map((i) =>
        i.key === 'q1' ? { ...i, concept: 'phq.self-harm' } : i,
      ),
    };

    const carried = carryForward(target, [
      { instrument: source, result: scoreInstrument(source, { q1: 3, q2: 0, q3: 0, q4: 0 }) },
    ]);

    expect(carried.map((c) => c.key)).not.toContain('q9');
    expect(itemsToAsk(target, carried).map((i) => i.key)).toContain('q9');
  });

  it('never carries across different recall windows', () => {
    // Same concept, but "in the past month" is not "over the last 2 weeks".
    const target: Instrument = {
      ...instrument('phq-9'),
      recallWindow: '1-month',
    };
    expect(carryForward(target, [prior('phq-4', answerAll('phq-4', 2))])).toEqual([]);
  });

  it('never carries when the instrument declares no recall window', () => {
    const target: Instrument = { ...instrument('phq-9'), recallWindow: undefined };
    expect(carryForward(target, [prior('phq-4', answerAll('phq-4', 2))])).toEqual([]);
  });

  it('never carries across different response scales', () => {
    // Same concept and window, rescaled 0–1. A rescaled item is a different
    // measurement, not the same answer.
    const source: Instrument = {
      ...instrument('phq-4'),
      scale: [
        { labelRef: 'scale.yesno.0', value: 0 },
        { labelRef: 'scale.yesno.1', value: 1 },
      ],
      bands: [{ min: 0, max: 4, bandId: 'none', severity: 0, reflectionRef: 'band.phq-4.none' }],
    };

    const carried = carryForward(instrument('phq-9'), [
      { instrument: source, result: scoreInstrument(source, { q1: 1, q2: 1, q3: 1, q4: 1 }) },
    ]);
    expect(carried).toEqual([]);
  });

  it('takes the most recent answer when two priors share a concept', () => {
    const carried = carryForward(instrument('phq-9'), [
      prior('phq-4', { q1: 0, q2: 0, q3: 0, q4: 0 }),
      prior('phq-4', { q1: 0, q2: 0, q3: 3, q4: 3 }),
    ]);
    expect(carriedAnswers(carried)).toEqual({ q1: 3, q2: 3 });
  });
});

describe('the concept vocabulary in config', () => {
  const byConcept = new Map<string, { id: string; key: string }[]>();
  for (const inst of instruments) {
    for (const item of inst.items) {
      if (!item.concept) continue;
      byConcept.set(item.concept, [...(byConcept.get(item.concept) ?? []), { id: inst.id, key: item.key }]);
    }
  }

  it('declares at least one shared concept, or this machinery is dead code', () => {
    expect([...byConcept.values()].some((uses) => uses.length > 1)).toBe(true);
  });

  it('every item wearing a shared concept asks the identical question', () => {
    // Two items claiming the same concept but different wording is a config bug
    // that would silently answer a question the person never saw. Compare the
    // wording the person actually reads, not the ref that points at it — the
    // refs differ by construction (phq-4.item.q3 vs phq-9.item.q1).
    for (const [concept, uses] of byConcept) {
      if (uses.length < 2) continue;
      const wordings = new Set(
        uses.map(({ id, key }) => {
          const item = instrument(id).items.find((i) => i.key === key);
          return item ? en[item.textRef] : undefined;
        }),
      );
      expect([...wordings].every(Boolean), `${concept} has an item with no wording`).toBe(true);
      expect(wordings.size, `${concept} is used on ${wordings.size} differently-worded items`).toBe(1);
    }
  });

  it('no crisis item anywhere carries a concept', () => {
    for (const inst of instruments) {
      const crisisKey = inst.crisisItem?.key;
      if (!crisisKey) continue;
      const item = inst.items.find((i) => i.key === crisisKey);
      expect(item?.concept, `${inst.id}.${crisisKey} is a crisis item with a concept`).toBeUndefined();
    }
  });
});
