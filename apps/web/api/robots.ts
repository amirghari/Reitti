/**
 * `GET /robots.txt`, answered per host.
 *
 * A static file cannot do this. `public/robots.txt` is served byte-for-byte to
 * every host the deployment answers on, and this deployment answers on three
 * kinds: mielenreitti.fi, the old reitti-seven.vercel.app, and a fresh preview
 * URL for every push. The real domain is open to search engines (D-26); the
 * others must stay out of the index. So the file is a function, and vercel.json
 * rewrites /robots.txt here. The rewrite only fires because no static file
 * matches that path any more, which is why `public/robots.txt` was deleted
 * rather than left in place as a fallback.
 *
 * `X-Robots-Tag` in vercel.json carries the same split and is the stronger of
 * the two: robots.txt asks a crawler not to *fetch* a page, while X-Robots-Tag
 * tells it not to *index* one it already has. Both are set, in the same
 * direction, so neither alone is load-bearing.
 */

/** The only hosts that are the real site. Everything else is a copy of it. */
const PRODUCTION_HOSTS = ['mielenreitti.fi', 'www.mielenreitti.fi'];

const OPEN = `# mielenreitti.fi is open to search engines as of 2026-09-21 (decision D-26).
#
# The clinical content is still not reviewed by a clinician registered in Finland.
# The preview banner on every screen says so, and that banner is not covered by
# this decision: it stays until a clinician signs the content off.
User-agent: *
Allow: /
`;

const CLOSED = `# Not the real site. This is a preview deployment or an old address that still
# serves the same app, and a second copy of unreviewed clinical content is the
# last thing a person searching for help needs to find.
#
# The real site is https://mielenreitti.fi and it is open to search engines.
User-agent: *
Disallow: /
`;

/**
 * Unknown hosts get the closed version on purpose. A host we did not anticipate
 * is by definition not the domain we decided to open, and the safe default for
 * a mistake here is invisibility rather than a second indexed copy.
 */
export function robotsFor(host: string | undefined): string {
  if (!host) return CLOSED;
  const bare = host.split(':')[0].trim().toLowerCase();
  return PRODUCTION_HOSTS.includes(bare) ? OPEN : CLOSED;
}

interface NodeRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface NodeResponse {
  status(code: number): NodeResponse;
  setHeader(name: string, value: string): void;
  send(body: string): void;
  end(): void;
}

export default function handler(req: NodeRequest, res: NodeResponse): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD');
    res.status(405).end();
    return;
  }

  const header = req.headers.host;
  const host = Array.isArray(header) ? header[0] : header;

  res.setHeader('content-type', 'text/plain; charset=utf-8');
  // Never cached at the edge. One cached copy served to the wrong host is the
  // single failure this whole file exists to prevent.
  res.setHeader('cache-control', 'no-store');
  res.setHeader('vary', 'host');
  res.status(200).send(robotsFor(host));
}
