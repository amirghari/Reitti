/**
 * The meta description follows the interface language: English in index.html,
 * Finnish or Swedish once the page has read ?lang=.
 */
import { expect, test } from '@playwright/test';

const description = (page: import('@playwright/test').Page) => page.locator('meta[name="description"]');

test.describe('meta description', () => {
  test('English by default, and it says answers never leave the phone', async ({ page }) => {
    await page.goto('/');
    await expect(description(page)).toHaveAttribute('content', /your answers never leave your phone/);
  });

  test('Finnish at ?lang=fi and Swedish at ?lang=sv', async ({ page }) => {
    await page.goto('/?lang=fi');
    await expect(description(page)).toHaveAttribute('content', /vastauksesi eivät koskaan lähde puhelimestasi/);
    await page.goto('/why?lang=sv');
    await expect(description(page)).toHaveAttribute('content', /dina svar lämnar aldrig din telefon/);
  });
});
