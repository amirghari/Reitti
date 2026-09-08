/**
 * Content lookup, split by ownership rather than by language.
 *
 *   ui/         product copy. Reitti's. Translated normally.
 *   clinical/   instrument wording, bands, rung labels, crisis resources. The
 *               clinician's, and the reason this split exists.
 *   directory/  service names, hours, cost notes.
 *
 * **Never hand-translate an instrument.** A translated screening item measures
 * something different, so `clinical/<lang>.json` carries `_translationStatus` per
 * instrument and the Finnish and Swedish bundles contain no instrument items or
 * response scales at all. An instrument whose official validated translation has
 * not been obtained is not offered in that language, and the app says so —
 * English-only is the honest state, not a gap to paper over.
 *
 * `uiLanguage` and `careLanguage` are independent. Wanting therapy in Finnish
 * while reading the interface in English is an ordinary combination.
 */
import uiEn from '@config/i18n/ui/en.json';
import uiFi from '@config/i18n/ui/fi.json';
import uiSv from '@config/i18n/ui/sv.json';
import clinicalEn from '@config/i18n/clinical/en.json';
import clinicalFi from '@config/i18n/clinical/fi.json';
import clinicalSv from '@config/i18n/clinical/sv.json';
import directoryEn from '@config/i18n/directory/en.json';
import directoryFi from '@config/i18n/directory/fi.json';
import directorySv from '@config/i18n/directory/sv.json';

export type UiLanguage = 'en' | 'fi' | 'sv';
export const AVAILABLE_UI_LANGUAGES: UiLanguage[] = ['fi', 'sv', 'en'];

type Bundle = Record<string, unknown>;

const merge = (...parts: Bundle[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      // `_note`, `_language`, `_translationStatus` are metadata, not copy.
      if (key.startsWith('_')) continue;
      if (typeof value === 'string') out[key] = value;
    }
  }
  return out;
};

const bundles: Record<UiLanguage, Record<string, string>> = {
  en: merge(uiEn, clinicalEn, directoryEn),
  fi: merge(uiFi, clinicalFi, directoryFi),
  sv: merge(uiSv, clinicalSv, directorySv),
};

const translationStatus: Record<UiLanguage, Record<string, string>> = {
  en: (clinicalEn as Bundle)._translationStatus as Record<string, string>,
  fi: (clinicalFi as Bundle)._translationStatus as Record<string, string>,
  sv: (clinicalSv as Bundle)._translationStatus as Record<string, string>,
};

/**
 * The interface language. Module-level rather than a React context because every
 * `t()` call site would otherwise need threading, and the language changes about
 * once per session.
 */
let current: UiLanguage = 'en';

export const uiLanguage = (): UiLanguage => current;

export function setUiLanguage(language: UiLanguage): void {
  current = language;
}

export function t(ref: string, language: UiLanguage = current): string {
  const value = bundles[language]?.[ref];
  if (value !== undefined) return value;

  if (import.meta.env.DEV) {
    console.warn(`[i18n] unresolved ref "${ref}" in "${language}"`);
  }

  // No silent English fallback. A Finnish screen quietly rendering English is a
  // bug that looks like a translation, and it is exactly what invariant 17
  // exists to catch — so an unresolved ref returns the ref and stays visible.
  return ref;
}

/**
 * Is this instrument's OFFICIAL validated translation available in this language?
 * Instruments are only ever offered where it is.
 */
export function hasOfficialTranslation(instrumentId: string, language: UiLanguage = current): boolean {
  return translationStatus[language]?.[instrumentId] === 'official';
}

/** The languages an instrument may honestly be presented in. */
export function languagesFor(instrumentId: string): UiLanguage[] {
  return AVAILABLE_UI_LANGUAGES.filter((l) => hasOfficialTranslation(instrumentId, l));
}
