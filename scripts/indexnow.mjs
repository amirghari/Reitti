/**
 * Tells search engines that use IndexNow (Bing, Yandex and others; not Google)
 * which addresses on mielenreitti.fi are new, changed or gone, after each deploy
 * (Amir, 14.11.2026). Run by `npm run deploy`, after `vercel deploy --prod`.
 *
 *   node scripts/indexnow.mjs [--dry-run] [--state <file>]
 *
 * What changed is read from the live site, not guessed from git: every address in
 * the live sitemap.xml is fetched and the text a reader sees is hashed (scripts,
 * styles and tags dropped, so a rebuilt asset name is not a change). Addresses
 * whose hash differs from the last run, new ones, and ones gone from the sitemap
 * are sent; nothing else. The hashes are kept in `.indexnow-state.json` (ignored by
 * git) beside this checkout; without it, every address is sent once.
 *
 * Only public addresses leave: the sitemap's own. The key is public by design
 * (IndexNow checks it at https://mielenreitti.fi/<key>.txt), so it lives in
 * apps/web/public, and nothing is sent unless that file answers with the key.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const HOST = 'mielenreitti.fi';
export const ORIGIN = `https://${HOST}`;
export const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** The key: the one `<32 hex>.txt` in apps/web/public whose content is its own name. */
export function readKey(publicDir = join(ROOT, 'apps/web/public')) {
  const keys = readdirSync(publicDir).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f) && readFileSync(join(publicDir, f), 'utf8').trim() === f.slice(0, 32));
  if (keys.length !== 1) throw new Error(`indexnow: expected one key file in ${publicDir}, found ${keys.length}`);
  return keys[0].slice(0, 32);
}

/** The addresses in a sitemap, on this host only. */
export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/&amp;/g, '&').trim())
    .filter((u) => u.startsWith(`${ORIGIN}/`) || u === ORIGIN);
}

/** What a reader sees, hashed: no scripts, styles or tags, spaces folded. */
export function contentHash(html) {
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/** New or changed since the last run, and gone from the sitemap. */
export function changedUrls(previous, current) {
  const changed = Object.keys(current).filter((u) => previous[u] !== current[u]);
  const gone = Object.keys(previous).filter((u) => !(u in current));
  return [...changed, ...gone];
}

export function payload(key, urlList) {
  return { host: HOST, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList };
}

async function text(fetcher, url) {
  const res = await fetcher(url, { headers: { 'user-agent': 'Mielenreitti-indexnow/1.0 (+https://mielenreitti.fi/about)' } });
  if (res.status !== 200) throw new Error(`indexnow: ${url} answered ${res.status}`);
  return res.text();
}

export async function run({ fetcher = fetch, state = join(ROOT, '.indexnow-state.json'), dryRun = false, key = readKey(), log = console.log } = {}) {
  // IndexNow fetches this file to check the key; if it is not live, nothing is sent.
  if ((await text(fetcher, `${ORIGIN}/${key}.txt`)).trim() !== key) throw new Error('indexnow: the live key file does not match');
  const urls = sitemapUrls(await text(fetcher, `${ORIGIN}/sitemap.xml`));
  if (urls.length === 0) throw new Error('indexnow: the live sitemap lists no addresses');
  const current = {};
  for (const u of urls) current[u] = contentHash(await text(fetcher, u));
  const previous = existsSync(state) ? JSON.parse(readFileSync(state, 'utf8')).hashes ?? {} : {};
  const list = changedUrls(previous, current);
  if (list.length === 0) {
    log('indexnow: nothing new, changed or gone');
    return { sent: [] };
  }
  if (dryRun) {
    log(`indexnow: would send ${list.length}:\n  ${list.join('\n  ')}`);
    return { sent: [], wouldSend: list };
  }
  // The API takes up to 10,000 a request; the site has about a hundred.
  for (let i = 0; i < list.length; i += 10_000) {
    const res = await fetcher(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload(key, list.slice(i, i + 10_000))),
    });
    if (res.status !== 200 && res.status !== 202) throw new Error(`indexnow: the API answered ${res.status}; nothing saved, the next run sends these again`);
  }
  writeFileSync(state, `${JSON.stringify({ sentAt: new Date().toISOString(), hashes: current }, null, 2)}\n`);
  log(`indexnow: sent ${list.length} address(es)`);
  return { sent: list };
}

const invoked = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : '';
if (invoked === realpathSync(fileURLToPath(import.meta.url))) {
  const argv = process.argv.slice(2);
  const s = argv.indexOf('--state');
  try {
    await run({ dryRun: argv.includes('--dry-run'), ...(s !== -1 ? { state: argv[s + 1] } : {}) });
  } catch (err) {
    // Run after a deploy that has already succeeded: say so, so this is not read as a failed deploy.
    console.error(`${err.message}\nThe deploy itself is not affected. Nothing was saved; run \`npm run indexnow\` to retry.`);
    process.exit(1);
  }
}
