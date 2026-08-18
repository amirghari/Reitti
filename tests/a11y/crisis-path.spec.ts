/**
 * Safety invariants 1–4, checked at the UI level.
 *
 * `packages/engine/test/invariants.test.ts` already proves these hold in the
 * config and the pure logic. It cannot see a control that renders off-screen, a
 * dialog that never takes focus, or a panel that no keyboard can open — which is
 * where a crisis path actually fails a person. These tests cover that gap, and
 * they run in all three projects, so "reachable" includes on a phone and in OS
 * high-contrast mode.
 *
 * If one of these fails, the failure is correct and the feature is wrong.
 */
import { expect, test } from '@playwright/test';
import {
  answerContext,
  answerInstruments,
  crisisControl,
  crisisDialog,
  openHome,
  startAssessment,
} from './flow';

test.describe('crisis path', () => {
  test('invariant 1 — the control is on every screen, with nothing completed first', async ({
    page,
  }) => {
    await openHome(page);
    await expect(crisisControl(page)).toBeVisible();

    await startAssessment(page);
    await expect(crisisControl(page)).toBeVisible();

    await answerContext(page);
    await expect(crisisControl(page)).toBeVisible();

    await answerInstruments(page, 'first');
    await expect(page.locator('.result-header')).toBeVisible();
    await expect(crisisControl(page)).toBeVisible();

    // "No sign-up" is structural: there is no client account anywhere in V1.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('invariant 1 — the control opens with the keyboard alone', async ({ page }) => {
    await openHome(page);

    await crisisControl(page).focus();
    await expect(crisisControl(page)).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(crisisDialog(page)).toBeVisible();
  });

  test('the panel behaves as a modal dialog: focus enters it, Escape leaves', async ({ page }) => {
    await openHome(page);
    await crisisControl(page).click();

    const dialog = crisisDialog(page);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(/.+/);
    await expect(page.locator('.panel-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('invariant 3 — the panel offers trained humans by phone, never a chatbot', async ({
    page,
  }) => {
    await openHome(page);
    await crisisControl(page).click();

    const dialog = crisisDialog(page);
    await expect(dialog).toContainText(/MIELI/i);

    // Every listed resource is a number someone can actually call.
    const calls = dialog.locator('a.crisis-call');
    await expect(calls).not.toHaveCount(0);
    for (const href of await calls.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    )) {
      expect(href).toMatch(/^tel:\+?[\d]+$/);
    }
    await expect(dialog).toContainText('112');

    // Nothing here may offer to talk to a machine instead.
    await expect(dialog.getByRole('textbox')).toHaveCount(0);
    await expect(dialog.locator('textarea')).toHaveCount(0);
    expect(await dialog.innerText()).not.toMatch(/\bchat|\bAI\b|\bbot\b|assistant/i);
  });

  test('invariant 2 — a crisis-flagged answer interrupts before scoring continues', async ({
    page,
  }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, 'last');

    const ending = await answerInstruments(page, 'last');
    expect(ending).toBe('crisis');

    const dialog = crisisDialog(page);
    await expect(dialog).toBeVisible();

    // Still mid-questionnaire: no result was scored or shown behind the panel,
    // and the panel offers to resume rather than to finish.
    await expect(page.locator('.result-header')).toHaveCount(0);
    await expect(page.locator('.progress-label')).toContainText('Question');
    await expect(dialog.getByRole('button', { name: /continue/i })).toBeVisible();

    // Answering cannot continue behind the panel.
    await expect(page.locator('.options .option').first()).toBeDisabled();
  });

  test('invariant 4 — the result names no disorder and says plainly it is not a diagnosis', async ({
    page,
  }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await answerInstruments(page, 'first');

    const main = page.locator('main');
    await expect(main.locator('.result-header')).toBeVisible();

    const shown = await main.innerText();
    expect(shown).not.toMatch(/\bdisorders?\b/i);
    await expect(main).toContainText(/does not diagnose/i);
  });
});
