/**
 * "/about" and the review line that replaced the preview banner (D-43, 9.11.2026).
 */
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from '../a11y/axe';
import { crisisControl, crisisDialog, openHome } from './flow';

const RAW_KEY = /\b(about|home|footer)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;

test.describe('/about', () => {
  for (const language of ['en', 'fi', 'sv'] as const) {
    test(`every section, no raw key, in ${language}`, async ({ page }, testInfo) => {
      await page.goto(`/about?lang=${language}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.privacy-section h2')).toHaveCount(5);
      expect(await page.locator('main').innerText()).not.toMatch(RAW_KEY);
      await expect(page.locator('main a[href="mailto:hello@mielenreitti.fi"]')).toHaveCount(1);
      await expect(page.locator('.about-review')).toContainText('Yasin Najafizadegan');
      if (language === 'en') {
        await expect(page.locator('main')).toContainText('Amir Ghari');
        await expect(page.locator('.about-review')).toHaveText(
          'Mielenreitti gives guidance, not a diagnosis. The routing rules were reviewed by Yasin Najafizadegan, PhD (licensed outside Finland); a review by a Finland-registered psychologist is in progress.',
        );
        await expectNoA11yViolations(page, testInfo, 'about page');
      }
    });
  }

  test('the footer opens it at its own address; its links lead on; the crisis control works there', async ({ page }) => {
    await openHome(page);
    await page.locator('.app-footer').getByRole('button', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('main').getByRole('button', { name: 'privacy notice' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
  });
});

test.describe('the preview banner is gone (D-43)', () => {
  test('no banner on any screen with a path, and nothing about it is stored', async ({ page }) => {
    for (const path of ['/', '/why', '/directory', '/privacy', '/about']) {
      await page.goto(path);
      await expect(page.locator('.provisional-banner'), path).toHaveCount(0);
    }
    expect(await page.evaluate(() => sessionStorage.getItem('reitti.previewNoticeDismissed'))).toBeNull();
  });

  test('the home page says what this is and who reviewed it, in one quiet line; /about is in the footer', async ({ page }) => {
    await openHome(page);
    const line = page.locator('.hero-review');
    await expect(line).toContainText('Mielenreitti gives guidance, not a diagnosis.');
    await expect(line).toContainText('A review by a Finland-registered psychologist is in progress.');
    // Plain text: the hero keeps its one button and one link (D-32).
    await expect(line.locator('a')).toHaveCount(0);
    await page.locator('.app-footer').getByRole('button', { name: 'About', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('About Mielenreitti');
  });
});
