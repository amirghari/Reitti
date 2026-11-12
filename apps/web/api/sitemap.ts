/**
 * `GET /sitemap.xml`, on mielenreitti.fi only. Every other host gets a 404,
 * for the reason robots.ts gives: previews and the old vercel.app address serve
 * the same app and must stay out of the index.
 *
 * Every page at its one address per language (D-44, apps/web/src/addresses.ts),
 * each with its alternates in the other two and "/"'s English page as
 * x-default. "How Mielenreitti decides" opens from `?page=how-it-decides` on each
 * language's home. The old `?lang=` addresses redirect and are not listed.
 *
 * The guides follow: each published language's index and guides
 * (guides/published.ts), so an unpublished draft is never listed. A guide's
 * alternates are its published translations only; with one language public,
 * a guide has none.
 *
 * Then a page per directory service (services/published.ts), each with its
 * other two languages and the English address as x-default. 7 Cups has none.
 *
 * No `lastmod`. We would have to invent it.
 */
import { GUIDES_PUBLISHED } from '../guides/index.js';
import type { GuideLang } from '../guides/paths.js';
import { publishedGuidePages } from '../guides/published.js';
import { publishedServicePages } from '../services/published.js';
import { ADDRESSES, LANGUAGES, addressFor, type AddressedScreen } from '../src/addresses.js';
import { answerOnProductionOnly, type NodeRequest, type NodeResponse } from './robots.js';

const ORIGIN = 'https://mielenreitti.fi';

/** The views worth a URL: a screen, and the query that opens it, if any. */
const VIEWS: { screen: AddressedScreen; query: string }[] = [
  { screen: 'home', query: '' },
  { screen: 'home', query: 'page=how-it-decides' },
  ...(Object.keys(ADDRESSES) as AddressedScreen[]).filter((s) => s !== 'home').map((screen) => ({ screen, query: '' })),
];

const url = (screen: AddressedScreen, query: string, language: (typeof LANGUAGES)[number]): string =>
  `${ORIGIN}${addressFor(screen, language)}${query ? `?${query}` : ''}`;

const xml = (value: string) => value.replace(/&/g, '&amp;');

function guideEntries(published: Record<GuideLang, boolean>): string[] {
  const pages = publishedGuidePages(published);
  return pages.map((page) => {
    const translations = pages.filter((p) => p.slot === page.slot);
    const english = translations.find((p) => p.lang === 'en');
    const alternates =
      translations.length > 1
        ? [
            ...translations.map((p) => `    <xhtml:link rel="alternate" hreflang="${p.lang}" href="${xml(ORIGIN + p.path)}"/>`),
            ...(english ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(ORIGIN + english.path)}"/>`] : []),
          ]
        : [];
    return ['  <url>', `    <loc>${xml(ORIGIN + page.path)}</loc>`, ...alternates, '  </url>'].join('\n');
  });
}

function serviceEntries(): string[] {
  const pages = publishedServicePages();
  return pages.map((page) => {
    const translations = pages.filter((p) => p.slot === page.slot);
    const english = translations.find((p) => p.lang === 'en')!;
    return [
      '  <url>',
      `    <loc>${xml(ORIGIN + page.path)}</loc>`,
      ...translations.map((p) => `    <xhtml:link rel="alternate" hreflang="${p.lang}" href="${xml(ORIGIN + p.path)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(ORIGIN + english.path)}"/>`,
      '  </url>',
    ].join('\n');
  });
}

export function sitemap(published: Record<GuideLang, boolean> = GUIDES_PUBLISHED): string {
  const entries = VIEWS.flatMap(({ screen, query }) =>
    LANGUAGES.map((language) => {
      const alternates = [
        ...LANGUAGES.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xml(url(screen, query, alt))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(url(screen, query, 'en'))}"/>`,
      ];
      return ['  <url>', `    <loc>${xml(url(screen, query, language))}</loc>`, ...alternates, '  </url>'].join('\n');
    }),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    ...guideEntries(published),
    ...serviceEntries(),
    '</urlset>',
    '',
  ].join('\n');
}

export default function handler(req: NodeRequest, res: NodeResponse): void {
  answerOnProductionOnly(req, res, 'application/xml; charset=utf-8', () => sitemap());
}
