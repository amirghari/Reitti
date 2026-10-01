/**
 * The questionnaire in Finnish and Swedish, per screener (D-36).
 *
 * A screener is asked in a language only when its official translation is
 * loaded. PHQ-4, PHQ-9, GAD-7, WHO-5 and AUDIT-C have one; PC-PTSD-5 and UCLA-3
 * do not, so a Finnish reader whose branch would open one of those goes on to
 * the rungs that fit, with one line saying so. The crisis path is the same in
 * every language.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  answerContext,
  answerInstrumentsAt,
  openHome,
  setUiLanguage,
  signature,
  startAssessment,
  type UiLanguage,
} from './flow';

const bundle = (name: string, language: string): Record<string, string> =>
  JSON.parse(readFileSync(join(process.cwd(), 'config', 'i18n', name, `${language}.json`), 'utf8'));
const fi = bundle('clinical', 'fi');

/**
 * Every English instrument string long enough to be unambiguous: items, stems
 * and answer labels. None may appear on a Finnish or Swedish page.
 */
const englishInstrumentText = Object.entries(bundle('clinical', 'en'))
  .filter(([key]) => /^instrument\.[^.]+\.(item\.|prompt$)|^scale\./.test(key))
  .map(([, text]) => text)
  .filter((text) => typeof text === 'string' && text.replace(/[^A-Za-z]/g, '').length >= 10);

/** An unresolved copy key renders as the key itself. */
const RAW_KEY = /\b(instrument|scale|band|milestone)\.[a-z0-9-]+(\.[a-z0-9-]+)+\b/;

async function answer(page: Page, index: number) {
  const before = await signature(page);
  await page.locator('.options .option').nth(index).click();
  await expect.poll(() => signature(page)).not.toBe(before);
}

async function expectNoEnglishInstrumentText(page: Page, where: string) {
  const text = await page.locator('body').innerText();
  for (const english of englishInstrumentText) expect(text, `${where} shows "${english}"`).not.toContain(english);
  expect(text, `${where} shows a raw key`).not.toMatch(RAW_KEY);
}

test.describe('a Finnish reader', () => {
  test('goes through PHQ-4 to PHQ-9 in Finnish, word for word', async ({ page }) => {
    await openHome(page);
    await setUiLanguage(page, 'fi');
    await expectNoEnglishInstrumentText(page, 'the Finnish home page');
    await startAssessment(page);
    await expect(page.locator('.language-notice')).toHaveCount(0);
    await answerContext(page, { domain: 'mood' });

    // PHQ-4, in the official Finnish wording.
    const question = page.locator('.question').first();
    await expect(question).toHaveAttribute('data-instrument', 'phq-4');
    await expect(question).toHaveText(fi['instrument.phq-4.item.q1']);
    await expectNoEnglishInstrumentText(page, 'Finnish PHQ-4');

    // The highest answers open PHQ-9; its first two items carry over from PHQ-4.
    for (let i = 0; i < 4; i++) await answer(page, 3);
    await expect(question).toHaveAttribute('data-instrument', 'phq-9');
    await expect(question).toHaveText(fi['instrument.phq-9.item.q3']);
    await expect(page.locator('.prompt')).toHaveText(fi['instrument.phq-9.prompt']);
    await expect(page.locator('.options .option').first()).toContainText(fi['scale.phq.0']);
    await expectNoEnglishInstrumentText(page, 'Finnish PHQ-9');

    // Through to the result, never touching the self-harm item's high answers.
    expect(await answerInstrumentsAt(page, 0, { avoidCrisisItem: true })).toBe('result');
    await expectNoEnglishInstrumentText(page, 'the Finnish result');
    // Nothing on this branch lacked a Finnish version, so no line about it.
    await expect(page.locator('.result-not-offered')).toHaveCount(0);
  });

  test('choosing loneliness skips the screener with no Finnish version and goes to the rungs, with one line saying so', async ({ page }) => {
    const seen: string[] = [];
    await openHome(page);
    await setUiLanguage(page, 'fi');
    await startAssessment(page);
    await answerContext(page, { domain: 'social' });

    // PHQ-4 at the lowest answers, recording every screener that is put to them.
    for (let i = 0; i < 20; i++) {
      if (await page.locator('.result-header').isVisible().catch(() => false)) break;
      const id = await page.locator('.question').first().getAttribute('data-instrument');
      if (id) seen.push(id);
      await answer(page, 0);
    }

    expect(seen).not.toContain('ucla-3');
    await expect(page.locator('.result-header')).toBeVisible();
    await expect(page.locator('.result-not-offered')).toHaveText(bundle('ui', 'fi')['result.notOfferedInLanguage']);
    await expect(page.locator('.rung-card, .fitting-rungs li, [data-rung]').first()).toBeVisible();
    await expectNoEnglishInstrumentText(page, 'the Finnish loneliness result');
  });
});

test.describe('in Swedish', () => {
  test('home and result never show English instrument text', async ({ page }) => {
    await openHome(page);
    await setUiLanguage(page, 'sv');
    await expectNoEnglishInstrumentText(page, 'the Swedish home page');
    await startAssessment(page);
    await answerContext(page, { domain: 'grief' });
    expect(await answerInstrumentsAt(page, 0, { avoidCrisisItem: true })).toBe('result');
    await expectNoEnglishInstrumentText(page, 'the Swedish result');
    // Grief would open PC-PTSD-5, which has no Swedish version.
    await expect(page.locator('.result-not-offered')).toBeVisible();
  });
});

test.describe('switching language in the middle of a screener', () => {
  test('to one it has no official version in skips it, rather than showing raw keys', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'social' });
    for (let i = 0; i < 12; i++) {
      const id = await page.locator('.question').first().getAttribute('data-instrument').catch(() => null);
      if (id === 'ucla-3') break;
      await answer(page, 0);
    }
    await expect(page.locator('.question').first()).toHaveAttribute('data-instrument', 'ucla-3');

    await setUiLanguage(page, 'fi' as UiLanguage);
    await expect(page.locator('.question[data-instrument="ucla-3"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/\binstrument\.ucla-3\./);
  });
});
