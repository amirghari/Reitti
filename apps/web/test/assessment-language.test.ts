/**
 * Which screeners, and whether the assessment at all, each language offers
 * (D-36, replacing D-35's all-or-nothing gate).
 *
 * Per screener: in a language, a screener is put to a person only when it is
 * official there. The assessment runs in a language when its entry screener and
 * every crisis-bearing screener are official there, because the crisis path
 * must be identical in every language.
 */
import { describe, expect, it } from 'vitest';
import { instrumentById } from '../src/config';
import {
  assessmentOfferedIn,
  crisisBearing,
  instrumentOfferedIn,
  missingTranslations,
  reachableInstruments,
} from '../src/assessmentLanguage';
import { AVAILABLE_UI_LANGUAGES, hasOfficialTranslation } from '../src/i18n';

describe('per-screener language gate', () => {
  it('offers a screener exactly when it is official in that language', () => {
    for (const language of AVAILABLE_UI_LANGUAGES) {
      for (const id of reachableInstruments()) {
        expect(instrumentOfferedIn(id, language), `${id} in ${language}`).toBe(hasOfficialTranslation(id, language));
      }
    }
  });

  it('runs the assessment in every interface language today', () => {
    for (const language of AVAILABLE_UI_LANGUAGES) expect(assessmentOfferedIn(language), language).toBe(true);
  });

  it('holds the crisis path identical in every language: every crisis-bearing screener is official everywhere', () => {
    // PHQ-9 carries the self-harm item. A language where it was skipped would
    // be a language where that question is never asked.
    expect(crisisBearing().length).toBeGreaterThan(0);
    for (const id of crisisBearing()) {
      expect(instrumentById(id).crisisItem).toBeTruthy();
      for (const language of AVAILABLE_UI_LANGUAGES) {
        expect(instrumentOfferedIn(id, language), `${id} must be official in ${language}`).toBe(true);
      }
    }
  });

  it('names what a Finnish or Swedish reader is not asked: PC-PTSD-5 and UCLA-3, which have no official versions', () => {
    expect(missingTranslations('en')).toEqual([]);
    for (const language of ['fi', 'sv'] as const) {
      expect(missingTranslations(language).sort()).toEqual(['pc-ptsd-5', 'ucla-3']);
    }
  });
});
