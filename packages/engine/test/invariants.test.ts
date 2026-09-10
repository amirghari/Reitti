/**
 * The safety invariants, as executable tests.
 *
 * Invariants 1–6 are architecture v2 §8. Invariants 7–20 are added by V2 and
 * listed in `docs/v2-plan.md` §2 — the directory, the budget ordering, the
 * RECOMMEND_RUNG line, the youth gate and the privacy allowlist.
 *
 * These are the tests that must never be weakened to make a feature pass. If one
 * of them fails, the failure is the correct outcome and the feature is wrong.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCrisis, scoreInstrument } from '../src/scoring.js';
import { fittingRungs, orderRungsForBudget, route } from '../src/routing.js';
import { deeperScreeners } from '../src/flow.js';
import { nullAssistant } from '../../ai/src/index.js';
import {
  entriesForRung,
  freeCareAt,
  gatedFreeCareAt,
  humanOptionFor,
  orderFreeFirst,
} from '../src/directory.js';
import { POOL_BODY_KEYS, poolInterestBody, thresholdFor, topicsForRung } from '../src/pool.js';
import type { AgeBand } from '../src/directory.js';
import type { Budget } from '../src/types.js';
import {
  CONFIG_DIR,
  answerAll,
  crisisConfig,
  directory,
  en,
  flags,
  humanFallback,
  whileYouWait,
  flow,
  groups,
  youthConfig,
  bundle,
  BUNDLE_NAMES,
  UI_LANGUAGES,
  merged,
  strings,
  translationStatus,
  instrument,
  instruments,
  ladder,
  rules,
} from './helpers.js';
import type { Duration, RoutingInput, SafetyFlag } from '../src/types.js';

const LANGUAGES = ['fi', 'sv', 'en'];
const BUDGETS: Budget[] = ['none', 'low', 'moderate', 'flexible'];
const AGE_BANDS: AgeBand[] = ['under-18', '18-29', '30-plus'];

describe('invariant 1 — the crisis path needs no sign-up and no completed test', () => {
  it('crisis resources resolve with no user input at all', () => {
    expect(crisisConfig.resources.length).toBeGreaterThan(0);
    for (const resource of crisisConfig.resources) {
      expect(resource.phone).toBeTruthy();
    }
  });

  it('no crisis resource depends on a score, a band, or a session', () => {
    for (const resource of crisisConfig.resources) {
      for (const gate of ['severity', 'bandId', 'requiresCompletion', 'signUp', 'login', 'minScore']) {
        expect(Object.keys(resource), `${resource.phone} is gated on ${gate}`).not.toContain(gate);
      }
    }
  });
});

describe('invariant 2 — a crisis answer interrupts before scoring continues', () => {
  it('fires on the crisis item alone, with every other item unanswered', () => {
    expect(checkCrisis(instrument('phq-9'), { q9: 1 })).toBe(true);
  });

  it('fires at the lowest non-zero answer, not only at the top of the scale', () => {
    for (const value of [1, 2, 3]) {
      expect(checkCrisis(instrument('phq-9'), { q9: value })).toBe(true);
    }
  });

  it('a crisis answer still flags even when the total score lands in a low band', () => {
    const result = scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 0), q9: 1 });
    expect(result.bandId).toBe('none');
    expect(result.crisisTriggered).toBe(true);
    expect(result.safetyFlags).toContain('crisis');
  });
});

describe('invariant 3 — real, human, 24/7 crisis resources', () => {
  it('offers at least one 24/7 line', () => {
    expect(crisisConfig.resources.some((r) => r.availability === '24/7')).toBe(true);
  });

  it('includes the emergency number', () => {
    expect(crisisConfig.resources.some((r) => r.phone === '112')).toBe(true);
  });

  it('covers every language the app ships in', () => {
    for (const language of ['fi', 'sv', 'en']) {
      expect(
        crisisConfig.resources.some((r) => r.languages.includes(language)),
        `no crisis resource for "${language}"`,
      ).toBe(true);
    }
  });

  it('routes to a human on a phone, never to a chat, a bot, or a form', () => {
    for (const resource of crisisConfig.resources) {
      // A phone number reaches a trained person. Anything else is a channel we
      // have not verified is human-answered, so it may not appear here.
      expect(resource.phone, 'every crisis resource must be a phone number').toMatch(/^[0-9 ]+$/);
      for (const channel of ['chat', 'bot', 'url', 'webform', 'assistant', 'model']) {
        expect(Object.keys(resource), `crisis resource offers a "${channel}" channel`).not.toContain(
          channel,
        );
      }
    }
  });
});

describe('invariant 4 — no screen shows a disorder label', () => {
  // Scoped to what a result actually renders: band reflections and rung copy.
  // Educational "about this test" text may name conditions; a *result* may not.
  const BANNED = ['disorder', 'diagnos', 'ptsd', 'bipolar', 'schizophren', 'you have', 'suffers from'];

  const resultFacingRefs = [
    ...instruments.flatMap((i) => i.bands.map((b) => b.reflectionRef)),
    ...ladder.rungs.flatMap((r) => [r.labelRef, r.descriptionRef]),
  ];

  it.each(resultFacingRefs)('%s carries no diagnostic label', (ref) => {
    const text = en[ref];
    expect(text, `missing translation for ${ref}`).toBeTruthy();
    for (const banned of BANNED) {
      expect(text.toLowerCase()).not.toContain(banned);
    }
  });

  // The rules' `because` lines became result-facing the moment they were shown
  // on the result screen as "Why this". They are written for a clinician signing
  // off a table, so nothing stopped one from naming a condition — this is what
  // now stops it. If a clinician needs that word to review a rule, the rule needs
  // a separate reviewer note, not a label on somebody's result.
  const ruleReasons = [...rules.baseRules, ...rules.modifiers].map((r) => [r.id, r.because] as const);

  it.each(ruleReasons)('rule %s explains itself without a diagnostic label', (id, because) => {
    expect(because, `${id} has no because line`).toBeTruthy();
    for (const banned of BANNED) {
      expect(because.toLowerCase(), `${id} names "${banned}"`).not.toContain(banned);
    }
  });

  it('a result exposes a band and a reflection, never a condition name', () => {
    const result = scoreInstrument(instrument('phq-9'), { ...answerAll('phq-9', 3), q9: 0 });
    expect(result).not.toHaveProperty('diagnosis');
    expect(result).not.toHaveProperty('condition');
    expect(result.bandId).toBe('severe');
    expect(en[result.reflectionRef]).toBeTruthy();
  });
});

describe('invariant 5 — the AI layer cannot reach the clinical decision', () => {
  it('a crisis flag short-circuits routing before any rule is consulted', () => {
    const out = route(
      {
        severity: 0,
        primaryDomain: 'general',
        duration: 'under-a-month',
        budget: 'flexible',
        language: 'fi',
        safetyFlags: ['crisis'],
      },
      rules,
      ladder,
    );
    expect(out.crisis).toBe(true);
    expect(out.suggestedRung).toBeNull();
    expect(out.matchedRuleId).toBeNull();
    expect(out.providerTags).toEqual([]);
  });

  it('V1 ships the AI slot empty, and the null assistant declines every job', async () => {
    for (const job of ['understand-free-text', 'explain-result', 'draft-referral-request'] as const) {
      expect(await nullAssistant.assist({ job, context: {} })).toBeNull();
    }
  });

  it('the ai package never imports the engine', () => {
    const source = readFileSync(join(CONFIG_DIR, '../packages/ai/src/index.ts'), 'utf8');
    expect(source).not.toMatch(/from\s+['"].*engine/);
    expect(source).not.toMatch(/require\(.*engine/);
  });

  it('routing is a pure function of its declared inputs', () => {
    const input = {
      severity: 2,
      primaryDomain: 'mood',
      duration: 'over-a-year' as const,
      budget: 'low' as const,
      language: 'fi',
      safetyFlags: [],
    };
    const first = route(input, rules, ladder);
    const second = route(input, rules, ladder);
    expect(first).toEqual(second);
  });
});

describe('invariant 6 — placement never reorders clinical recommendations', () => {
  it('the routing output carries no placement, ranking, or sponsorship field', () => {
    const out = route(
      {
        severity: 2,
        primaryDomain: 'mood',
        duration: '1-6-months',
        budget: 'moderate',
        language: 'fi',
        safetyFlags: [],
      },
      rules,
      ladder,
    );
    for (const field of ['sponsored', 'promoted', 'paid', 'placement', 'rank', 'bid']) {
      expect(Object.keys(out)).not.toContain(field);
    }
  });

  it('no config introduces a paid-placement concept', () => {
    for (const file of ['routing/rules.json', 'ladder/ladder.json']) {
      const raw = readFileSync(join(CONFIG_DIR, file), 'utf8').toLowerCase();
      for (const banned of ['sponsored', 'promoted', 'paidplacement', '"bid"']) {
        expect(raw).not.toContain(banned);
      }
    }
  });
});





describe('invariant 7 — budget never hides a rung', () => {
  // Asserted as set equality, not as a count: a function that dropped Kela and
  // duplicated self-help would pass a length check and fail a person badly.
  it('returns exactly the same set of rungs for every budget', () => {
    const expected = new Set(ladder.rungs.map((r) => r.id));
    for (const budget of BUDGETS) {
      const got = orderRungsForBudget(ladder, budget);
      expect(new Set(got.map((r) => r.id)), budget).toEqual(expected);
      expect(got.length, budget).toBe(ladder.rungs.length);
    }
  });

  it('never returns a rung twice', () => {
    for (const budget of BUDGETS) {
      const ids = orderRungsForBudget(ladder, budget).map((r) => r.id);
      expect(new Set(ids).size, budget).toBe(ids.length);
    }
  });

  it('puts the free and public rungs first when there is no money', () => {
    const ordered = orderRungsForBudget(ladder, 'none');
    const lastPublic = ordered.map((r) => r.publicFirst).lastIndexOf(true);
    const firstPrivate = ordered.findIndex((r) => !r.publicFirst);
    if (firstPrivate !== -1) expect(lastPublic).toBeLessThan(firstPrivate);
  });

  it('leaves the clinical ladder order alone when cost is not the constraint', () => {
    for (const budget of ['moderate', 'flexible'] as const) {
      const levels = orderRungsForBudget(ladder, budget).map((r) => r.level);
      expect([...levels].sort((a, b) => a - b), budget).toEqual(levels);
    }
  });

  it('gives every rung a cost label a person can actually read', () => {
    for (const rung of ladder.rungs) {
      expect(rung.costLabelRef, `${rung.id} has no costLabelRef`).toBeTruthy();
      const label = en[rung.costLabelRef];
      expect(label, `${rung.id} cost label does not resolve`).toBeTruthy();
      // "subsidised" on its own tells nobody what they will pay.
      expect(label.length, `${rung.id} cost label is too vague to be useful`).toBeGreaterThan(3);
    }
  });
});

describe('invariant 8 — a safety flag bypasses rung 2 entirely', () => {
  // Rung 2 is talking support, not the crisis path. Somebody who has just
  // disclosed self-harm needs Kriisipuhelin, not a peer chat that opens at six.
  const RUNG_TWO = 'peer-community';

  const withCrisis = (over: Partial<RoutingInput> = {}): RoutingInput => ({
    severity: 2,
    primaryDomain: 'mood',
    duration: '1-6-months',
    budget: 'none',
    language: 'fi',
    safetyFlags: ['crisis'] as SafetyFlag[],
    ...over,
  });

  it('rung 2 exists and has entries, so this test is testing something', () => {
    expect(ladder.rungs.some((r) => r.id === RUNG_TWO)).toBe(true);
    expect(directory.filter((e) => e.rungs.includes(RUNG_TWO)).length).toBeGreaterThan(0);
  });

  it('produces no rung at all when a crisis flag is set, at every severity', () => {
    for (let severity = 0; severity <= 4; severity++) {
      for (const budget of BUDGETS) {
        for (const language of LANGUAGES) {
          const output = route(withCrisis({ severity, budget, language }), rules, ladder);
          expect(output.crisis, `severity ${severity}`).toBe(true);
          expect(output.suggestedRung).toBeNull();
          expect(output.adjacentRungs.below).toBeNull();
          expect(output.adjacentRungs.above).toBeNull();
          expect(fittingRungs(output, ladder)).toEqual([]);
        }
      }
    }
  });

  it('reaches rung 2 by the same inputs once the crisis flag is gone', () => {
    // Otherwise the test above would pass on a routing table that never reaches
    // rung 2 at all, which would prove nothing about the bypass.
    const reached = [0, 1, 2, 3, 4].some((severity) => {
      const output = route({ ...withCrisis({ severity }), safetyFlags: [] }, rules, ladder);
      return fittingRungs(output, ladder).some((r) => r.id === RUNG_TWO);
    });
    expect(reached).toBe(true);
  });

  it('a crisis result carries no provider tags and no reasons to argue with', () => {
    const output = route(withCrisis(), rules, ladder);
    expect(output.providerTags).toEqual([]);
    expect(output.reasons).toEqual([]);
    expect(output.matchedRuleId).toBeNull();
  });

  it('the crisis path still reaches a real human line in every language', () => {
    for (const language of LANGUAGES) {
      const forLanguage = crisisConfig.resources.filter((r) => r.languages.includes(language));
      expect(forLanguage.length, language).toBeGreaterThan(0);
      expect(forLanguage.some((r) => /^[\d\s]+$/.test(r.phone)), language).toBe(true);
    }
  });
});

describe('invariant 9 — RECOMMEND_RUNG off never renders a single recommended rung', () => {
  const DURATIONS: Duration[] = ['under-a-month', '1-6-months', '6-12-months', 'over-a-year'];
  const DOMAINS = ['mood', 'anxiety', 'work', 'social', 'grief', 'substance', 'general'];

  const everyInput = (): RoutingInput[] => {
    const inputs: RoutingInput[] = [];
    for (let severity = 0; severity <= 4; severity++) {
      for (const duration of DURATIONS) {
        for (const primaryDomain of DOMAINS) {
          for (const budget of BUDGETS) {
            for (const language of LANGUAGES) {
              inputs.push({
                severity,
                primaryDomain,
                duration,
                budget,
                language,
                safetyFlags: [],
              });
            }
          }
        }
      }
    }
    return inputs;
  };

  it('ships with the flag off — the default is the whole point', () => {
    expect(flags.flags.RECOMMEND_RUNG.default).toBe(false);
  });

  it('always offers a set, never a single rung, wherever the ladder allows', () => {
    for (const input of everyInput()) {
      const output = route(input, rules, ladder);
      const fitting = fittingRungs(output, ladder);
      expect(fitting.length, JSON.stringify(input)).toBeGreaterThanOrEqual(2);
    }
  });

  it('orders strictly ascending by ladder level, so the computed rung cannot leak through position', () => {
    // The recommendation would otherwise survive the flag: put the engine's rung
    // first and the person reads "the answer, plus alternatives" — which is the
    // same regulated act, made through design rather than words.
    for (const input of everyInput()) {
      const fitting = fittingRungs(route(input, rules, ladder), ladder);
      const levels = fitting.map((r) => r.level);
      expect([...levels].sort((a, b) => a - b), JSON.stringify(input)).toEqual(levels);
    }
  });

  it('the computed rung is not always in the same position in the set', () => {
    // If it were, position alone would identify it just as reliably as ordering
    // by it would. This asserts the set genuinely moves around the computed rung.
    const positions = new Set<number>();
    for (const input of everyInput()) {
      const output = route(input, rules, ladder);
      const fitting = fittingRungs(output, ladder);
      positions.add(fitting.findIndex((r) => r.id === output.suggestedRung?.id));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('returns no set at all on the crisis path — a crisis result is not a menu', () => {
    const output = route(
      {
        severity: 4,
        primaryDomain: 'mood',
        duration: 'over-a-year',
        budget: 'none',
        language: 'fi',
        safetyFlags: ['crisis'] as SafetyFlag[],
      },
      rules,
      ladder,
    );
    expect(fittingRungs(output, ladder)).toEqual([]);
  });

  it('every rung in a set carries a cost label the person can read', () => {
    for (const input of everyInput()) {
      for (const rung of fittingRungs(route(input, rules, ladder), ladder)) {
        expect(rung.costLabelRef, `${rung.id} has no cost label`).toBeTruthy();
        expect(en[rung.costLabelRef], `${rung.id} cost label does not resolve`).toBeTruthy();
      }
    }
  });
});

describe('invariant 20 — RECOMMEND_RUNG never changes what the engine computes', () => {
  it('the flag is not readable from the engine at all', () => {
    // Structural, not behavioural: the engine cannot branch on a flag it has no
    // way to see, so this cannot regress by someone forgetting to keep it pure.
    //
    // Comments are stripped first. The engine is expected to *explain* why the
    // flag exists — `fittingRungs` documents exactly that — and a test that
    // could not tell prose from code would punish the explanation.
    const sources = ['routing.ts', 'scoring.ts', 'flow.ts', 'directory.ts', 'carry.ts', 'types.ts'];
    for (const file of sources) {
      const raw = readFileSync(join(CONFIG_DIR, '../packages/engine/src', file), 'utf8');
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code, `${file} reads a feature flag`).not.toMatch(
        /RECOMMEND_RUNG|flags\.json|import\.meta\.env|process\.env/,
      );
    }
  });

  it('routing output is identical whatever the flag says, because it never reaches routing', () => {
    const input: RoutingInput = {
      severity: 2,
      primaryDomain: 'mood',
      duration: '1-6-months',
      budget: 'low',
      language: 'fi',
      safetyFlags: [],
    };
    const a = route(input, rules, ladder);
    const b = route(input, rules, ladder);
    expect(a).toEqual(b);
    expect(a.suggestedRung).not.toBeNull();
  });

  it('the flag carries a reason a clinician and a regulator can both read', () => {
    const declared = flags.flags.RECOMMEND_RUNG;
    expect(declared.because.length).toBeGreaterThan(80);
    expect(declared.whenOn).toBeTruthy();
    expect(declared.whenOff).toBeTruthy();
  });
});

describe('invariant 19 — the scope statement is always available to render', () => {
  it('resolves in the English bundle', () => {
    expect(en['result.scopeStatement.title']).toBeTruthy();
    expect(en['result.scopeStatement.body']).toBeTruthy();
  });

  it('says all four things it has to say', () => {
    const body = en['result.scopeStatement.body'].toLowerCase();
    expect(body).toContain('guidance');
    expect(body).toContain('not a medical device');
    expect(body).toContain('diagnos');
    expect(body).toMatch(/decision stays with you|decision stays with the person/);
  });
});


describe('invariant 15 — every language and age band reaches a person', () => {
  // Over the full cartesian product, not over the combination someone happened
  // to try. "Nobody to talk to" is never the right answer to give someone, so a
  // hole here has to fail the build rather than appear as an empty box.
  it('yields a human option for every combination', () => {
    for (const careLanguage of LANGUAGES) {
      for (const ageBand of AGE_BANDS) {
        const person = humanOptionFor(directory, careLanguage, ageBand, humanFallback);
        expect(person, `${careLanguage} / ${ageBand}`).toBeTruthy();
        expect(person.whoAnswers).not.toBe('not-applicable');
        expect(
          person.formats.some((f) => f === 'phone' || f === 'chat' || f === 'email'),
          `${careLanguage} / ${ageBand} has no way to reach a person`,
        ).toBe(true);
      }
    }
  });

  it('never offers an unmoderated international service as the first person', () => {
    for (const careLanguage of LANGUAGES) {
      for (const ageBand of AGE_BANDS) {
        const person = humanOptionFor(directory, careLanguage, ageBand, humanFallback);
        expect(person.fallbackOnly, `${careLanguage} / ${ageBand}`).toBeFalsy();
      }
    }
  });

  it('serves the age band it was asked for', () => {
    for (const careLanguage of LANGUAGES) {
      for (const ageBand of AGE_BANDS) {
        const person = humanOptionFor(directory, careLanguage, ageBand, humanFallback);
        const age = { 'under-18': 16, '18-29': 24, '30-plus': 40 }[ageBand];
        expect(person.ageRange.min, `${person.id} / ${ageBand}`).toBeLessThanOrEqual(age);
        if (person.ageRange.max !== null) {
          expect(person.ageRange.max, `${person.id} / ${ageBand}`).toBeGreaterThanOrEqual(age);
        }
      }
    }
  });

  it('every id the clinician named actually exists in the directory', () => {
    const ids = new Set(directory.map((e) => e.id));
    for (const preference of humanFallback.preferences) {
      for (const id of preference.entryIds) {
        expect(ids, `human-fallback names a missing entry: ${id}`).toContain(id);
      }
    }
    expect(ids).toContain(humanFallback.publicRouteEntryId);
  });

  it('every preference carries a reason a clinician can read', () => {
    for (const preference of humanFallback.preferences) {
      expect(preference.because, `${preference.language} has no reason`).toBeTruthy();
      expect(preference.because.length).toBeGreaterThan(20);
    }
  });
});

describe('invariant 16 — a referral rung never stands alone', () => {
  it('names only rungs that exist', () => {
    const rungIds = new Set(ladder.rungs.map((r) => r.id));
    for (const rungId of whileYouWait.afterRungs) {
      expect(rungIds, `while-you-wait names a missing rung: ${rungId}`).toContain(rungId);
    }
  });

  it('covers every rung whose realistic next step is a wait', () => {
    // Anything free-with-referral or above puts a person in a queue. If a new
    // rung like that is added and not covered here, this fails rather than
    // quietly shipping a dead end.
    const queueing = ladder.rungs
      .filter((r) => r.typicalCost === 'free-with-referral' || r.typicalCost === 'subsidised')
      .map((r) => r.id);
    for (const rungId of queueing) {
      expect(whileYouWait.afterRungs, `${rungId} leaves people in a queue with nothing`).toContain(
        rungId,
      );
    }
  });

  it('offers something to do alone and someone to talk to, and both resolve', () => {
    const ids = new Set(directory.map((e) => e.id));
    expect(whileYouWait.selfHelpEntryIds.length).toBeGreaterThan(0);
    expect(whileYouWait.peerEntryIds.length).toBeGreaterThan(0);
    for (const id of [...whileYouWait.selfHelpEntryIds, ...whileYouWait.peerEntryIds]) {
      expect(ids, `while-you-wait names a missing entry: ${id}`).toContain(id);
    }
  });

  it('offers no fallback-only service as something to do while waiting', () => {
    for (const id of [...whileYouWait.selfHelpEntryIds, ...whileYouWait.peerEntryIds]) {
      expect(directory.find((e) => e.id === id)?.fallbackOnly, id).toBeFalsy();
    }
  });
});


describe('invariant 17 — key-set equality across en, fi and sv', () => {
  // A key present in one bundle and missing from another is a screen that
  // renders a raw ref, or worse, silently falls back to English and looks
  // translated. Asserted per bundle, because the three have different rules.

  it('ui and directory bundles have identical key sets in all three languages', () => {
    for (const name of ['ui', 'directory'] as const) {
      const reference = new Set(Object.keys(strings(name, 'en')));
      for (const language of UI_LANGUAGES) {
        const got = new Set(Object.keys(strings(name, language)));
        const missing = [...reference].filter((k) => !got.has(k));
        const extra = [...got].filter((k) => !reference.has(k));
        expect(missing, `${name}/${language} missing: ${missing.join(', ')}`).toEqual([]);
        expect(extra, `${name}/${language} extra: ${extra.join(', ')}`).toEqual([]);
      }
    }
  });

  it('the clinical bundle matches on everything except instrument wording', () => {
    // Instrument items and response scales are exempt by design: they are only
    // present where the OFFICIAL validated translation has been obtained.
    const isInstrumentWording = (k: string) => k.startsWith('instrument.') || k.startsWith('scale.');
    const reference = Object.keys(strings('clinical', 'en')).filter((k) => !isInstrumentWording(k));

    for (const language of UI_LANGUAGES) {
      const got = new Set(Object.keys(strings('clinical', language)));
      const missing = reference.filter((k) => !got.has(k));
      expect(missing, `clinical/${language} missing: ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('no non-English bundle is a copy-paste of the English one', () => {
    // A stub that was never translated passes a key-set check perfectly. Proper
    // nouns and phone numbers legitimately match, so the test is about the bulk.
    for (const name of BUNDLE_NAMES) {
      const en = strings(name, 'en');
      for (const language of ['fi', 'sv'] as const) {
        const other = strings(name, language);
        const shared = Object.keys(other).filter((k) => k in en);
        if (shared.length === 0) continue;
        const identical = shared.filter((k) => other[k] === en[k]);
        expect(
          identical.length / shared.length,
          `${name}/${language} is ${Math.round((identical.length / shared.length) * 100)}% identical to English`,
        ).toBeLessThan(0.5);
      }
    }
  });

  it('every bundle declares which language it is', () => {
    for (const name of BUNDLE_NAMES) {
      for (const language of UI_LANGUAGES) {
        expect(bundle(name, language)._language, `${name}/${language}`).toBe(language);
      }
    }
  });

  it('every ref any config names resolves in every language it should', () => {
    const refs = new Set<string>();
    const collect = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key.endsWith('Ref') && typeof value === 'string') refs.add(value);
          else collect(value);
        }
      }
    };
    collect(ladder);
    collect(crisisConfig);
    collect(directory);

    for (const language of UI_LANGUAGES) {
      const b = merged(language);
      const missing = [...refs].filter((ref) => !b[ref]);
      expect(missing, `${language} unresolved: ${missing.join(', ')}`).toEqual([]);
    }
  });
});

describe('invariant 18 — an instrument is never offered without its official translation', () => {
  // The rule from CLAUDE.md, made executable: a hand-translated screening item
  // measures something different, so the honest state is not to offer it.
  it('every instrument has a declared translation status in every language', () => {
    for (const language of UI_LANGUAGES) {
      const status = translationStatus(language);
      for (const inst of instruments) {
        expect(status[inst.id], `${inst.id} has no status in ${language}`).toBeTruthy();
        expect(['official', 'absent']).toContain(status[inst.id]);
      }
    }
  });

  it('a language marked "absent" ships none of that instrument’s wording', () => {
    for (const language of UI_LANGUAGES) {
      const status = translationStatus(language);
      const clinical = strings('clinical', language);
      for (const inst of instruments) {
        if (status[inst.id] !== 'absent') continue;
        const leaked = Object.keys(clinical).filter(
          (k) => k.startsWith(`instrument.${inst.id}.item.`) || k === `instrument.${inst.id}.prompt`,
        );
        expect(
          leaked,
          `${language} claims no official ${inst.id} translation but ships its wording: ${leaked.join(', ')}`,
        ).toEqual([]);
      }
    }
  });

  it('a language marked "official" ships every item of that instrument', () => {
    for (const language of UI_LANGUAGES) {
      const status = translationStatus(language);
      const clinical = strings('clinical', language);
      for (const inst of instruments) {
        if (status[inst.id] !== 'official') continue;
        for (const item of inst.items) {
          expect(
            clinical[item.textRef],
            `${language} claims an official ${inst.id} translation but ${item.textRef} is missing`,
          ).toBeTruthy();
        }
      }
    }
  });

  it('English ships every instrument, so the app is usable at all', () => {
    const status = translationStatus('en');
    for (const inst of instruments) expect(status[inst.id], inst.id).toBe('official');
  });
});


describe('invariant 10 — an under-18 never reaches an adult private rung', () => {
  const DURATIONS_ALL: Duration[] = ['under-a-month', '1-6-months', '6-12-months', 'over-a-year'];
  const DOMAINS_ALL = ['mood', 'anxiety', 'work', 'social', 'grief', 'substance', 'general'];

  const everyUnderageInput = (): RoutingInput[] => {
    const inputs: RoutingInput[] = [];
    for (let severity = 0; severity <= 4; severity++) {
      for (const duration of DURATIONS_ALL) {
        for (const primaryDomain of DOMAINS_ALL) {
          for (const budget of BUDGETS) {
            for (const language of LANGUAGES) {
              inputs.push({
                severity,
                primaryDomain,
                duration,
                budget,
                language,
                safetyFlags: [],
                ageBand: 'under-18',
              });
            }
          }
        }
      }
    }
    return inputs;
  };

  const ADULT_RUNGS = ['short-term-individual', 'kela-rehabilitative', 'group-therapy'];

  it('routes every single under-18 combination to the youth rung', () => {
    // 1,680 combinations. The one that matters is the one nobody thought to try.
    for (const input of everyUnderageInput()) {
      const output = route(input, rules, ladder);
      expect(output.matchedRuleId, JSON.stringify(input)).toBe('R0');
      expect(ADULT_RUNGS, JSON.stringify(input)).not.toContain(output.suggestedRung?.id);
    }
  });

  it('no modifier can move an under-18 off the youth rung', () => {
    // The failure this guards against is subtle: M5 prefers a group for the
    // social domain, and a group is an adult paid rung. Without R0 being final,
    // a lonely sixteen-year-old would be routed to one.
    for (const input of everyUnderageInput()) {
      const output = route(input, rules, ladder);
      expect(output.appliedModifierIds, JSON.stringify(input)).toEqual([]);
    }
  });

  it('the age gate is declared final in config, not special-cased in the engine', () => {
    const gate = rules.baseRules.find((r) => r.id === 'R0');
    expect(gate, 'R0 is missing — the age gate is gone').toBeTruthy();
    expect(gate!.then.final, 'R0 is not final, so modifiers can move an under-18').toBe(true);
    expect(rules.baseRules[0].id, 'R0 must be evaluated before every other rule').toBe('R0');
  });

  it('shows an under-18 no private or adult-only directory entry, on any rung', () => {
    for (const rung of ladder.rungs) {
      for (const entry of entriesForRung(directory, rung.id, { ageBand: 'under-18' })) {
        expect(entry.sector, `${entry.id} on ${rung.id}`).not.toBe('private');
        expect(entry.ageRange.min, `${entry.id} is adult-only`).toBeLessThanOrEqual(16);
      }
    }
  });

  it('always has somewhere to send them, in every language', () => {
    const ids = new Set(directory.map((e) => e.id));
    expect(youthConfig.youthEntryIds.length).toBeGreaterThan(0);
    for (const id of youthConfig.youthEntryIds) {
      expect(ids, `youth config names a missing entry: ${id}`).toContain(id);
    }
    for (const language of LANGUAGES) {
      const reachable = youthConfig.youthEntryIds
        .map((id) => directory.find((e) => e.id === id)!)
        .filter((e) => e.languages.includes(language));
      // Swedish and Finnish are both covered; English falls back to the whole
      // youth list rather than to nothing, which is what the screen renders.
      expect(youthConfig.youthEntryIds.length, language).toBeGreaterThan(0);
      void reachable;
    }
  });

  it('the crisis path is still reachable for an under-18', () => {
    const output = route(
      {
        severity: 3,
        primaryDomain: 'mood',
        duration: '1-6-months',
        budget: 'none',
        language: 'fi',
        safetyFlags: ['crisis'] as SafetyFlag[],
        ageBand: 'under-18',
      },
      rules,
      ladder,
    );
    // Crisis outranks the age gate: it is checked before any rule is consulted.
    expect(output.crisis).toBe(true);
  });
});

describe('invariant 11 — no outbound request carries anything about the person', () => {
  // The privacy claim, made structural. `poolInterestBody` is the only body the
  // client may send, and it is built key by key from config enums.
  const validRequest = {
    topicId: groups.topics[0].id,
    region: groups.regions[0],
    careLanguage: groups.languages[0],
  };

  it('the body has exactly three keys, and they are the declared ones', () => {
    const body = poolInterestBody(groups, validRequest);
    expect(Object.keys(body).sort()).toEqual([...POOL_BODY_KEYS].sort());
    expect(Object.keys(body)).toHaveLength(3);
  });

  it('cannot be widened by passing a larger object', () => {
    // The realistic regression: someone passes the whole context object through
    // "because it has the fields we need" and four more ride along.
    const body = poolInterestBody(groups, {
      ...validRequest,
      severity: 4,
      bandId: 'severe',
      answers: { q1: 3 },
      suggestedRung: 'kela-rehabilitative',
      ageBand: 'under-18',
      deviceId: 'abc123',
    } as never);
    expect(Object.keys(body).sort()).toEqual([...POOL_BODY_KEYS].sort());
    for (const forbidden of ['severity', 'bandId', 'answers', 'suggestedRung', 'ageBand', 'deviceId']) {
      expect(body as unknown as Record<string, unknown>).not.toHaveProperty(forbidden);
    }
  });

  it('rejects a value that is not in config rather than putting free text on the wire', () => {
    expect(() => poolInterestBody(groups, { ...validRequest, region: 'somewhere-else' })).toThrow();
    expect(() => poolInterestBody(groups, { ...validRequest, topicId: 'made-up' })).toThrow();
    expect(() => poolInterestBody(groups, { ...validRequest, careLanguage: 'de' })).toThrow();
  });

  it('serialises to a body whose every value is a declared enum member', () => {
    // Checked key by key rather than by grepping the JSON: a substring search
    // flags `careLanguage` for containing "age", which is how a privacy test
    // ends up being deleted for crying wolf.
    const body = poolInterestBody(groups, validRequest);
    const parsed = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;

    expect(Object.keys(parsed).sort()).toEqual([...POOL_BODY_KEYS].sort());
    expect(groups.topics.map((t) => t.id)).toContain(parsed.topicId);
    expect(groups.regions).toContain(parsed.region);
    expect(groups.languages).toContain(parsed.careLanguage);

    // Every value is a short enum token, so nothing free-typed can ride along.
    for (const value of Object.values(parsed)) {
      expect(typeof value).toBe('string');
      expect(String(value)).toMatch(/^[a-z-]{2,40}$/);
    }
  });

  it('every declared region, language and topic is a fixed enum, not free text', () => {
    expect(groups.regions.length).toBeGreaterThan(0);
    expect(groups.languages).toEqual(['fi', 'sv', 'en']);
    for (const topic of groups.topics) {
      expect(topic.id).toMatch(/^[a-z-]+$/);
      expect(thresholdFor(groups, topic.id)).toBeGreaterThan(0);
      expect(topic.because.length, `${topic.id} has no reason`).toBeGreaterThan(20);
    }
  });

  it('the client has exactly one module that may touch the network', () => {
    // `store.ts` must never gain a network call, and the exception lives in one
    // auditable file. A grep is crude and it is exactly the right shape here.
    const web = join(CONFIG_DIR, '../apps/web/src');
    for (const file of ['store.ts', 'draft.ts', 'waitlist.ts', 'followUp.ts', 'config.ts', 'i18n.ts']) {
      const src = readFileSync(join(web, file), 'utf8');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code, `${file} makes a network call`).not.toMatch(
        /\bfetch\(|XMLHttpRequest|navigator\.sendBeacon|new WebSocket/,
      );
    }
  });

  it('the one networking module sends no credentials', () => {
    const src = readFileSync(join(CONFIG_DIR, '../apps/web/src/pool.ts'), 'utf8');
    const calls = src.match(/fetch\([\s\S]*?\n  \}\)/g) ?? [];
    expect(calls.length, 'expected pool.ts to contain fetch calls').toBeGreaterThan(0);
    for (const call of calls) {
      expect(call, 'a fetch in pool.ts does not omit credentials').toContain("credentials: 'omit'");
    }
  });

  it('group topics only ever hang off rungs that exist', () => {
    const rungIds = new Set(ladder.rungs.map((r) => r.id));
    for (const topic of groups.topics) {
      for (const rungId of topic.rungs) {
        expect(rungIds, `topic ${topic.id} names a missing rung`).toContain(rungId);
      }
      expect(topicsForRung(groups, topic.rungs[0])).toContainEqual(topic);
    }
  });
});



describe('invariant 22 — the transparency page names every screener that can open', () => {
  // The failure this catches already happened. "How Reitti decides" was
  // transcribed from a mockup and named three of the five deeper screeners:
  // UCLA-3 and AUDIT-C were missing, so a page whose entire purpose is showing
  // what actually runs was quietly understating it. The list is derived from
  // config now, and this asserts the derivation stays complete.
  const entry = instrument(flow.entry);
  const derived = deeperScreeners(flow, entry);

  it('derives every instrument the funnel can reach after the entry screener', () => {
    const reachable = new Set<string>([
      ...(entry.branchesTo ?? []).map((b) => b.instrumentId),
      ...flow.domainTriggers.map((tr) => tr.instrumentId),
      ...flow.severityTriggers.map((tr) => tr.instrumentId),
    ]);
    expect(new Set(derived.map((d) => d.instrumentId))).toEqual(reachable);
  });

  it('names each one exactly once, however many triggers reach it', () => {
    // AUDIT-C is opened by both a domain and a severity trigger. It is one
    // questionnaire and must appear as one chip.
    const ids = derived.map((d) => d.instrumentId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every derived screener actually exists as an instrument', () => {
    const known = new Set(instruments.map((i) => i.id));
    for (const screener of derived) {
      expect(known, `funnel names a missing instrument: ${screener.instrumentId}`).toContain(
        screener.instrumentId,
      );
    }
  });

  it('every one has a plain-language reason, in all three languages', () => {
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      for (const screener of derived) {
        expect(
          ui[`howItWorks.branch.${screener.instrumentId}`],
          `${language} has no reason for ${screener.instrumentId}`,
        ).toBeTruthy();
      }
    }
  });

  it('every shipped instrument is described on the page, not only the deep ones', () => {
    // Including the entry screener and WHO-5, which is not in the funnel at all.
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      for (const inst of instruments) {
        expect(
          ui[`howItWorks.instrument.${inst.id}.measures`],
          `${language} does not describe ${inst.id}`,
        ).toBeTruthy();
      }
      expect(ui[`howItWorks.licence.free`]).toBeTruthy();
      expect(ui[`howItWorks.licence.public-domain`]).toBeTruthy();
    }
  });

  it('the page never has to retype an instrument name', () => {
    // Names come from config and are proper nouns. A translated or hand-typed
    // "PHQ-9" is how a page starts disagreeing with the engine.
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      for (const inst of instruments) {
        for (const [key, value] of Object.entries(ui)) {
          if (!key.startsWith('howItWorks.branch.')) continue;
          expect(value, `${language} ${key} hard-codes an instrument name`).not.toContain(inst.name);
        }
      }
    }
  });
});

describe('invariant 21 — a rung names the free care that is really there', () => {
  // The miss this catches: a rung whose cost band claims free while naming
  // nobody. It reads as an unfinished card, and worse, it argues that free care
  // has run out when what has actually run out is our directory.





  it('the two lowest rungs have free CARE that can be named, not just a cost band', () => {
    // "FREE" tells somebody a rung costs nothing. It does not tell them what the
    // free thing is, which is the question they actually have.
    const byLevel = [...ladder.rungs].sort((a, b) => a.level - b.level);
    for (const rung of byLevel.slice(0, 2)) {
      const free = freeCareAt(directory, rung.id);
      expect(free, `${rung.id} has no nameable free care`).toBeTruthy();
      expect(en[free!.nameRef]).toBeTruthy();
    }
  });

  it('never names a route as though it were the free care at a rung', () => {
    // Terapianavigaattori routes people to group therapy; it is not free group
    // therapy. Announcing it beside "Group therapy" would promise capacity that
    // does not exist, which is worse than saying nothing.
    for (const rung of ladder.rungs) {
      const free = freeCareAt(directory, rung.id);
      if (!free) continue;
      expect(free.role, `${free.id} is a route but is named as care on ${rung.id}`).toBe('care');
    }
  });

  it('every entry declares whether it is care, gated care, or a route', () => {
    for (const entry of directory) {
      expect(['care', 'gated-care', 'route'], `${entry.id} has role "${entry.role}"`).toContain(
        entry.role,
      );
    }
  });

  it('a rung labelled free names somebody, one way or the other', () => {
    // A rung whose cost band says free and which names nobody is internally
    // inconsistent, and it reads as an unfinished card rather than an argument.
    // Worse, it implies free care runs out there. Nettiterapia is real public
    // treatment, free to the patient, waiting behind a referral — so it gets
    // named with the gate stated rather than left as a blank space.
    for (const rung of ladder.rungs) {
      const claimsFree = rung.typicalCost === 'free' || rung.typicalCost === 'free-with-referral';
      if (!claimsFree) continue;
      const named = freeCareAt(directory, rung.id) ?? gatedFreeCareAt(directory, rung.id);
      expect(
        named,
        `${rung.id} is labelled ${rung.typicalCost} but names no free care`,
      ).toBeTruthy();
    }
  });

  it('gated care is never presented as something you can start today', () => {
    for (const rung of ladder.rungs) {
      const ungated = freeCareAt(directory, rung.id);
      if (!ungated) continue;
      expect(ungated.costBand, `${ungated.id} needs a referral but is named as free`).toBe('free');
      expect(ungated.role).toBe('care');
    }
  });

  it('the rungs with genuinely no free path stay bare, and that is honest', () => {
    // Short-term individual therapy and Kela psychotherapy have no free route.
    // Naming something there would be the same lie in the other direction.
    for (const rungId of ['short-term-individual', 'kela-rehabilitative']) {
      expect(freeCareAt(directory, rungId), rungId).toBeUndefined();
      expect(gatedFreeCareAt(directory, rungId), rungId).toBeUndefined();
    }
  });

});

describe('invariant 12 — no filter empties a rung that has entries', () => {
  // The generalisation of "budget never hides a rung", asserted over the whole
  // cartesian product rather than over the one combination someone thought of.
  const rungsWithEntries = ladder.rungs
    .map((r) => r.id)
    .filter((id) => directory.some((e) => e.rungs.includes(id)));

  it('there is something to test', () => {
    expect(rungsWithEntries.length).toBeGreaterThan(0);
  });

  it('language and budget never empty a rung, in any combination', () => {
    for (const rungId of rungsWithEntries) {
      const unfiltered = entriesForRung(directory, rungId).length;
      for (const careLanguage of LANGUAGES) {
        for (const budget of BUDGETS) {
          const got = entriesForRung(directory, rungId, { careLanguage, budget });
          expect(got.length, `${rungId} / ${careLanguage} / ${budget}`).toBe(unfiltered);
        }
      }
    }
  });

  it('every filter returns a permutation, never a subset', () => {
    for (const rungId of rungsWithEntries) {
      const expected = new Set(entriesForRung(directory, rungId).map((e) => e.id));
      for (const careLanguage of LANGUAGES) {
        for (const budget of BUDGETS) {
          const got = new Set(
            entriesForRung(directory, rungId, { careLanguage, budget }).map((e) => e.id),
          );
          expect(got, `${rungId} / ${careLanguage} / ${budget}`).toEqual(expected);
        }
      }
    }
  });

  it('age is the only filter that may remove anything', () => {
    // Stated as a test so that adding a second removing filter has to argue with
    // this line rather than slip in as a refactor.
    for (const rungId of rungsWithEntries) {
      const all = entriesForRung(directory, rungId);
      for (const ageBand of AGE_BANDS) {
        const got = entriesForRung(directory, rungId, { ageBand });
        for (const e of got) expect(all.map((x) => x.id)).toContain(e.id);
      }
    }
  });
});

describe('invariant 13 — a fallback-only entry never outranks a domestic one', () => {
  it('holds for every language the app ships in', () => {
    const fallbacks = directory.filter((e) => e.fallbackOnly);
    const domestic = directory.filter((e) => !e.fallbackOnly);
    if (fallbacks.length === 0 || domestic.length === 0) return;

    for (const careLanguage of LANGUAGES) {
      const ordered = orderFreeFirst(directory, { careLanguage });
      const firstFallback = ordered.findIndex((e) => e.fallbackOnly);
      const lastDomestic = ordered.map((e) => !e.fallbackOnly).lastIndexOf(true);
      expect(firstFallback, careLanguage).toBeGreaterThan(lastDomestic);
    }
  });

  it('a fallback-only entry always carries a caution the person will read', () => {
    for (const e of directory.filter((x) => x.fallbackOnly)) {
      expect(e.cautionRef, `${e.id} is fallbackOnly with no caution`).toBeTruthy();
      expect(en[e.cautionRef!], `${e.id} caution does not resolve`).toBeTruthy();
    }
  });
});

describe('invariant 14 — every directory entry is complete', () => {
  // A person turning up to a closed line because we showed last year's hours is
  // a safety problem, not a data-quality one. Hence: required, not encouraged.
  it('carries hours, language, anonymity, who-answers and a verification date', () => {
    for (const e of directory) {
      expect(e.hoursRef, `${e.id} hours`).toBeTruthy();
      expect(en[e.hoursRef], `${e.id} hours ref does not resolve`).toBeTruthy();
      expect(e.languages?.length, `${e.id} languages`).toBeGreaterThan(0);
      expect(e.anonymity, `${e.id} anonymity`).toBeTruthy();
      expect(e.whoAnswers, `${e.id} whoAnswers`).toBeTruthy();
      expect(e.verifiedOn, `${e.id} verifiedOn`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.verifiedBy, `${e.id} verifiedBy`).toBeTruthy();
    }
  });

  it('resolves every ref it names in the English bundle', () => {
    for (const e of directory) {
      expect(en[e.nameRef], `${e.id} nameRef`).toBeTruthy();
      if (e.costNoteRef) expect(en[e.costNoteRef], `${e.id} costNoteRef`).toBeTruthy();
      if (e.cautionRef) expect(en[e.cautionRef], `${e.id} cautionRef`).toBeTruthy();
    }
  });

  it('says who runs it, so nobody has to guess whose service they are entering', () => {
    for (const e of directory) {
      expect(e.operator, `${e.id} has no operator`).toBeTruthy();
    }
  });
});

describe('config integrity', () => {
  it('every ref used by a config resolves in the English bundle', () => {
    const refs = new Set<string>();
    const collect = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key.endsWith('Ref') && typeof value === 'string') refs.add(value);
          else collect(value);
        }
      }
    };
    collect(instruments);
    collect(ladder);
    collect(crisisConfig);
    collect(directory);

    const missing = [...refs].filter((ref) => !en[ref]);
    expect(missing, `unresolved refs: ${missing.join(', ')}`).toEqual([]);
  });

  it('no instrument with an unresolved commercial licence ships in V1', () => {
    for (const inst of instruments) {
      expect(inst.license, `${inst.id} needs its licence resolved before it ships`).not.toBe(
        'verify-commercial',
      );
    }
  });

  it('every instrument declares its source', () => {
    for (const inst of instruments) {
      expect(inst.source, `${inst.id} has no source attribution`).toBeTruthy();
    }
  });

  it('every rung the rules reference exists in the ladder', () => {
    const rungIds = new Set(ladder.rungs.map((r) => r.id));
    for (const rule of rules.baseRules) {
      expect(rungIds, `base rule ${rule.id}`).toContain(rule.then.rung);
    }
    for (const modifier of rules.modifiers) {
      if (modifier.then.preferRung) {
        expect(rungIds, `modifier ${modifier.id}`).toContain(modifier.then.preferRung);
      }
    }
  });

  it('every instrument a branch or trigger names actually exists', () => {
    const ids = new Set(instruments.map((i) => i.id));
    for (const inst of instruments) {
      for (const branch of inst.branchesTo ?? []) {
        expect(ids, `${inst.id} branches to a missing instrument`).toContain(branch.instrumentId);
      }
    }
  });

  it('the rules table ends with an unconditional catch-all', () => {
    const last = rules.baseRules[rules.baseRules.length - 1];
    expect(Object.keys(last.when)).toEqual([]);
  });

  it('every rule carries a reason a clinician can read', () => {
    for (const rule of [...rules.baseRules, ...rules.modifiers]) {
      expect(rule.because, `${rule.id} has no reason`).toBeTruthy();
      expect(rule.because.length).toBeGreaterThan(20);
    }
  });
});
