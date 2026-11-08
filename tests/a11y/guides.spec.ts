/**
 * The guide pages (Phase C) under axe and the keyboard, served from the
 * renderer on a routed host with the real stylesheet.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { GUIDES_EN } from '../../apps/web/guides/index';
import { guidePage, guidePath, guidesIndex } from '../../apps/web/guides/render';
import { expectNoA11yViolations } from './axe';

const HOST = 'http://guides.test';
const CSS = readFileSync(new URL('../../apps/web/pages/pages.css', import.meta.url), 'utf8');
const pages = new Map<string, string>([['/en/guides', guidesIndex(GUIDES_EN)], ...GUIDES_EN.map((g) => [guidePath(g.slug), guidePage(g)] as [string, string])]);

async function serve(page: Page) {
  await page.route(`${HOST}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/site-pages.css') return route.fulfill({ contentType: 'text/css', body: CSS });
    const html = pages.get(path);
    return html ? route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }) : route.fulfill({ status: 404, body: '' });
  });
}

test.describe('guide pages (Phase C)', () => {
  for (const path of pages.keys()) {
    test(`axe: ${path}`, async ({ page }, testInfo) => {
      await serve(page);
      await page.goto(`${HOST}${path}`);
      await expect(page.locator('h1')).toBeVisible();
      await expectNoA11yViolations(page, testInfo, `guide ${path}`);
    });
  }

  test('the keyboard reaches the skip link, then a crisis line, before anything else', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not Tab to links by default');
    await serve(page);
    await page.goto(`${HOST}/en/guides/free-help-now`);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.crisis-call').first()).toHaveAttribute('href', 'tel:112');
  });

  test('a source note jumps to its source', async ({ page }) => {
    await serve(page);
    await page.goto(`${HOST}/en/guides/kela-psychotherapy`);
    await page.locator('.ref a').first().click();
    await expect(page).toHaveURL(/#source-/);
    await expect(page.locator('.sources-list li:target')).toHaveCount(1);
  });
});
