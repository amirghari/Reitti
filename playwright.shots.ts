/**
 * The README screenshots, captured from the real app rather than mocked up.
 *
 * Separate from `playwright.config.ts` because this is not a gate — it writes
 * files into docs/images/ and is run by hand when the UI changes:
 *
 *   npm run shots
 *
 * Screenshots that cannot be regenerated are screenshots that quietly go stale,
 * which is worse than having none.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/shots',
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', trace: 'off' },
  projects: [
    {
      name: 'shots',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
  },
});
