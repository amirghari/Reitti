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
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.A11Y_PORT ?? 5173);
const BASE_URL = process.env.A11Y_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // `tests/shots` is a separate, manually-run config for screenshots.
  testIgnore: ["**/shots/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // A Vercel preview stays behind Deployment Protection — a mental-health
    // preview should not be public just so a test runner can reach it. The
    // automation bypass is a header, so the deployment is testable without ever
    // becoming publicly readable.
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "true",
        }
      : {},
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      // `forcedColors` is not a Playwright fixture option — it only reaches the
      // browser through `contextOptions`. Set directly on `use` it is accepted
      // and silently dropped, which is how this project ran as a plain copy of
      // `desktop` and reported high-contrast coverage it never had. Typecheck
      // catches the mistake; it was not in CI until now.
      name: "forced-colors",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { forcedColors: "active" },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],

  // Against a deployed URL there is nothing to start locally.
  webServer: process.env.A11Y_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        // Demand pooling is off unless a counter URL is configured, so the privacy
        // suite points it at a host it will never actually reach: every request is
        // intercepted and inspected by the test rather than sent. That is the only
        // way to assert what the app *would* put on the wire.
        env: { VITE_POOL_COUNTER_URL: "https://pool-counter.test" },
      },
});
