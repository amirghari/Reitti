/**
 * The accessibility gate. Separate from `npm test` on purpose: vitest owns the
 * pure engine and the safety invariants, and neither should need a browser.
 *
 * Three projects, because a mechanical pass on one desktop viewport is not a
 * claim about accessibility:
 *   desktop        the ordinary case
 *   forced-colors  OS high-contrast mode, where anything carried by colour alone
 *                  or drawn with a background image quietly disappears
 *   mobile         how someone in distress actually holds this
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
      name: 'forced-colors',
      use: { ...devices['Desktop Chrome'], forcedColors: 'active' },
    },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
  },
});
