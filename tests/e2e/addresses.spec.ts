/**
 * The URLs the sitemap and llms.txt hand out have to open what they say.
 *
 * `?lang=fi` must be the Finnish page, or the sitemap's hreflang alternates
 * point at the English one three times. `?page=how-it-decides` must open the
 * transparency page, or llms.txt links to the landing page and calls it
 * something else.
 */
import { expect, test } from '@playwright/test';

test.describe('addresses', () => {
  for (const [lang, chip] of [
    ['fi', 'Suomi'],
    ['sv', 'Svenska'],
    ['en', 'English'],
  ] as const) {
    test(`?lang=${lang} opens the site in that language, and says so`, async ({ page }) => {
      await page.goto(`/?lang=${lang}`);
      await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText(chip);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe(lang);
    });
  }

  test('no parameter is English, as it always was', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('English');
  });

  test('an unknown language is ignored rather than guessed', async ({ page }) => {
    await page.goto('/?lang=de');
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('English');
  });

  test('switching language puts it in the address and on the page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.language-switch').getByRole('button', { name: 'Svenska' }).click();
    await expect(page).toHaveURL(/[?&]lang=sv\b/);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('sv');
  });

  test('?page=how-it-decides opens "How Mielenreitti decides", in the language asked for', async ({ page }) => {
    await page.goto('/?page=how-it-decides&lang=fi');
    await expect(page.locator('.nav-link[aria-current="page"]')).toBeVisible();
    await expect(page.locator('.hero')).toHaveCount(0);
    // Taken out of the address once read, so a refresh after Back goes home.
    await expect(page).not.toHaveURL(/page=/);
    await expect(page).toHaveURL(/lang=fi/);
  });

  test('the page carries no canonical tag that would contradict the alternates', async ({ page }) => {
    await page.goto('/?lang=fi');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});
