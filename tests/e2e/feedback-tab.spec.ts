/**
 * The landing page's feedback tab.
 *
 * The review found the full-page form too prominent. It is now a tab in the
 * corner. What must not change with it: the crisis control stays above it and
 * reachable while it is open, the warning that this is not a place to get help
 * is the same words, and a keyboard user can open it, close it, and land back
 * where they were.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { crisisControl, crisisDialog, openHome, startAssessment } from './flow';

const ui: Record<string, string> = JSON.parse(
  readFileSync(join(process.cwd(), 'config/i18n/ui/en.json'), 'utf8'),
);

const tab = (page: import('@playwright/test').Page) => page.locator('.feedback-tab');
const panel = (page: import('@playwright/test').Page) => page.locator('.feedback-tab-panel');

test.describe('the feedback tab', () => {
  test('replaces the full-page section on the landing page', async ({ page }) => {
    await openHome(page);
    await expect(tab(page)).toBeVisible();
    await expect(page.locator('main section.feedback')).toHaveCount(0);
    await expect(panel(page)).toHaveCount(0);
  });

  test('is on the landing page only', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await expect(tab(page)).toHaveCount(0);
  });

  test('keyboard: Enter opens it, Escape closes it, focus returns to the tab', async ({ page }) => {
    await openHome(page);
    await tab(page).focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    await expect(tab(page)).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(tab(page)).toBeFocused();
    await expect(tab(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps the not-a-place-to-get-help warning, word for word', async ({ page }) => {
    await openHome(page);
    await tab(page).click();
    await expect(panel(page).locator('.feedback-not-support')).toHaveText(ui['feedback.notSupport']);
  });

  test('sits under the crisis control, which stays reachable while it is open', async ({ page }) => {
    await openHome(page);
    await tab(page).click();
    await expect(panel(page)).toBeVisible();

    const z = async (selector: string) =>
      Number(await page.locator(selector).evaluate((el) => getComputedStyle(el).zIndex));
    expect(await z('.feedback-tab-wrap')).toBeLessThan(await z('.crisis-fab'));

    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();

    // Escape belongs to the crisis panel while it is open, not to the tab.
    await page.keyboard.press('Escape');
    await expect(crisisDialog(page)).toBeHidden();
    await expect(panel(page)).toBeVisible();
  });

  test('the textarea focus is a 2px edge and a 4px ring, not a glow', async ({ page }) => {
    await openHome(page);
    await tab(page).click();
    const box = panel(page).locator('.feedback-textarea');
    await box.focus();
    const style = await box.evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderTopWidth, outline: s.outlineWidth, shadow: s.boxShadow };
    });
    expect(style.border).toBe('2px');
    expect(style.outline).toBe('4px');
    expect(style.shadow).toBe('none');
  });
});
