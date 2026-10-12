/**
 * "/directory": every service, with Language and How-to-reach filters (D-37).
 */
import { expect, test, type Page } from '@playwright/test';
import { crisisControl, crisisDialog } from './flow';

const cards = (page: Page) => page.locator('.directory-list .option-card');
const chip = (page: Page, group: number, name: string) =>
  page.locator('.directory-filter').nth(group).getByRole('button', { name, exact: true });

/** The tags a card shows for one group, as rendered text. */
const tagsOf = (page: Page, group: 'languages' | 'formats') =>
  cards(page).evaluateAll(
    (els, g) => els.map((el) => Array.from(el.querySelectorAll(`[data-tags="${g}"] li`)).map((li) => li.textContent?.trim())),
    group,
  );

test.describe('/directory', () => {
  test('lists every service, free first, each with language and how-to-reach tags', async ({ page }) => {
    await page.goto('/directory');
    const total = await cards(page).count();
    expect(total).toBeGreaterThan(15);
    await expect(page.locator('.directory-count')).toContainText(`${total} of ${total}`);
    for (const tags of await tagsOf(page, 'languages')) expect(tags.length).toBeGreaterThan(0);
    for (const tags of await tagsOf(page, 'formats')) expect(tags.length).toBeGreaterThan(0);
    // Tags are not links.
    await expect(page.locator('.directory-list .tag-chip a')).toHaveCount(0);
  });

  test('a filter shows only matching services; two filters combine with AND; it lives in the address', async ({ page }) => {
    await page.goto('/directory');
    const total = await cards(page).count();

    await chip(page, 0, 'English').click();
    await expect(page).toHaveURL(/[?&]spoken=en\b/);
    const english = await cards(page).count();
    expect(english).toBeLessThan(total);
    for (const tags of await tagsOf(page, 'languages')) expect(tags).toContain('English');

    await chip(page, 1, 'Chat').click();
    await expect(page).toHaveURL(/[?&]how=chat\b/);
    expect(await cards(page).count()).toBeLessThanOrEqual(english);
    for (const tags of await tagsOf(page, 'languages')) expect(tags).toContain('English');
    for (const tags of await tagsOf(page, 'formats')) expect(tags).toContain('Chat');

    // The interface stays in English: the filter is not the `lang` parameter.
    await expect(page).not.toHaveURL(/[?&]lang=/);
  });

  test('a shared filtered address opens filtered', async ({ page }) => {
    await page.goto('/directory?spoken=sv&how=phone');
    await expect(chip(page, 0, 'Swedish')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 1, 'Phone')).toHaveAttribute('aria-pressed', 'true');
    for (const tags of await tagsOf(page, 'formats')) expect(tags).toContain('Phone');
  });

  test('nothing matching says so, and the reset brings everything back', async ({ page }) => {
    await page.goto('/directory');
    const total = await cards(page).count();
    // Pick a combination no service has, by trying each how-to-reach value with Swedish.
    await chip(page, 0, 'Swedish').click();
    const formats = await page.locator('.directory-filter').nth(1).getByRole('button').allInnerTexts();
    let empty = false;
    for (const name of formats) {
      await chip(page, 1, name).click();
      if ((await cards(page).count()) === 0) {
        empty = true;
        break;
      }
      await chip(page, 1, name).click();
    }
    test.skip(!empty, 'every combination has a match today');
    await expect(page.locator('.directory-none')).toBeVisible();
    await page.locator('.directory-none').getByRole('button').click();
    expect(await cards(page).count()).toBe(total);
  });

  test('keyboard: the filters are buttons that say whether they are on', async ({ page }) => {
    await page.goto('/directory');
    const english = chip(page, 0, 'English');
    await english.focus();
    await page.keyboard.press('Enter');
    await expect(english).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(english).toHaveAttribute('aria-pressed', 'false');
  });

  test('the footer links to it, Back leaves it, and the crisis control works here', async ({ page }) => {
    await page.goto('/');
    await page.locator('.app-footer').getByRole('button', { name: 'All services' }).click();
    await expect(page).toHaveURL(/\/directory$/);
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page.locator('.hero')).toBeVisible();
  });

  for (const language of ['en', 'fi', 'sv'] as const) {
    test(`the hero's Terapianavigaattori link opens its card, in ${language}`, async ({ page }) => {
      await page.goto(`/?lang=${language}`);
      const link = page.locator('.hero-have-code a');
      await expect(link).toHaveText('Terapianavigaattori');
      // The name is not the first word of the line.
      expect((await page.locator('.hero-have-code').innerText()).trim().startsWith('Terapianavigaattori')).toBe(false);
      await link.click();
      // The page reads entry= once and drops it, so a later share is of the list.
      await expect(page).toHaveURL(/\/directory/);
      const card = page.locator('.directory-list [data-entry="terapianavigaattori"]');
      await expect(card).toHaveClass(/is-target/);
      await expect(card).toBeInViewport();
      await expect(card).toBeFocused();
      // And in the language the reader chose.
      await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveAttribute('lang', language);
    });
  }
});

