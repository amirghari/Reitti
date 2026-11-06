/**
 * Builds the professional and city pages from the private dataset (D-39).
 *
 *   npm run pages:build -- --data ../Reitti-data [--out apps/web/dist]
 *
 * Never part of `npm run build`: a Vercel git build has no dataset and builds
 * no directory page. This runs only when someone runs it, for a private preview.
 *
 * It refuses, and builds nothing, when:
 *   - the dataset does not match docs/schemas/professional.schema.json;
 *   - it is a production build (VERCEL_ENV=production or --production) and
 *     anything in productionBlockers() stands: the gate is shut, a sample row,
 *     no claim/removal address, a licence not checked.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionBlockers, validate, type Professional } from '../apps/web/pages/data.ts';
import { STYLESHEET, previewIndex, renderAll } from '../apps/web/pages/render.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const dataDir = arg('data') ?? process.env.REITTI_DATA_DIR;
const outDir = resolve(arg('out') ?? join(ROOT, 'apps/web/dist'));
const production = process.argv.includes('--production') || process.env.VERCEL_ENV === 'production';

function fail(lines: string[]): never {
  console.error(['[pages] nothing built:', ...lines.map((l) => `  - ${l}`)].join('\n'));
  process.exit(1);
}

if (!dataDir || !existsSync(join(dataDir, 'professionals.json'))) {
  console.log('[pages] no Reitti-data checkout given (--data or REITTI_DATA_DIR); no directory pages built.');
  process.exit(0);
}

const dataset = JSON.parse(readFileSync(join(dataDir, 'professionals.json'), 'utf8')) as { rows?: unknown };
const problems = validate(dataset.rows);
if (problems.length) fail(problems);
const rows = dataset.rows as Professional[];

const suppressed = JSON.parse(readFileSync(join(dataDir, 'suppressed.json'), 'utf8')) as { entries?: unknown };
if (!Array.isArray(suppressed.entries)) fail(['suppressed.json has no entries list']);

if (production) {
  const blockers = productionBlockers(rows);
  if (blockers.length) fail(blockers);
}

const pages = renderAll(rows);
for (const { path, html } of pages) {
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
mkdirSync(join(outDir, dirname(STYLESHEET)), { recursive: true });
copyFileSync(join(ROOT, 'apps/web/pages/pages.css'), join(outDir, STYLESHEET));
writeFileSync(join(outDir, dirname(STYLESHEET), 'index.html'), previewIndex(pages));

const samples = rows.filter((r) => r.sample).length;
console.log(`[pages] ${pages.length} pages from ${rows.length} rows (${samples} sample) into ${outDir}; index at ${dirname(STYLESHEET)}/`);
