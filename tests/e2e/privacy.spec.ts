/**
 * The privacy audit.
 *
 * The claim under test, stated exactly as it is stated to the person:
 *
 *   > Reitti's server holds counts, not people. It never receives your answers,
 *   > your scores, or anything that identifies you or your device.
 *
 * Invariant 11 asserts the request *builder* in isolation. This suite watches
 * the real app through real journeys and asserts what actually goes on the wire —
 * which is the only version of this test that could catch a stray analytics
 * snippet, a font from a CDN, or a `sendBeacon` somebody added in a hurry.
 *
 * The captured request log is attached to every run so it can go into the report
 * rather than being summarised by whoever ran it.
 */
import { expect, test, type Page, type Request } from '@playwright/test';
import { answerContext, answerInstrumentsAt, openHome, startAssessment } from './flow';

interface Captured {
  method: string;
  url: string;
  resourceType: string;
  body: string | null;
  hasCookie: boolean;
  hasAuth: boolean;
}

/** Everything the page asks for, with the bodies, for the whole run. */
function captureRequests(page: Page): Captured[] {
  const log: Captured[] = [];
  page.on('request', (request: Request) => {
    const headers = request.headers();
    log.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      body: request.postData(),
      hasCookie: 'cookie' in headers,
      hasAuth: 'authorization' in headers,
    });
  });
  return log;
}

/** Requests to anywhere that is not the app's own origin. */
const outbound = (log: Captured[], baseURL: string): Captured[] =>
  log.filter((r) => !r.url.startsWith(baseURL) && !r.url.startsWith('data:'));

/**
 * Words that must never appear in an outbound request. Matched against the body
 * and the URL, key by key rather than as loose substrings — `careLanguage`
 * contains "age", and a privacy test that cries wolf is a privacy test that gets
 * deleted.
 */
const FORBIDDEN_KEYS = [
  'severity',
  'bandId',
  'band',
  'answers',
  'score',
  'suggestedRung',
  'rung',
  'ageBand',
  'statedDomain',
  'domain',
  'deviceId',
  'sessionId',
  'userId',
  'completedAt',
  'timestamp',
];

test.describe('the privacy audit', () => {
  test('a full assessment sends nothing about the person', async ({ page, baseURL }, testInfo) => {
    const log = captureRequests(page);

    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'anxiety', budget: 'none', duration: 'over-a-year' });
    expect(await answerInstrumentsAt(page, 2, { avoidCrisisItem: true })).toBe('result');

    await testInfo.attach('request-log-assessment.json', {
      body: JSON.stringify(log, null, 2),
      contentType: 'application/json',
    });

    // Nothing left the origin at all during a whole assessment. Fonts are
    // self-hosted precisely so this stays true — a font request that leaks an IP
    // on every page load would undercut the entire claim.
    const external = outbound(log, baseURL!);
    expect(
      external.map((r) => r.url),
      'an assessment must send nothing anywhere',
    ).toEqual([]);
  });

  test('no request anywhere carries an answer, a score or an identifier', async ({
    page,
  }, testInfo) => {
    const log = captureRequests(page);

    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'social', budget: 'none' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    // Reach the waitlist, which is the one feature that talks to a server.
    const waitlist = page.locator('.waitlist').first();
    if ((await waitlist.count()) > 0) {
      await waitlist.locator('.waitlist-region').selectOption('helsinki');
      const join = waitlist.locator('.waitlist-topic').first().getByRole('button').first();
      if (await join.isEnabled()) await join.click();
    }

    await testInfo.attach('request-log-waitlist.json', {
      body: JSON.stringify(log, null, 2),
      contentType: 'application/json',
    });

    for (const request of log) {
      const haystack = `${request.url} ${request.body ?? ''}`;
      for (const key of FORBIDDEN_KEYS) {
        expect(
          haystack.includes(`"${key}"`),
          `${key} appears in a request: ${request.method} ${request.url}`,
        ).toBe(false);
      }
    }
  });

  test('the pool request is exactly three enum values, with no credentials', async ({
    page,
  }, testInfo) => {
    const sent: { url: string; body: unknown; headers: Record<string, string> }[] = [];

    // The counter host is unreachable by design; the request is caught here and
    // inspected rather than delivered.
    await page.route('**/pool/**', async (route) => {
      const request = route.request();
      sent.push({
        url: request.url(),
        body: request.postData() ? JSON.parse(request.postData()!) : null,
        headers: request.headers(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 3, threshold: 8, ready: false }),
      });
    });

    await openHome(page);
    await startAssessment(page);
    await answerContext(page, { domain: 'social', budget: 'none' });
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    const waitlist = page.locator('.waitlist').first();
    await expect(waitlist).toBeVisible();

    // Pooling needs a counter service. The preview deployment has none, so the
    // feature is off there and there is no request to inspect — which is the
    // correct behaviour, not a gap. The assertion runs wherever pooling is
    // configured (the local suite sets VITE_POOL_COUNTER_URL); elsewhere this
    // test says so rather than passing vacuously.
    const pooling = await waitlist.getAttribute('data-pooling');
    test.skip(pooling !== 'on', 'demand pooling is not configured in this build');

    await waitlist.locator('.waitlist-region').selectOption('helsinki');

    const topic = waitlist.locator('.waitlist-topic').first();
    await topic.getByRole('button', { name: /group|ryhmä|grupp/i }).first().click();

    // The consent copy names the three values before the request is made.
    const consent = topic.locator('.waitlist-consent-body');
    await expect(consent).toBeVisible();
    await expect(consent).toContainText(/three things/i);

    await topic.locator('.waitlist-consent-actions .btn').click();
    await expect(topic.locator('.waitlist-joined')).toBeVisible();

    await testInfo.attach('pool-requests.json', {
      body: JSON.stringify(sent, null, 2),
      contentType: 'application/json',
    });

    const posts = sent.filter((r) => r.body !== null);
    expect(posts.length, 'the join should have sent exactly one request').toBe(1);

    const body = posts[0].body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['careLanguage', 'region', 'topicId']);
    expect(body.region).toBe('helsinki');
    expect(body.careLanguage).toBe('fi');
    expect(typeof body.topicId).toBe('string');

    // No cookie, no auth header, no device id, no nonce.
    for (const request of sent) {
      expect(request.headers).not.toHaveProperty('cookie');
      expect(request.headers).not.toHaveProperty('authorization');
      expect(request.headers).not.toHaveProperty('x-device-id');
    }
  });

  test('the follow-up reminder is scheduled on the device and nowhere else', async ({
    page,
    baseURL,
  }) => {
    const log = captureRequests(page);

    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    // The reminder now exists locally.
    const stored = await page.evaluate(() => localStorage.getItem('reitti.followup.v1'));
    expect(stored, 'a follow-up should have been scheduled locally').toBeTruthy();
    expect(JSON.parse(stored!)).toHaveProperty('remindAt');

    // And nothing about it was announced to anyone.
    expect(outbound(log, baseURL!).map((r) => r.url)).toEqual([]);
  });

  test('"delete everything" really does', async ({ page }) => {
    await openHome(page);
    await startAssessment(page);
    await answerContext(page);
    expect(await answerInstrumentsAt(page, 1, { avoidCrisisItem: true })).toBe('result');

    const before = await page.evaluate(() => Object.keys(localStorage).sort());
    expect(before.length).toBeGreaterThan(0);

    await page.locator('.link.danger').click();

    const after = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith('reitti.')),
    );
    expect(after, 'nothing under the reitti namespace may survive').toEqual([]);
  });
});
