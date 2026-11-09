/**
 * The build-time pre-render (SEO step 0, 9.11.2026): every screen with an address
 * of its own renders to static HTML whose text, headings, links and crisis lines
 * are there without JavaScript.
 */
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import { PAGES, description, render, title } from '../src/entry-server';

const pages = PAGES.map((p) => ({ ...p, html: render(p.screen) }));
const h1 = (html: string) => html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]+>/g, '').trim();

describe('pre-rendered pages', () => {
  it('the five screens with an address of their own', () => {
    expect(PAGES.map((p) => p.path)).toEqual(['/', '/why', '/directory', '/privacy', '/about']);
  });

  it('each has its own heading and title, and the home title says what the site is', () => {
    expect(title('home')).toBe('Mielenreitti – mental health help in Finland');
    expect(Object.fromEntries(pages.map((p) => [p.path, h1(p.html)]))).toMatchObject({
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

  it('navigation is real links a crawler can follow, on every page', () => {
    for (const { path, html } of pages) {
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
