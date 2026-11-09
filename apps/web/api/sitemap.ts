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
 * No `lastmod`. We would have to invent it.
 */
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

export function sitemap(): string {
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
    '</urlset>',
    '',
  ].join('\n');
}

export default function handler(req: NodeRequest, res: NodeResponse): void {
  answerOnProductionOnly(req, res, 'application/xml; charset=utf-8', sitemap);
}
