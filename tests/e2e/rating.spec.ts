/**
 * The optional rating, checked in a browser.
 *
 * Invariant 23 asserts the rule in isolation and invariant 11 asserts the body
 * the client builds. Neither can see whether the thing is actually on the page,
 * which is the only version of "never on the crisis path" that matters. These
 * walk the real journeys.
 *
 * The request is intercepted rather than sent: there is no relay in front of the
 * dev server, and asserting the exact body on the wire is the point anyway.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  answerContext,
  answerInstrumentsAt,
  crisisControl,
  crisisDialog,
  openHome,
  startAssessment,
} from './flow';

const rating = (page: Page) => page.locator('.rating');

/** Capture what a click on a number would put on the wire, and answer 204. */
function captureRating(page: Page): { bodies: unknown[] } {
  const bodies: unknown[] = [];
  void page.route('**/api/feedback', async (route) => {
    bodies.push(JSON.parse(route.request().postData() ?? 'null'));
    await route.fulfill({ status: 204, body: '' });
  });
  return { bodies };
}

/** A result with no safety flag: the lowest answer on every scale. */
async function ordinaryResult(page: Page): Promise<void> {
  await openHome(page);
  await startAssessment(page);
  await answerContext(page, { ageBand: '30-plus', duration: '1-6-months' });
  expect(await answerInstrumentsAt(page, 0)).toBe('result');
}

test.describe('the optional rating', () => {
  test('is offered at the bottom of an ordinary result, and sends three values', async ({ page }) => {
    const captured = captureRating(page);
    await ordinaryResult(page);

    await expect(rating(page)).toBeVisible();
    await expect(rating(page)).toContainText(/nothing about you|sinusta ei|ingenting om dig/i);

    await page.locator('.rating-btn[data-rating="4"]').click();

    await expect.poll(() => captured.bodies.length).toBe(1);
    const body = captured.bodies[0] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['locale', 'rating', 'screen']);
    expect(body).toEqual({ rating: 4, locale: 'en', screen: 'result' });

    // Nothing about the result can be in there, because nothing about it was
    // passed in. Asserted anyway: this is the test that would notice.
    const wire = JSON.stringify(body).toLowerCase();
    for (const forbidden of ['band', 'score', 'rung', 'phq', 'gad', 'answer', 'severity', 'flag']) {
      expect(wire, `the wire carried "${forbidden}"`).not.toContain(forbidden);
    }
  });

  test('the note box sits directly under it, and still sends a note, not a rating', async ({
    page,
  }) => {
    const captured = captureRating(page);
    await ordinaryResult(page);

    const block = page.locator('.result-feedback');
    await expect(block).toBeVisible();
    await expect(block.locator('.rating')).toBeVisible();
    await expect(block.locator('.feedback')).toBeVisible();

    // Order on the page, not just presence: the rating first, the box under it.
    const order = await block.evaluate((el) =>
      [...el.querySelectorAll('.rating, .feedback')].map((child) => child.className.split(' ')[0]),
    );
    expect(order).toEqual(['rating', 'feedback']);

    // The warning belongs to the box wherever the box is.
    await expect(block.locator('.feedback-not-support')).toBeVisible();

    // The same relay, a different shape. A note from here is still a note.
    await block.locator('.feedback-textarea').fill('The Swedish hours look wrong.');
    await block.getByRole('button', { name: /send/i }).click();

    await expect.poll(() => captured.bodies.length).toBe(1);
    const body = captured.bodies[0] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['locale', 'message', 'website']);
    expect(body.message).toBe('The Swedish hours look wrong.');
    expect(body).not.toHaveProperty('rating');
  });

  test('the note box has its own field id, so the header dialog does not collide with it', async ({
    page,
  }) => {
    // Two copies of the same form are mounted together here, and a shared id
    // would point the label at whichever the browser found first.
    await ordinaryResult(page);
    await page.locator('.app-header').getByRole('button', { name: /tell us/i }).click();
    await expect(page.locator('.feedback-dialog')).toBeVisible();

    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('.feedback-textarea')].map((el) => el.id),
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  test('is dismissible, and sends nothing when dismissed', async ({ page }) => {
    const captured = captureRating(page);
    await ordinaryResult(page);

    await expect(rating(page)).toBeVisible();
    await page.locator('.rating-dismiss').click();
    await expect(rating(page)).toHaveCount(0);
    expect(captured.bodies).toHaveLength(0);
  });

  test('is never on the crisis panel', async ({ page }) => {
    await openHome(page);
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
    await expect(crisisDialog(page).locator('.rating')).toHaveCount(0);
    await expect(crisisDialog(page)).not.toContainText(/was this useful|oliko tästä|var det här till nytta/i);
  });

  test('is gone for the rest of the session once the crisis path has opened', async ({ page }) => {
    // Opened by the person, not by an answer: the flag is sticky either way, and
    // this is the path that leaves no safety flag on the result to fall back on.
    await openHome(page);
    await crisisControl(page).click();
    await expect(crisisDialog(page)).toBeVisible();
    await page.locator('.panel-close').click();

    await startAssessment(page);
    await answerContext(page, { ageBand: '30-plus', duration: '1-6-months' });
    expect(await answerInstrumentsAt(page, 0)).toBe('result');

    await expect(page.locator('.result-header')).toBeVisible();
    await expect(rating(page)).toHaveCount(0);
    await expect(page.locator('.result-feedback')).toHaveCount(0);

    // Nothing was taken away: the same form is still one click away in the
    // header, on this screen as on every other.
    await expect(page.locator('.app-header').getByRole('button', { name: /tell us/i })).toBeVisible();
  });

  test('is never on a result reached through a crisis answer', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { ageBand: '30-plus', duration: 'over-a-year' });
    expect(await answerInstrumentsAt(page, 3)).toBe('crisis');

    // Carry on from the panel, which is allowed and ends at a result.
    await crisisDialog(page).getByRole('button', { name: /continue|jatka|fortsätt/i }).click();
    await answerInstrumentsAt(page, 3);

    await expect(rating(page)).toHaveCount(0);
    await expect(page.locator('.result-feedback')).toHaveCount(0);
  });

  test('is never on the under-18 screen', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { ageBand: 'under-18', duration: 'over-a-year' });
    expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');

    await expect(page.locator('.youth-result')).toBeVisible();
    await expect(rating(page)).toHaveCount(0);
    await expect(page.locator('.result-feedback')).toHaveCount(0);
  });
});
