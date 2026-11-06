/**
 * The directory's sitemap (D-39), gated like the pages: written as
 * /sitemap-directory.xml only by an approved production build, and named in
 * robots.txt only once PUBLIC_PAGES_APPROVED is true. A preview gets a copy
 * under /pro-pages/ to look at.
 *
 * The same shape as apps/web/api/sitemap.ts: every language's address, each
 * with its fi/sv/en alternates. x-default is the Finnish page, since the
 * directory is of professionals in Finland.
 */
import { CITIES, cityOf, listed, type Professional } from './data.ts';
import { ORIGIN, cityPath, privacyPath, profilePath, type Lang } from './render.ts';

export const SITEMAP_PATH = '/sitemap-directory.xml';

/** One page in its three languages. */
export type PageGroup = Record<Lang, string>;

const LANGS: Lang[] = ['fi', 'sv', 'en'];
const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function sitemapXml(groups: PageGroup[]): string {
  const entries = groups.flatMap((group) =>
    LANGS.map((lang) =>
      [
        '  <url>',
        `    <loc>${xml(ORIGIN + group[lang])}</loc>`,
        ...LANGS.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xml(ORIGIN + group[alt])}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(ORIGIN + group.fi)}"/>`,
        '  </url>',
      ].join('\n'),
    ),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * A Build Output route that answers 404 for the directory sitemap on any host
 * but mielenreitti.fi, as /api/sitemap does for the main one: previews and the
 * old vercel.app address must not hand a crawler a list of people.
 */
export const sitemapHostRoute = {
  src: `^${SITEMAP_PATH.replace(/\./g, '\\.')}$`,
  missing: [{ type: 'host', value: 'mielenreitti.fi' }],
  status: 404,
};

/**
 * What goes in: the privacy page, every listed professional, and each city page
 * with at least one person of that type on it. An empty city page is built, so
 * an address never breaks, but it is not offered to a search engine.
 */
export function sitemapGroups(rows: Professional[]): PageGroup[] {
  const shown = listed(rows);
  const each = (path: (lang: Lang) => string): PageGroup => ({ fi: path('fi'), sv: path('sv'), en: path('en') });
  const groups: PageGroup[] = [each(privacyPath)];
  for (const row of shown) groups.push(each((lang) => profilePath(lang, row.slug)));
  for (const type of ['psychotherapist', 'psychologist'] as const) {
    for (const city of CITIES) {
      if (shown.some((row) => row.type === type && cityOf(row)?.slug === city.slug)) {
        groups.push(each((lang) => cityPath(lang, type, city.slug)));
      }
    }
  }
  return groups;
}

/**
 * Put the host route first, before Vercel's filesystem handle, so the file is
 * never served off the real domain. Any earlier copy is replaced.
 */
export function withSitemapHostRoute(routes: Record<string, unknown>[]): Record<string, unknown>[] {
  return [sitemapHostRoute, ...routes.filter((route) => route.src !== sitemapHostRoute.src)];
}

