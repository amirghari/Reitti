/**
 * Which interface languages the assessment may run in.
 *
 * A validated instrument is offered only in a language whose OFFICIAL
 * translation we hold (invariant 18). That used to be checked on the entry
 * screener alone. But the funnel can open a deeper screener after it, by
 * branch, by the domain a person names, or by severity, and a language with an
 * official PHQ-4 but no official PC-PTSD-5 would walk somebody who chose
 * "grief" into a screen of untranslated keys halfway through. So the whole
 * reachable funnel has to be official, or the language gets the honest
 * English-only notice instead (D-35).
 */
import { deeperScreeners } from '@reitti/engine';
import { flow, instrumentById } from './config';
import { hasOfficialTranslation, type UiLanguage } from './i18n';

/** The entry screener and everything the funnel can open after it. */
export const reachableInstruments = (): string[] => [
  flow.entry,
  ...deeperScreeners(flow, instrumentById(flow.entry)).map((s) => s.instrumentId),
];

/** The reachable instruments with no official translation in this language. */
export const missingTranslations = (language: UiLanguage): string[] =>
  reachableInstruments().filter((id) => !hasOfficialTranslation(id, language));

export const assessmentOfferedIn = (language: UiLanguage): boolean => missingTranslations(language).length === 0;
