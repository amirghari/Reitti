/**
 * Driving the real routing spine: home → context → questions → result, plus the
 * crisis panel that sits over all four.
 *
 * Deliberately position-based rather than label-based. Every user-facing string
 * on these screens comes from `config/i18n`, which is the clinician's surface and
 * is expected to change without a code review — a test that asserts on that
 * wording would break on a copy edit and teach everyone to ignore it. Position
 * carries what these tests actually need: "answer the lowest option" or "answer
 * the highest one".
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** Lowest-severity answer, or "Yes" on a gate; highest-severity answer, or "No". */
export type Pick = 'first' | 'last';

/** The always-present control from safety invariant 1. */
export const crisisControl = (page: Page): Locator => page.locator('.crisis-fab');

export const crisisDialog = (page: Page): Locator => page.getByRole('dialog');

export async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** The header entry point, which exists on every screen. */
export async function startAssessment(page: Page): Promise<void> {
  await page
    .locator('.app-header')
    .getByRole('button', { name: 'Find your path' })
    .click();
  await expect(page.locator('.progress-label')).toContainText('Step 1 of');
}

/** The four non-clinical context questions (domain, duration, budget, language). */
export async function answerContext(page: Page, pick: Pick = 'first'): Promise<void> {
  await expect(page.locator('.progress-label')).toContainText('Step 1 of');

  // Bounded: the context step count lives in config and could grow.
  for (let i = 0; i < 10; i++) {
    const label = await text(page.locator('.progress-label').first());
    if (!label?.startsWith('Step')) return;
    await answerOne(page, pick);
  }
  throw new Error('the context questions never handed off to an instrument');
}

/**
 * Answer instruments until the flow ends. Returns where it ended: `result` for a
 * completed routing, `crisis` when an answer tripped the crisis item first.
 *
 * Pass `seen` to collect the wording of every question actually put to the
 * person, in order.
 */
export async function answerInstruments(
  page: Page,
  pick: Pick,
  maxAnswers = 60,
  seen?: string[],
): Promise<'result' | 'crisis'> {
  for (let i = 0; i < maxAnswers; i++) {
    const state = await signature(page);
    if (state === 'crisis' || state === 'result') return state;
    if (seen) {
      const question = await text(page.locator('.question').first());
      if (question) seen.push(question.trim());
    }
    await answerOne(page, pick);
  }
  throw new Error(`the flow did not finish within ${maxAnswers} answers`);
}

/** The wording of the question currently on screen. */
export const currentQuestion = (page: Page): Promise<string | null> =>
  text(page.locator('.question').first());

/** Answer the current screen and wait for the app to render whatever comes next. */
export async function answerOne(page: Page, pick: Pick): Promise<void> {
  const before = await signature(page);
  const options = page.locator('.options .option');
  await (pick === 'first' ? options.first() : options.last()).click();

  await expect
    .poll(() => signature(page), {
      timeout: 5_000,
      message: 'the screen did not change after answering',
    })
    .not.toBe(before);
}

/**
 * A cheap fingerprint of the current screen, so waiting is on an actual state
 * change rather than on a sleep. Crisis and result are terminal and named.
 */
async function signature(page: Page): Promise<string> {
  if (await visible(crisisDialog(page))) return 'crisis';
  if (await visible(page.locator('.result-header'))) return 'result';

  const label = await text(page.locator('.progress-label').first());
  const question = await text(page.locator('.question').first());
  return `${label ?? ''}::${question ?? ''}`;
}

const visible = (locator: Locator): Promise<boolean> =>
  locator.first().isVisible().catch(() => false);

const text = (locator: Locator): Promise<string | null> =>
  locator.textContent({ timeout: 1_000 }).catch(() => null);
