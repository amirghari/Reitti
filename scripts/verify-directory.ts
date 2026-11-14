/**
 * Directory verification, in two halves that fail differently — decision D-7.
 *
 *   Completeness  offline, deterministic, our bug.        BLOCKS.  (exit 1)
 *   Liveness      needs the network, usually not our bug. REPORTS. (exit 0)
 *
 * Combining them would mean MIELI ry's site being down for ten minutes stops us
 * deploying a fix to Reitti — and worse, teaches everyone to wave through a red
 * check that is usually somebody else's outage. A missing field is ours and must
 * block; a dead link is reported in STATUS.md on the status branch, every day
 * (Amir, 12.11.2026: the site says every address is checked daily, so a failure
 * must land somewhere a person reads, not only in a green run's log).
 *
 *   npm run directory:verify            completeness only
 *   npm run directory:verify -- --live  completeness + URL liveness
 *   npm run directory:verify -- --live --json <file>   + the results as JSON,
 *       which scripts/liveness-status.mjs turns into the STATUS.md section
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
  if (e.operatorRef && !(e.operatorRef in en)) fail(e.id, `operatorRef "${e.operatorRef}" does not resolve`);
  if (e.anonymityRef && !(e.anonymityRef in en)) fail(e.id, `anonymityRef "${e.anonymityRef}" does not resolve`);
  if (e.languagesRef && !(e.languagesRef in en)) fail(e.id, `languagesRef "${e.languagesRef}" does not resolve`);
  // A link labelled "in English" must open a page in a language the service has
  // (or one whose languages are not stated, which claims none: the health station).
  if (e.urlLanguage && !e.languagesRef && !e.languages?.includes(e.urlLanguage)) fail(e.id, `urlLanguage "${e.urlLanguage}" is not one of its languages`);
  if (e.urlLanguage && !(`directory.visitIn.${e.urlLanguage}` in en)) fail(e.id, `no "directory.visitIn.${e.urlLanguage}" label`);
  // A page per interface language, each on https, and never the same as `url`.
  for (const [l, u] of Object.entries(e.localUrls ?? {})) {
    if (!['en', 'fi', 'sv'].includes(l)) fail(e.id, `localUrls has "${l}", not an interface language`);
    if (!/^https:\/\//.test(u ?? '') || u === e.url) fail(e.id, `localUrls.${l} is not a separate https page`);
    if (l === e.urlLanguage) fail(e.id, `localUrls.${l} duplicates urlLanguage`);
  }

  if (!e.languages?.length) fail(e.id, 'no languages');
  if (!e.formats?.length) fail(e.id, 'no formats');
  if (!e.anonymity) fail(e.id, 'no anonymity');
  if (!e.whoAnswers) fail(e.id, 'no whoAnswers');
  if (!e.operator) fail(e.id, 'no operator');
  if (!e.rungs?.length) fail(e.id, 'no rungs');
  if (!e.url) fail(e.id, 'no url');
  if (!e.origin) fail(e.id, 'no origin');
  // 'care' is support you can walk into, 'gated-care' is real care behind a
  // referral, 'route' is a navigator. Only the first two may be named at a rung,
  // and 'gated-care' only ever with the gate stated.
  if (!e.role) fail(e.id, 'no role');
  else if (!['care', 'gated-care', 'route'].includes(e.role)) {
    fail(e.id, `role "${e.role}" is not care, gated-care or route`);
  }
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
  if (process.argv.includes('--json')) {
    console.error('  --json reports URL liveness, so it needs --live');
    process.exit(2);
  }
  console.log('  (skipping URL liveness — pass --live to check)\n');
  process.exit(0);
}

console.log('DIRECTORY URL LIVENESS — reporting only, never blocks\n');

// Each entry's address, and its page in each other language (`localUrls`, Amir
// 14.11.2026: the health station's Swedish page is checked daily too).
const targets: { id: string; lang?: string; url: string }[] = entries.flatMap((e) => [
  { id: e.id, url: e.url },
  ...Object.entries(e.localUrls ?? {}).map(([lang, url]) => ({ id: e.id, lang, url: url as string })),
]);

const results = await Promise.all(
  targets.map(async ({ id, lang, url }) => {
    const named = lang ? { id, lang } : { id };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      // HEAD is refused by enough of these sites that a GET is the honest check.
      // The user agent says who is asking; it never pretends to be a browser.
      // Accept-Language because every browser sends one, and Nyyti's course pages
      // answer 500 without it (12.11.2026): a page that works for people is not dead.
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'user-agent': 'Mielenreitti-link-check/1.0 (+https://mielenreitti.fi/about)',
          accept: 'text/html,*/*;q=0.8',
          'accept-language': 'fi,sv;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timer);
      return { ...named, url, status: res.status };
    } catch (err) {
      return { ...named, url, status: 0, error: (err as Error).message };
    }
  }),
);

for (const r of results) {
  const mark = r.status === 200 ? '✓' : r.status === 0 ? '✗' : '⚠';
  console.log(`  ${mark} ${String(r.status || 'ERR').padEnd(4)} ${('lang' in r ? `${r.id} (${r.lang})` : r.id).padEnd(24)} ${r.url}`);
}

const bad = results.filter((r) => r.status !== 200);
console.log(
  bad.length === 0
    ? '\n  ✓ every URL returned 200\n'
    : `\n  ⚠ ${bad.length} URL(s) did not return 200. Reported in STATUS.md on the status branch; this does not block.\n`,
);
// A warning on the run page too, so a green run still shows what failed.
if (process.env.GITHUB_ACTIONS === 'true') {
  for (const r of bad) console.log(`::warning title=Directory link::${r.id} answered ${r.status || 'nothing'} (${r.url})`);
}

const j = process.argv.indexOf('--json');
if (j !== -1) {
  const file = process.argv[j + 1];
  if (!file || file.startsWith('--')) throw new Error('--json needs a file');
  writeFileSync(file, JSON.stringify({ checkedAt: new Date().toISOString(), total: results.length, results }, null, 2));
}
