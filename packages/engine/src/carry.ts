/**
 * Asking the same question once.
 *
 * Brief screeners are built by reusing items from longer ones. PHQ-4 is not
 * merely *similar* to PHQ-9 and GAD-7 — it is literally their first two items
 * each. So the routing funnel, working exactly as designed, asks someone "Little
 * interest or pleasure in doing things" in PHQ-4 and then again in PHQ-9 a
 * minute later. Four of the twenty items in the PHQ-4 → PHQ-9 → GAD-7 path are
 * verbatim repeats.
 *
 * That is not just tedious. Being asked something you have just answered reads
 * as not having been heard, which is the last thing this product can afford.
 *
 * The fix is identity, not similarity: an item declares a `concept`, and two
 * items with the same concept are the same question. Nothing here guesses, does
 * string matching, or infers — a carry happens only when config says the two
 * items are interchangeable, and every condition below is a clinical one.
 *
 * Pure, like the rest of the engine: configs and prior results in, a list out.
 */
import type { Answers, Instrument, Item, ScaleOption, ScoreResult } from './types.js';
import { scaleFor } from './scoring.js';

/** One answer reused from an instrument the person already completed. */
export interface CarriedAnswer {
  /** The item in the instrument about to be asked. */
  key: string;
  concept: string;
  value: number;
  /** Where it came from. Shown to the person, and to the clinician in the audit trail. */
  fromInstrumentId: string;
  fromItemKey: string;
}

export interface PriorAnswers {
  instrument: Instrument;
  result: ScoreResult;
}

/**
 * Which of `instrument`'s items are already answered by earlier instruments.
 *
 * A carry requires *all* of:
 *   - both items declare the same `concept`;
 *   - both instruments declare the same `recallWindow` — "over the last 2 weeks"
 *     and "in the past month" are different measurements, not the same one;
 *   - the two items offer an identical response scale, option for option. A
 *     rescaled item is a different instrument's item that happens to rhyme;
 *   - the item is not this instrument's crisis item. Safety invariant 2 turns on
 *     an answer being *given*; a crisis item is always asked directly, however
 *     recently something equivalent was answered.
 *
 * When several priors match, the most recent wins.
 */
export function carryForward(instrument: Instrument, priors: PriorAnswers[]): CarriedAnswer[] {
  if (!instrument.recallWindow) return [];

  const carried: CarriedAnswer[] = [];

  for (const item of instrument.items) {
    if (!item.concept) continue;
    if (instrument.crisisItem?.key === item.key) continue;

    const targetScale = scaleFor(instrument, item.key);

    // Most recent first.
    for (const prior of [...priors].reverse()) {
      if (prior.instrument.recallWindow !== instrument.recallWindow) continue;

      const match = prior.instrument.items.find((candidate) => candidate.concept === item.concept);
      if (!match) continue;
      if (prior.instrument.crisisItem?.key === match.key) continue;

      const value = prior.result.answers[match.key];
      if (value === undefined) continue;

      if (!sameScale(targetScale, scaleFor(prior.instrument, match.key))) continue;

      carried.push({
        key: item.key,
        concept: item.concept,
        value,
        fromInstrumentId: prior.instrument.id,
        fromItemKey: match.key,
      });
      break;
    }
  }

  return carried;
}

/** The carried answers as an `Answers` map, ready to merge into a questionnaire. */
export function carriedAnswers(carried: CarriedAnswer[]): Answers {
  return Object.fromEntries(carried.map((c) => [c.key, c.value]));
}

/** The items still to ask — the instrument's items minus anything carried. */
export function itemsToAsk(instrument: Instrument, carried: CarriedAnswer[]): Item[] {
  const skip = new Set(carried.map((c) => c.key));
  return instrument.items.filter((item) => !skip.has(item.key));
}

/** Identical option-for-option: same length, same values, same labels, same order. */
function sameScale(a: ScaleOption[], b: ScaleOption[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((option, i) => option.value === b[i].value && option.labelRef === b[i].labelRef);
}
