/**
 * The V2 scenarios, in Finnish, Swedish and English.
 *
 * These are the promises the V2 brief makes to a person, checked against the
 * running app rather than against the engine: free options first with what they
 * cost, a set of fitting rungs and never a single recommendation, a crisis
 * answer that bypasses talking support, a sixteen-year-old who is handed to
 * Sekasin, and a budget that reorders without ever hiding a rung.
 */
import { expect, test } from '@playwright/test';
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
 * The questionnaires only run where we hold the OFFICIAL validated translation,
 * which today is English alone. A Finnish or Swedish run therefore meets the
 * honest notice first and continues from there — which is itself a scenario
 * worth asserting, so it is asserted rather than skipped.
 */
async function startAssessmentIn(page: import('@playwright/test').Page, language: UiLanguage) {
  await openHome(page);
  await setUiLanguage(page, language);
  await startAssessment(page);

  if (language !== 'en') {
    const notice = page.locator('.language-notice');
    await expect(notice, 'a non-English run must be told the questions are English-only').toBeVisible();
    await notice.getByRole('button').first().click();
  }
  await expect(page.locator('.progress-label')).toBeVisible();
}

test.describe('the free public options are on the front door', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await openHome(page);
      await setUiLanguage(page, language);

      // Reachable with nothing answered — no assessment, no account, no referral.
      const entryPoints = page.locator('.entry-points');
      await expect(entryPoints).toBeVisible();

      const ids = await entryPoints
        .locator('.option-card')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-entry')));
      expect(ids).toContain('terapianavigaattori');
      expect(ids).toContain('mielenterveystalo-omahoito');

      // Somebody who already holds a consent code must not have to answer
      // twelve screening questions to be told they did not need to.
      await expect(entryPoints.locator('.option-consent-code')).toBeVisible();

      // Nothing paid, nothing international on the front door.
      for (const id of ids) {
        const card = entryPoints.locator(`.option-card[data-entry="${id}"]`);
        await expect(card).toHaveAttribute('data-cost', 'free');
        await expect(card).not.toHaveAttribute('data-fallback', 'true');
      }

      // And the ladder card names what is free rather than only asserting it is.
      const firstRung = page.locator('.ladder-row').first();
      await expect(firstRung.locator('.ladder-free a')).toBeVisible();
    });
  }
});

test.describe('a mild band sees free options first, with what each costs', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { budget: 'none' });
      expect(await answerInstrumentsAt(page, 1)).toBe('result');

      // Every rung on offer names its cost. "What will this cost me" is the
      // question the ladder exists to answer.
      const rungs = page.locator('.fitting-rung');
      expect(await rungs.count()).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < (await rungs.count()); i++) {
        await expect(rungs.nth(i).locator('.fitting-rung-cost')).not.toBeEmpty();
      }

      // Free before paid, inside the first rung that offers both.
      const costs = await page.locator('.option-card .option-cost').allInnerTexts();
      expect(costs.length, 'no directory options rendered').toBeGreaterThan(0);

      const bands = await page
        .locator('.option-card')
        .evaluateAll((cards) => cards.map((c) => c.getAttribute('data-cost')));
      const firstPaid = bands.findIndex((b) => b === 'self-pay' || b === 'employer-paid');
      const lastFree = bands.lastIndexOf('free');
      if (firstPaid !== -1 && lastFree !== -1) expect(lastFree).toBeLessThan(firstPaid);
    });
  }
});

test.describe('a moderate band sees a set of rungs, never a single recommendation', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { domain: 'anxiety', duration: '1-6-months' });
      expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');

      const rungs = page.locator('.fitting-rung');
      const count = await rungs.count();
      expect(count, 'a set is 2–3 rungs').toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(3);

      // With RECOMMEND_RUNG off, the single-suggestion view must not render.
      await expect(page.locator('.recommended')).toHaveCount(0);
      await expect(page.locator('[data-recommended-rung]')).toHaveCount(0);

      // Ascending ladder order, so the computed rung cannot leak through position.
      const levels = await rungs.evaluateAll((els) =>
        els.map((e) => Number(e.getAttribute('data-level'))),
      );
      expect([...levels].sort((a, b) => a - b)).toEqual(levels);

      // The scope statement is on every result screen.
      await expect(page.locator('.scope-statement')).toBeVisible();
      await expect(page.locator('.fitting-you-choose')).toBeVisible();
    });
  }
});

test.describe('a crisis answer goes to humans, and bypasses rung 2 entirely', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { domain: 'mood', duration: 'over-a-year' });
      expect(await answerInstrumentsAt(page, 3)).toBe('crisis');

      await expect(crisisDialog(page)).toBeVisible();

      // Rung 2 is talking support, not the crisis path. Somebody who has just
      // disclosed self-harm needs Kriisipuhelin, not a peer chat that opens at six.
      await expect(page.locator('[data-rung="peer-community"]')).toHaveCount(0);
      await expect(page.locator('[data-entry="7cups"]')).toHaveCount(0);
      await expect(page.locator('[data-entry="tukinet"]')).toHaveCount(0);

      // A real phone number, not a chatbot.
      await expect(crisisDialog(page)).toContainText(/\d{2,3}\s?\d{3}\s?\d{4}|112/);
    });
  }
});

test.describe('an under-18 is handed to youth services and nothing else', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { ageBand: 'under-18', budget: 'flexible', duration: 'over-a-year' });
      expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');

      await expect(page.locator('.youth-result')).toBeVisible();

      // No ladder, no cost table, no adult private rung — whatever they answered.
      await expect(page.locator('.fitting-rung')).toHaveCount(0);
      await expect(page.locator('.ladder-overview')).toHaveCount(0);
      await expect(page.locator('[data-rung="short-term-individual"]')).toHaveCount(0);
      await expect(page.locator('[data-rung="kela-rehabilitative"]')).toHaveCount(0);
      await expect(page.locator('[data-entry="7cups"]')).toHaveCount(0);

      // Somewhere to actually go, and the crisis path, which is for everyone.
      await expect(page.locator('[data-entry="sekasin"]')).toBeVisible();
      await expect(page.locator('.crisis-fab')).toBeVisible();
      await expect(page.locator('.youth-crisis-note')).toBeVisible();
    });
  }
});

test.describe('budget reorders the ladder and never shortens it', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { budget: 'none' });
      expect(await answerInstrumentsAt(page, 1)).toBe('result');

      const ladder = page.locator('.ladder-overview .ladder-item');
      const all = await ladder.evaluateAll((els) => els.map((e) => e.getAttribute('data-rung')));
      expect(all).toHaveLength(6);

      // Free and public first when there is no money.
      const publicFirst = ['self-help', 'peer-community', 'nettiterapia', 'kela-rehabilitative'];
      const lastPublic = all.map((id) => publicFirst.includes(id!)).lastIndexOf(true);
      const firstPrivate = all.findIndex((id) => !publicFirst.includes(id!));
      expect(lastPublic).toBeLessThan(firstPrivate);

      // Switch to "cost isn't the constraint": the order changes, the set does not.
      await page.locator('.budget-chip').nth(3).click();
      const reordered = await ladder.evaluateAll((els) =>
        els.map((e) => e.getAttribute('data-rung')),
      );
      expect(reordered).toHaveLength(6);
      expect([...reordered].sort()).toEqual([...all].sort());
      expect(reordered).not.toEqual(all);
    });
  }
});

test.describe('a referral never leaves someone with only a link', () => {
  test('while-you-wait and the group waitlist follow a referral rung', async ({ page }) => {
    await startAssessmentIn(page, 'en');
    await answerContext(page, { domain: 'anxiety', duration: 'over-a-year' });
    expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');

    const referral = page.locator('.fitting-rung[data-rung="nettiterapia"]');
    if ((await referral.count()) > 0) {
      await expect(referral.locator('.while-you-wait')).toBeVisible();
      await expect(referral.locator('.waitlist')).toBeVisible();
    }
  });
});

test.describe('there is always a person to talk to', () => {
  for (const language of LANGUAGES) {
    test(`${language}`, async ({ page }) => {
      await startAssessmentIn(page, language);
      await answerContext(page, { careLanguage: language === 'en' ? 'en' : language });
      expect(await answerInstrumentsAt(page, 1)).toBe('result');

      const human = page.locator('.human-option');
      await expect(human).toBeVisible();
      await expect(human.locator('.option-card')).toHaveCount(1);
      // Never an unmoderated international service as the first suggestion.
      await expect(human.locator('[data-entry="7cups"]')).toHaveCount(0);
      await expect(page.locator('.human-public-route')).toBeVisible();
    });
  }
});

test.describe('rung 2 shows who you would be talking to', () => {
  test('every talking-support card names who answers, hours and anonymity', async ({ page }) => {
    await startAssessmentIn(page, 'en');
    // A mild band with no social domain lands on peer-community itself: the
    // social domain would send modifier M5 to a group rung instead.
    await answerContext(page, { domain: 'mood', duration: 'under-a-month' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    const rungTwo = page.locator('.fitting-rung[data-rung="peer-community"]');
    await expect(rungTwo, 'a mild band must reach the talking-support rung').toHaveCount(1);

    const cards = rungTwo.locator('.option-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card.locator('.option-operator')).not.toBeEmpty();
      await expect(card.locator('.option-verified')).not.toBeEmpty();
      const facts = await card.locator('.option-facts dt').allInnerTexts();
      expect(facts.length, 'who answers / hours / anonymity must be on the card').toBe(5);
    }

    // 7 Cups is last, and never without its caution.
    const ids = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-entry')));
    const sevenCups = ids.indexOf('7cups');
    if (sevenCups !== -1) {
      expect(sevenCups, '7 Cups must be last').toBe(ids.length - 1);
      await expect(cards.nth(sevenCups).locator('.option-caution')).toBeVisible();
    }
  });
});
