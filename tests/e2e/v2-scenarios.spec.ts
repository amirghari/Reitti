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
      // Every rung-2 entry is a service with a person on the other end, so all
      // five facts are required here. `Who you talk to` is omitted only for
      // self-guided resources, which do not belong on this rung at all.
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

test.describe('feedback is reachable from anywhere, not just the home page', () => {
  test('the header opens it, and it behaves as a modal', async ({ page }) => {
    await openHome(page);

    const trigger = page.locator('.app-header').getByRole('button', { name: /tell us/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await trigger.click();
    const dialog = page.locator('.feedback-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    // The warning is inside the dialog too, not only in the page section.
    await expect(dialog.locator('.feedback-not-support')).toBeVisible();

    // Focus starts inside and Tab does not walk out into the page behind.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const panel = document.querySelector('.feedback-dialog');
        return !!panel && panel.contains(document.activeElement);
      });
      expect(inside, `Tab ${i + 1} escaped the dialog`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('it opens from a result screen without losing the result', async ({ page }) => {
    // The whole reason for the dialog: an opinion formed on the result screen
    // had nowhere to go, because the section lives at the foot of the home page.
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'mood' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    await page.locator('.app-header').getByRole('button', { name: /tell us/i }).click();
    await expect(page.locator('.feedback-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    // The result is still there underneath.
    await expect(page.locator('.result-header')).toBeVisible();
    await expect(page.locator('.fitting-rung').first()).toBeVisible();
  });
});

test.describe('"How Reitti decides" — the transparency page', () => {
  for (const language of LANGUAGES) {
    test(`${language}: reachable, complete, and legible`, async ({ page }) => {
      await openHome(page);
      await setUiLanguage(page, language);

      await page.locator('.header-nav').getByRole('button', { name: /how reitti decides|miten reitti|hur reitti/i }).click();
      await expect(page.locator('.how-it-works')).toBeVisible();

      // The whole path is present, in order, and none of it is a picture of text.
      const stages = page.locator('.hw-flow .hw-stage');
      await expect(stages).toHaveCount(4);
      await expect(page.locator('.hw-crisis')).toBeVisible();
      // Not a literal: hard-coding three is precisely the bug this page had,
      // and the page understated the funnel for a day because of it. Every
      // deeper screener the funnel can open has to be named here.
      const branches = await page
        .locator('.hw-branch')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-instrument')));
      expect(branches.sort()).toEqual(['audit-c', 'gad-7', 'pc-ptsd-5', 'phq-9', 'ucla-3']);

      await expect(page.locator('.hw-trust .hw-chip')).toHaveCount(4);

      // Every questionnaire is described, including the entry screener and the
      // one that is not in the funnel at all.
      await expect(page.locator('.hw-table tbody tr')).toHaveCount(7);

      // A text alternative for the diagram, in the reader's language.
      const alt = await page.locator('.hw-flow').getAttribute('aria-label');
      expect(alt && alt.length).toBeGreaterThan(80);

      // The claim the page exists to make, and the honesty that qualifies it.
      await expect(page.locator('.hw-note')).toBeVisible();

      // And the edges. An outside review asked how this handles adolescents,
      // severe cases, regional variation, waiting times and other languages.
      await expect(page.locator('.hw-limits-list li')).toHaveCount(6);

      // Nothing ref-shaped leaked through untranslated.
      const text = await page.locator('.how-it-works').innerText();
      expect(text).not.toMatch(/(^|\s)howItWorks\.[a-zA-Z.]+/);
    });
  }

  test('the diagram composes even with motion disabled', async ({ browser }) => {
    // Non-negotiable: many people here need reduced motion, and the page must
    // read identically for them. The starting state lives inside a
    // `no-preference` query, so the final composition is the base case.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await openHome(page);
    await page.locator('.header-nav').getByRole('button', { name: /how reitti decides|miten reitti|hur reitti/i }).click();
    await expect(page.locator('.how-it-works')).toBeVisible();

    for (const selector of ['.hw-stage', '.hw-crisis', '.hw-options', '.hw-trust .hw-chip']) {
      const box = page.locator(selector).first();
      await expect(box).toBeVisible();
      const style = await box.evaluate((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });
      expect(Number(style.opacity), `${selector} is invisible without motion`).toBe(1);
      expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(style.transform);
    }
    await context.close();
  });

  test('the green box passes AA, which the reference mockup did not', async ({ page }) => {
    await openHome(page);
    await page.locator('.header-nav').getByRole('button', { name: /how reitti decides|miten reitti|hur reitti/i }).click();
    const sub = page.locator('.hw-options .hw-stage-sub');
    await expect(sub).toBeVisible();

    const ratio = await sub.evaluate((el) => {
      const parse = (c: string) => (c.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const fg = lum(parse(getComputedStyle(el).color));
      const bg = lum(parse(getComputedStyle(el.closest('.hw-options') as Element).backgroundColor));
      const hi = Math.max(fg, bg);
      const lo = Math.min(fg, bg);
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio, 'subtext on the green box must pass AA for small text').toBeGreaterThanOrEqual(4.5);
  });

  test('it opens from the result and goes back to it', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'mood' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    await page.locator('.reasons').getByRole('button').click();
    await expect(page.locator('.how-it-works')).toBeVisible();

    await page.locator('.how-it-works').getByRole('button').last().click();
    await expect(page.locator('.result-header')).toBeVisible();
  });
});
