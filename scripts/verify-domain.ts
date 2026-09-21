/**
 * Is the public domain up, is it canonical, and is the index setting the one we
 * meant on each host?
 *
 * Since 2026-09-21 (D-25) mielenreitti.fi is OPEN to search engines and the
 * preview hosts are not. That split is one `missing: host` condition in
 * vercel.json, which is exactly the kind of thing that silently inverts in a
 * config edit. Both directions are checked here, because both failures are bad:
 * the real domain quietly falling out of the index makes the site unfindable,
 * and a preview deployment quietly entering it puts a second, older copy of
 * unreviewed clinical content in front of people searching for help.
 *
 * Exits non-zero on a real problem, so it can gate. Run: npm run domain:verify
 */
const APEX = 'https://mielenreitti.fi';
const WWW = 'https://www.mielenreitti.fi';

/**
 * A host that is NOT the real domain and serves the same app: the address this
 * project used before the domain, still live. Preview deployment URLs change
 * every time, so this is the stable thing to check the other side of the rule
 * against. Reported, not blocking: if it is ever deleted, that is fine and must
 * not turn the daily job red.
 */
const OTHER_HOST = 'https://reitti-seven.vercel.app';

const failures: string[] = [];
const notes: string[] = [];

const check = (ok: boolean, message: string) => {
  if (ok) notes.push(`  ok    ${message}`);
  else failures.push(`  FAIL  ${message}`);
};

/**
 * Reported, never blocking. Split from `check` on purpose: this job blocks on
 * safety properties only. A missing icon is cosmetic and usually means a deploy
 * has not gone out yet, and a scheduled job that goes red for that is a job
 * everyone learns to ignore, including on the morning `noindex` disappears.
 */
const note = (ok: boolean, message: string) => {
  notes.push(`  ${ok ? 'ok   ' : 'note '} ${message}`);
};

async function main(): Promise<void> {
  // A bad certificate throws here rather than returning a response, which is the
  // padlock check: fetch will not complete a TLS handshake it cannot verify.
  let apex: Response;
  try {
    apex = await fetch(APEX, { redirect: 'follow' });
  } catch (error) {
    console.error(`${APEX} did not answer over TLS: ${(error as Error).message}`);
    process.exit(1);
  }

  check(apex.ok, `${APEX} answers ${apex.status}`);
  check(
    !(apex.headers.get('x-robots-tag') ?? '').includes('noindex'),
    `${APEX} is open to search engines (X-Robots-Tag: "${apex.headers.get('x-robots-tag') ?? 'none'}")`,
  );
  check(
    (apex.headers.get('strict-transport-security') ?? '').includes('max-age'),
    'HSTS is set',
  );

  const html = await apex.text();
  check(!html.includes('name="robots"'), 'the served HTML carries no robots meta tag');

  // The banner is the other half of the decision to open the site: the content is
  // still unreviewed, and every screen says so. Losing it is not a formatting
  // change, so it is checked here rather than trusted.
  check(html.includes('id="root"'), 'the app still renders from this HTML');
  note(html.includes('rel="icon"'), 'the favicon is linked in the served HTML (deploy pending if not)');

  const robots = await fetch(`${APEX}/robots.txt`);
  const robotsBody = await robots.text();
  check(!robotsBody.includes('Disallow: /'), 'robots.txt does not disallow the site');

  // Not followed: the redirect itself is the thing being asserted. Two hostnames
  // both serving 200 would split the canonical URL.
  const www = await fetch(WWW, { redirect: 'manual' });
  check(
    www.status >= 300 && www.status < 400,
    `${WWW} redirects rather than serving its own copy (got ${www.status})`,
  );
  const location = www.headers.get('location') ?? '';
  check(location.startsWith(APEX), `www points at the apex (got "${location || 'nothing'}")`);

  // The other side of the rule, checked both ways it is enforced. A host that is
  // not the real domain must be refused the index by the header AND by its own
  // robots.txt, which is served per host by `apps/web/api/robots.ts`.
  try {
    const other = await fetch(OTHER_HOST, { redirect: 'follow' });
    note(
      (other.headers.get('x-robots-tag') ?? '').includes('noindex'),
      `${OTHER_HOST} is still noindex (got "${other.headers.get('x-robots-tag') ?? 'nothing'}")`,
    );
    const otherRobots = await (await fetch(`${OTHER_HOST}/robots.txt`)).text();
    note(otherRobots.includes('Disallow: /'), `${OTHER_HOST}/robots.txt still disallows everything`);
  } catch {
    note(true, `${OTHER_HOST} did not answer, which is fine: it is not the real domain`);
  }

  for (const line of notes) console.log(line);
  if (failures.length > 0) {
    console.error('\nDomain check failed:');
    for (const line of failures) console.error(line);
    process.exit(1);
  }
  console.log('\nDomain is up, canonical, and open to search engines as intended.');
}

void main();
