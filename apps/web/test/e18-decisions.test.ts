/**
 * Amir's E18 decisions of 12.11.2026 (docs/open-items.md), held where they show:
 * the crisis panel's 112 entry, and the directory cards and service pages.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import type { DirectoryEntry } from '@reitti/engine';
import { servicePage } from '../services/render';
import { matchesFilters } from '../src/components/Directory';
import { OptionCard } from '../src/components/Options';
import { directory } from '../src/config';
import { setUiLanguage, t } from '../src/i18n';

const byId = (id: string) => (directory as DirectoryEntry[]).find((e) => e.id === id)!;
const card = (entry: DirectoryEntry, lang: 'en' | 'fi' | 'sv') => {
  setUiLanguage(lang);
  return renderToStaticMarkup(createElement('ul', null, createElement(OptionCard, { entry, careLanguage: lang })));
};
afterEach(() => setUiLanguage('en'));

describe('1. 112: a source that states the hours the panel prints, and nothing on screen changes', () => {
  const r = crisis.resources.find((x) => x.id === 'emergency')!;

  it('the source is the agency page that says 24/7, read 12.11.2026', () => {
    expect(r.sourceUrl).toBe('https://112.fi/ekasikirja-hatakeskuspaivystajan-tyopaiva');
    expect(r.sourceReadOn).toBe('2026-11-12');
    expect(r.verifyNote).toContain("'Hätäkeskukset palvelet vuoden ympäri 24/7'");
  });

  it('everything the panel shows is as it was: number, name, languages, 24/7, no hours array', () => {
    expect(r.phone).toBe('112');
    expect(r.nameRef).toBe('crisis.emergency.name');
    expect(r.languages).toEqual(['fi', 'sv', 'en']);
    expect(r.availability).toBe('24/7');
    expect('hours' in r).toBe(false);
    expect(r.verified).toBe(true);
  });
});

describe('2–4, 6: the cards say what Amir decided', () => {
  it('Ärligt talat: a professional or a trained volunteer, and the cost note says who answers on Monday evenings', () => {
    const e = byId('arligt-talat');
    expect(e.whoAnswers).toBe('mixed');
    const html = card(e, 'sv');
    expect(html).toContain(t('directory.whoAnswers.mixed', 'sv'));
    expect(t(e.costNoteRef!, 'en')).toContain("on Monday evenings, Victim Support Finland's trained volunteers answer too");
  });

  it('FinFami Uusimaa: both, anonymous counselling and sign-up for groups, on the card and its page', () => {
    const e = byId('finfami-uusimaa');
    expect(e.anonymityRef).toBe('directory.finfami-uusimaa.anonymity');
    for (const lang of ['en', 'fi', 'sv'] as const) {
      const both = t(e.anonymityRef!, lang);
      expect(card(e, lang)).toContain(both);
      expect(card(e, lang)).not.toContain(t(`directory.anonymity.${e.anonymity}`, lang));
      expect(servicePage(e, lang)).toContain(both);
    }
    expect(t(e.anonymityRef!, 'en')).toBe('Counselling can be anonymous; most groups ask you to sign up first');
  });

  it("Nyyti's groups: no Swedish for now", () => {
    expect(byId('nyyti-groups').languages).toEqual(['fi', 'en']);
  });

  it("Nyyti's two trilingual resources keep their English links, labelled English for a Finnish or Swedish reader", () => {
    for (const id of ['nyyti-mind-matters', 'nyyti-mental-health-info']) {
      const e = byId(id);
      expect(e.url).toMatch(/^https:\/\/www\.nyyti\.fi\/en\//);
      expect(e.urlLanguage).toBe('en');
      expect(card(e, 'fi')).toContain('>Avaa sivusto (englanniksi)<');
      expect(card(e, 'sv')).toContain('>Öppna webbplatsen (på engelska)<');
      expect(servicePage(e, 'fi')).toContain('>Avaa sivusto (englanniksi)</a>');
      // In English it is just the site.
      expect(card(e, 'en')).toContain(`>${t('directory.visit', 'en')}<`);
      expect(card(e, 'en')).not.toContain('(in English)');
    }
  });

  it('a link without urlLanguage is never labelled', () => {
    expect(card(byId('sekasin'), 'fi')).not.toContain('(englanniksi)');
  });

  it('HUS Nettiterapiat: no video', () => {
    expect(byId('hus-nettiterapiat').formats).not.toContain('video');
  });
});

describe('5, 7: languages no source states read "check the site"', () => {
  const unstated = ['kela-kuntoutuspsykoterapia', 'interventionavigaattori', 'health-station'];

  it('exactly these three, and each card and page shows the fallback, no language list and no mismatch warning', () => {
    expect((directory as DirectoryEntry[]).filter((e) => e.languagesRef).map((e) => e.id).sort()).toEqual([...unstated].sort());
    for (const id of unstated) {
      const e = byId(id);
      expect(e.languagesRef).toBe('directory.languages.checkSite');
      for (const lang of ['en', 'fi', 'sv'] as const) {
        const fallback = t('directory.languages.checkSite', lang);
        const c = card(e, lang);
        expect(c, `${id} ${lang}`).toContain(fallback);
        expect(c, `${id} ${lang}`).not.toContain(t('directory.languageMismatch', lang));
        for (const l of e.languages) expect(c, `${id} ${lang}`).not.toContain(`>${t(`directory.language.${l}`, lang)}<`);
        const page = servicePage(e, lang);
        expect(page).toContain(fallback);
        expect(page).not.toContain('class="language-warning"');
        expect(page).not.toContain('availableLanguage');
      }
    }
    expect(t('directory.languages.checkSite', 'en')).toBe('Not stated, so check the site');
  });

  it('the /directory list shows them unfiltered; a language filter, which means "stated to be in", leaves them out', () => {
    for (const id of unstated) {
      expect(matchesFilters(byId(id), [], []), id).toBe(true);
      for (const l of ['fi', 'sv', 'en']) expect(matchesFilters(byId(id), [l], []), `${id} ${l}`).toBe(false);
    }
    expect(matchesFilters(byId('health-station'), [], ['phone'])).toBe(true);
    expect(matchesFilters(byId('arligt-talat'), ['sv'], [])).toBe(true);
    expect(matchesFilters(byId('arligt-talat'), ['en'], [])).toBe(false);
  });

  it('the health station points at a page that states the route, and is re-dated', () => {
    const e = byId('health-station');
    expect(e.url).toBe('https://www.mielenterveystalo.fi/fi/mielenterveyspalvelut/milloin-ja-mista-apua-mielenterveyden-ongelmiin');
    expect(e.verifiedOn).toBe('2026-11-12');
  });
});
