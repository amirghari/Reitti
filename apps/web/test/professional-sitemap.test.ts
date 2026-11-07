/**
 * The directory sitemap (D-39), gated like the pages, on invented rows.
 */
import { describe, expect, it } from 'vitest';
import { robotsFor } from '../api/robots';
import { PUBLIC_PAGES_APPROVED } from '../pages/gate';
import type { Professional } from '../pages/data';
import { SITEMAP_PATH, sitemapGroups, sitemapHostRoute, sitemapXml, withSitemapHostRoute } from '../pages/sitemap';

const row = (overrides: Partial<Professional>): Professional =>
  ({
    id: 'x', slug: 'keksitty', type: 'psychotherapist', name: 'Keksitty', title: 'Psykoterapeutti', languages: ['fi'],
    city: 'Helsinki', region: 'Helsinki', methods: [], kela_approved: false, kela_checked_on: '2026-11-06',
    licence_checked_on: '2026-11-06', registered_provider_checked_on: null, business_id: null, website: null,
    booking_url: null, phone: null, email: null, prices: null, waiting_time: null, remote_available: 'unknown',
    accepting_new_clients: 'unknown', sources: [], claimed: false, claimed_on: null, status: 'active',
    stale_since: null, do_not_list: false, do_not_list_on: null, sample: true, ...overrides,
  }) as Professional;

const ROWS = [
  row({}),
  row({ id: 'y', slug: 'psykologi-oulu', type: 'psychologist', city: 'Oulu' }),
  row({ id: 'z', slug: 'poistettu', do_not_list: true, do_not_list_on: '2026-11-06' }),
  row({ id: 'w', slug: 'vanha', type: 'psychologist', city: 'Turku', status: 'stale', stale_since: '2026-10-01' }),
];

describe('what the directory sitemap offers', () => {
  const groups = sitemapGroups(ROWS);
  const fi = groups.map((g) => g.fi);

  it('the privacy page, each listed professional, and only the city pages with someone on them', () => {
    expect(fi).toEqual([
      '/tietosuoja/ammattilaiset',
      '/ammattilaiset/keksitty',
      '/ammattilaiset/psykologi-oulu',
      '/psykoterapeutit/helsinki',
      '/psykologit/oulu',
    ]);
  });

  it('never a removed or stale person, or the city only they were in', () => {
    const all = groups.flatMap((g) => Object.values(g)).join(' ');
    expect(all).not.toMatch(/poistettu|vanha|turku/);
  });

  it('every address in every language, each with fi/sv/en alternates and Finnish as x-default', () => {
    const xml = sitemapXml(groups);
    expect(xml.match(/<url>/g)).toHaveLength(groups.length * 3);
    expect(xml).toContain('<loc>https://mielenreitti.fi/en/professionals/keksitty</loc>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="sv" href="https://mielenreitti.fi/sv/yrkespersoner/keksitty"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://mielenreitti.fi/ammattilaiset/keksitty"/>');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

describe('the gate', () => {
  it('robots.txt names the directory sitemap only once the pages are public', () => {
    expect(PUBLIC_PAGES_APPROVED).toBe(false);
    expect(robotsFor('mielenreitti.fi')).not.toContain('sitemap-directory');
    expect(robotsFor('mielenreitti.fi')).toContain('Sitemap: https://mielenreitti.fi/sitemap.xml');
  });

  it('a host route, first in the list, keeps the file off every host but mielenreitti.fi', () => {
    const routes = withSitemapHostRoute([{ src: '^/(.*)$', continue: true }, { handle: 'filesystem' }]);
    expect(routes[0]).toEqual(sitemapHostRoute);
    expect(new RegExp(sitemapHostRoute.src).test(SITEMAP_PATH)).toBe(true);
    expect(sitemapHostRoute.status).toBe(404);
    expect(withSitemapHostRoute(routes)).toEqual(routes);
  });
});
