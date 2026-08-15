/**
 * Content lookup.
 *
 * English only for now, deliberately. Every Type-1/2 instrument must use its
 * OFFICIAL validated Finnish and Swedish translation — a hand translation of a
 * screening item changes what it measures. `config/i18n/fi.json` and `sv.json`
 * stay absent until those official translations are obtained.
 */
import en from '@config/i18n/en.json';

const bundles: Record<string, Record<string, string>> = { en: en as Record<string, string> };

export type UiLanguage = 'en';
export const AVAILABLE_UI_LANGUAGES: UiLanguage[] = ['en'];

export function t(ref: string, language: UiLanguage = 'en'): string {
  const value = bundles[language]?.[ref];
  if (value === undefined) {
    // Loud in dev, harmless in production: a missing ref is a config bug, not a crash.
    if (import.meta.env.DEV) console.warn(`[i18n] unresolved ref: ${ref}`);
    return ref;
  }
  return value;
}
