/**
 * The behaviours a DOM scan cannot judge: where focus goes, what gets announced,
 * whether the progress bar tells the truth, and whether a refresh throws the
 * person's answers away.
 *
 * Each of these was a real gap, not a hypothetical one.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  answerContext,
  answerInstruments,
  answerOne,
  crisisControl,
  crisisDialog,
  currentQuestion,
  openHome,
  startAssessment,
} from './flow';

/** Where focus is, as a selector-ish description, for readable failures. */
const activeDescription = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return '(nothing)';
    return `${el.tagName.toLowerCase()}${el.className ? `.${el.className.split(' ').join('.')}` : ''}`;
  });

test.describe('the crisis dialog holds focus', () => {
  test('Tab cannot leave the panel', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await crisisControl(page).click();
    await crisisDialog(page).waitFor();

    // Enough tabs to lap the panel several times over. `aria-modal` is a promise
    // to assistive tech; without a trap, Tab walks into the questionnaire behind.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() =>
        Boolean(document.querySelector('.panel')?.contains(document.activeElement)),
      );
      expect(inside, `focus left the crisis panel after ${i + 1} tabs, onto ${await activeDescription(page)}`).toBe(true);
    }
  });

  test('Shift+Tab cannot leave it either', async ({ page }) => {
    await openHome(page);
    await crisisControl(page).click();
    await crisisDialog(page).waitFor();

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Shift+Tab');
      const inside = await page.evaluate(() =>
        Boolean(document.querySelector('.panel')?.contains(document.activeElement)),
      );
      expect(inside, `focus left the crisis panel backwards after ${i + 1} tabs`).toBe(true);
    }
  });

  test('closing returns focus to whatever opened it', async ({ page }) => {
    await openHome(page);

    await crisisControl(page).focus();
    await page.keyboard.press('Enter');
    await crisisDialog(page).waitFor();

    await page.keyboard.press('Escape');
    await expect(crisisDialog(page)).toBeHidden();

    // Not the top of the document — the control the person actually left.
    await expect(crisisControl(page)).toBeFocused();
  });
});

test.describe('the screen announces itself', () => {
  test('the live region carries the current question, and updates', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);

    const live = page.locator('[role="status"]').first();
    await expect(live).toHaveAttribute('role', 'status');

    await answerContext(page);

    const question = (await page.locator('.question').first().innerText()).trim();
    await expect(live).toContainText(question);

    const before = await live.innerText();
    await page.locator('.options .option').first().click();
    await expect(live).not.toHaveText(before);

    const next = (await page.locator('.question').first().innerText()).trim();
    await expect(live).toContainText(next);
  });

  test('it goes quiet while the crisis dialog is speaking', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await crisisControl(page).click();
    await crisisDialog(page).waitFor();

    await expect(page.locator('main [role="status"]').first()).toHaveText('');
  });
});

test.describe('the progress bar tells the truth', () => {
  test('the drawn width matches the announced value on every screen', async ({ page }) => {
    // The bar animates its width over 0.25s, so a measurement taken right after
    // a click catches it mid-flight. Reduced motion is the app's own switch for
    // turning that off — no test-only hook needed.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await startAssessment(page);

    for (let step = 0; step < 24; step++) {
      const bar = page.locator('.progress');
      if ((await bar.count()) === 0) break;

      const { drawn, now, max } = await bar.first().evaluate((el) => {
        const fill = el.querySelector('.progress-bar') as HTMLElement;
        return {
          drawn: (fill.getBoundingClientRect().width / el.getBoundingClientRect().width) * 100,
          now: Number(el.getAttribute('aria-valuenow')),
          max: Number(el.getAttribute('aria-valuemax')),
        };
      });

      // The bar used to render index/length while announcing index+1, so the
      // sighted reader saw 0% on question 1 and a screen reader heard "1 of 9".
      expect(drawn, `drawn ${drawn.toFixed(1)}% vs announced ${now}/${max}`).toBeCloseTo(
        (now / max) * 100,
        0,
      );
      expect(now).toBeGreaterThanOrEqual(1);

      const options = page.locator('.options .option');
      if ((await options.count()) === 0) break;
      await options.first().click();
      await page.waitForTimeout(60);
      if (await crisisDialog(page).isVisible().catch(() => false)) break;
      if ((await page.locator('.result-header').count()) > 0) break;
    }
  });
});

test.describe('a refresh does not throw the answers away', () => {
  test('the questionnaire resumes where it was', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);

    // Get a few questions in, so there is something worth losing.
    for (let i = 0; i < 3; i++) {
      await page.locator('.options .option').first().click();
      await page.waitForTimeout(60);
    }
    const before = await page.locator('.progress-label').first().innerText();

    await page.reload();

    await expect(page.locator('.progress-label').first()).toHaveText(before);
    await expect(page.locator('.question').first()).toBeVisible();
  });

  test('but a fresh tab starts clean — the draft is not on the device', async ({ page, context }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await page.locator('.options .option').first().click();
    await page.waitForTimeout(60);

    // sessionStorage, not localStorage: a half-finished set of symptom answers
    // must not outlive the tab on a shared device.
    const fresh = await context.newPage();
    await fresh.goto('/');
    await expect(fresh.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(fresh.locator('.progress-label')).toHaveCount(0);
    await fresh.close();
  });
});

test.describe('the same question is never asked twice', () => {
  test('no wording repeats across the whole assessment', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, 'first');

    const seen: string[] = [];
    const record = async () => {
      const question = await currentQuestion(page);
      if (question) seen.push(question.trim());
    };

    // Top of the scale through the entry screener, so PHQ-4 branches to *both*
    // PHQ-9 and GAD-7 — the path where the duplicated items appear. Then the
    // bottom of the scale, so PHQ-9's crisis item is answered 0 and the run
    // reaches a result rather than the crisis panel.
    for (let i = 0; i < 4; i++) {
      await record();
      await answerOne(page, 'last');
    }
    const ending = await answerInstruments(page, 'first', 60, seen);
    expect(ending).toBe('result');

    const duplicates = seen.filter((q, i) => seen.indexOf(q) !== i);
    expect(duplicates, `asked again: ${duplicates.join(' | ')}`).toEqual([]);

    // It really did walk more than the 4-item entry screener.
    expect(seen.length).toBeGreaterThan(10);
  });

  test('what was reused is shown, and can be refused', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, 'last');

    // Walk until a carried-over note appears, answering the highest option so
    // PHQ-4 branches onward.
    let note = page.locator('.carried-note');
    for (let i = 0; i < 12 && (await note.count()) === 0; i++) {
      const options = page.locator('.options .option');
      if ((await options.count()) === 0) break;
      await options.last().click();
      await page.waitForTimeout(60);
      if (await crisisDialog(page).isVisible().catch(() => false)) break;
      note = page.locator('.carried-note');
    }

    if ((await note.count()) === 0) test.skip(true, 'this path carried nothing');

    await expect(note.first()).toBeVisible();
    const asked = Number((await page.locator('.progress-label').first().innerText()).match(/of (\d+)/)?.[1]);

    // Refusing the carry-over asks the full instrument instead.
    await note.first().locator('summary').click();
    await note.first().getByRole('button', { name: /answer these again/i }).click();

    const afterRefusal = Number(
      (await page.locator('.progress-label').first().innerText()).match(/of (\d+)/)?.[1],
    );
    expect(afterRefusal).toBeGreaterThan(asked);
  });
});
