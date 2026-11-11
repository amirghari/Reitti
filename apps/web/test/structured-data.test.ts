/**
 * Structured data (search visibility plan item 6, Amir 11.11.2026): Organization
 * and WebSite on /, /fi and /sv; Article on each guide; no FAQ markup; and no
 * "reviewed by" without the clinician's written consent.
 */
import { describe, expect, it } from 'vitest';
import { ORIGIN as FRAME_ORIGIN } from '../pages/frame';
import { GUIDES } from '../guides/index';
import { guidePage, guidePath, guidesIndex } from '../guides/render';
import { PAGES, structuredData } from '../src/entry-server';
import {
  CLINICAL_REVIEW,
  ORIGIN,
  guideJsonLd,
  helsinkiDay,
  jsonLdScript,
  reviewFields,
  type ArticleInput,
  type ClinicalReview,
} from '../src/structuredData';

type Node = Record<string, any>;

/** Every JSON-LD block in a page, parsed, flattened to its nodes. */
function nodesIn(html: string): Node[] {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  return blocks.flatMap((b) => (b['@graph'] ?? [b]) as Node[]);
}
const ofType = (nodes: Node[], type: string) => nodes.filter((n) => n['@type'] === type);
const LANGS = ['en', 'fi', 'sv'] as const;
const allGuidePages = () => LANGS.flatMap((l) => GUIDES[l].map((g) => guidePage(g)));

const REVIEW: ClinicalReview = { name: 'A. Example', jobTitle: 'Psychologist', reviewedOn: '2026-11-25' };
const INPUT: ArticleInput = { lang: 'en', path: '/en/guides/free-help-now', headline: 'h', description: 'd', checkedOn: '2026-11-11', sources: [] };

describe('Organization and WebSite on the three home pages', () => {
  it('on /, /fi and /sv, and on no other pre-rendered screen', () => {
    expect(PAGES.filter((p) => p.screen === 'home').map((p) => p.path)).toEqual(['/', '/fi', '/sv']);
    for (const p of PAGES) {
      if (p.screen === 'home') expect(structuredData(p.screen), p.path).toContain('application/ld+json');
      else expect(structuredData(p.screen), p.path).toBe('');
    }
  });

  it('names the site as it names itself, at its real address', () => {
    const nodes = nodesIn(structuredData('home'));
    const [org] = ofType(nodes, 'Organization');
    const [site] = ofType(nodes, 'WebSite');
    expect(org).toMatchObject({ name: 'Mielenreitti', url: 'https://mielenreitti.fi/', logo: 'https://mielenreitti.fi/apple-touch-icon.png' });
    expect(site).toMatchObject({ name: 'Mielenreitti', url: 'https://mielenreitti.fi/', publisher: { '@id': org['@id'] } });
    expect(site.inLanguage).toEqual(['en', 'fi', 'sv']);
    expect(ORIGIN).toBe(FRAME_ORIGIN);
  });
});

describe('Article on each guide', () => {
  it('on every guide, in every language, saying what the page says', () => {
    for (const lang of LANGS) {
      for (const guide of GUIDES[lang]) {
        const where = `${lang}/${guide.slug}`;
        const nodes = nodesIn(guidePage(guide));
        const [article] = ofType(nodes, 'Article');
        expect(article, where).toBeDefined();
        expect(article.headline, where).toBe(guide.title);
        expect(article.description, where).toBe(guide.description);
        expect(article.inLanguage, where).toBe(lang);
        expect(article.url, where).toBe(`https://mielenreitti.fi${guidePath(guide.slug, lang)}`);
        expect(article.dateModified, where).toBe(helsinkiDay(guide.checkedOn));
        expect(article.dateModified.startsWith(`${guide.checkedOn}T00:00:00+0`), where).toBe(true);
        expect(article.author, where).toMatchObject({ '@type': 'Organization', name: 'Mielenreitti' });
        expect(article.citation.map((c: Node) => c.url), where).toEqual(guide.sources.map((s) => s.url));
        expect(article.citation.map((c: Node) => c.name), where).toEqual(guide.sources.map((s) => s.label));
        // Free to read is not paywall markup: Google reads isAccessibleForFree as that.
        expect(article, where).not.toHaveProperty('isAccessibleForFree');
        const [page] = ofType(nodes, 'WebPage');
        expect(page.mainEntity['@id'], where).toBe(article['@id']);
      }
    }
  });

  it('gives the checked day in Helsinki time, with summer time', () => {
    expect(helsinkiDay('2026-11-08')).toBe('2026-11-08T00:00:00+02:00');
    expect(helsinkiDay('2026-07-01')).toBe('2026-07-01T00:00:00+03:00');
    // 2026: summer time from Sunday 29 March to Sunday 25 October.
    expect(helsinkiDay('2026-03-28')).toBe('2026-03-28T00:00:00+02:00');
    expect(helsinkiDay('2026-03-29')).toBe('2026-03-29T00:00:00+03:00');
    expect(helsinkiDay('2026-10-24')).toBe('2026-10-24T00:00:00+03:00');
    expect(helsinkiDay('2026-10-25')).toBe('2026-10-25T00:00:00+02:00');
    expect(() => helsinkiDay('11.11.2026')).toThrow();
  });

  it('not on the guides index, which is a list rather than an article', () => {
    expect(ofType(nodesIn(guidesIndex(GUIDES.en)), 'Article')).toHaveLength(0);
  });

  it('no string can close the script early', () => {
    const input = { ...INPUT, headline: 'a </script><script>alert(1)</script>' };
    const tag = jsonLdScript(guideJsonLd(input));
    expect(tag.match(/<\/script>/g)).toHaveLength(1);
    expect(ofType(nodesIn(tag), 'Article')[0].headline).toBe(input.headline);
  });
});

describe('no FAQ markup (Amir, 11.11.2026)', () => {
  it('on no home page and no guide', () => {
    for (const html of [structuredData('home'), ...allGuidePages()]) {
      expect(html).not.toContain('FAQPage');
      expect(html).not.toContain('"Question"');
    }
  });
});

describe('"reviewed by" never appears without written consent', () => {
  it('nobody is named today', () => {
    expect(CLINICAL_REVIEW).toBeNull();
    for (const html of [structuredData('home'), guidesIndex(GUIDES.en), ...allGuidePages()]) {
      expect(html).not.toContain('reviewedBy');
      expect(html).not.toContain('lastReviewed');
    }
  });

  it('a review with no consent, or consent without a date or a record of where it is kept, publishes nothing', () => {
    const withouts: (ClinicalReview | null)[] = [
      null,
      REVIEW,
      { ...REVIEW, writtenConsent: { receivedOn: '', keptIn: 'company-ops/consents/x.pdf' } },
      { ...REVIEW, writtenConsent: { receivedOn: 'soon', keptIn: 'company-ops/consents/x.pdf' } },
      { ...REVIEW, writtenConsent: { receivedOn: '2026-11-26', keptIn: '  ' } },
    ];
    for (const review of withouts) {
      expect(reviewFields(review)).toEqual({});
      const text = JSON.stringify(guideJsonLd(INPUT, review));
      expect(text).not.toContain('reviewedBy');
      expect(text).not.toContain(REVIEW.name);
    }
  });

  it('with written consent on record, the reviewer is named on the page node', () => {
    const consented: ClinicalReview = { ...REVIEW, writtenConsent: { receivedOn: '2026-11-26', keptIn: 'company-ops/consents/x.pdf' } };
    const [page] = ofType(nodesIn(jsonLdScript(guideJsonLd(INPUT, consented))), 'WebPage');
    expect(page.reviewedBy).toEqual({ '@type': 'Person', name: 'A. Example', jobTitle: 'Psychologist' });
    expect(page.lastReviewed).toBe('2026-11-25');
    // Where the consent is kept is for us, not for the page.
    expect(JSON.stringify(page)).not.toContain('company-ops');
  });
});
