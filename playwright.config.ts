/**
 * The accessibility gate. Separate from `npm test` on purpose: vitest owns the
 * pure engine and the safety invariants, and neither should need a browser.
 *
 * Four projects, because a mechanical pass on one desktop viewport is not a
 * claim about accessibility:
 *   desktop        the ordinary case
 *   forced-colors  OS high-contrast mode, where anything carried by colour alone
 *                  or drawn with a background image quietly disappears
 *   mobile         how someone in distress actually holds this
 *   mobile-safari  the same, on WebKit. Chrome-on-Android emulation is still
 *                  Chromium; iOS Safari is a different engine with its own
 *                  viewport, focus and on-screen-keyboard behaviour, and it is a
 *                  large share of Finnish mobile. Untested until now.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.A11Y_PORT ?? 5173);
const BASE_URL = process.env.A11Y_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      // `forcedColors` is not a Playwright fixture option — it only reaches the
      // browser through `contextOptions`. Set directly on `use` it is accepted
      // and silently dropped, which is how this project ran as a plain copy of
      // `desktop` and reported high-contrast coverage it never had. Typecheck
      // catches the mistake; it was not in CI until now.
      name: 'forced-colors',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { forcedColors: 'active' },
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
  },
});
