import { describe, expect, it } from 'vitest';
import {
  entriesForRung,
  freeCareAt,
  humanOptionFor,
  orderFreeFirst,
  servesAge,
  speaks,
  type DirectoryEntry,
} from '../src/directory.js';
import { ConfigError } from '../src/scoring.js';
import type { Budget } from '../src/types.js';
import { directory, ladder } from './helpers.js';

const LANGUAGES = ['fi', 'sv', 'en'];
const BUDGETS: Budget[] = ['none', 'low', 'moderate', 'flexible'];
const RUNGS = ladder.rungs.map((r) => r.id);

/** A minimal entry; each test overrides only the field it is about. */
const make = (over: Partial<DirectoryEntry> & { id: string }): DirectoryEntry => ({
  nameRef: `directory.${over.id}.name`,
  operator: 'Test operator',
  rungs: ['peer-community'],
  sector: 'third-sector',
  costBand: 'free',
  languages: ['fi'],
  ageRange: { min: 18, max: null },
  formats: ['chat'],
  hoursRef: 'directory.hours.unverified',
  anonymity: 'anonymous',
  whoAnswers: 'trained-volunteer',
  url: 'https://example.fi/',
  origin: 'domestic',
  role: 'care',
  verifiedOn: '2026-09-08',
  verifiedBy: 'test',
  clinicianReviewed: false,
  ...over,
});

describe('free-first ordering', () => {
  it('puts free before subsidised before self-pay', () => {
    const ordered = orderFreeFirst([
      make({ id: 'paid', costBand: 'self-pay', sector: 'private' }),
      make({ id: 'kela', costBand: 'kela-subsidised', sector: 'kela' }),
      make({ id: 'free', costBand: 'free', sector: 'public' }),
    ]);
    expect(ordered.map((e) => e.id)).toEqual(['free', 'kela', 'paid']);
  });

  it('puts public before third-sector when cost is equal', () => {
    const ordered = orderFreeFirst([
      make({ id: 'jarjesto', sector: 'third-sector' }),
      make({ id: 'julkinen', sector: 'public' }),
    ]);
    expect(ordered.map((e) => e.id)).toEqual(['julkinen', 'jarjesto']);
  });

  it('is stable, so config order is the clinician tiebreak', () => {
    const ordered = orderFreeFirst([
      make({ id: 'first' }),
      make({ id: 'second' }),
      make({ id: 'third' }),
    ]);
    expect(ordered.map((e) => e.id)).toEqual(['first', 'second', 'third']);
  });

  it('orders a language match above a non-match, because an unusable service is not a cheap one', () => {
    const ordered = orderFreeFirst(
      [
        make({ id: 'finnish-free', languages: ['fi'], costBand: 'free' }),
        make({ id: 'english-paid', languages: ['en'], costBand: 'self-pay' }),
      ],
      { careLanguage: 'en' },
    );
    expect(ordered.map((e) => e.id)).toEqual(['english-paid', 'finnish-free']);
  });

  it('never drops the non-matching language, it only moves it down', () => {
    const ordered = orderFreeFirst([make({ id: 'finnish', languages: ['fi'] })], {
      careLanguage: 'en',
    });
    expect(ordered.map((e) => e.id)).toEqual(['finnish']);
  });

  it('orders every domestic entry above an international one, whatever the language', () => {
    for (const language of LANGUAGES) {
      const ordered = orderFreeFirst(
        [
          make({ id: 'international', origin: 'international', languages: ['en'] }),
          make({ id: 'domestic', origin: 'domestic', languages: ['fi'] }),
        ],
        { careLanguage: language },
      );
      expect(ordered[0].id, `language ${language}`).toBe('domestic');
    }
  });

  it('puts a fallbackOnly entry last even when it is the only language match', () => {
    const ordered = orderFreeFirst(
      [
        make({ id: 'fallback', fallbackOnly: true, origin: 'international', languages: ['en'] }),
        make({ id: 'ordinary', languages: ['fi'] }),
      ],
      { careLanguage: 'en' },
    );
    expect(ordered.map((e) => e.id)).toEqual(['ordinary', 'fallback']);
  });

  it('a budget of none pushes self-pay down but keeps it in the list', () => {
    const entries = [
      make({ id: 'paid', costBand: 'self-pay' }),
      make({ id: 'free', costBand: 'free' }),
    ];
    const ordered = orderFreeFirst(entries, { budget: 'none' });
    expect(ordered.map((e) => e.id)).toEqual(['free', 'paid']);
    expect(ordered).toHaveLength(2);
  });
});

describe('entriesForRung', () => {
  it('returns an entry under every rung it serves', () => {
    const multi = make({ id: 'multi', rungs: ['self-help', 'peer-community'] });
    expect(entriesForRung([multi], 'self-help').map((e) => e.id)).toEqual(['multi']);
    expect(entriesForRung([multi], 'peer-community').map((e) => e.id)).toEqual(['multi']);
  });

  it('returns nothing for a rung an entry does not serve', () => {
    expect(entriesForRung([make({ id: 'a' })], 'kela-rehabilitative')).toEqual([]);
  });

  it('filters by age, which is the only permitted removal', () => {
    const adultOnly = make({ id: 'adult', ageRange: { min: 18, max: null } });
    expect(entriesForRung([adultOnly], 'peer-community', { ageBand: 'under-18' })).toEqual([]);
    expect(entriesForRung([adultOnly], 'peer-community', { ageBand: '30-plus' })).toHaveLength(1);
  });

  it('reorders but never removes for language or budget', () => {
    const entries = [
      make({ id: 'a', languages: ['fi'], costBand: 'self-pay' }),
      make({ id: 'b', languages: ['en'], costBand: 'free' }),
    ];
    for (const language of LANGUAGES) {
      for (const budget of BUDGETS) {
        const got = entriesForRung(entries, 'peer-community', { careLanguage: language, budget });
        expect(got, `${language}/${budget}`).toHaveLength(2);
      }
    }
  });
});

describe('servesAge and speaks', () => {
  it('respects an upper bound', () => {
    const youth = make({ id: 'youth', ageRange: { min: 12, max: 29 } });
    expect(servesAge(youth, 'under-18')).toBe(true);
    expect(servesAge(youth, '18-29')).toBe(true);
    expect(servesAge(youth, '30-plus')).toBe(false);
  });

  it('treats a null upper bound as no bound', () => {
    const open = make({ id: 'open', ageRange: { min: 18, max: null } });
    expect(servesAge(open, '30-plus')).toBe(true);
  });

  it('reports the languages an entry actually has', () => {
    const e = make({ id: 'e', languages: ['fi', 'sv'] });
    expect(speaks(e, 'fi')).toBe(true);
    expect(speaks(e, 'en')).toBe(false);
  });
});

describe('humanOptionFor', () => {
  const humans = [
    make({ id: 'fi-line', languages: ['fi'], formats: ['phone'] }),
    make({ id: 'en-line', languages: ['en'], formats: ['chat'] }),
    make({ id: 'self-help', languages: ['fi'], formats: ['self-guided'], whoAnswers: 'not-applicable' }),
  ];

  it('prefers the person’s own language', () => {
    expect(humanOptionFor(humans, 'en', '30-plus').id).toBe('en-line');
    expect(humanOptionFor(humans, 'fi', '30-plus').id).toBe('fi-line');
  });

  it('never returns a self-guided resource as a human option', () => {
    expect(humanOptionFor(humans, 'fi', '30-plus').whoAnswers).not.toBe('not-applicable');
  });

  it('falls back to another language rather than to nobody', () => {
    expect(humanOptionFor(humans, 'sv', '30-plus').id).toBe('fi-line');
  });

  it('throws rather than returning nothing, so a hole fails the build', () => {
    expect(() => humanOptionFor([], 'fi', '30-plus')).toThrow(ConfigError);
  });
});

describe('freeCareAt — the free thing you can actually use at a rung', () => {
  it('names care, never a route to care', () => {
    // The bug this exists to prevent: Terapianavigaattori lists group-therapy
    // among its rungs because it routes people there, so "the first free option
    // on the group rung" resolved to it and the ladder announced free group
    // therapy that does not exist.
    const entries = [
      make({ id: 'navigator', role: 'route', costBand: 'free', rungs: ['group-therapy'] }),
      make({ id: 'the-group', role: 'care', costBand: 'free', rungs: ['group-therapy'] }),
    ];
    expect(freeCareAt(entries, 'group-therapy')?.id).toBe('the-group');
  });

  it('returns nothing rather than naming a route when no free care exists', () => {
    const entries = [make({ id: 'navigator', role: 'route', costBand: 'free', rungs: ['group-therapy'] })];
    expect(freeCareAt(entries, 'group-therapy')).toBeUndefined();
  });

  it('ignores paid, international and fallback-only entries', () => {
    expect(
      freeCareAt([make({ id: 'paid', costBand: 'self-pay' })], 'peer-community'),
    ).toBeUndefined();
    expect(
      freeCareAt([make({ id: 'abroad', origin: 'international' })], 'peer-community'),
    ).toBeUndefined();
    expect(
      freeCareAt([make({ id: 'last-resort', fallbackOnly: true })], 'peer-community'),
    ).toBeUndefined();
  });
});

describe('the shipped registry', () => {
  it('every entry names a rung that exists in the ladder', () => {
    for (const e of directory) {
      for (const rungId of e.rungs) {
        expect(RUNGS, `${e.id} → ${rungId}`).toContain(rungId);
      }
    }
  });

  it('no two entries share an id', () => {
    const ids = directory.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ships no private-sector entry, because none is verified against JulkiTerhikki', () => {
    expect(directory.filter((e) => e.sector === 'private')).toEqual([]);
  });

  it('orders a free public option first on every rung that has one', () => {
    for (const rungId of RUNGS) {
      const ordered = entriesForRung(directory, rungId);
      if (ordered.length === 0) continue;
      const free = ordered.filter((e) => e.costBand === 'free');
      if (free.length === 0) continue;
      const firstPaidIndex = ordered.findIndex((e) => e.costBand !== 'free');
      const lastFreeIndex = ordered.map((e) => e.costBand === 'free').lastIndexOf(true);
      if (firstPaidIndex !== -1) expect(lastFreeIndex, rungId).toBeLessThan(firstPaidIndex);
    }
  });
});
