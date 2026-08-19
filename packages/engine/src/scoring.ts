import type {
  Answers,
  Band,
  Instrument,
  SafetyFlag,
  ScaleOption,
  ScoreResult,
} from './types.js';

export class ConfigError extends Error {}
export class IncompleteAnswersError extends Error {
  constructor(public readonly missingKeys: string[]) {
    super(`Missing answers for: ${missingKeys.join(', ')}`);
  }
}

/** The scale that applies to a given item — its own, or the instrument's shared one. */
export function scaleFor(instrument: Instrument, itemKey: string): ScaleOption[] {
  const item = instrument.items.find((i) => i.key === itemKey);
  if (!item) throw new ConfigError(`${instrument.id}: no item "${itemKey}"`);
  const scale = item.scale ?? instrument.scale;
  if (!scale || scale.length === 0) {
    throw new ConfigError(`${instrument.id}: item "${itemKey}" has no scale`);
  }
  return scale;
}

/**
 * Safety invariant 2: this is checked on every answer as it is given, before
 * the questionnaire continues — not at the end. It must work on partial answers.
 */
export function checkCrisis(instrument: Instrument, answers: Answers): boolean {
  const rule = instrument.crisisItem;
  if (!rule) return false;
  const value = answers[rule.key];
  if (value === undefined) return false;
  return value >= rule.triggerIf.atLeast;
}

/** An instrument whose gate was answered "no" is skipped entirely. */
export function isGatedOut(instrument: Instrument, answers: Answers): boolean {
  const gate = instrument.gate;
  if (!gate || !gate.skipIfNo) return false;
  return answers[gate.key] === 0;
}

function findBand(instrument: Instrument, score: number): Band {
  const band = instrument.bands.find((b) => score >= b.min && score <= b.max);
  if (!band) {
    throw new ConfigError(
      `${instrument.id}: score ${score} falls outside every band — the bands table has a gap`,
    );
  }
  return band;
}

/**
 * Score a completed instrument. Pure: same answers in, same result out.
 *
 * Throws IncompleteAnswersError rather than scoring a partial set — a screener
 * scored on missing items would understate severity, which is the dangerous
 * direction to be wrong in.
 */
export function scoreInstrument(instrument: Instrument, answers: Answers): ScoreResult {
  const missing = instrument.items.filter((i) => answers[i.key] === undefined).map((i) => i.key);
  if (missing.length > 0) throw new IncompleteAnswersError(missing);

  // Reject values that aren't on the item's scale — a typo in config or a bad
  // client would otherwise silently shift someone into the wrong band.
  for (const item of instrument.items) {
    const permitted = scaleFor(instrument, item.key).map((o) => o.value);
    if (!permitted.includes(answers[item.key])) {
      throw new ConfigError(
        `${instrument.id}: item "${item.key}" answered ${answers[item.key]}, not on its scale [${permitted.join(', ')}]`,
      );
    }
  }

  const values = instrument.items.map((i) => answers[i.key]);
  const sum = values.reduce((a, b) => a + b, 0);
  const rawScore = instrument.scoring === 'mean' ? sum / values.length : sum;
  const score = instrument.scoreTransform ? rawScore * instrument.scoreTransform.multiplier : rawScore;

  const subscales: Record<string, number> = {};
  for (const item of instrument.items) {
    if (!item.subscale) continue;
    subscales[item.subscale] = (subscales[item.subscale] ?? 0) + answers[item.key];
  }

  const band = findBand(instrument, score);
  const crisisTriggered = checkCrisis(instrument, answers);

  const safetyFlags: SafetyFlag[] = [];
  if (crisisTriggered) safetyFlags.push('crisis');
  if (instrument.safetyFlag && instrument.safetyFlag.ifBandId === band.bandId) {
    safetyFlags.push(instrument.safetyFlag.flag);
  }

  const nextInstrumentIds = (instrument.branchesTo ?? [])
    .filter((branch) => {
      if (branch.ifSubscaleAtLeast) {
        const { subscale, score: threshold } = branch.ifSubscaleAtLeast;
        return (subscales[subscale] ?? 0) >= threshold;
      }
      if (branch.ifScoreAtLeast !== undefined) return score >= branch.ifScoreAtLeast;
      return false;
    })
    .map((branch) => branch.instrumentId);

  return {
    instrumentId: instrument.id,
    instrumentVersion: instrument.version,
    type: instrument.type,
    rawScore,
    score,
    bandId: band.bandId,
    severity: band.severity,
    reflectionRef: band.reflectionRef,
    subscales,
    answers: { ...answers },
    crisisTriggered,
    safetyFlags,
    domainTag: instrument.routingSignal?.domainTag,
    nextInstrumentIds,
  };
}
