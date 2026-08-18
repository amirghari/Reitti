/**
 * An axe-core scan of every screen a person can actually reach, in each of the
 * three projects in `playwright.config.ts` (desktop, OS high-contrast, phone).
 *
 * The screens are reached by walking the real flow rather than by deep-linking,
 * because the app holds its state in memory and because the walk is the thing
 * being made accessible.
 */
import { test } from '@playwright/test';
import { expectNoA11yViolations } from './axe';
import {
  answerContext,
  answerInstruments,
  crisisControl,
  crisisDialog,
  openHome,
  startAssessment,
} from './flow';

test.describe('accessibility', () => {
  test('home', async ({ page }, testInfo) => {
    await openHome(page);
    await expectNoA11yViolations(page, testInfo, 'home');
  });

  test('crisis panel, opened from the always-present control', async ({ page }, testInfo) => {
    await openHome(page);
    await crisisControl(page).click();
    await crisisDialog(page).waitFor();
    await expectNoA11yViolations(page, testInfo, 'crisis panel (self-opened)');
  });

  test('context questions', async ({ page }, testInfo) => {
    await openHome(page);
    await startAssessment(page);
    await expectNoA11yViolations(page, testInfo, 'context questions');
  });

  test('questionnaire', async ({ page }, testInfo) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await expectNoA11yViolations(page, testInfo, 'questionnaire');
  });

  test('result', async ({ page }, testInfo) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await answerInstruments(page, 'first');
    await expectNoA11yViolations(page, testInfo, 'result');
  });

  test('crisis panel, triggered by an answer', async ({ page }, testInfo) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, 'last');
    await answerInstruments(page, 'last');
    await crisisDialog(page).waitFor();
    await expectNoA11yViolations(page, testInfo, 'crisis panel (answer-triggered)');
  });
});
