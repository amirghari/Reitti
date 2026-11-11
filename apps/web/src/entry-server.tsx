/**
 * Build-time pre-render (SEO step 0, Amir 9.11.2026; per-language addresses,
 * D-44). Every screen with an address is rendered to static HTML in each
 * language, at that language's own path, so its text, headings, links and the
 * crisis lines are there without JavaScript. The browser then renders the app
 * over it as before (main.tsx).
 */
import { renderToString } from 'react-dom/server';
import App, { type Screen } from './App';
import { ADDRESSES, LANGUAGES, addressFor, type AddressedScreen, type Lang } from './addresses';
import { setUiLanguage, t } from './i18n';
import { titleFor } from './pageTitle';
import { homeJsonLd, jsonLdScript } from './structuredData';

export interface Page {
  path: string;
  screen: AddressedScreen;
  lang: Lang;
}

export const PAGES: Page[] = (Object.keys(ADDRESSES) as AddressedScreen[]).flatMap((screen) =>
  LANGUAGES.map((lang) => ({ path: addressFor(screen, lang), screen, lang })),
);

export function render(screen: AddressedScreen, lang: Lang = 'en'): string {
  // No document on the server: this sets the module's language and nothing else.
  setUiLanguage(lang);
  return renderToString(<App initialScreen={screen as Screen} />);
}

export const title = (screen: AddressedScreen, lang: Lang = 'en'): string => titleFor(screen, lang);
export const description = (lang: Lang = 'en'): string => t('meta.description', lang);

/** The same page in every language, and "/"'s English page as x-default (D-44). */
export const alternates = (screen: AddressedScreen): { hreflang: string; path: string }[] => [
  ...LANGUAGES.map((lang) => ({ hreflang: lang, path: addressFor(screen, lang) })),
  { hreflang: 'x-default', path: addressFor(screen, 'en') },
];

/** Organization and WebSite on /, /fi and /sv (plan item 6); nothing on the other screens. */
export const structuredData = (screen: AddressedScreen): string => (screen === 'home' ? jsonLdScript(homeJsonLd()) : '');
