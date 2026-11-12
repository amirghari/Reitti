/**
 * Where each directory service's own page lives: under its language's
 * directory address (src/addresses.ts), by the entry's id. No imports, so the
 * sitemap.xml and llms.txt functions can read it (same reason as guides/paths.ts);
 * a test holds the three folders to the directory's addresses.
 */
export type ServiceLang = 'en' | 'fi' | 'sv';

const INDEX_PATH: Record<ServiceLang, string> = { en: '/directory', fi: '/fi/palvelut', sv: '/sv/tjanster' };
export const servicesIndexPath = (lang: ServiceLang = 'en') => INDEX_PATH[lang];
export const servicePath = (id: string, lang: ServiceLang = 'en') => `${INDEX_PATH[lang]}/${id}`;
