/**
 * "/why": the pitch, moved off the front door (D-32).
 *
 * The values, the five gaps, the comparison and what is coming were the part of
 * the landing page that two reviews read as a sales pitch. They live here now,
 * unreworded, and the landing page no longer carries them.
 */
import { expect, test } from '@playwright/test';
import { crisisControl, crisisDialog, openHome } from './flow';

const PITCH = ['.value-card', '.gap-card', '.compare-col', '.preview-card', '.why-built', '.btn-soon'];

/** An unresolved copy key renders as the key itself; none may reach the page. */
const RAW_KEY = /\b(home|previews)\.[a-z0-9]+(\.[a-z0-9]+)+\b/;

test.describe('/why', () => {
  for (const language of ['en', 'fi', 'sv'] as const) {
    test(`renders every moved section in ${language}`, async ({ page }) => {
      await page.goto(`/why?lang=${language}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.value-card')).toHaveCount(2);
      await expect(page.locator('.gap-card')).toHaveCount(5);
      await expect(page.locator('.compare-col')).toHaveCount(2);
      await expect(page.locator('.preview-card')).toHaveCount(3);
      expect(await page.locator('main').innerText()).not.toMatch(RAW_KEY);
    });
  }

  test('"Coming soon" is a button that is not open yet', async ({ page }) => {
    await page.goto('/why');
    const soon = page.locator('.entry-card .btn-soon');
    await expect(soon).toHaveCount(1);
    await expect(soon).toHaveAttribute('aria-disabled', 'true');
    await expect(soon).toBeDisabled();
    expect((await soon.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });

  test('the landing page no longer carries the pitch', async ({ page }) => {
    await openHome(page);
    for (const selector of PITCH) await expect(page.locator(selector), selector).toHaveCount(0);
  });

  test('the header link opens it at its own address, and Back returns home', async ({ page }) => {
    await openHome(page);
    await page.locator('.header-nav').getByRole('button', { name: 'Why we built this' }).click();
    await expect(page).toHaveURL(/\/why$/);
    await expect(page.locator('.value-card').first()).toBeVisible();

    await page.goBack();
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.value-card')).toHaveCount(0);
  });

  test('the footer links to it too', async ({ page }) => {
    await openHome(page);
    await page.locator('.app-footer').getByRole('button', { name: 'Why we built this' }).click();
    await expect(page).toHaveURL(/\/why$/);
  });

  test('leaving it for the questions puts the address back to "/"', async ({ page }) => {
    await page.goto('/why');
    await page.locator('.app-header .btn').click();
    await expect(page.locator('.progress-label')).toBeVisible();
    await expect(page).not.toHaveURL(/\/why/);
  });

  test('the crisis control, the banner and the language switch work as on every screen', async ({ page }) => {
    await page.goto('/why');
    await expect(page.locator('.provisional-banner, [class*="banner"]').first()).toBeVisible();
    await page.locator('.language-switch').getByRole('button', { name: 'Suomi' }).click();
    await expect(page).toHaveURL(/\/why\?lang=fi/);
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
  });
});
