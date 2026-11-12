/**
 * The guide pages that are public: the one list sitemap.xml and llms.txt read,
 * so neither can name a page production does not build. A language joins it
 * when `GUIDES_PUBLISHED` says so (the reviewer's sign-off, guides/index.ts),
 * and the same flag decides what scripts/build-guides.ts builds.
 *
 * Imports carry `.js`, not `.ts`, because the serverless functions load this.
 */
import { GUIDES, GUIDES_PUBLISHED } from './index.js';
import { guidePath, guidesIndexPath, type GuideLang } from './paths.js';

export interface PublishedGuidePage {
  lang: GuideLang;
  path: string;
  /** The guide's own title; absent for a language's guides index. */
  title?: string;
  /** Pages in different languages with the same slot are translations of each other. */
  slot: string;
}

const LANGS: GuideLang[] = ['en', 'fi', 'sv'];

export function publishedGuidePages(published: Record<GuideLang, boolean> = GUIDES_PUBLISHED): PublishedGuidePage[] {
  return LANGS.filter((lang) => published[lang] && GUIDES[lang].length).flatMap((lang) => [
    { lang, path: guidesIndexPath(lang), slot: 'index' },
    // A translation shares its English guide's slot by name (`translationOf`). The lists are
    // also kept in the same order, so each language's index reads alike; a test holds both.
    ...GUIDES[lang].map((g) => ({ lang, path: guidePath(g.slug, lang), title: g.title, slot: `guide-${g.translationOf ?? g.slug}` })),
  ]);
}
