/**
 * "/privacy": the site's privacy notice (7.11.2026).
 *
 * The notice is a description of mechanisms, so the claims a browser can check
 * are checked here: no cookie is ever set, and the page has every section in
 * every language. What goes on the wire is privacy.spec.ts's job.
 */
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from '../a11y/axe';
import { crisisControl, crisisDialog, openHome } from './flow';

const RAW_KEY = /\b(privacy|footer)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;
const SECTIONS = 7;

test.describe('/privacy', () => {
  for (const language of ['en', 'fi', 'sv'] as const) {
    test(`every section, no raw key, in ${language}`, async ({ page }, testInfo) => {
      await page.goto(`/privacy?lang=${language}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.privacy-section h2')).toHaveCount(SECTIONS);
      await expect(page.locator('.privacy-list li')).toHaveCount(5);
      expect(await page.locator('main').innerText()).not.toMatch(RAW_KEY);
      await expect(page.locator('main a[href="mailto:tietosuoja@mielenreitti.fi"]')).toHaveCount(1);
      if (language === 'en') await expectNoA11yViolations(page, testInfo, 'privacy notice');
    });
  }

  test('the footer opens it at its own address, Back returns home, and the crisis control works there', async ({ page }) => {
    await openHome(page);
    await page.locator('.app-footer').getByRole('button', { name: 'Privacy', exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator('main h1')).toHaveText('Privacy');
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('it quotes the real label of the button that deletes everything', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('main')).toContainText('"Delete everything Mielenreitti has stored on this device"');
  });

  test('no cookie is set, on the notice or anywhere it links within the site', async ({ page, context }) => {
    for (const path of ['/', '/privacy', '/directory', '/why']) await page.goto(path);
    expect(await context.cookies()).toEqual([]);
  });
});
