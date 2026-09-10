/**
 * Language parity, checked on the running app.
 *
 * `t()` returns the ref itself when a key is missing, deliberately: a silent
 * English fallback is a bug that looks like a translation, and looking like a
 * translation is how it survives to production. That design makes this suite
 * simple — an unresolved key is *visible*, so we can walk every screen in all
 * three languages and assert that nothing that looks like a ref is on it.
 */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  answerContext,
  answerInstrumentsAt,
  crisisDialog,
  openHome,
  setUiLanguage,
  startAssessment,
  type UiLanguage,
} from './flow';

const LANGUAGES: UiLanguage[] = ['fi', 'sv', 'en'];

/**
 * What an unresolved ref looks like on screen: `result.scopeStatement.title`.
 * Dotted, no spaces, lower-case first segment. Real copy does not look like this,
 * and the few things that legitimately do — URLs, domain names, file names — are
 * excluded rather than the check being loosened.
 */
const REF_SHAPED = /(^|\s)([a-z][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+){1,})(\s|$)/;

const ALLOWED = [
  /\.fi\b/,
  /\.net\b/,
  /\.com\b/,
  /\.org\b/,
  /mieli\.fi/,
  /sekasin\.fi/,
  /tukinet\.fi/,
  /mtkl\.fi/,
  /arligttalat\.fi/,
  /7cups\.com/,
];

async function expectNoUnresolvedRefs(page: Page, screen: string, language: string) {
  const text = await page.locator('main').innerText();
  for (const line of text.split('\n')) {
    const match = line.match(REF_SHAPED);
    if (!match) continue;
    const candidate = match[2];
    if (ALLOWED.some((pattern) => pattern.test(candidate))) continue;
    throw new Error(`${language} / ${screen}: unresolved i18n ref on screen — "${candidate}"`);
  }
}

async function expectNoA11yViolations(page: Page, screen: string, language: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const described = serious
    .map((v) => `${v.id} (${v.impact}) — ${v.help}\n    ${v.nodes.map((n) => n.target).join('\n    ')}`)
    .join('\n  ');

  expect(serious, `${language} / ${screen}:\n  ${described}`).toEqual([]);
}

for (const language of LANGUAGES) {
  test.describe(`${language}`, () => {
    test('every screen resolves its copy and is free of serious a11y violations', async ({
      page,
    }) => {
      await openHome(page);
      await setUiLanguage(page, language);
      await expectNoUnresolvedRefs(page, 'home', language);
      await expectNoA11yViolations(page, 'home', language);

      await startAssessment(page);

      if (language !== 'en') {
        // The honest English-only notice is a screen in its own right.
        await expectNoUnresolvedRefs(page, 'language-notice', language);
        await expectNoA11yViolations(page, 'language-notice', language);
        await page.locator('.language-notice').getByRole('button').first().click();
      }

      await expect(page.locator('.progress-label')).toBeVisible();
      await expectNoUnresolvedRefs(page, 'context', language);
      await expectNoA11yViolations(page, 'context', language);

      await answerContext(page, { domain: 'anxiety', budget: 'none' });
      await expectNoUnresolvedRefs(page, 'questionnaire', language);
      await expectNoA11yViolations(page, 'questionnaire', language);

      expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');
      await expectNoUnresolvedRefs(page, 'result', language);
      await expectNoA11yViolations(page, 'result', language);

      // The transparency page, reached from the result where somebody reading
      // "why this" is most likely to want the whole mechanism.
      await page.locator('.reasons').getByRole('button').click();
      await expect(page.locator('.how-it-works')).toBeVisible();
      // The path builds on scroll; measure the composed page, not a frame of the
      // transition, or axe reads the mid-fade colour as a contrast failure.
      await page.locator('.hw-flow').scrollIntoViewIfNeeded();
      await expect(page.locator('.hw-flow')).toHaveClass(/is-built/);
      await page.waitForTimeout(2600);
      await expectNoUnresolvedRefs(page, 'how Reitti decides', language);
      await expectNoA11yViolations(page, 'how Reitti decides', language);
    });

    test('the crisis panel resolves its copy and is accessible', async ({ page }) => {
      await openHome(page);
      await setUiLanguage(page, language);
      await page.locator('.crisis-fab').click();
      await expect(crisisDialog(page)).toBeVisible();

      const panel = await crisisDialog(page).innerText();
      expect(panel.length).toBeGreaterThan(0);
      const match = panel.match(REF_SHAPED);
      if (match && !ALLOWED.some((p) => p.test(match[2]))) {
        throw new Error(`${language} / crisis: unresolved ref "${match[2]}"`);
      }

      await expectNoA11yViolations(page, 'crisis panel', language);
    });

    test('the youth screen resolves its copy', async ({ page }) => {
      await openHome(page);
      await setUiLanguage(page, language);
      await startAssessment(page);
      if (language !== 'en') {
        await page.locator('.language-notice').getByRole('button').first().click();
      }
      await answerContext(page, { ageBand: 'under-18' });
      expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

      await expect(page.locator('.youth-result')).toBeVisible();
      await expectNoUnresolvedRefs(page, 'youth result', language);
      await expectNoA11yViolations(page, 'youth result', language);
    });
  });
}

test.describe('the interface language is independent of the care language', () => {
  test('reading in English while asking for Finnish-language care is ordinary', async ({ page }) => {
    await openHome(page);
    await setUiLanguage(page, 'en');
    await startAssessment(page);
    await answerContext(page, { careLanguage: 'fi' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    const session = await page.evaluate(() => localStorage.getItem('reitti.v1'));
    const parsed = JSON.parse(session!);
    const context = parsed.sessions[0].context;

    // Two fields, not one. Conflating them is a bug the moment the bundles split.
    expect(context.careLanguage).toBe('fi');
    expect(context.uiLanguage).toBe('en');
  });
});
