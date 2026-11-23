/**
 * Amir, 23.11.2026: /about and the professional-page footer say nobody can pay
 * to be shown first, as the partner page does; the site footer links to
 * /partners so organisations can find it; the partner page's two advertising
 * lines stay exactly as they are. The fi and sv wording waits for the native
 * reviewers (`_needsNativeReview`).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '../src/entry-server';
import { partnerPage } from '../partners/page';
import { t } from '../src/i18n';

const LANGS = ['en', 'fi', 'sv'] as const;
const bundle = (lang: string) =>
  JSON.parse(readFileSync(new URL(`../../../config/i18n/ui/${lang}.json`, import.meta.url), 'utf8')) as Record<string, unknown>;

describe('nobody can pay to be shown first', () => {
  const expected = {
    en: {
      about: 'no service can pay to be shown first.',
      pro: 'no one can pay to be shown first.',
    },
    fi: {
      about: 'eikä mikään palvelu voi maksaa siitä, että se näytetään ensin.',
      pro: 'eikä kukaan voi maksaa siitä, että hänet näytetään ensin.',
    },
    sv: {
      about: 'ingen tjänst kan betala för att visas först.',
      pro: 'ingen kan betala för att visas först.',
    },
  };

  it('/about says it in every language, and no longer speaks of paying to be listed', () => {
    for (const lang of LANGS) {
      expect(t('about.who.body', lang), lang).toContain(expected[lang].about);
      expect(render('about', lang), lang).toContain(expected[lang].about);
    }
    expect(t('about.who.body', 'en')).not.toContain('pays to be listed');
  });

  it('the professional-page footer says it in every language', () => {
    for (const lang of LANGS) expect(t('pro.footer', lang), lang).toContain(expected[lang].pro);
    expect(t('pro.footer', 'en')).not.toContain('pays to be listed');
  });

  it('the Finnish and Swedish wording is on the native reviewers\' list', () => {
    for (const lang of ['fi', 'sv']) {
      const list = bundle(lang)._needsNativeReview as string[];
      for (const key of ['about.who.body', 'pro.footer', 'footer.partnersLink']) expect(list, `${lang} ${key}`).toContain(key);
    }
  });
});

describe('the site footer links to /partners', () => {
  it('on every addressed screen, in every language, saying in fi and sv that the page is in English', () => {
    for (const lang of LANGS) {
      for (const screen of ['home', 'why', 'directory', 'privacy', 'about'] as const) {
        const html = render(screen, lang);
        const footer = html.slice(html.indexOf('<footer'));
        expect(footer, `${screen} ${lang}`).toContain(
          // React writes the attribute as hrefLang; HTML attribute names are case-insensitive.
          `<a href="/partners" class="footer-link" hrefLang="en">${t('footer.partnersLink', lang)}</a>`,
        );
      }
    }
    expect(t('footer.partnersLink', 'en')).toBe('For partners');
    expect(t('footer.partnersLink', 'fi')).toContain('(englanniksi)');
    expect(t('footer.partnersLink', 'sv')).toContain('(på engelska)');
  });
});

describe("the partner page's two advertising lines stay exactly as they are", () => {
  it('both, word for word', () => {
    const html = partnerPage();
    expect(html).toContain('<li>No analytics, advertising, tracking tools or cookies.</li>');
    expect(html).toContain(
      'Mielenreitti is run by Amir Ghari in Helsinki, who is also responsible for its data (the data controller). It is independent and carries no advertising.',
    );
  });
});
