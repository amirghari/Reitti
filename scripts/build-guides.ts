/**
 * Writes the guide pages into the app's build output (docs/next-phase.md, Phase C).
 *
 *   part of `npm run build` in apps/web; on its own: vite-node scripts/build-guides.ts [--out dir]
 *
 * Unlike the directory pages these are public once merged: they carry no
 * personal data and nothing gated. A guide that breaks a rule in checkGuide()
 * stops the build, so a figure without a source cannot ship.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDES_EN } from '../apps/web/guides/index.ts';
import { GUIDE_STYLESHEET, checkGuide, guidePage, guidePath, guidesIndex, guidesIndexPath } from '../apps/web/guides/render.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(i === -1 ? join(ROOT, 'apps/web/dist') : process.argv[i + 1]);

const problems = GUIDES_EN.flatMap(checkGuide);
if (problems.length) {
  console.error(['[guides] nothing built:', ...problems.map((p) => `  - ${p}`)].join('\n'));
  process.exit(1);
}

const write = (path: string, html: string) => {
  const file = join(out, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};
for (const guide of GUIDES_EN) write(guidePath(guide.slug), guidePage(guide));
write(guidesIndexPath('en'), guidesIndex(GUIDES_EN));
copyFileSync(join(ROOT, 'apps/web/pages/pages.css'), join(out, GUIDE_STYLESHEET));
console.log(`[guides] ${GUIDES_EN.length} English guides and their index into ${out}`);
