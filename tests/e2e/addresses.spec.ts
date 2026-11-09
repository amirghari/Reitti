/**
 * The URLs the sitemap and llms.txt hand out have to open what they say, and
 * each language has one address (D-44): `/fi/miksi`, not `/why?lang=fi`.
 *
 * On mielenreitti.fi an old `?lang=` address is redirected by the server
 * (vercel.json); here, on the dev server, the app does the same in the browser,
 * so neither serves a second copy.
 */
import { expect, test } from '@playwright/test';

test.describe('addresses (D-44)', () => {
  for (const [lang, chip, home] of [
    ['fi', 'Suomi', '/fi'],
    ['sv', 'Svenska', '/sv'],
  ] as const) {
    test(`${home} opens the site in that language, and says so`, async ({ page }) => {
      await page.goto(home);
      await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText(chip);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe(lang);
    });

    test(`an old ?lang=${lang} address opens in ${lang} and moves to ${home}`, async ({ page }) => {
      await page.goto(`/?lang=${lang}`);
      await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText(chip);
      await expect(page).toHaveURL(new RegExp(`${home}$`));
    });
  }

  test('/ is English, and ?lang=en moves to the plain path', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('English');
    await page.goto('/why?lang=en');
    await expect(page).toHaveURL(/\/why$/);
  });

  test('an unknown language is ignored rather than guessed', async ({ page }) => {
    await page.goto('/?lang=de');
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('English');
  });

  test('switching language moves to that language’s address for the same page', async ({ page }) => {
    await page.goto('/why');
    await page.locator('.language-switch').getByRole('button', { name: 'Svenska' }).click();
    await expect(page).toHaveURL(/\/sv\/varfor$/);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('sv');
    await page.locator('.language-switch').getByRole('button', { name: 'Suomi' }).click();
    await expect(page).toHaveURL(/\/fi\/miksi$/);
  });

  test('links stay in the language, and Back crosses languages with the address', async ({ page }) => {
    await page.goto('/fi/miksi');
    await page.locator('.app-footer').getByRole('link', { name: 'Kaikki palvelut' }).click();
    await expect(page).toHaveURL(/\/fi\/palvelut$/);
    await page.goto('/sv/om');
    await expect(page.locator('main h1')).toHaveText('Om Mielenreitti');
    await page.goBack();
    await expect(page).toHaveURL(/\/fi\/palvelut$/);
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('Suomi');
  });

  test('?page=how-it-decides opens "How Mielenreitti decides", in the language asked for', async ({ page }) => {
    await page.goto('/?page=how-it-decides&lang=fi');
    await expect(page.locator('.nav-link[aria-current="page"]')).toBeVisible();
    await expect(page.locator('.hero')).toHaveCount(0);
    // Both parameters are taken out once read: the address is Finnish's home.
    await expect(page).toHaveURL(/\/fi$/);
  });

  test('the page carries no canonical tag', async ({ page }) => {
    await page.goto('/fi');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});
