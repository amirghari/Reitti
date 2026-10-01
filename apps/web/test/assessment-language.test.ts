/**
 * The assessment runs in a language only when every instrument the funnel can
 * reach is officially translated into it (D-35). A partly translated funnel
 * would show untranslated keys halfway through, to the person who named grief
 * or loneliness.
 */
import { describe, expect, it } from 'vitest';
import { assessmentOfferedIn, missingTranslations, reachableInstruments } from '../src/assessmentLanguage';
import { hasOfficialTranslation } from '../src/i18n';

describe('which languages the assessment is offered in', () => {
  it('covers the whole reachable funnel, not only the entry screener', () => {
    expect(reachableInstruments().length).toBeGreaterThan(1);
  });

  it('offers a language exactly when every reachable instrument is official in it', () => {
    for (const language of ['en', 'fi', 'sv'] as const) {
      const all = reachableInstruments().every((id) => hasOfficialTranslation(id, language));
      expect(assessmentOfferedIn(language), language).toBe(all);
    }
  });

  it('is offered in English', () => {
    expect(assessmentOfferedIn('en')).toBe(true);
  });

  it('is not yet offered in Finnish or Swedish, and names what is missing', () => {
    // PHQ-4, PHQ-9, GAD-7, WHO-5 and AUDIT-C are official in both since
    // D-35. PC-PTSD-5 and UCLA-3 have no official Finnish or Swedish version.
    for (const language of ['fi', 'sv'] as const) {
      expect(assessmentOfferedIn(language)).toBe(false);
      expect(missingTranslations(language).sort()).toEqual(['pc-ptsd-5', 'ucla-3']);
    }
  });
});
