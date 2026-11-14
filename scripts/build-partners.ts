/**
 * Writes the partner page (apps/web/partners/page.ts) into the build output at
 * /partners. Live on mielenreitti.fi since 14.11.2026 (Amir).
 *
 *   part of `npm run build` in apps/web; on its own: vite-node scripts/build-partners.ts [--out dir]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTNER_PATH, partnerPage } from '../apps/web/partners/page.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(i === -1 ? join(ROOT, 'apps/web/dist') : process.argv[i + 1]);

const file = join(out, PARTNER_PATH, 'index.html');
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, partnerPage());
console.log(`[partners] ${PARTNER_PATH} into ${out}`);
