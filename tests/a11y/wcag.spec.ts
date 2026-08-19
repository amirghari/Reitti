/**
 * The WCAG criteria axe cannot see.
 *
 * axe reads the DOM; these are all questions about what the *layout* does under
 * conditions the person controls, not the site — a 320px viewport, text spacing
 * overridden by a user stylesheet, motion turned off at the OS. They fail
 * silently and only for the people who need them, which is exactly why they need
 * a machine watching.
 */
import { expect, test, type Page } from '@playwright/test';
import { answerContext, answerInstruments, crisisControl, openHome, startAssessment } from './flow';

/**
 * Horizontal overflow of the page as a whole, named. Returns '' when the page
 * fits; otherwise a description of what is sticking out.
 *
 * The naming matters more than it looks. A bare "the page scrolls sideways" sends
 * whoever reads the CI log off to reproduce it locally — and this check does not
 * reproduce locally on macOS, where scrollbars are overlays and a 320px viewport
 * really is 320px wide. On Linux a classic scrollbar takes ~15px, so the same
 * test runs against 305px and is strictly harder. That asymmetry is worth
 * keeping, because 305px is also roughly what a person gets at 400% zoom — but
 * only if a failure explains itself where it happens.
 *
 * 1px of tolerance for rounding.
 */
async function overflowReport(page: Page): Promise<string> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth + 1) return '';

    const culprits = [...document.querySelectorAll<HTMLElement>('*')]
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.right > doc.clientWidth + 1 && box.width > 0)
      // The outermost offenders explain it; their children just inherit the width.
      .filter(({ el }) => {
        const parent = el.parentElement;
        if (!parent) return true;
        return parent.getBoundingClientRect().right <= doc.clientWidth + 1;
      })
      .slice(0, 5)
      .map(({ el, box }) => {
        const name = el.tagName.toLowerCase() + (el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : '');
        const min = getComputedStyle(el).minWidth;
        return `${name} (width ${Math.round(box.width)}px, right edge ${Math.round(box.right)}px, min-width ${min})`;
      });

    return [
      `viewport ${doc.clientWidth}px but content is ${doc.scrollWidth}px`,
      ...culprits.map((c) => `  → ${c}`),
    ].join('\n');
  });
}

/** Assert the page does not scroll sideways, naming what does if it fails. */
const expectNoSidewaysScroll = async (page: Page, screen: string): Promise<void> => {
  expect(await overflowReport(page), `${screen} scrolls sideways`).toBe('');
};

test.describe('1.4.10 reflow — 320 CSS px, the width left at 400% zoom', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('no screen scrolls sideways', async ({ page }) => {
    await openHome(page);
    await expectNoSidewaysScroll(page, 'home');

    await startAssessment(page);
    await expectNoSidewaysScroll(page, 'the context questions');

    await answerContext(page);
    await expectNoSidewaysScroll(page, 'the questionnaire');

    await answerInstruments(page, 'first');
    await expectNoSidewaysScroll(page, 'the result');
  });

  test('the crisis panel fits, and its numbers stay tappable', async ({ page }) => {
    await openHome(page);
    await crisisControl(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectNoSidewaysScroll(page, 'the crisis panel');

    // A phone number that has been squeezed off-screen is not a crisis resource.
    for (const call of await dialog.locator('a.crisis-call').all()) {
      const box = await call.boundingBox();
      expect(box, 'a crisis number has no box at 320px').not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320 + 1);
    }
  });
});

/**
 * The same criterion at the width that is actually left once a classic scrollbar
 * has taken its ~15px.
 *
 * Pinned explicitly so it fails on every machine rather than only on the ones
 * with non-overlay scrollbars. The reflow bug this was written for passed on
 * macOS and failed in CI for exactly that reason, and a check that only one
 * platform can see is a check nobody runs.
 */
test.describe('1.4.10 reflow — 305px, the width a classic scrollbar leaves', () => {
  test.use({ viewport: { width: 305, height: 640 } });

  test('the whole routing spine still fits', async ({ page }) => {
    await openHome(page);
    await expectNoSidewaysScroll(page, 'home at 305px');

    await crisisControl(page).click();
    await page.getByRole('dialog').waitFor();
    await expectNoSidewaysScroll(page, 'the crisis panel at 305px');
    await page.keyboard.press('Escape');

    await startAssessment(page);
    await answerContext(page);
    await expectNoSidewaysScroll(page, 'the questionnaire at 305px');

    await answerInstruments(page, 'first');
    await expectNoSidewaysScroll(page, 'the result at 305px');
  });
});

test.describe('1.4.12 text spacing — the person overrides spacing and nothing is lost', () => {
  /** The exact overrides named in the success criterion. */
  const TEXT_SPACING = `
    * {
      line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    p, li { margin-bottom: 2em !important; }
  `;

  test('the questionnaire survives it', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    await page.addStyleTag({ content: TEXT_SPACING });

    await expectNoSidewaysScroll(page, 'the questionnaire at WCAG text spacing');

    // Nothing clipped: every answer option still shows its full text.
    for (const option of await page.locator('.options .option').all()) {
      await expect(option).toBeVisible();
      const clipped = await option.evaluate(
        (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      );
      expect(clipped, 'an answer option clips its own text at WCAG text spacing').toBe(false);
    }
  });

  test('the crisis panel survives it', async ({ page }) => {
    await openHome(page);
    await crisisControl(page).click();
    await page.getByRole('dialog').waitFor();
    await page.addStyleTag({ content: TEXT_SPACING });

    await expectNoSidewaysScroll(page, 'the crisis panel at WCAG text spacing');
    await expect(page.getByRole('dialog')).toContainText('112');
  });
});

test.describe('2.3.3 / prefers-reduced-motion', () => {
  test('the stylesheet actually honours the OS setting', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);

    // styles.css carries a reduce block; nothing proved it was reached.
    const media = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(media).toBe(true);

    const durations = await page.evaluate(() =>
      [...document.querySelectorAll('.step, .option, .btn')].map(
        (el) => getComputedStyle(el).transitionDuration,
      ),
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const duration of durations) {
      expect(duration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
    }
  });
});
