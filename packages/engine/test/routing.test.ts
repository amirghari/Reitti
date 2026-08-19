import { describe, expect, it } from 'vitest';
import { deriveRoutingInput, orderRungsForBudget, printRulesTable, route } from '../src/routing.js';
import { scoreInstrument } from '../src/scoring.js';
import { nextInstrumentId } from '../src/flow.js';
import type { RoutingInput } from '../src/types.js';
import { answerAll, flow, instrument, ladder, rules } from './helpers.js';

const baseInput = (over: Partial<RoutingInput> = {}): RoutingInput => ({
  severity: 0,
  primaryDomain: 'general',
  duration: 'under-a-month',
  budget: 'moderate',
  language: 'fi',
  safetyFlags: [],
  ...over,
});

describe('severity climbs the ladder', () => {
  it.each([
    [0, 'self-help', 'R7'],
    [1, 'peer-community', 'R6'],
    [2, 'nettiterapia', 'R5'],
    [3, 'nettiterapia', 'R4'],
    [4, 'short-term-individual', 'R2'],
  ])('severity %i on a recent difficulty suggests %s', (severity, rung, ruleId) => {
    const out = route(baseInput({ severity }), rules, ladder);
    expect(out.suggestedRung?.id).toBe(rung);
    expect(out.matchedRuleId).toBe(ruleId);
  });

  it('a severe, long-standing difficulty reaches the top rung', () => {
    const out = route(baseInput({ severity: 4, duration: 'over-a-year' }), rules, ladder);
    expect(out.matchedRuleId).toBe('R1');
    expect(out.suggestedRung?.id).toBe('kela-rehabilitative');
    expect(out.providerTags).toContain('psychiatrist-referral');
  });

  it('never suggests a rung above the top of the ladder', () => {
    const out = route(baseInput({ severity: 4, duration: 'over-a-year' }), rules, ladder);
    expect(out.adjacentRungs.above).toBeNull();
    expect(out.suggestedRung?.level).toBe(5);
  });

  it('never suggests a rung below the bottom', () => {
    const out = route(baseInput({ severity: 0 }), rules, ladder);
    expect(out.adjacentRungs.below).toBeNull();
    expect(out.suggestedRung?.level).toBe(0);
  });

  it('always offers the "too much / not enough" pair in the middle of the ladder', () => {
    const out = route(baseInput({ severity: 2 }), rules, ladder);
    expect(out.adjacentRungs.below?.id).toBe('peer-community');
    expect(out.adjacentRungs.above?.id).toBe('group-therapy');
  });
});

describe('modifiers shift the suggestion without removing options', () => {
  it('a long-standing difficulty biases one rung up', () => {
    const recent = route(baseInput({ severity: 2 }), rules, ladder);
    const longstanding = route(baseInput({ severity: 2, duration: 'over-a-year' }), rules, ladder);
    expect(longstanding.suggestedRung!.level).toBe(recent.suggestedRung!.level + 1);
    expect(longstanding.appliedModifierIds).toContain('M1');
  });

  it('no budget shifts tags toward public options but never changes the rung', () => {
    const funded = route(baseInput({ severity: 2 }), rules, ladder);
    const broke = route(baseInput({ severity: 2, budget: 'none' }), rules, ladder);
    expect(broke.suggestedRung!.id).toBe(funded.suggestedRung!.id);
    expect(broke.providerTags).toContain('public-first');
    expect(broke.providerTags).toContain('free-options');
  });

  it('a non-Finnish language tags for provider matching and nothing else', () => {
    const fi = route(baseInput({ severity: 2 }), rules, ladder);
    const en = route(baseInput({ severity: 2, language: 'en' }), rules, ladder);
    expect(en.suggestedRung!.id).toBe(fi.suggestedRung!.id);
    expect(en.providerTags).toContain('language-match-needed');
    expect(fi.providerTags).not.toContain('language-match-needed');
  });

  it('a social domain prefers a group', () => {
    const out = route(baseInput({ severity: 2, primaryDomain: 'social' }), rules, ladder);
    expect(out.suggestedRung?.id).toBe('group-therapy');
    expect(out.providerTags).toContain('group-suitable');
  });

  it('a trauma flag adds a tag without changing intensity', () => {
    const plain = route(baseInput({ severity: 2 }), rules, ladder);
    const trauma = route(baseInput({ severity: 2, safetyFlags: ['trauma'] }), rules, ladder);
    expect(trauma.suggestedRung!.id).toBe(plain.suggestedRung!.id);
    expect(trauma.providerTags).toContain('trauma-informed');
  });

  it('a substance flag adds resources rather than a rung', () => {
    const out = route(baseInput({ severity: 2, safetyFlags: ['substance'] }), rules, ladder);
    expect(out.suggestedRung?.id).toBe('nettiterapia');
    expect(out.providerTags).toContain('substance-aware');
  });

  it('every budget still sees every rung — nothing is filtered out', () => {
    for (const budget of ['none', 'low', 'moderate', 'flexible'] as const) {
      expect(orderRungsForBudget(ladder, budget)).toHaveLength(ladder.rungs.length);
    }
  });

  it('with no budget, free and public rungs are ordered first', () => {
    const ordered = orderRungsForBudget(ladder, 'none');
    expect(ordered[0].publicFirst).toBe(true);
    const firstPaid = ordered.findIndex((r) => !r.publicFirst);
    expect(ordered.slice(0, firstPaid).every((r) => r.publicFirst)).toBe(true);
  });
});

describe('deriving routing input from instrument results', () => {
  it('takes the highest severity across screeners, not the lowest', () => {
    const mild = scoreInstrument(instrument('gad-7'), { ...answerAll('gad-7', 0), q1: 3, q2: 2 });
    const severe = scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 3), q9: 0 });
    const input = deriveRoutingInput([mild, severe], {
      duration: 'over-a-year',
      budget: 'low',
      language: 'fi',
    });
    expect(input.severity).toBe(4);
  });

  it('takes the domain of the most severe screener that raised something', () => {
    const anxiety = scoreInstrument(instrument('gad-7'), answerAll('gad-7', 3));
    const mood = scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 0), q1: 2, q2: 2, q3: 1 });
    const input = deriveRoutingInput([anxiety, mood], {
      duration: '1-6-months',
      budget: 'low',
      language: 'fi',
    });
    expect(input.primaryDomain).toBe('anxiety');
  });

  it('falls back to what the person said when nothing was raised', () => {
    const clear = scoreInstrument(instrument('phq-4'), answerAll('phq-4', 0));
    const input = deriveRoutingInput([clear], {
      duration: 'under-a-month',
      budget: 'low',
      language: 'fi',
      statedDomain: 'social',
    });
    expect(input.primaryDomain).toBe('social');
  });

  it('ignores progress-type instruments when setting severity', () => {
    const lowWellbeing = scoreInstrument(instrument('who-5'), answerAll('who-5', 0));
    expect(lowWellbeing.type).toBe('progress');
    const input = deriveRoutingInput([lowWellbeing], {
      duration: 'under-a-month',
      budget: 'low',
      language: 'fi',
    });
    expect(input.severity).toBe(0);
  });

  it('collects safety flags from every instrument without duplicates', () => {
    const trauma = scoreInstrument(instrument('pc-ptsd-5'), answerAll('pc-ptsd-5', 1));
    const substance = scoreInstrument(instrument('audit-c'), answerAll('audit-c', 2));
    const input = deriveRoutingInput([trauma, substance], {
      duration: '1-6-months',
      budget: 'low',
      language: 'fi',
    });
    expect(input.safetyFlags.sort()).toEqual(['substance', 'trauma']);
  });
});

describe('the tiered flow', () => {
  it('starts everyone on the entry screener', () => {
    expect(nextInstrumentId(flow, { completed: [], skipped: [] })).toBe('phq-4');
  });

  it('goes straight to the result when the quick screen is clear', () => {
    const clear = scoreInstrument(instrument('phq-4'), answerAll('phq-4', 0));
    expect(nextInstrumentId(flow, { completed: [clear], skipped: [] })).toBeNull();
  });

  it('opens the deep dive the quick screen pointed to', () => {
    const flagged = scoreInstrument(instrument('phq-4'), { q1: 0, q2: 0, q3: 2, q4: 1 });
    expect(nextInstrumentId(flow, { completed: [flagged], skipped: [] })).toBe('phq-9');
  });

  it('offers the trauma screen when the stated domain points there', () => {
    const clear = scoreInstrument(instrument('phq-4'), answerAll('phq-4', 0));
    expect(
      nextInstrumentId(flow, { completed: [clear], skipped: [], statedDomain: 'grief' }),
    ).toBe('pc-ptsd-5');
  });

  it('does not re-offer an instrument the person skipped', () => {
    const clear = scoreInstrument(instrument('phq-4'), answerAll('phq-4', 0));
    expect(
      nextInstrumentId(flow, { completed: [clear], skipped: ['pc-ptsd-5'], statedDomain: 'grief' }),
    ).toBeNull();
  });

  it('nobody sees all six instruments', () => {
    const flagged = scoreInstrument(instrument('phq-4'), { q1: 2, q2: 2, q3: 2, q4: 2 });
    const state = { completed: [flagged], skipped: [] as string[], statedDomain: 'work' };
    const offered = new Set<string>();
    // Walk the flow to exhaustion, marking each offered instrument as skipped.
    for (let guard = 0; guard < 10; guard++) {
      const next = nextInstrumentId(flow, state);
      if (!next) break;
      offered.add(next);
      state.skipped.push(next);
    }
    expect(offered.size).toBeLessThan(5);
  });

  it('terminates for every combination of stated domain and severity', () => {
    for (const statedDomain of ['general', 'mood', 'anxiety', 'social', 'grief', 'substance', 'work']) {
      for (const value of [0, 1, 2, 3]) {
        const entry = scoreInstrument(instrument('phq-4'), answerAll('phq-4', value));
        const state = { completed: [entry], skipped: [] as string[], statedDomain };
        let guard = 0;
        while (nextInstrumentId(flow, state) !== null) {
          state.skipped.push(nextInstrumentId(flow, state)!);
          if (++guard > 10) throw new Error(`flow did not terminate for ${statedDomain}/${value}`);
        }
      }
    }
  });
});

describe('the rules table prints for clinician sign-off', () => {
  it('includes every rule and its reason', () => {
    const printed = printRulesTable(rules);
    for (const rule of [...rules.baseRules, ...rules.modifiers]) {
      expect(printed).toContain(rule.id);
      expect(printed).toContain(rule.because);
    }
  });
});

describe('UCLA-3 makes loneliness a measured signal, not just a stated one', () => {
  const lonely = () => scoreInstrument(instrument('ucla-3'), { q1: 3, q2: 3, q3: 2 });
  const connected = () => scoreInstrument(instrument('ucla-3'), { q1: 1, q2: 1, q3: 1 });

  it('reproduces the published cutoff: 6 and above is the lonely band', () => {
    expect(scoreInstrument(instrument('ucla-3'), { q1: 2, q2: 2, q3: 1 }).bandId).toBe('not-lonely'); // 5
    expect(scoreInstrument(instrument('ucla-3'), { q1: 2, q2: 2, q3: 2 }).bandId).toBe('lonely'); // 6
  });

  it('is reached when the person names loneliness, and not otherwise', () => {
    const social = nextInstrumentId(flow, { completed: [], skipped: [], statedDomain: 'social' });
    expect(social).toBe('phq-4'); // everyone starts at the entry screener

    const afterEntry = (statedDomain: string) =>
      nextInstrumentId(flow, {
        completed: [scoreInstrument(instrument('phq-4'), answerAll('phq-4', 0))],
        skipped: [],
        statedDomain,
      });
    expect(afterEntry('social')).toBe('ucla-3');
    expect(afterEntry('mood')).toBeNull();
  });

  it('carries the social domain into routing, so M5 prefers a group', () => {
    const out = route(
      deriveRoutingInput([lonely()], {
        duration: '1-6-months',
        budget: 'moderate',
        language: 'fi',
        statedDomain: 'social',
      }),
      rules,
      ladder,
    );

    expect(out.appliedModifierIds).toContain('M5');
    expect(out.suggestedRung?.id).toBe('group-therapy');
    expect(out.providerTags).toContain('group-suitable');
  });

  it('never raises the ladder on its own — loneliness is not severity', () => {
    // A lonely answer contributes severity 1. Without M5 that is peer-community;
    // it must not reach the rungs a symptom screener is what opens.
    const input = deriveRoutingInput([lonely()], {
      duration: '1-6-months',
      budget: 'moderate',
      language: 'fi',
      statedDomain: 'social',
    });
    expect(input.severity).toBe(1);
    expect(deriveRoutingInput([connected()], {
      duration: '1-6-months',
      budget: 'moderate',
      language: 'fi',
      statedDomain: 'social',
    }).severity).toBe(0);
  });

  it('does not override a symptom screener that found something more severe', () => {
    const severe = scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 3), q9: 0 });
    const out = route(
      deriveRoutingInput([severe, lonely()], {
        duration: 'over-a-year',
        budget: 'moderate',
        language: 'fi',
        statedDomain: 'social',
      }),
      rules,
      ladder,
    );

    // M5 is capped at severityAtMost 2, so a group does not displace real care.
    expect(out.appliedModifierIds).not.toContain('M5');
    expect(out.suggestedRung?.id).not.toBe('group-therapy');
  });
});

describe('the result can explain itself', () => {
  it('quotes the base rule that fired, verbatim', () => {
    const out = route(baseInput({ severity: 2 }), rules, ladder);
    const fired = rules.baseRules.find((r) => r.id === out.matchedRuleId)!;
    expect(out.reasons[0]).toBe(fired.because);
  });

  it('adds a line for every modifier, in the order they applied', () => {
    const out = route(
      baseInput({ severity: 2, duration: 'over-a-year', budget: 'none', language: 'en' }),
      rules,
      ladder,
    );
    expect(out.appliedModifierIds.length).toBeGreaterThan(1);
    expect(out.reasons).toHaveLength(out.appliedModifierIds.length + 1);

    const expected = [
      rules.baseRules.find((r) => r.id === out.matchedRuleId)!.because,
      ...out.appliedModifierIds.map((id) => rules.modifiers.find((m) => m.id === id)!.because),
    ];
    expect(out.reasons).toEqual(expected);
  });

  it('explains nothing on the crisis path — that result is not a recommendation', () => {
    const out = route(baseInput({ severity: 4, safetyFlags: ['crisis'] }), rules, ladder);
    expect(out.crisis).toBe(true);
    expect(out.reasons).toEqual([]);
  });

  it('never invents a reason: every line is a string from rules.json', () => {
    const known = new Set([...rules.baseRules, ...rules.modifiers].map((r) => r.because));
    for (const severity of [0, 1, 2, 3, 4]) {
      for (const duration of ['under-a-month', 'over-a-year'] as const) {
        const out = route(baseInput({ severity, duration }), rules, ladder);
        for (const reason of out.reasons) expect(known).toContain(reason);
      }
    }
  });
});
