/**
 * The crisis control must not look like a chat widget (D-32).
 *
 * A rounded pill with a dot in the bottom corner is the support-chat pattern,
 * so people read it as a bot. It is the same component on every screen
 * (invariant 1) and it opens exactly as before; only its look changed, and that
 * look is what these hold.
 */
import { expect, test, type Page } from '@playwright/test';
import { crisisControl, crisisDialog } from './flow';

const CRISIS_FILL = 'rgb(110, 59, 78)'; // --crisis, #6e3b4e
const SUN = 'rgb(242, 193, 78)'; // --sun, #f2c14e

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** In forced colours the system paints every fill and ring, by design. */
const forcedColors = (page: Page) => page.evaluate(() => matchMedia('(forced-colors: active)').matches);

async function open(page: Page, width: number, lang = 'en') {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`/?lang=${lang}`);
  await expect(crisisControl(page)).toBeVisible();
}

test.describe('the crisis control', () => {
  test('desktop: filled, square-cornered, a phone and a label, never a pill', async ({ page }) => {
    await open(page, 1280);
    const control = crisisControl(page);
    const style = await control.evaluate((el) => {
      const s = getComputedStyle(el);
      return { radius: s.borderTopLeftRadius, fill: s.backgroundColor, color: s.color };
    });
    expect(style.radius).toBe('8px');
    if (!(await forcedColors(page))) {
      expect(style.fill).toBe(CRISIS_FILL);
      expect(style.color).toBe('rgb(255, 255, 255)');
    }
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await expect(control.locator('svg')).toHaveCount(1);
    await expect(control.locator('.crisis-fab-dot')).toHaveCount(0);
    await expect(control).toHaveAccessibleName(/Need help now\? Call/);
  });

  test('a phone: a full-width bar on the bottom edge, with 112 for an English reader', async ({ page }) => {
    await open(page, 390);
    const box = (await crisisControl(page).boundingBox())!;
    expect(box.x).toBe(0);
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    await expect(crisisControl(page)).toContainText('112');
  });

  test('the number is the reader\'s first line that answers at any hour', async ({ page }) => {
    await open(page, 390, 'fi');
    await expect(crisisControl(page)).toContainText('09 2525 0111');
    // Swedish gets 112, not 0112: the Swedish line is closed most of the day.
    await open(page, 390, 'sv');
    await expect(crisisControl(page)).toContainText('112');
    await expect(crisisControl(page)).not.toContainText('0112');
  });

  test('on a phone the feedback tab sits above the bar, and under it in the stack', async ({ page }) => {
    await open(page, 390);
    const bar = (await crisisControl(page).boundingBox())!;
    const tab = (await page.locator('.feedback-tab').boundingBox())!;
    expect(tab.y + tab.height).toBeLessThanOrEqual(bar.y);
    const z = (selector: string) => page.locator(selector).evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(await z('.feedback-tab-wrap')).toBeLessThan(await z('.crisis-fab'));
  });

  test('the focus ring is 3px sun, at least 3:1 against the crisis fill', async ({ page }) => {
    await open(page, 1280);
    await crisisControl(page).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ring = await crisisControl(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, color: s.outlineColor, style: s.outlineStyle };
    });
    expect(ring.width).toBe('3px');
    expect(ring.style).toBe('solid');
    if (await forcedColors(page)) return;
    expect(ring.color).toBe(SUN);
    const rgb = (s: string) => s.match(/\d+/g)!.slice(0, 3).map(Number);
    expect(contrast(rgb(SUN), rgb(CRISIS_FILL))).toBeGreaterThanOrEqual(3);
  });

  test('it does not move: no animation, no transition', async ({ page }) => {
    await open(page, 1280);
    const motion = await crisisControl(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationName, transition: s.transitionDuration };
    });
    expect(motion.animation).toBe('none');
    expect(motion.transition).toBe('0s');
  });

  test('it opens the crisis panel, exactly as before', async ({ page }) => {
    for (const width of [1280, 390]) {
      await open(page, width);
      // By keyboard: WebKit does not focus a button on click, so after a click
      // there is nothing for focus to return to. The crisis-path spec does the same.
      await crisisControl(page).focus();
      await page.keyboard.press('Enter');
      await expect(crisisDialog(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(crisisDialog(page)).toBeHidden();
      await expect(crisisControl(page)).toBeFocused();
    }
  });
});
