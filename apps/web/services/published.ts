/**
 * The directory services that have a page of their own, and those pages: the
 * one list scripts/build-services.ts builds and sitemap.xml and llms.txt read,
 * so neither can name a page production does not build.
 *
 * Every directory entry gets a page in each language, except a `fallbackOnly`
 * one: 7 Cups is listed last with its caution and only because nothing Finnish
 * answers in English around the clock, and a page of its own could become
 * someone's first search result for it (Amir, 12.11.2026).
 *
 * Imports carry `.js`, not `.ts`, because the serverless functions load this.
 */
import kela from '../../../config/directory/kela.json' with { type: 'json' };
import privateSector from '../../../config/directory/private.json' with { type: 'json' };
import publicSector from '../../../config/directory/public.json' with { type: 'json' };
import thirdSector from '../../../config/directory/third-sector.json' with { type: 'json' };
import youth from '../../../config/directory/youth.json' with { type: 'json' };
import directoryEn from '../../../config/i18n/directory/en.json' with { type: 'json' };
import directoryFi from '../../../config/i18n/directory/fi.json' with { type: 'json' };
import directorySv from '../../../config/i18n/directory/sv.json' with { type: 'json' };
import { servicePath, type ServiceLang } from './paths.js';

interface Listed {
  id: string;
  nameRef: string;
  fallbackOnly?: boolean;
}

const ALL: Listed[] = [publicSector, kela, thirdSector, youth, privateSector].flatMap((file) => file.entries as Listed[]);

/** The ids with a page, in config order. */
export const SERVICE_IDS: string[] = ALL.filter((e) => !e.fallbackOnly).map((e) => e.id);

const NAMES: Record<ServiceLang, Record<string, unknown>> = { en: directoryEn, fi: directoryFi, sv: directorySv };
const LANGS: ServiceLang[] = ['en', 'fi', 'sv'];

export interface PublishedServicePage {
  lang: ServiceLang;
  id: string;
  path: string;
  /** The service's name as that language's card shows it. */
  title: string;
  /** Pages with the same slot are one service in different languages. */
  slot: string;
}

export function publishedServicePages(): PublishedServicePage[] {
  return LANGS.flatMap((lang) =>
    ALL.filter((e) => !e.fallbackOnly).map((e) => {
      const title = NAMES[lang][e.nameRef];
      if (typeof title !== 'string') throw new Error(`[services] no "${e.nameRef}" in ${lang}`);
      return { lang, id: e.id, path: servicePath(e.id, lang), title, slot: `service-${e.id}` };
    }),
  );
}
