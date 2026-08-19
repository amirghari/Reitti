import { test } from '@playwright/test';
import { answerContext, answerOne, crisisControl, openHome, startAssessment } from '../a11y/flow';

const DIR = 'docs/images';

test('capture the flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await openHome(page);
  await page.screenshot({ path: `${DIR}/home.png` });

  await startAssessment(page);
  await page.screenshot({ path: `${DIR}/context.png` });

  await answerContext(page, 'first');
  await page.screenshot({ path: `${DIR}/question.png` });

  await crisisControl(page).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: `${DIR}/crisis.png` });
  await page.keyboard.press('Escape');

  // Top of the scale through PHQ-4 so it branches, then the bottom so the run
  // reaches a result rather than the crisis panel.
  for (let i = 0; i < 4; i++) await answerOne(page, 'last');
  for (let i = 0; i < 40; i++) {
    if ((await page.locator('.result-header').count()) > 0) break;
    if ((await page.locator('.carried-note').count()) > 0) {
      await page.screenshot({ path: `${DIR}/carried.png` });
    }
    await answerOne(page, 'first');
  }
  await page.locator('.result-header').waitFor();
  await page.screenshot({ path: `${DIR}/result.png`, fullPage: true });
});
