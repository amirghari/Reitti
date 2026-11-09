/**
 * One address per screen per language (D-44, Amir 9.11.2026). Replaces the
 * `?lang=` copies of D-31: each language has its own path, `?lang=` redirects
 * there permanently, and "/" is the x-default in hreflang.
 *
 * No imports and no `window`: the app, the build-time pre-render, the sitemap
 * function, the guides and the directory pages all read this one table, so
 * they cannot disagree about where a page lives.
 */
export type Lang = 'en' | 'fi' | 'sv';
export const LANGUAGES: Lang[] = ['en', 'fi', 'sv'];

export type AddressedScreen = 'home' | 'why' | 'directory' | 'privacy' | 'about';

export const ADDRESSES: Record<AddressedScreen, Record<Lang, string>> = {
  home: { en: '/', fi: '/fi', sv: '/sv' },
  why: { en: '/why', fi: '/fi/miksi', sv: '/sv/varfor' },
  directory: { en: '/directory', fi: '/fi/palvelut', sv: '/sv/tjanster' },
  privacy: { en: '/privacy', fi: '/fi/tietosuoja', sv: '/sv/dataskydd' },
  about: { en: '/about', fi: '/fi/tietoa', sv: '/sv/om' },
};

export const isAddressed = (screen: string): screen is AddressedScreen => screen in ADDRESSES;

export const addressFor = (screen: AddressedScreen, lang: Lang): string => ADDRESSES[screen][lang];

const trim = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

/** The screen and language an address names, or null if it is not one of ours. */
export function parseAddress(pathname: string): { screen: AddressedScreen; lang: Lang } | null {
  const path = trim(pathname);
  for (const screen of Object.keys(ADDRESSES) as AddressedScreen[]) {
    for (const lang of LANGUAGES) if (ADDRESSES[screen][lang] === path) return { screen, lang };
  }
  return null;
}

/**
 * The same link in another language: "/why" becomes "/fi/miksi", and
 * "/directory?entry=x" becomes "/fi/palvelut?entry=x". Any `lang` parameter is
 * dropped, since the path now says it. A path that is not ours is returned as it is.
 */
export function localize(href: string, lang: Lang): string {
  const [path, query = ''] = href.split('?');
  const found = parseAddress(path);
  const params = new URLSearchParams(query);
  params.delete('lang');
  const rest = params.toString();
  const target = found ? addressFor(found.screen, lang) : path;
  return rest ? `${target}?${rest}` : target;
}
