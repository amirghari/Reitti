/**
 * `GET /sitemap.xml`, on mielenreitti.fi only. Every other host gets a 404,
 * for the reason robots.ts gives: previews and the old vercel.app address serve
 * the same app and must stay out of the index.
 *
 * The site has one page and one addressable view. The page reads `?lang=` so
 * each interface language has a real URL of its own, which is what makes the
 * hreflang alternates below true rather than decorative: before that, every
 * language lived at `/` and an alternate would have pointed at nothing.
 * "How Mielenreitti decides" opens from `?page=how-it-decides`.
 *
 * No `lastmod`. We would have to invent it.
 */
import { answerOnProductionOnly, type NodeRequest, type NodeResponse } from './robots.js';

const ORIGIN = 'https://mielenreitti.fi';
const LANGUAGES = ['en', 'fi', 'sv'] as const;

/** The views worth a URL, as the query each one is reached by. */
const VIEWS = [{ query: '' }, { query: 'page=how-it-decides' }];

const url = (query: string, language?: string): string => {
  const params = [query, language ? `lang=${language}` : ''].filter(Boolean).join('&');
  return `${ORIGIN}/${params ? `?${params}` : ''}`;
};

const xml = (value: string) => value.replace(/&/g, '&amp;');

export function sitemap(): string {
  const entries = VIEWS.flatMap(({ query }) =>
    LANGUAGES.map((language) => {
      const alternates = [
        ...LANGUAGES.map(
          (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xml(url(query, alt))}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(url(query))}"/>`,
      ];
      return ['  <url>', `    <loc>${xml(url(query, language))}</loc>`, ...alternates, '  </url>'].join('\n');
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
