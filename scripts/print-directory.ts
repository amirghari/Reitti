/**
 * Prints the provider registry for clinician and partner review.
 *
 * The companion to `rules:print`. That one answers "are these recommendations
 * arbitrary?"; this one answers "where are you actually sending people?" — which
 * is the question a wellbeing county or MIELI asks first, and the one a wrong
 * phone number answers badly.
 *
 *   npm run directory:print
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { printDirectory } from '../packages/engine/src/directory.ts';
import type { DirectoryEntry } from '../packages/engine/src/directory.ts';
import type { Ladder } from '../packages/engine/src/types.ts';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '../config');
const read = <T>(...p: string[]): T => JSON.parse(readFileSync(join(CONFIG, ...p), 'utf8')) as T;

const ladder = read<Ladder>('ladder', 'ladder.json');
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

const rungOrder = [...ladder.rungs].sort((a, b) => a.level - b.level).map((r) => r.id);
const rule = (char = '─') => char.repeat(78);

console.log(`\n${rule('═')}`);
console.log('REITTI — PROVIDER REGISTRY  ·  FOR CLINICIAN & PARTNER REVIEW');
console.log('All entries below are PROVISIONAL until signed off.');
console.log(rule('═'));

console.log(printDirectory(entries, rungOrder));

// A rung with no entries is a person told where to go and given no way to get
// there. Worth seeing on the sign-off sheet rather than discovering on a screen.
const empty = rungOrder.filter((id) => !entries.some((e) => e.rungs.includes(id)));
if (empty.length > 0) {
  console.log(`\n⚠ Rungs with no directory entry at all: ${empty.join(', ')}`);
}

console.log(`\n${rule()}`);
console.log('\nNAMES AS THEY APPEAR TO THE PERSON\n');
for (const e of entries) {
  console.log(`  ${(en[e.nameRef] ?? `‼ UNRESOLVED ${e.nameRef}`).padEnd(46)} ${en[e.hoursRef] ?? `‼ ${e.hoursRef}`}`);
}

console.log(`\n${rule('═')}`);
console.log('Signed: ______________________________   Date: ______________');
console.log(`${rule('═')}\n`);
