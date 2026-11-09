/**
 * The build-time pre-render (SEO step 0, 9.11.2026): every screen with an address
 * of its own renders to static HTML whose text, headings, links and crisis lines
 * are there without JavaScript.
 */
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import { PAGES, alternates, description, render, title } from '../src/entry-server';

const pages = PAGES.map((p) => ({ ...p, html: render(p.screen, p.lang) }));
const h1 = (html: string) => html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]+>/g, '').trim();

describe('pre-rendered pages', () => {
  it('the five screens with an address of their own, each in three languages at its own path (D-44)', () => {
    expect(PAGES.filter((p) => p.lang === 'en').map((p) => p.path)).toEqual(['/', '/why', '/directory', '/privacy', '/about']);
    expect(PAGES.filter((p) => p.lang === 'fi').map((p) => p.path)).toEqual(['/fi', '/fi/miksi', '/fi/palvelut', '/fi/tietosuoja', '/fi/tietoa']);
    expect(PAGES.filter((p) => p.lang === 'sv').map((p) => p.path)).toEqual(['/sv', '/sv/varfor', '/sv/tjanster', '/sv/dataskydd', '/sv/om']);
  });

  it('each language renders in that language, with its own title and description', () => {
    const fiAbout = pages.find((p) => p.path === '/fi/tietoa')!;
    const svPrivacy = pages.find((p) => p.path === '/sv/dataskydd')!;
    expect(h1(fiAbout.html)).toBe('Tietoa Mielenreitistä');
    expect(h1(svPrivacy.html)).toBe('Dataskydd');
    expect(title('home', 'fi')).toBe('Mielenreitti – mielenterveyden apua Suomessa');
    expect(title('home', 'sv')).toBe('Mielenreitti – hjälp för psykisk hälsa i Finland');
    expect(description('fi')).toContain('vastauksesi eivät koskaan lähde puhelimestasi');
  });

  it('every page’s alternates name the three addresses, and x-default is the English one', () => {
    expect(alternates('why')).toEqual([
      { hreflang: 'en', path: '/why' },
      { hreflang: 'fi', path: '/fi/miksi' },
      { hreflang: 'sv', path: '/sv/varfor' },
      { hreflang: 'x-default', path: '/why' },
    ]);
    expect(alternates('home').find((a) => a.hreflang === 'x-default')!.path).toBe('/');
  });

  it('a Finnish page links within Finnish, and a Swedish page within Swedish', () => {
    const fi = pages.find((p) => p.path === '/fi/miksi')!.html;
    const sv = pages.find((p) => p.path === '/sv/tjanster')!.html;
    for (const href of ['/fi', '/fi/miksi', '/fi/palvelut', '/fi/tietosuoja', '/fi/tietoa']) expect(fi, href).toContain(`href="${href}"`);
    for (const href of ['/sv', '/sv/varfor', '/sv/tjanster', '/sv/dataskydd', '/sv/om']) expect(sv, href).toContain(`href="${href}"`);
    expect(fi).not.toContain('lang=fi');
  });

  it('each has its own heading and title, and the home title says what the site is', () => {
    expect(title('home')).toBe('Mielenreitti – mental health help in Finland');
    expect(Object.fromEntries(pages.filter((p) => p.lang === 'en').map((p) => [p.path, h1(p.html)]))).toMatchObject({
      '/why': 'Why we built this',
      '/directory': 'All services',
      '/privacy': 'Privacy',
      '/about': 'About Mielenreitti',
    });
    expect(title('about')).toBe('About Mielenreitti');
    expect(title('privacy')).toBe('Privacy – Mielenreitti');
    expect(description()).toContain('your answers never leave your phone');
  });

  it('every page carries every crisis line as a real phone link (invariant 1, without script)', () => {
    for (const { path, html } of pages) {
      for (const r of crisis.resources) expect(html, `${path} ${r.id}`).toContain(`href="tel:${r.phone.replace(/\s/g, '')}"`);
    }
  });

  it('navigation is real links a crawler can follow, on every English page', () => {
    for (const { path, html } of pages.filter((p) => p.lang === 'en')) {
      for (const href of ['/', '/?page=how-it-decides', '/why', '/directory', '/privacy', '/about']) {
        expect(html, `${path} links to ${href}`).toContain(`href="${href.replace('&', '&amp;')}"`);
      }
    }
  });

  it('the home page has its text and the review line; no preview banner anywhere; no raw string key', () => {
    const home = pages.find((p) => p.path === '/')!.html;
    expect(home).toContain('Mielenreitti gives guidance, not a diagnosis.');
    for (const { path, html } of pages) {
      expect(html, path).not.toContain('provisional-banner');
      expect(html, path).not.toMatch(/>\s*(home|about|privacy|directory|footer)\.[a-z]+\.[a-zA-Z.]+\s*</);
    }
  });

  it('the directory page lists every service, unfiltered, without script', () => {
    const html = pages.find((p) => p.path === '/directory')!.html;
    expect((html.match(/class="option-card/g) || []).length).toBeGreaterThan(15);
  });
});
