/**
 * Is the public domain up, and is it still invisible to search engines?
 *
 * Both halves matter and the second is the one worth a scheduled job. This build
 * carries clinical routing content that no clinician has signed off. `noindex`
 * is set three ways (meta tag, X-Robots-Tag, robots.txt) precisely because any
 * one of them can be lost in a config change, and losing all of them silently is
 * how a provisional answer ends up in a search result for someone looking for
 * help. A daily check is cheaper than finding out from Google.
 *
 * Exits non-zero on a real problem, so it can gate. Run: npm run domain:verify
 */
const APEX = 'https://mielenreitti.fi';
const WWW = 'https://www.mielenreitti.fi';

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
    (apex.headers.get('x-robots-tag') ?? '').includes('noindex'),
    `${APEX} still sends X-Robots-Tag: noindex (got "${apex.headers.get('x-robots-tag') ?? 'nothing'}")`,
  );
  check(
    (apex.headers.get('strict-transport-security') ?? '').includes('max-age'),
    'HSTS is set',
  );

  const html = await apex.text();
  check(html.includes('name="robots"'), 'the robots meta tag is in the served HTML');
  note(html.includes('rel="icon"'), 'the favicon is linked in the served HTML (deploy pending if not)');

  const robots = await fetch(`${APEX}/robots.txt`);
  const robotsBody = await robots.text();
  check(robotsBody.includes('Disallow: /'), 'robots.txt still disallows everything');

  // Not followed: the redirect itself is the thing being asserted. Two hostnames
  // both serving 200 would split the canonical URL.
  const www = await fetch(WWW, { redirect: 'manual' });
  check(
    www.status >= 300 && www.status < 400,
    `${WWW} redirects rather than serving its own copy (got ${www.status})`,
  );
  const location = www.headers.get('location') ?? '';
  check(location.startsWith(APEX), `www points at the apex (got "${location || 'nothing'}")`);

  for (const line of notes) console.log(line);
  if (failures.length > 0) {
    console.error('\nDomain check failed:');
    for (const line of failures) console.error(line);
    process.exit(1);
  }
  console.log('\nDomain is up, canonical and still noindex.');
}

void main();
