/**
 * Writes the partner page PREVIEW (apps/web/partners/page.ts) into the build
 * output at /partners, for Amir to read on a preview deployment (13.11.2026).
 *
 *   part of `npm run build` in apps/web; on its own: vite-node scripts/build-partners.ts [--out dir]
 *
 * Builds nothing in a production build (VERCEL_ENV=production, or a
 * `vercel build --prod` output), so the page cannot reach mielenreitti.fi until
 * Amir says it goes live and this guard is removed in its own pull request.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTNER_PATH, partnerPage } from '../apps/web/partners/page.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(i === -1 ? join(ROOT, 'apps/web/dist') : process.argv[i + 1]);

/** Production if Vercel says so, or the output folder is a production build's. */
function production(): boolean {
  if (process.env.VERCEL_ENV === 'production') return true;
  const builds = join(out, '..', 'builds.json');
  if (!existsSync(builds)) return false;
  try {
    return (JSON.parse(readFileSync(builds, 'utf8')) as { target?: string }).target === 'production';
  } catch {
    return true; // unreadable: assume the case that must not publish
  }
}

if (production()) {
  console.log('[partners] production build: the partner page is a preview only, nothing written');
} else {
  const file = join(out, PARTNER_PATH, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, partnerPage());
  console.log(`[partners] preview page at ${PARTNER_PATH} (noindex, not in the sitemap)`);
}
