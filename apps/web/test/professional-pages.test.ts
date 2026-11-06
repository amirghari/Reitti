/**
 * The professionals directory's templates and gate (D-39), against invented rows.
 * No real person appears in this repository; the real rows live in the private
 * amirghari/Reitti-data and never reach a test.
 */
import { describe, expect, it } from 'vitest';
import en from '../../../config/i18n/ui/en.json' with { type: 'json' };
import fi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import sv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import crisis from '../../../config/crisis.json' with { type: 'json' };
import {
  CITIES,
  PUBLIC_PAGES_APPROVED,
  ladderSteps,
  productionBlockers,
  validate,
  type Professional,
} from '../pages/data';
import { LANGS, cityPath, professionalPage, profilePath, renderAll } from '../pages/render';

function invented(overrides: Partial<Professional> = {}): Professional {
  return {
    id: 'fixture-1',
    slug: 'keksitty-terapeutti',
    type: 'psychotherapist',
    name: 'Keksitty Terapeutti',
    title: 'Psykoterapeutti (keksitty)',
    languages: ['fi', 'en'],
    city: 'Helsinki',
    region: 'Helsinki',
    methods: ['kognitiivinen psykoterapia'],
    kela_approved: true,
    kela_checked_on: '2026-11-06',
    licence_checked_on: '2026-11-06',
    registered_provider_checked_on: null,
    business_id: '1234567-8',
    website: 'https://example.org/keksitty',
    booking_url: null,
    phone: null,
    email: null,
    prices: null,
    waiting_time: null,
    remote_available: 'yes',
    accepting_new_clients: 'unknown',
    sources: [{ source: 'kela', url: 'https://www.kela.fi/hae-palveluntuottajaa', read_on: '2026-11-06', fields: ['languages'] }],
    claimed: false,
    claimed_on: null,
    status: 'active',
    stale_since: null,
    do_not_list: false,
    do_not_list_on: null,
    sample: true,
    ...overrides,
  };
}

const ROWS: Professional[] = [
  invented(),
  invented({ id: 'fixture-2', slug: 'keksitty-psykologi', type: 'psychologist', name: 'Keksitty Psykologi', city: 'Oulu', kela_approved: false }),
  invented({ id: 'fixture-3', slug: 'poistettu', name: 'Poistettu Henkilo', do_not_list: true, do_not_list_on: '2026-11-06' }),
  invented({ id: 'fixture-4', slug: 'vanhentunut', name: 'Vanhentunut Henkilo', status: 'stale', stale_since: '2026-10-01' }),
];

describe('the dataset is checked against the schema', () => {
  it('accepts the invented rows', () => {
    expect(validate(ROWS)).toEqual([]);
  });

  it('refuses a missing field, an unknown field, a psychiatrist and a city outside the first six', () => {
    const { email: _email, ...missing } = invented();
    expect(validate([missing]).join('\n')).toMatch(/email: missing/);
    expect(validate([{ ...invented(), notes_internal: 'x' }]).join('\n')).toMatch(/notes_internal: not in the schema/);
    expect(validate([invented({ type: 'psychiatrist' as never })]).join('\n')).toMatch(/type/);
    expect(validate([invented({ city: 'Jyväskylä' })]).join('\n')).toMatch(/first cities/);
  });

  it('refuses a slug used twice, a bad date, a plain-http link and a removal with no date', () => {
    expect(validate([invented(), invented({ id: 'other' })]).join('\n')).toMatch(/slug.*used twice/);
    expect(validate([invented({ licence_checked_on: '6.11.2026' })]).join('\n')).toMatch(/not a date/);
    expect(validate([invented({ website: 'http://example.org' })]).join('\n')).toMatch(/https/);
    expect(validate([invented({ do_not_list: true })]).join('\n')).toMatch(/do_not_list without/);
  });
});

describe('ladder steps are derived, never stored (D-39)', () => {
  it('psychotherapists sit on short-term individual therapy, and Kela rehabilitative too when Kela-approved', () => {
    expect(ladderSteps({ type: 'psychotherapist', kela_approved: false })).toEqual(['short-term-individual']);
    expect(ladderSteps({ type: 'psychotherapist', kela_approved: true })).toEqual(['short-term-individual', 'kela-rehabilitative']);
  });

  it('psychologists sit on short-term individual therapy only, Kela or not', () => {
    expect(ladderSteps({ type: 'psychologist', kela_approved: true })).toEqual(['short-term-individual']);
  });
});

describe('the gate: no public page until Amir says so', () => {
  it('is shut', () => {
    expect(PUBLIC_PAGES_APPROVED).toBe(false);
  });

  it('a production build names every reason it may not proceed', () => {
    const reasons = productionBlockers([invented(), invented({ id: 'x', slug: 'x', sample: false, licence_checked_on: null })]).join('\n');
    expect(reasons).toMatch(/not public until Amir says so/);
    expect(reasons).toMatch(/claim and removal address/);
    expect(reasons).toMatch(/1 sample row/);
    expect(reasons).toMatch(/without a licence check: x/);
  });
});

describe('the pages', () => {
  const pages = renderAll(ROWS);
  const byPath = new Map(pages.map((p) => [p.path, p.html]));

  it('builds each listed professional and every city page, in three languages', () => {
    expect(pages).toHaveLength(LANGS.length * (2 + 2 * CITIES.length));
    expect(byPath.has('/ammattilaiset/keksitty-terapeutti')).toBe(true);
    expect(byPath.has('/sv/yrkespersoner/keksitty-terapeutti')).toBe(true);
    expect(byPath.has('/en/professionals/keksitty-terapeutti')).toBe(true);
    expect(byPath.has('/psykoterapeutit/helsinki')).toBe(true);
    expect(byPath.has('/sv/psykologer/oulu')).toBe(true);
    expect(byPath.has('/en/psychologists/vantaa')).toBe(true);
  });

  it('a removed or stale row gets no page and is on no city page', () => {
    for (const lang of LANGS) {
      expect(byPath.has(profilePath(lang, 'poistettu'))).toBe(false);
      expect(byPath.has(profilePath(lang, 'vanhentunut'))).toBe(false);
    }
    for (const html of byPath.values()) {
      expect(html).not.toContain('Poistettu Henkilo');
      expect(html).not.toContain('Vanhentunut Henkilo');
    }
  });

  it('every page is noindex, in its own language, with the crisis lines before the content', () => {
    for (const { path, html } of pages) {
      expect(html, path).toContain('<meta name="robots" content="noindex, nofollow">');
      const lang = path.startsWith('/sv/') ? 'sv' : path.startsWith('/en/') ? 'en' : 'fi';
      expect(html, path).toContain(`<html lang="${lang}">`);
      const band = html.indexOf('class="crisis-band"');
      expect(band, path).toBeGreaterThan(-1);
      expect(band, path).toBeLessThan(html.indexOf('<main'));
      for (const r of crisis.resources) expect(html, path).toContain(`href="tel:${r.phone.replace(/\s/g, '')}"`);
    }
  });

  it('prints no raw string key, no em dash, no business ID and no rating', () => {
    for (const { path, html } of pages) {
      expect(html, path).not.toMatch(/\bpro\.[a-z]+\.[a-zA-Z.]+/);
      expect(html, path).not.toContain('—');
      expect(html, path).not.toContain('1234567-8');
      expect(html, path).not.toMatch(/aggregateRating|"review"|ratingValue/);
    }
  });

  it('a sample is stamped in the title, the first line of the page and the structured data', () => {
    const html = professionalPage(invented(), 'en');
    expect(html).toMatch(/<title>Sample, not a real professional\./);
    expect(html).toContain('class="sample-banner"');
    expect(html).toMatch(/"description":"Sample, not a real professional\."/);
    expect(byPath.get('/psykoterapeutit/helsinki')).toContain('class="sample-banner"');
  });

  it('a real row carries no sample stamp', () => {
    const html = professionalPage(invented({ sample: false }), 'en');
    expect(html).not.toContain('sample-banner');
    expect(html).not.toContain('Sample, not a real professional');
  });

  it('shows the licence check, the source with its date, and the Article 14 notice', () => {
    const html = byPath.get('/en/professionals/keksitty-terapeutti')!;
    expect(html).toContain('Licence checked on 6 November 2026');
    expect(html).toContain('Kela&#39;s search for rehabilitative psychotherapy providers</a>, read on 6 November 2026');
    expect(html).toContain('legitimate interest');
    expect(html).toContain('within 7 days');
    // No address chosen yet: the requests print as text, never as a dead link.
    expect(html).toContain('Is this you? Claim this page');
    expect(html).not.toMatch(/href="mailto:[^"]*subject/);
  });

  it('Finnish source text is marked as Finnish on the other languages pages', () => {
    expect(byPath.get('/en/professionals/keksitty-terapeutti')).toContain('<span lang="fi">kognitiivinen psykoterapia</span>');
    expect(byPath.get('/ammattilaiset/keksitty-terapeutti')).not.toContain('<span lang="fi">');
  });

  it('every link between directory pages lands on a page that was built', () => {
    for (const { path, html } of pages) {
      for (const [, href] of html.matchAll(/href="(\/(?:ammattilaiset|psykoterapeutit|psykologit|sv|en)\/[^"]*)"/g)) {
        expect(byPath.has(href), `${path} links to ${href}`).toBe(true);
      }
    }
  });

  it('an empty city says so', () => {
    expect(byPath.get(cityPath('en', 'psychologist', 'turku'))).toContain('No one is listed here yet.');
  });
});

describe('the copy', () => {
  const keys = Object.keys(en).filter((k) => k.startsWith('pro.'));

  it('every page string exists in Finnish and Swedish, and is flagged for a native reader', () => {
    expect(keys.length).toBeGreaterThan(40);
    for (const bundle of [fi, sv] as Record<string, unknown>[]) {
      const flagged = new Set(bundle._needsNativeReview as string[]);
      for (const key of keys) {
        expect(typeof bundle[key], key).toBe('string');
        expect(flagged.has(key), key).toBe(true);
      }
    }
  });
});
