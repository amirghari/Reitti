/**
 * The directory's static pages (D-39), under axe and the keyboard.
 *
 * The pages are rendered from invented rows in the test itself and served on a
 * routed host, so this needs neither the private dataset nor a build. The
 * stylesheet is the real one.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { renderAll } from '../../apps/web/pages/render';
import type { Professional } from '../../apps/web/pages/data';
import { expectNoA11yViolations } from './axe';

const HOST = 'http://directory-pages.test';
const CSS = readFileSync(new URL('../../apps/web/pages/pages.css', import.meta.url), 'utf8');

const base: Professional = {
  id: 'fixture-1',
  slug: 'keksitty-terapeutti',
  type: 'psychotherapist',
  name: 'Keksitty Terapeutti',
  title: 'Psykoterapeutti (keksitty)',
  languages: ['fi', 'sv', 'en'],
  city: 'Helsinki',
  region: 'Helsinki',
  methods: ['kognitiivinen psykoterapia'],
  kela_approved: true,
  kela_checked_on: '2026-11-06',
  licence_checked_on: '2026-11-06',
  registered_provider_checked_on: null,
  business_id: null,
  website: 'https://example.org/keksitty',
  booking_url: 'https://example.org/keksitty/varaa',
  phone: null,
  email: null,
  prices: 'Keksitty hintatieto',
  waiting_time: null,
  remote_available: 'yes',
  accepting_new_clients: 'no',
  sources: [{ source: 'kela', url: 'https://www.kela.fi/hae-palveluntuottajaa', read_on: '2026-11-06', fields: ['languages'] }],
  claimed: false,
  claimed_on: null,
  status: 'active',
  stale_since: null,
  do_not_list: false,
  do_not_list_on: null,
  sample: true,
};
const rows: Professional[] = [base, { ...base, id: 'fixture-2', slug: 'toinen', name: 'Toinen Keksitty', kela_approved: false }];
const pages = new Map(renderAll(rows).map((p) => [p.path, p.html]));

async function serve(page: Page) {
  await page.route(`${HOST}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/pro-pages/pages.css') return route.fulfill({ contentType: 'text/css', body: CSS });
    const html = pages.get(path);
    return html ? route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }) : route.fulfill({ status: 404, body: '' });
  });
}

const SCREENS = [
  '/ammattilaiset/keksitty-terapeutti',
  '/sv/yrkespersoner/keksitty-terapeutti',
  '/en/professionals/keksitty-terapeutti',
  '/psykoterapeutit/helsinki',
  '/en/psychologists/turku',
  '/tietosuoja/ammattilaiset',
  '/en/privacy/professionals',
];

test.describe('directory pages (D-39)', () => {
  for (const path of SCREENS) {
    test(`axe: ${path}`, async ({ page }, testInfo) => {
      await serve(page);
      await page.goto(`${HOST}${path}`);
      await expect(page.locator('h1')).toBeVisible();
      await expectNoA11yViolations(page, testInfo, `directory page ${path}`);
    });
  }

  test('the keyboard reaches the skip link, then a crisis line, before anything else', async ({ page, browserName }) => {
    // WebKit's Tab skips links unless the OS setting says otherwise.
    test.skip(browserName === 'webkit', 'WebKit does not Tab to links by default');
    await serve(page);
    await page.goto(`${HOST}/en/professionals/keksitty-terapeutti`);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.crisis-call').first()).toBeFocused();
    await expect(page.locator('.crisis-call').first()).toHaveAttribute('href', 'tel:112');
  });

  test('the language links open the same page in the other language', async ({ page }) => {
    await serve(page);
    await page.goto(`${HOST}/en/professionals/keksitty-terapeutti`);
    await page.locator('.lang-switch a[lang="fi"]').click();
    await expect(page).toHaveURL(`${HOST}/ammattilaiset/keksitty-terapeutti`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
    await expect(page.locator('h1')).toHaveText('Keksitty Terapeutti');
  });

  test('a sample says so before its name', async ({ page }) => {
    await serve(page);
    await page.goto(`${HOST}/psykoterapeutit/helsinki`);
    const banner = page.locator('.sample-banner');
    await expect(banner).toBeVisible();
    await expect(page.locator('.card')).toHaveCount(2);
    expect(await banner.evaluate((el) => el.compareDocumentPosition(document.querySelector('h1')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  });
});
