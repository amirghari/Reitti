/**
 * The guide pages (docs/next-phase.md, Phase C) and the rules they are held to.
 */
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import { GUIDES_EN } from '../guides/index';
import { checkGuide, guidePage, guidePath, guidesIndex } from '../guides/render';
import type { Guide } from '../guides/types';

const pages = GUIDES_EN.map((g) => ({ guide: g, html: guidePage(g) }));
const known = new Set(['/', '/directory', '/privacy', '/en/guides', ...GUIDES_EN.map((g) => guidePath(g.slug))]);

describe('the guides', () => {
  it('every guide passes every rule: each figure sourced, each source cited, dated and https', () => {
    for (const guide of GUIDES_EN) expect(checkGuide(guide), guide.slug).toEqual([]);
  });

  it('five English guides; "the first winter" waits for Amir', () => {
    expect(GUIDES_EN.map((g) => g.slug)).toEqual([
      'free-help-now',
      'therapy-in-finland-in-english',
      'kela-psychotherapy',
      'psychologist-without-referral',
      'while-you-wait',
    ]);
  });

  it('every page: English, the crisis lines before the content, a canonical address, and no raw string key', () => {
    for (const { guide, html } of pages) {
      expect(html, guide.slug).toContain('<html lang="en">');
      expect(html.indexOf('class="crisis-band"'), guide.slug).toBeLessThan(html.indexOf('<main'));
      for (const r of crisis.resources) expect(html, guide.slug).toContain(`href="tel:${r.phone.replace(/\s/g, '')}"`);
      expect(html, guide.slug).toContain(`<link rel="canonical" href="https://mielenreitti.fi${guidePath(guide.slug)}">`);
      expect(html, guide.slug).not.toMatch(/\b(guide|pro)\.[a-z]+\.[a-zA-Z.]+/);
      expect(html, guide.slug).not.toContain('noindex');
    }
  });

  it('every page ends with the questionnaire and the directory, then its sources and the date they were checked', () => {
    for (const { guide, html } of pages) {
      const next = html.indexOf('class="next-steps"');
      expect(next, guide.slug).toBeGreaterThan(-1);
      expect(html.slice(next, html.indexOf('</section>', next)), guide.slug).toMatch(/href="\/".*href="\/directory"/s);
      expect(html.indexOf('class="sources-list"'), guide.slug).toBeGreaterThan(next);
      expect(html, guide.slug).toContain('checked against its official source on 8 November 2026');
    }
  });

  it('every source note points at a source on the page, numbered in reading order', () => {
    for (const { guide, html } of pages) {
      const refs = [...html.matchAll(/href="#source-([a-z0-9-]+)" aria-label="Source (\d+)"/g)];
      expect(refs.length, guide.slug).toBeGreaterThan(0);
      for (const [, id] of refs) expect(html, `${guide.slug} ${id}`).toContain(`id="source-${id}"`);
      const firstSeen = [...new Set(refs.map(([, , n]) => Number(n)))];
      expect(firstSeen, guide.slug).toEqual([...firstSeen].sort((a, b) => a - b));
    }
  });

  it('every page links to the privacy notice', () => {
    for (const { guide, html } of pages) expect(html, guide.slug).toContain('href="/privacy"');
  });

  it('every link within the site lands on a page that exists', () => {
    for (const { guide, html } of [...pages, { guide: { slug: 'index' } as Guide, html: guidesIndex(GUIDES_EN) }]) {
      for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
        if (href.endsWith('.css') || href.endsWith('.svg')) continue;
        expect(known.has(href), `${guide.slug} links to ${href}`).toBe(true);
      }
    }
  });

  it('the free-help guide prints the crisis lines exactly as config/crisis.json has them', () => {
    const html = pages.find((p) => p.guide.slug === 'free-help-now')!.html;
    for (const r of crisis.resources.filter((r) => r.id.startsWith('mieli'))) expect(html).toContain(r.phone);
    expect(html).toContain('Monday and Wednesday 16 to 20; Tuesday, Thursday and Friday 9 to 13');
    // The closed English line is named only as closed.
    expect(pages.find((p) => p.guide.slug === 'therapy-in-finland-in-english')!.html).toMatch(/09 2525 0116.*That line is closed/s);
  });
});

describe('the rules catch what they should', () => {
  const base: Guide = {
    slug: 'test',
    title: 'Test',
    description: 'A test guide.',
    checkedOn: '2026-11-08',
    intro: ['No figures here.'],
    sections: [{ heading: 'One', body: ['A fact [[a]].'] }],
    sources: [{ id: 'a', label: 'A', url: 'https://example.org', checkedOn: '2026-11-08' }],
  };
  const withBody = (body: Guide['sections'][number]['body'], sources = base.sources) => ({ ...base, sections: [{ heading: 'One', body }], sources });

  it('a figure without a source', () => {
    expect(checkGuide(withBody(['It costs 30 euros.', 'A fact [[a]].'])).join()).toMatch(/figure without a source/);
  });
  it('an unknown or uncited source, and a plain-http one', () => {
    expect(checkGuide(withBody(['A fact [[b]].'])).join()).toMatch(/unknown source "b"/);
    expect(checkGuide(withBody(['No source.'])).join()).toMatch(/never cited/);
    expect(checkGuide(withBody(['A fact [[a]].'], [{ ...base.sources[0], url: 'http://example.org' }])).join()).toMatch(/not https/);
  });
  it('an em dash, and a figure in a table row without its source', () => {
    expect(checkGuide(withBody(['A fact — sourced [[a]].'])).join()).toMatch(/em dash/);
    expect(checkGuide(withBody([{ table: { head: ['x', 'y'], rows: [['Item', '57.60 euros']] } }, 'A fact [[a]].'])).join()).toMatch(/figure without a source/);
  });
});
