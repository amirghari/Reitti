/**
 * The six safety invariants from architecture v2 §8, as executable tests.
 *
 * These are the tests that must never be weakened to make a feature pass. If one
 * of them fails, the failure is the correct outcome and the feature is wrong.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCrisis, scoreInstrument } from '../src/scoring.js';
import { route } from '../src/routing.js';
import { nullAssistant } from '../../ai/src/index.js';
import { CONFIG_DIR, answerAll, crisisConfig, en, instrument, instruments, ladder, rules } from './helpers.js';

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
