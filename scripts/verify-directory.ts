/**
 * Directory verification, in two halves that fail differently — decision D-7.
 *
 *   Completeness  offline, deterministic, our bug.        BLOCKS.  (exit 1)
 *   Liveness      needs the network, usually not our bug. REPORTS. (exit 0)
 *
 * Combining them would mean MIELI ry's site being down for ten minutes stops us
 * deploying a fix to Reitti — and worse, teaches everyone to wave through a red
 * check that is usually somebody else's outage. A missing field is ours and must
 * block; a dead link opens an issue.
 *
 *   npm run directory:verify            completeness only
 *   npm run directory:verify -- --live  completeness + URL liveness
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DirectoryEntry } from '../packages/engine/src/directory.ts';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '../config');
const read = <T>(...p: string[]): T => JSON.parse(readFileSync(join(CONFIG, ...p), 'utf8')) as T;

/**
 * The English bundle, merged from the three ownership-split files. `_note`,
 * `_language` and `_translationStatus` are metadata, not copy.
 */
const strings = (name: string): Record<string, string> =>
  Object.fromEntries(
    Object.entries(read<Record<string, unknown>>('i18n', name, 'en.json')).filter(
      ([k, v]) => !k.startsWith('_') && typeof v === 'string',
    ),
  ) as Record<string, string>;

const en: Record<string, string> = {
  ...strings('ui'),
  ...strings('clinical'),
  ...strings('directory'),
};
const entries = readdirSync(join(CONFIG, 'directory'))
  .filter((f) => f.endsWith('.json'))
  // Sector files are the ones carrying an `entries` array. Selecting on shape
  // rather than on a hand-maintained filename list keeps the "a file nobody
  // added to the list is the file nobody tested" property, while letting policy
  // files (human-fallback, while-you-wait) live in the same folder.
  .map((f) => read<{ entries?: DirectoryEntry[] }>('directory', f).entries)
  .filter((e): e is DirectoryEntry[] => Array.isArray(e))
  .flat();

// ---------------------------------------------------------------------------
// Completeness — blocking
// ---------------------------------------------------------------------------

const problems: string[] = [];
const fail = (id: string, msg: string) => problems.push(`  ${id.padEnd(24)} ${msg}`);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

for (const e of entries) {
  if (!e.hoursRef) fail(e.id, 'no hoursRef');
  else if (!(e.hoursRef in en)) fail(e.id, `hoursRef "${e.hoursRef}" does not resolve`);

  if (!e.nameRef) fail(e.id, 'no nameRef');
  else if (!(e.nameRef in en)) fail(e.id, `nameRef "${e.nameRef}" does not resolve`);

  if (e.costNoteRef && !(e.costNoteRef in en)) fail(e.id, `costNoteRef "${e.costNoteRef}" does not resolve`);
  if (e.cautionRef && !(e.cautionRef in en)) fail(e.id, `cautionRef "${e.cautionRef}" does not resolve`);

  if (!e.languages?.length) fail(e.id, 'no languages');
  if (!e.formats?.length) fail(e.id, 'no formats');
  if (!e.anonymity) fail(e.id, 'no anonymity');
  if (!e.whoAnswers) fail(e.id, 'no whoAnswers');
  if (!e.operator) fail(e.id, 'no operator');
  if (!e.rungs?.length) fail(e.id, 'no rungs');
  if (!e.url) fail(e.id, 'no url');
  if (!e.origin) fail(e.id, 'no origin');
  // 'care' is the support itself; 'route' is a way of reaching it. Only 'care'
  // may be named as the free thing available at a rung.
  if (!e.role) fail(e.id, 'no role');
  else if (e.role !== 'care' && e.role !== 'route') fail(e.id, `role "${e.role}" is not care or route`);
  if (e.ageRange?.min === undefined) fail(e.id, 'no ageRange.min');

  if (!e.verifiedOn) fail(e.id, 'no verifiedOn');
  else if (!ISO_DATE.test(e.verifiedOn)) fail(e.id, `verifiedOn "${e.verifiedOn}" is not ISO yyyy-mm-dd`);
  if (!e.verifiedBy) fail(e.id, 'no verifiedBy');

  // A fallback-only entry without its caution is the failure mode this field
  // exists to prevent: 7 Cups rendered as though it were equivalent to MIELI.
  if (e.fallbackOnly && !e.cautionRef) fail(e.id, 'fallbackOnly with no cautionRef');
}

const ids = entries.map((e) => e.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
for (const id of new Set(duplicates)) fail(id, 'duplicate entry id');

console.log(`\nDIRECTORY COMPLETENESS — ${entries.length} entries`);
if (problems.length === 0) {
  console.log('  ✓ every entry carries hours, language, anonymity, who-answers and a verification date\n');
} else {
  console.log(`  ✗ ${problems.length} problem(s):\n`);
  console.log(problems.join('\n'));
  console.log('');
  process.exit(1);
}

const unreviewed = entries.filter((e) => !e.clinicianReviewed);
if (unreviewed.length > 0) {
  console.log(`  ⚠ ${unreviewed.length} entries not clinician-reviewed (provisional, does not block)\n`);
}

// ---------------------------------------------------------------------------
// Liveness — reporting only
// ---------------------------------------------------------------------------

if (!process.argv.includes('--live')) {
  console.log('  (skipping URL liveness — pass --live to check)\n');
  process.exit(0);
}

console.log('DIRECTORY URL LIVENESS — reporting only, never blocks\n');

const results = await Promise.all(
  entries.map(async (e) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      // HEAD is refused by enough of these sites that a GET is the honest check.
      const res = await fetch(e.url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timer);
      return { id: e.id, url: e.url, status: res.status };
    } catch (err) {
      return { id: e.id, url: e.url, status: 0, error: (err as Error).message };
    }
  }),
);

for (const r of results) {
  const mark = r.status === 200 ? '✓' : r.status === 0 ? '✗' : '⚠';
  console.log(`  ${mark} ${String(r.status || 'ERR').padEnd(4)} ${r.id.padEnd(24)} ${r.url}`);
}

const bad = results.filter((r) => r.status !== 200);
console.log(
  bad.length === 0
    ? '\n  ✓ every URL returned 200\n'
    : `\n  ⚠ ${bad.length} URL(s) did not return 200. Open an issue; this does not block.\n`,
);
