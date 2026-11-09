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
import { GUIDES, GUIDES_PUBLISHED } from '../apps/web/guides/index.ts';
import { GUIDE_STYLESHEET, checkGuide, guidePage, guidePath, guidesIndex, guidesIndexPath } from '../apps/web/guides/render.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(i === -1 ? join(ROOT, 'apps/web/dist') : process.argv[i + 1]);

// Production builds only what is published; previews and local builds also the
// drafts, with noindex (Finnish and Swedish wait for the native reviewer).
const production = process.env.VERCEL_ENV === 'production';
const langs = (Object.keys(GUIDES) as ('en' | 'fi' | 'sv')[]).filter((l) => GUIDES[l].length && (GUIDES_PUBLISHED[l] || !production));

const problems = langs.flatMap((l) => GUIDES[l].flatMap(checkGuide));
if (problems.length) {
  console.error(['[guides] nothing built:', ...problems.map((p) => `  - ${p}`)].join('\n'));
  process.exit(1);
}

const write = (path: string, html: string) => {
  const file = join(out, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};
for (const lang of langs) {
  const noindex = !GUIDES_PUBLISHED[lang];
  for (const guide of GUIDES[lang]) write(guidePath(guide.slug, lang), guidePage(guide, { noindex }));
  write(guidesIndexPath(lang), guidesIndex(GUIDES[lang], lang, { noindex }));
}
copyFileSync(join(ROOT, 'apps/web/pages/pages.css'), join(out, GUIDE_STYLESHEET));
console.log(`[guides] ${langs.map((l) => `${GUIDES[l].length} ${l}${GUIDES_PUBLISHED[l] ? '' : ' (draft, noindex)'}`).join(', ')} into ${out}`);
