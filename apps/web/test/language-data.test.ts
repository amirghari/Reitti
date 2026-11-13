/**
 * Amir's decisions of 13.11.2026: Kela psychotherapy's languages from Kela's own
 * page, ordering that reads the language data the cards show, Nyyti's groups link
 * labelled English, and the health station's link in each reader's language.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { languageMismatch, orderFreeFirst, speaks, visitLink, type DirectoryEntry } from '@reitti/engine';
import { servicePage } from '../services/render';
import { matchesFilters } from '../src/components/Directory';
import { OptionCard } from '../src/components/Options';
import { directory } from '../src/config';
import { setUiLanguage, t } from '../src/i18n';

const all = directory as DirectoryEntry[];
const byId = (id: string) => all.find((e) => e.id === id)!;
const LANGS = ['en', 'fi', 'sv'] as const;
const card = (entry: DirectoryEntry, ui: (typeof LANGS)[number], care: string = ui) => {
  setUiLanguage(ui);
  return renderToStaticMarkup(createElement('ul', null, createElement(OptionCard, { entry, careLanguage: care })));
};
const hrefOf = (html: string) => html.match(/class="option-link" href="([^"]+)"/)![1];
afterEach(() => setUiLanguage('en'));

describe('1. Kela psychotherapy: languages from Kela, so it stays under English', () => {
  const kela = byId('kela-kuntoutuspsykoterapia');

  it('states fi, sv and en, re-dated, with the source in its note', () => {
    expect(kela.languagesRef).toBeUndefined();
    expect(kela.languages).toEqual(['fi', 'sv', 'en']);
    expect(kela.verifiedOn).toBe('2026-11-13');
    expect(kela.note).toContain("'Palveluntuottajan kielitaito'");
    expect(kela.note).toContain("'englanti'");
  });

  it('is in the English filter, and its card names English', () => {
    expect(matchesFilters(kela, ['en'], [])).toBe(true);
    const html = card(kela, 'en');
    expect(html).toContain(`>${t('directory.language.en', 'en')}<`);
    expect(html).not.toContain(t('directory.languages.checkSite', 'en'));
  });
});

describe('2. ordering reads the language data the cards show', () => {
  it('for every entry and language, the order demotes exactly what the card warns of', () => {
    for (const e of all) {
      for (const lang of LANGS) {
        const warns = card(e, lang).includes(t('directory.languageMismatch', lang));
        expect(languageMismatch(e, lang), `${e.id} ${lang}`).toBe(warns);
      }
    }
  });

  it('an entry whose languages are not stated is never demoted, and never counts as speaking one', () => {
    for (const e of all.filter((x) => x.languagesRef)) {
      for (const lang of LANGS) {
        expect(languageMismatch(e, lang), `${e.id} ${lang}`).toBe(false);
        expect(speaks(e, lang), `${e.id} ${lang}`).toBe(false);
      }
    }
  });

  it('Interventionavigaattori keeps its place for an English reader', () => {
    const plain = orderFreeFirst(all).map((e) => e.id);
    const english = orderFreeFirst(all, { careLanguage: 'en' }).map((e) => e.id);
    const demoted = english.filter((id) => languageMismatch(byId(id), 'en'));
    // Language only demotes: everything not demoted keeps its plain order.
    expect(english.filter((id) => !demoted.includes(id))).toEqual(plain.filter((id) => !demoted.includes(id)));
    expect(demoted.length).toBeGreaterThan(0);
    expect(demoted).not.toContain('interventionavigaattori');
  });
});

describe("3. Nyyti's groups link is labelled English", () => {
  const groups = byId('nyyti-groups');
  it('for a Finnish or Swedish reader, and not for an English one', () => {
    expect(groups.urlLanguage).toBe('en');
    expect(card(groups, 'fi')).toContain('>Avaa sivusto (englanniksi)<');
    expect(card(groups, 'sv')).toContain('>Öppna webbplatsen (på engelska)<');
    expect(card(groups, 'en')).toContain(`>${t('directory.visit', 'en')}<`);
    expect(servicePage(groups, 'fi')).toContain('>Avaa sivusto (englanniksi)</a>');
  });
});

describe('4. the health station links each language to its own page', () => {
  const station = byId('health-station');
  const FI = 'https://www.mielenterveystalo.fi/fi/mielenterveyspalvelut/milloin-ja-mista-apua-mielenterveyden-ongelmiin';
  const SV = 'https://www.mielenterveystalo.fi/sv/mentalvardstjanster/nar-och-var-kan-man-fa-hjalp-vid-psykiska-problem';

  it('Finnish to the Finnish page, Swedish to the Swedish page, both unlabelled', () => {
    expect(visitLink(station, 'fi')).toEqual({ href: FI });
    expect(visitLink(station, 'sv')).toEqual({ href: SV });
    expect(hrefOf(card(station, 'fi'))).toBe(FI);
    expect(hrefOf(card(station, 'sv'))).toBe(SV);
    expect(card(station, 'sv')).toContain(`>${t('directory.visit', 'sv')}<`);
    expect(servicePage(station, 'sv')).toContain(`<a href="${SV}" rel="noopener">${t('directory.visit', 'sv')}</a>`);
  });

  it('English has no page of its own, so it opens the Finnish one and says so', () => {
    expect(visitLink(station, 'en')).toEqual({ href: FI, labelLanguage: 'fi' });
    expect(card(station, 'en')).toContain('>Open the site (in Finnish)<');
    expect(servicePage(station, 'en')).toContain(`<a href="${FI}" rel="noopener">Open the site (in Finnish)</a>`);
  });

  it('the link follows the interface language, not the care language', () => {
    expect(hrefOf(card(station, 'sv', 'fi'))).toBe(SV);
  });
});
