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
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionBlockers, validate, type Professional } from '../apps/web/pages/data.ts';
import { OWNED_FOLDERS, STYLESHEET, previewIndex, renderAll } from '../apps/web/pages/render.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function fail(lines: string[]): never {
  console.error(['[pages] nothing built:', ...lines.map((l) => `  - ${l}`)].join('\n'));
  process.exit(1);
}

/**
 * Only these three flags, spelled exactly. Anything else stops the build:
 * `--production=true` or `--prod` must never fall through to a preview build
 * that skips the blockers.
 */
const FLAGS = new Set(['--data', '--out', '--production']);
const argv = process.argv.slice(2);
const unknown = argv.filter((a, i) => a.startsWith('-') && !FLAGS.has(a) && !['--data', '--out'].includes(argv[i - 1]));
const stray = argv.filter((a, i) => !a.startsWith('-') && !['--data', '--out'].includes(argv[i - 1]));
if (unknown.length || stray.length) fail([`unknown arguments: ${[...unknown, ...stray].join(' ')} (allowed: --data <dir>, --out <dir>, --production)`]);

function arg(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

const dataDir = arg('data') ?? process.env.REITTI_DATA_DIR;
const outDir = resolve(arg('out') ?? join(ROOT, 'apps/web/dist'));

/**
 * Production if anyone says so: the flag, Vercel's own environment, or a
 * `vercel build --prod` output, whose builds.json beside static/ names its
 * target. Writing into that folder is preparing a production deploy, however
 * this script was called.
 */
function vercelTarget(dir: string): string | undefined {
  const builds = join(dir, '..', 'builds.json');
  if (!existsSync(builds)) return undefined;
  try {
    return (JSON.parse(readFileSync(builds, 'utf8')) as { target?: string }).target;
  } catch {
    return 'unreadable';
  }
}
const target = vercelTarget(outDir);
const production =
  argv.includes('--production') || process.env.VERCEL_ENV === 'production' || (target !== undefined && target !== 'preview');

if (!dataDir || !existsSync(join(dataDir, 'professionals.json'))) {
  console.log('[pages] no Reitti-data checkout given (--data or REITTI_DATA_DIR); no directory pages built.');
  process.exit(0);
}

const dataset = JSON.parse(readFileSync(join(dataDir, 'professionals.json'), 'utf8')) as { rows?: unknown };
const problems = validate(dataset.rows);
if (problems.length) fail(problems);
const rows = dataset.rows as Professional[];

// Read so a malformed file stops the build. Matching rows against it needs the
// salt, which lives outside both repositories; that check belongs to the hand-entry
// and import step, not built yet (docs/directory.md, "Not built yet").
const suppressed = JSON.parse(readFileSync(join(dataDir, 'suppressed.json'), 'utf8')) as { entries?: unknown };
if (!Array.isArray(suppressed.entries)) fail(['suppressed.json has no entries list']);

if (production) {
  const blockers = productionBlockers(rows);
  if (blockers.length) fail(blockers);
}

const pages = renderAll(rows);

// The folders these pages live in belong to this build alone. Clear them first,
// so a row removed since the last build leaves no page behind in a reused --out.
for (const folder of OWNED_FOLDERS) rmSync(join(outDir, folder), { recursive: true, force: true });
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
