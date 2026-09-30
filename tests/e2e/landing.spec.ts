/**
 * The landing page, as the second outside review found it.
 *
 * Each block is one thing the reviewer saw broken: a "Coming soon" bar sitting
 * where a button should be, buttons at three different heights across one row,
 * a ladder nobody realised could be clicked, and a footer that was one grey
 * paragraph with a crisis number typed into the copy.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { crisisControl, openHome, setUiLanguage, type UiLanguage } from './flow';

const LANGUAGES: UiLanguage[] = ['en', 'fi', 'sv'];

/** The only source of crisis numbers, read the way the app reads it. */
const crisis: { resources: { phone: string }[] } = JSON.parse(
  readFileSync(join(process.cwd(), 'config/crisis.json'), 'utf8'),
);

const box = async (locator: Locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element is not rendered');
  return b;
};

/** Bottom edges of the given elements, grouped by the row their card sits on. */
async function rowsOf(page: Page, card: string, part: string) {
  const cards = page.locator(card);
  const rows = new Map<number, { bottom: number; top: number; cardTop: number }[]>();
  for (let i = 0; i < (await cards.count()); i++) {
    const c = cards.nth(i);
    const cb = await box(c);
    const pb = await box(c.locator(part).first());
    const key = Math.round(cb.y);
    rows.set(key, [...(rows.get(key) ?? []), { bottom: pb.y + pb.height, top: pb.y, cardTop: cb.y }]);
  }
  return [...rows.values()];
}

test.describe('card buttons sit on one line across a row', () => {
  for (const language of LANGUAGES) {
    for (const width of [1280, 390]) {
      test(`${language} at ${width}px`, async ({ page }) => {
        // Layout, measured at rest. With motion on, the cards are still sliding
        // in on a stagger when the page settles, and a measurement catches them
        // apart. Reduced motion is the app's own switch for that.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width, height: 900 });
        await openHome(page);
        await setUiLanguage(page, language);
        // Fraunces and Inter swap in after first paint and change line heights,
        // so a card measured before then is measured in the fallback font.
        await page.evaluate(() => document.fonts.ready);

        for (const row of await rowsOf(page, '.entry-card', '.btn')) {
          const bottoms = row.map((r) => r.bottom);
          expect(Math.max(...bottoms) - Math.min(...bottoms), 'entry-card buttons drift').toBeLessThan(1.5);
        }

        for (const section of ['.free-now', '.pyramid-panel:not([hidden])']) {
          const buttons = await rowsOf(page, `${section} .option-card`, '.option-link');
          const dates = await rowsOf(page, `${section} .option-card`, '.option-verified');
          for (const row of buttons) {
            const tops = row.map((r) => r.top);
            expect(Math.max(...tops) - Math.min(...tops), `${section} buttons drift`).toBeLessThan(1.5);
          }
          for (const row of dates) {
            const tops = row.map((r) => r.top);
            expect(Math.max(...tops) - Math.min(...tops), `${section} dates drift`).toBeLessThan(1.5);
          }
        }
      });
    }
  }
});

test.describe('the ladder says it can be clicked', () => {
  test('every rung is a button that names its panel, and says whether it is open', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.pyramid-hint')).not.toBeEmpty();

    const rungs = page.locator('.pyramid-bar');
    const count = await rungs.count();
    expect(count).toBeGreaterThan(3);

    for (let i = 0; i < count; i++) {
      const rung = rungs.nth(i);
      expect(await rung.evaluate((el) => el.tagName)).toBe('BUTTON');
      await expect(rung).toHaveAttribute('aria-expanded', /true|false/);
      const controls = await rung.getAttribute('aria-controls');
      await expect(page.locator(`[id="${controls}"]`)).toHaveCount(1);
      await expect(rung.locator('.pyramid-chevron')).toHaveCount(1);
      expect(await rung.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
    }

    // The open rung is distinct from the closed free ones, not just thicker.
    const open = page.locator('.pyramid-bar[aria-expanded="true"]');
    const closedFree = page.locator('.pyramid-bar[aria-expanded="false"][data-free="true"]').first();
    // In forced colours the system paints every fill, so the difference is the
    // border and the weight, which is exactly why there are three signals.
    const forced = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
    const fill = (l: Locator) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (!forced) expect(await fill(open)).not.toBe(await fill(closedFree));
    expect(await open.locator('.pyramid-name').evaluate((el) => getComputedStyle(el).fontWeight)).toBe('600');
  });

  test('arrow keys walk the rungs, and Enter opens the one in focus', async ({ page }) => {
    await openHome(page);
    const rungs = page.locator('.pyramid-bar');
    await rungs.first().focus();
    await page.keyboard.press('ArrowUp');
    await expect(rungs.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(rungs.nth(1)).toHaveAttribute('aria-expanded', 'true');
    const panel = await rungs.nth(1).getAttribute('aria-controls');
    await expect(page.locator(`[id="${panel}"]`)).toBeVisible();
    await expect(rungs.first()).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('the footer', () => {
  test('carries the crisis lines from config, 112 first for an English reader', async ({ page }) => {
    await openHome(page);
    const block = page.locator('.app-footer .footer-crisis');
    const phones = await block.locator('.crisis-strip-phone').allInnerTexts();

    expect(phones.map((p) => p.trim()).sort()).toEqual(crisis.resources.map((r) => r.phone).sort());
    expect(phones[0].trim()).toBe('112');
  });

  test('types no crisis number outside the crisis block', async ({ page }) => {
    await openHome(page);
    const elsewhere = await page
      .locator('.app-footer')
      .evaluate((footer) => {
        const clone = footer.cloneNode(true) as HTMLElement;
        clone.querySelector('.footer-crisis')?.remove();
        return clone.innerText;
      });
    for (const resource of crisis.resources) expect(elsewhere).not.toContain(resource.phone);
  });

  test('the crisis control is still where it was, and on top', async ({ page }) => {
    await openHome(page);
    await page.locator('.app-footer').scrollIntoViewIfNeeded();
    await crisisControl(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('landing motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('jumping past a section still finishes it', async ({ page }) => {
    // The hero's own link goes straight to the ladder, over the three steps. An
    // observer never sees an element that is jumped over, so without the scroll
    // check they stayed shifted, with their numerals stuck at 00.
    await openHome(page);
    await page.locator('.hero-browse').click();
    await page.evaluate(() => window.scrollBy(0, 40));

    await expect(page.locator('.steps-numeral')).toHaveText(['01', '02', '03'], { timeout: 3000 });
    for (const row of await page.locator('.steps-row').all()) {
      await expect(row).toHaveClass(/is-visible/);
    }
  });

  test('the numerals count up as they arrive', async ({ page }) => {
    await openHome(page);
    const first = page.locator('.steps-numeral').first();
    await page.locator('.steps-section').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(first).toHaveText('01', { timeout: 3000 });
  });
});
