/**
 * Writes a page per directory service into the app's build output (Amir,
 * 12.11.2026): /directory/<id>, /fi/palvelut/<id>, /sv/tjanster/<id>.
 *
 *   part of `npm run build` in apps/web; on its own: vite-node scripts/build-services.ts [--out dir]
 *
 * Public in every language, like the directory pages they come from: the same
 * strings, already live on the cards. The list is apps/web/services/published.ts,
 * which sitemap.xml and llms.txt read too, so the three can never disagree.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DirectoryEntry } from '@reitti/engine';
import kela from '../config/directory/kela.json' with { type: 'json' };
import privateSector from '../config/directory/private.json' with { type: 'json' };
import publicSector from '../config/directory/public.json' with { type: 'json' };
import thirdSector from '../config/directory/third-sector.json' with { type: 'json' };
import youth from '../config/directory/youth.json' with { type: 'json' };
import { GUIDE_STYLESHEET } from '../apps/web/guides/render.ts';
import { publishedServicePages } from '../apps/web/services/published.ts';
import { servicePage } from '../apps/web/services/render.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(i === -1 ? join(ROOT, 'apps/web/dist') : process.argv[i + 1]);

const entries = new Map(
  [publicSector, kela, thirdSector, youth, privateSector].flatMap((file) => file.entries as unknown as DirectoryEntry[]).map((e) => [e.id, e]),
);

const pages = publishedServicePages();
for (const page of pages) {
  const entry = entries.get(page.id);
  if (!entry) throw new Error(`[services] no entry "${page.id}"`);
  const file = join(out, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, servicePage(entry, page.lang));
}
copyFileSync(join(ROOT, 'apps/web/pages/pages.css'), join(out, GUIDE_STYLESHEET));
console.log(`[services] ${pages.length} pages (${new Set(pages.map((p) => p.id)).size} services × 3 languages) into ${out}`);
