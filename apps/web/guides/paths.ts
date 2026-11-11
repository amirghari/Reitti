/**
 * Where the guides live, per language. No imports, so the sitemap.xml and
 * llms.txt functions can read it (same reason as pages/gate.ts).
 */
export type GuideLang = 'en' | 'fi' | 'sv';

const INDEX_PATH: Record<GuideLang, string> = { en: '/en/guides', fi: '/fi/oppaat', sv: '/sv/guider' };
export const guidesIndexPath = (lang: GuideLang = 'en') => INDEX_PATH[lang];
export const guidePath = (slug: string, lang: GuideLang = 'en') => `${guidesIndexPath(lang)}/${slug}`;
