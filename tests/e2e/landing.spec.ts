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

test.describe('a front door: six sections, one action each (D-32)', () => {
  test('the sections, in order', async ({ page }) => {
    await openHome(page);
    const order = await page.locator('main > section').evaluateAll((sections) =>
      sections.map((el) => el.id || el.className),
    );
    expect(order).toEqual([
      'hero',
      'services',
      'landing-band is-surface',
      'free-now',
      'landing-band is-surface',
    ]);
    await expect(page.locator('.app-footer')).toBeVisible();
  });

  test('the steps have one action, and the trust row none', async ({ page }) => {
    await openHome(page);
    const bands = page.locator('main > section.landing-band.is-surface');
    const interactive = 'a[href], button, input, select, textarea';
    await expect(bands.nth(0).locator(interactive)).toHaveCount(1);
    await expect(bands.nth(1).locator(interactive)).toHaveCount(0);
  });

  test('the hero has one button and one link, and the code-holder line', async ({ page }) => {
    await openHome(page);
    const hero = page.locator('.hero');
    await expect(hero.locator('button')).toHaveCount(1);
    await expect(hero.locator('a[href]')).toHaveCount(1);
    await expect(hero.locator('.hero-have-code')).toBeVisible();
    await expect(hero.locator('.hero-facts li')).toHaveCount(3);
  });

  test('"Just want to see the questions?" starts the questions', async ({ page }) => {
    await openHome(page);
    await page.locator('.steps-link').click();
    await expect(page.locator('.progress-label')).toBeVisible();
  });
});

test.describe('on a phone, the primary button is clear on the first screen', () => {
  // The feedback tab and the crisis bar both sat over "See what fits you" on a
  // 390px phone: the one action the page exists for, on the device most people
  // open it on. Checked on the common phone sizes in all three languages, with
  // room kept for an iPhone's home indicator, which the emulator does not draw
  // but a real device adds under the crisis bar.
  const HOME_INDICATOR = 34;

  for (const [width, height] of [
    [390, 844],
    [393, 852],
    [430, 932],
  ] as const) {
    for (const language of LANGUAGES) {
      test(`${width}x${height}, ${language}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width, height });
        await page.goto(`/?lang=${language}`);
        await page.evaluate(() => document.fonts.ready);

        const cta = page.locator('.hero-cta .btn');
        const box = (await cta.boundingBox())!;
        const bar = (await crisisControl(page).boundingBox())!;
        expect(box.y + box.height, 'the button runs under the crisis bar').toBeLessThanOrEqual(
          bar.y - HOME_INDICATOR,
        );

        // Nothing sits on top of it: every corner and the middle hit the button.
        const clear = await cta.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const points = [
            [r.left + 4, r.top + 4],
            [r.right - 4, r.top + 4],
            [r.left + 4, r.bottom - 4],
            [r.right - 4, r.bottom - 4],
            [r.left + r.width / 2, r.top + r.height / 2],
          ];
          return points.every(([x, y]) => el.contains(document.elementFromPoint(x, y)));
        });
        expect(clear, 'something covers the button').toBe(true);
      });
    }
  }

  test('the feedback tab is in the page on a phone, not floating over it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    const position = await page.locator('.feedback-tab-wrap').evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('static');
  });
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

test.describe('landing motion: one hero loop, interaction everywhere else (D-32)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  const opacity = (page: Page, selector: string) =>
    page.locator(selector).first().evaluate((el) => Number(getComputedStyle(el).opacity));

  test('a section fades in when it is scrolled to, not before', async ({ page }) => {
    await openHome(page);
    expect(await opacity(page, '#free-now')).toBe(0);
    await page.locator('#free-now').scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(page, '#free-now')).toBe(1);
  });

  test('hiding is instant; only arriving fades, over 250ms', async ({ page }) => {
    // A transition on the hidden state made sections painted before JavaScript
    // ran fade OUT at load. Held here as the rule itself.
    await openHome(page);
    const duration = (selector: string) =>
      page.locator(selector).evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(await duration('#free-now')).toBe('0s');
    await page.locator('#free-now').scrollIntoViewIfNeeded();
    await expect.poll(() => duration('#free-now')).toBe('0.25s');
  });

  test('jumping past sections still finishes them', async ({ page }) => {
    await openHome(page);
    await page.locator('.app-footer').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -10));
    for (const band of await page.locator('main [data-reveal]').all()) {
      await expect(band).toHaveClass(/is-visible/);
    }
  });

  test('nothing slides, staggers or counts', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.steps-numeral')).toHaveText(['01', '02', '03']);
    for (const selector of ['.steps-row', '.pyramid-step', '.option-card', '.hero-text']) {
      const moved = await page
        .locator(selector)
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el).transform !== 'none').length);
      expect(moved, `${selector} is transformed`).toBe(0);
    }
    await expect(page.locator('.hero-photo img')).toHaveCSS('animation-name', 'none');
  });
});

test.describe('the hero loop loads only on a desktop with motion allowed', () => {
  const videoRequests = (page: Page) => {
    const seen: string[] = [];
    page.on('request', (request) => {
      if (/hero-loop\.(webm|mp4)/.test(request.url())) seen.push(request.url());
    });
    return seen;
  };

  test('desktop, motion allowed: it is requested, and the still stays for assistive tech', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 800 });
    const seen = videoRequests(page);
    await openHome(page);
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    await expect(page.locator('.hero-photo img')).toHaveAttribute('alt', /.+/);
  });

  test('until the files exist, it falls back to the still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route(/hero-loop\.(webm|mp4)/, (route) => route.fulfill({ status: 404, body: '' }));
    await openHome(page);
    await expect(page.locator('.hero-loop')).toHaveCount(0);
    await expect(page.locator('.hero-photo img')).toBeVisible();
  });

  for (const [name, setup] of [
    ['reduced motion', async (page: Page) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 800 });
    }],
    ['a phone', async (page: Page) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 390, height: 844 });
    }],
    ['data saving', async (page: Page) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
      });
    }],
  ] as const) {
    test(`${name}: never requested, the still renders`, async ({ page }) => {
      await setup(page);
      const seen = videoRequests(page);
      await openHome(page);
      await page.waitForTimeout(800);
      expect(seen).toEqual([]);
      await expect(page.locator('video')).toHaveCount(0);
      await expect(page.locator('.hero-photo img')).toBeVisible();
    });
  }
});
