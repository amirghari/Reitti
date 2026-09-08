/**
 * Driving the V2 flow by *choice* rather than by position.
 *
 * `tests/a11y/flow.ts` deliberately answers "the lowest option" or "the highest
 * one", because those tests are about the shape of the screens and must not
 * break on a copy edit. The V2 scenarios are about specific journeys — a
 * sixteen-year-old, someone with no money, a moderate band — so they need to
 * pick a specific answer at a specific step.
 *
 * Options render in config order, so an index is a stable way to name a choice
 * without asserting on the clinician's wording. The maps below are that config
 * order, written out so a reader can see which journey a test is driving.
 */
import { expect, type Locator, type Page } from '@playwright/test';

export const DOMAIN = {
  mood: 0,
  anxiety: 1,
  work: 2,
  social: 3,
  grief: 4,
  substance: 5,
  general: 6,
} as const;

export const DURATION = {
  'under-a-month': 0,
  '1-6-months': 1,
  '6-12-months': 2,
  'over-a-year': 3,
} as const;

export const BUDGET = { none: 0, low: 1, moderate: 2, flexible: 3 } as const;
export const CARE_LANGUAGE = { fi: 0, sv: 1, en: 2 } as const;
export const AGE_BAND = { 'under-18': 0, '18-29': 1, '30-plus': 2 } as const;

export type UiLanguage = 'fi' | 'sv' | 'en';

export interface Journey {
  domain?: keyof typeof DOMAIN;
  duration?: keyof typeof DURATION;
  budget?: keyof typeof BUDGET;
  careLanguage?: keyof typeof CARE_LANGUAGE;
  ageBand?: keyof typeof AGE_BAND;
}

export const crisisControl = (page: Page): Locator => page.locator('.crisis-fab');
export const crisisDialog = (page: Page): Locator => page.getByRole('dialog');

export async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Switch the *interface* language. Independent of the care language. */
export async function setUiLanguage(page: Page, language: UiLanguage): Promise<void> {
  const label = { fi: 'Suomi', sv: 'Svenska', en: 'English' }[language];
  await page.locator('.language-switch').getByRole('button', { name: label }).click();
  await expect(
    page.locator('.language-chip', { hasText: label }),
  ).toHaveAttribute('aria-pressed', 'true');
}

export async function startAssessment(page: Page): Promise<void> {
  await page.locator('.app-header .btn').click();
}

/** Click the nth option on the current step and wait for the screen to change. */
async function chooseAt(page: Page, index: number): Promise<void> {
  const before = await signature(page);
  await page.locator('.options .option').nth(index).click();
  await expect
    .poll(() => signature(page), { timeout: 5_000, message: 'the screen did not change' })
    .not.toBe(before);
}

/**
 * Answer the five context questions, taking each choice from `journey` and
 * defaulting to a thirty-something with no money looking for Finnish-language
 * care — the person this product exists for.
 */
export async function answerContext(page: Page, journey: Journey = {}): Promise<void> {
  await expect(page.locator('.progress-label')).toBeVisible();
  const choices = [
    DOMAIN[journey.domain ?? 'mood'],
    DURATION[journey.duration ?? '1-6-months'],
    BUDGET[journey.budget ?? 'none'],
    CARE_LANGUAGE[journey.careLanguage ?? 'fi'],
    AGE_BAND[journey.ageBand ?? '30-plus'],
  ];
  for (const index of choices) await chooseAt(page, index);
}

/**
 * Items that trip the crisis path. Answering one of these at anything above zero
 * ends the flow in the crisis panel — correctly, which is why the crisis
 * scenario has a test of its own and every other scenario has to steer around it.
 */
const CRISIS_ITEMS = new Set(['phq-9:q9']);

export interface AnswerOptions {
  /**
   * Answer the crisis item at zero, so a "moderate band" journey reaches a
   * result instead of the crisis panel. Off for the crisis scenario itself.
   */
  avoidCrisisItem?: boolean;
  maxAnswers?: number;
}

/**
 * Answer every remaining instrument at one point on its scale, until the flow
 * ends. Index 0 is the lowest-severity answer, 3 the highest on a PHQ scale.
 */
export async function answerInstrumentsAt(
  page: Page,
  index: number,
  options: AnswerOptions = {},
): Promise<'result' | 'crisis'> {
  const { avoidCrisisItem = false, maxAnswers = 60 } = options;

  for (let i = 0; i < maxAnswers; i++) {
    const state = await signature(page);
    if (state === 'crisis' || state === 'result') return state;

    // Some instruments have a shorter scale than others (yes/no gates, AUDIT-C).
    const count = await page.locator('.options .option').count();
    if (count === 0) throw new Error(`no options on screen: ${state}`);

    const question = page.locator('.question').first();
    const id = await question.evaluate(
      (el) => `${el.getAttribute('data-instrument')}:${el.getAttribute('data-item')}`,
    );

    const wanted = avoidCrisisItem && CRISIS_ITEMS.has(id) ? 0 : index;
    await chooseAt(page, Math.min(wanted, count - 1));
  }
  throw new Error(`the flow did not finish within ${maxAnswers} answers`);
}

/** A cheap fingerprint of the current screen. Crisis and result are terminal. */
export async function signature(page: Page): Promise<string> {
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
