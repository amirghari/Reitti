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
    // The guides are listed in the same order in every language (guides/index.ts).
    ...GUIDES[lang].map((g, i) => ({ lang, path: guidePath(g.slug, lang), title: g.title, slot: `guide-${i}` })),
  ]);
}
