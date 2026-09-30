/**
 * The questionnaire, as the second outside review found it: people could not
 * tell how far along they were, "Start again" threw them onto the landing page,
 * and every screen was text.
 *
 * Nothing here asserts on clinical wording. The milestone copy is provisional
 * and the clinician's, so these check where things appear and what they do.
 */
import { expect, test, type Page } from '@playwright/test';
import { answerContext, answerInstrumentsAt, crisisControl, openHome, setUiLanguage, signature, startAssessment } from './flow';

const label = (page: Page) => page.locator('.progress-label').first();

/** Answer one item on the current screen and wait for the next one. */
async function answerAt(page: Page, index: number) {
  const before = await signature(page);
  await page.locator('.options .option').nth(index).click();
  await expect.poll(() => signature(page)).not.toBe(before);
}

test.describe('"Start over" goes to the first question, not the landing page', () => {
  test('from the middle of a questionnaire: answers cleared, language kept', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await answerAt(page, 1);
    await expect(label(page)).toContainText('question 2 of');

    await page.locator('.app-header').getByRole('button', { name: 'Start over' }).click();

    await expect(label(page)).toContainText('Step 1 of');
    await expect(page.locator('.hero')).toHaveCount(0);
    // Nothing carried over from the run that was thrown away.
    await expect(page.locator('.options .option[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.language-chip[aria-pressed="true"]')).toHaveText('English');
  });

  test('a refreshed draft does not come back after starting over', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerAt(page, 2);
    await answerAt(page, 1);
    await page.reload();
    await expect(label(page)).toContainText('Step 3 of');

    await page.locator('.app-header').getByRole('button', { name: 'Start over' }).click();
    await expect(label(page)).toContainText('Step 1 of');
    await expect(page.locator('.options .option[aria-pressed="true"]')).toHaveCount(0);
  });

  test('from the result, both controls say the same thing and do it', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    expect(await answerInstrumentsAt(page, 0)).toBe('result');

    await page.locator('main').getByRole('button', { name: 'Start over' }).click();
    await expect(label(page)).toContainText('Step 1 of');
  });

  test('the wordmark still goes home', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await page.locator('.app-header .wordmark').click();
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('restarting does not forget that the crisis path opened', async ({ page }) => {
    // The rating stays away for the rest of a session in which the crisis path
    // opened. Starting over is the same person on the same afternoon.
    await openHome(page);
    await startAssessment(page);
    await crisisControl(page).click();
    await page.keyboard.press('Escape');
    await page.locator('.app-header').getByRole('button', { name: 'Start over' }).click();
    await answerContext(page);
    expect(await answerInstrumentsAt(page, 0)).toBe('result');
    await expect(page.locator('.rating')).toHaveCount(0);
  });
});

test.describe('the route line says how far along, and never promises a count', () => {
  test('a dot per part, the label says "up to", and a second part is part 2', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);

    await expect(label(page)).toContainText(/Part 1 of up to \d+ · question 1 of \d+/);
    const upTo = Number((await label(page).innerText()).match(/up to (\d+)/)?.[1]);
    await expect(page.locator('.route-dot')).toHaveCount(upTo);
    await expect(page.locator('.route-dot[data-state="current"]')).toHaveCount(1);

    // The highest answers on the entry screener open a deeper one.
    for (let i = 0; i < 4; i++) await answerAt(page, 3);
    await expect(label(page)).toContainText(/Part 2 of (up to )?\d+ · question 1 of \d+/);
    await expect(page.locator('.route-dot[data-state="done"]')).toHaveCount(1);

    // Same role and numbers as before: the progress bar is the current segment.
    const bar = page.locator('.route-line [role="progressbar"]');
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveAttribute('aria-valuenow', '1');
  });

  test('the milestone opens each part, once', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await expect(page.locator('.milestone')).toHaveCount(1);
    await answerAt(page, 0);
    await expect(page.locator('.milestone')).toHaveCount(0);
  });
});

test.describe('something visual, and nothing that moves under an item', () => {
  test('the chosen answer fills before the next question arrives', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);

    const option = page.locator('.options .option').nth(1);
    await option.click();
    // Seen during the pause, not after it: the next item has not arrived yet.
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await expect(label(page)).toContainText('question 1 of');
    await expect(label(page)).toContainText('question 2 of');

    // Going back shows the answer already given.
    await page.getByRole('button', { name: /previous question/i }).click();
    await expect(page.locator('.options .option').nth(1)).toHaveAttribute('aria-pressed', 'true');
  });

  test('the illustration is on the first screen only, never on an item', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await expect(page.locator('.route-illustration')).toHaveCount(1);
    await answerAt(page, 0);
    await expect(page.locator('.route-illustration')).toHaveCount(0);
    await answerContext(page).catch(() => undefined);
  });
});

test.describe('"You can stop any time"', () => {
  test('is under every item, and lands on the free options without losing the run', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await answerAt(page, 0);

    const stop = page.getByRole('button', { name: /stop any time/i });
    await expect(stop).toBeVisible();
    await stop.click();

    await expect(page.locator('#free-now-title')).toBeFocused();
    await expect(page.locator('#free-now-title')).toBeInViewport();
  });

  test('is in all three languages', async ({ page }) => {
    for (const language of ['fi', 'sv'] as const) {
      await openHome(page);
      await startAssessment(page);
      await answerContext(page);
      await setUiLanguage(page, language);
      await expect(page.locator('.stop-link')).not.toHaveText(/stop any time/i);
      await expect(page.locator('.stop-link')).not.toBeEmpty();
    }
  });
});
