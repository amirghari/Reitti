/**
 * Amir's decision of 18.11.2026: Interventionavigaattori's card lists Finnish,
 * Swedish and English, from its own site's language menu read by hand on
 * 17.11.2026, with that date as the check date, in all three interface
 * languages. The 13–19 age range is recorded with its source, Terapiat
 * etulinjaan, because the service's own site does not state it on screen.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { languageMismatch, speaks, type DirectoryEntry } from '@reitti/engine';
import { servicePage } from '../services/render';
import { matchesFilters } from '../src/components/Directory';
import { OptionCard } from '../src/components/Options';
import { directory } from '../src/config';
import { setUiLanguage, t } from '../src/i18n';

const all = directory as DirectoryEntry[];
const nav = all.find((e) => e.id === 'interventionavigaattori')!;
const LANGS = ['en', 'fi', 'sv'] as const;
const card = (ui: (typeof LANGS)[number]) => {
  setUiLanguage(ui);
  return renderToStaticMarkup(createElement('ul', null, createElement(OptionCard, { entry: nav, careLanguage: ui })));
};
afterEach(() => setUiLanguage('en'));

describe('Interventionavigaattori: languages stated, from its own site', () => {
  it('states fi, sv and en, with no "check the site" fallback, checked 17.11.2026 at its own site', () => {
    expect(nav.languagesRef).toBeUndefined();
    expect(nav.languages).toEqual(['fi', 'sv', 'en']);
    expect(nav.verifiedOn).toBe('2026-11-17');
    expect(nav.url).toBe('https://www.interventionavigaattori.fi/');
    expect(nav.note).toContain('Suomeksi, På svenska and In English');
  });

  it('every interface language shows the three languages and the check date, never the fallback or a mismatch', () => {
    for (const ui of LANGS) {
      const c = card(ui);
      for (const l of ['fi', 'sv', 'en']) expect(c, `${ui} ${l}`).toContain(`>${t(`directory.language.${l}`, ui)}<`);
      expect(c, ui).not.toContain(t('directory.languages.checkSite', ui));
      expect(c, ui).not.toContain(t('directory.languageMismatch', ui));
      expect(c, ui).toContain(`${t('directory.verifiedOn', ui)} <time dateTime="2026-11-17">`);
      const page = servicePage(nav, ui);
      expect(page, ui).not.toContain(t('directory.languages.checkSite', ui));
      expect(page, ui).toContain('2026-11-17');
    }
  });

  it('speaks each of the three, so a language filter keeps it and ordering never demotes it', () => {
    for (const l of ['fi', 'sv', 'en']) {
      expect(speaks(nav, l), l).toBe(true);
      expect(languageMismatch(nav, l), l).toBe(false);
      expect(matchesFilters(nav, [l], []), l).toBe(true);
    }
  });
});

describe('Interventionavigaattori: where the age range comes from', () => {
  it('13–19, sourced to Terapiat etulinjaan with its address, date and words', () => {
    expect(nav.ageRange).toEqual({ min: 13, max: 19 });
    expect(nav.ageRangeSource).toEqual({
      url: 'https://terapiatetulinjaan.fi/lapset-ja-nuoret/nuorten-interventionavigaattori/',
      readOn: '2026-11-18',
      quote: 'suunnattu 13–19-vuotiaille nuorille',
    });
  });

  it('no other entry carries an age-range source yet', () => {
    expect(all.filter((e) => e.ageRangeSource).map((e) => e.id)).toEqual(['interventionavigaattori']);
  });
});
