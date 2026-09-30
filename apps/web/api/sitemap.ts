/**
 * `GET /sitemap.xml`, on mielenreitti.fi only. Every other host gets a 404,
 * for the reason robots.ts gives: previews and the old vercel.app address serve
 * the same app and must stay out of the index.
 *
 * The site has two paths, "/" and "/why", and one view addressed by query. The page reads `?lang=` so
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

/** The views worth a URL: the path, and the query each one is reached by. */
const VIEWS = [
  { path: '/', query: '' },
  { path: '/', query: 'page=how-it-decides' },
  { path: '/why', query: '' },
];

const url = (path: string, query: string, language?: string): string => {
  const params = [query, language ? `lang=${language}` : ''].filter(Boolean).join('&');
  return `${ORIGIN}${path}${params ? `?${params}` : ''}`;
};

const xml = (value: string) => value.replace(/&/g, '&amp;');

export function sitemap(): string {
  const entries = VIEWS.flatMap(({ path, query }) =>
    LANGUAGES.map((language) => {
      const alternates = [
        ...LANGUAGES.map(
          (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xml(url(path, query, alt))}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(url(path, query))}"/>`,
      ];
      return ['  <url>', `    <loc>${xml(url(path, query, language))}</loc>`, ...alternates, '  </url>'].join('\n');
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
