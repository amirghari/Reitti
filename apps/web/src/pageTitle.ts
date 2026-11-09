/**
 * The page title per screen and language (SEO step 0, Amir 9.11.2026). One
 * function for the browser (App sets document.title) and the build-time
 * pre-render, so the two cannot disagree.
 */
import { t, type UiLanguage } from './i18n';

const SCREEN_TITLE_KEY: Record<string, string> = {
  why: 'home.whyBuilt',
  directory: 'directory.page.title',
  privacy: 'privacy.title',
  about: 'about.title',
  'how-it-works': 'howItWorks.navLabel',
};

export function titleFor(screen: string, language: UiLanguage): string {
  const key = SCREEN_TITLE_KEY[screen];
  if (!key) return t('meta.title', language);
  const name = t('app.name', language);
  const page = t(key, language);
  // "About Mielenreitti" already says whose page it is.
  return page.includes(name) ? page : `${page} – ${name}`;
}
