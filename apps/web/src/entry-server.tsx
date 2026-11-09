/**
 * Build-time pre-render (SEO step 0, Amir 9.11.2026). The screens with an
 * address of their own are rendered to static HTML, so their text, headings,
 * links and the crisis lines are there without JavaScript. The browser then
 * renders the app over it as before (main.tsx).
 *
 * English only: a static file cannot vary by `?lang=`, so Finnish and Swedish
 * still come from the app as it starts.
 */
import { renderToString } from 'react-dom/server';
import App, { type Screen } from './App';
import { t } from './i18n';
import { titleFor } from './pageTitle';

export const PAGES: { path: string; screen: Screen }[] = [
  { path: '/', screen: 'home' },
  { path: '/why', screen: 'why' },
  { path: '/directory', screen: 'directory' },
  { path: '/privacy', screen: 'privacy' },
  { path: '/about', screen: 'about' },
];

export const render = (screen: Screen): string => renderToString(<App initialScreen={screen} />);
export const title = (screen: Screen): string => titleFor(screen, 'en');
export const description = (): string => t('meta.description', 'en');
