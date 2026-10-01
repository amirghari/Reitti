/**
 * Which instruments, and whether the assessment at all, a language is offered.
 *
 * A validated instrument is offered only in a language whose OFFICIAL
 * translation we hold (invariant 18). Per screener, not all or nothing (D-36):
 * in a language, the funnel puts a screener to the person only when it is
 * official there. A branch whose screener is not official skips it, and the
 * person goes on to the rungs that fit, with one line saying no questionnaire
 * is offered for this in their language.
 *
 * Two things are not per branch. The assessment runs in a language only when
 * its entry screener is official there, because without it there is no
 * assessment to run. And every screener that carries a crisis item must be
 * official too: the crisis path is identical in every language, and a skipped
 * PHQ-9 would be a skipped self-harm question.
 */
import { deeperScreeners } from '@reitti/engine';
import { flow, instrumentById } from './config';
import { hasOfficialTranslation, type UiLanguage } from './i18n';

/** The entry screener and everything the funnel can open after it. */
export const reachableInstruments = (): string[] => [
  flow.entry,
  ...deeperScreeners(flow, instrumentById(flow.entry)).map((s) => s.instrumentId),
];

/** May this screener be put to somebody reading in this language? */
export const instrumentOfferedIn = (instrumentId: string, language: UiLanguage): boolean =>
  hasOfficialTranslation(instrumentId, language);

/** The reachable screeners a reader in this language will not be asked. */
export const missingTranslations = (language: UiLanguage): string[] =>
  reachableInstruments().filter((id) => !instrumentOfferedIn(id, language));

/** Screeners whose answers can open the crisis path. These never degrade. */
export const crisisBearing = (): string[] => reachableInstruments().filter((id) => Boolean(instrumentById(id).crisisItem));

export const assessmentOfferedIn = (language: UiLanguage): boolean =>
  instrumentOfferedIn(flow.entry, language) && crisisBearing().every((id) => instrumentOfferedIn(id, language));
