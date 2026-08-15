import { describe, expect, it } from 'vitest';
import { ConfigError, IncompleteAnswersError, checkCrisis, isGatedOut, scoreInstrument } from '../src/scoring.js';
import { answerAll, instrument } from './helpers.js';

describe('published cutoffs are reproduced exactly', () => {
  // The band boundaries below are the published ones. If a change to config
  // moves them, that is a clinical decision and these tests should fail loudly.
  it.each([
    [0, 'none'],
    [4, 'none'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'moderately-severe'],
    [19, 'moderately-severe'],
    [20, 'severe'],
    [27, 'severe'],
  ])('PHQ-9 score %i is band %s', (score, expected) => {
    // Build an answer set summing exactly to `score` without touching item 9.
    const answers: Record<string, number> = answerAll('phq-9', 0);
    let remaining = score;
    for (const item of instrument('phq-9').items) {
      if (item.key === 'q9') continue;
      const take = Math.min(3, remaining);
      answers[item.key] = take;
      remaining -= take;
    }
    if (remaining > 0) answers.q9 = remaining; // only reached at 25+
    expect(scoreInstrument(instrument('phq-9'), answers).bandId).toBe(expected);
  });

  it.each([
    [0, 'none'],
    [4, 'none'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'severe'],
    [21, 'severe'],
  ])('GAD-7 score %i is band %s', (score, expected) => {
    const answers: Record<string, number> = answerAll('gad-7', 0);
    let remaining = score;
    for (const item of instrument('gad-7').items) {
      const take = Math.min(3, remaining);
      answers[item.key] = take;
      remaining -= take;
    }
    expect(scoreInstrument(instrument('gad-7'), answers).bandId).toBe(expected);
  });

  it('WHO-5 multiplies the raw score by 4 onto a 0–100 scale', () => {
    const result = scoreInstrument(instrument('who-5'), answerAll('who-5', 5));
    expect(result.rawScore).toBe(25);
    expect(result.score).toBe(100);
    expect(result.bandId).toBe('adequate');

    const low = scoreInstrument(instrument('who-5'), answerAll('who-5', 1));
    expect(low.score).toBe(20);
    expect(low.bandId).toBe('very-low');
  });

  it('every band table covers its full theoretical range with no gaps', () => {
    for (const inst of [instrument('phq-4'), instrument('phq-9'), instrument('gad-7'), instrument('who-5')]) {
      const maxRaw = inst.items.reduce((sum, item) => {
        const scale = item.scale ?? inst.scale!;
        return sum + Math.max(...scale.map((o) => o.value));
      }, 0);
      const max = inst.scoreTransform ? maxRaw * inst.scoreTransform.multiplier : maxRaw;
      for (let score = 0; score <= max; score++) {
        expect(
          inst.bands.some((b) => score >= b.min && score <= b.max),
          `${inst.id} has no band covering score ${score}`,
        ).toBe(true);
      }
    }
  });
});

describe('PHQ-4 subscales drive the branch to the deeper screeners', () => {
  it('opens PHQ-9 when the depression pair reaches 3', () => {
    const result = scoreInstrument(instrument('phq-4'), { q1: 0, q2: 0, q3: 2, q4: 1 });
    expect(result.subscales).toEqual({ anxiety: 0, depression: 3 });
    expect(result.nextInstrumentIds).toEqual(['phq-9']);
  });

  it('opens GAD-7 when the anxiety pair reaches 3', () => {
    const result = scoreInstrument(instrument('phq-4'), { q1: 2, q2: 1, q3: 0, q4: 0 });
    expect(result.nextInstrumentIds).toEqual(['gad-7']);
  });

  it('opens both when both pairs reach 3', () => {
    const result = scoreInstrument(instrument('phq-4'), { q1: 2, q2: 1, q3: 2, q4: 1 });
    expect(result.nextInstrumentIds).toEqual(['phq-9', 'gad-7']);
  });

  it('opens neither below the threshold', () => {
    const result = scoreInstrument(instrument('phq-4'), { q1: 1, q2: 1, q3: 1, q4: 1 });
    expect(result.nextInstrumentIds).toEqual([]);
  });
});

describe('safety flags', () => {
  it('AUDIT-C flags substance at the risky band', () => {
    expect(scoreInstrument(instrument('audit-c'), { q1: 1, q2: 1, q3: 1 }).safetyFlags).toContain('substance');
    expect(scoreInstrument(instrument('audit-c'), { q1: 1, q2: 1, q3: 0 }).safetyFlags).toEqual([]);
  });

  it('PC-PTSD-5 flags trauma at 3 or more, and not at 2', () => {
    expect(scoreInstrument(instrument('pc-ptsd-5'), { q1: 1, q2: 1, q3: 1, q4: 0, q5: 0 }).safetyFlags).toContain('trauma');
    expect(scoreInstrument(instrument('pc-ptsd-5'), { q1: 1, q2: 1, q3: 0, q4: 0, q5: 0 }).safetyFlags).toEqual([]);
  });

  it('a trauma flag is never a crisis flag', () => {
    const result = scoreInstrument(instrument('pc-ptsd-5'), answerAll('pc-ptsd-5', 1));
    expect(result.crisisTriggered).toBe(false);
    expect(result.safetyFlags).not.toContain('crisis');
  });

  it('skips the whole instrument when a gate is answered no', () => {
    expect(isGatedOut(instrument('pc-ptsd-5'), { exposure: 0 })).toBe(true);
    expect(isGatedOut(instrument('pc-ptsd-5'), { exposure: 1 })).toBe(false);
    expect(isGatedOut(instrument('phq-9'), {})).toBe(false);
  });
});

describe('refuses to score what it should not', () => {
  it('throws rather than scoring a partial answer set', () => {
    expect(() => scoreInstrument(instrument('phq-9'), { q1: 3 })).toThrow(IncompleteAnswersError);
  });

  it('names every missing item', () => {
    try {
      scoreInstrument(instrument('gad-7'), { q1: 1, q2: 1 });
      expect.unreachable();
    } catch (error) {
      expect((error as IncompleteAnswersError).missingKeys).toEqual(['q3', 'q4', 'q5', 'q6', 'q7']);
    }
  });

  it('rejects a value that is not on the item scale', () => {
    expect(() => scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 0), q1: 7 })).toThrow(ConfigError);
  });
});

describe('checkCrisis works on a partial answer set', () => {
  it('fires as soon as item 9 is answered, before the rest exist', () => {
    expect(checkCrisis(instrument('phq-9'), { q9: 1 })).toBe(true);
  });

  it('does not fire on an unanswered item', () => {
    expect(checkCrisis(instrument('phq-9'), { q1: 3 })).toBe(false);
  });

  it('returns false for instruments with no crisis item', () => {
    expect(checkCrisis(instrument('gad-7'), answerAll('gad-7', 3))).toBe(false);
  });
});
