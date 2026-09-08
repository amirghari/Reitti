import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Instrument, Ladder, RoutingRules } from '../src/types.js';
import type { FlowConfig } from '../src/flow.js';
import type { DirectoryEntry, HumanFallbackConfig } from '../src/directory.js';
import type { GroupsConfig } from '../src/pool.js';

const here = dirname(fileURLToPath(import.meta.url));
export const CONFIG_DIR = join(here, '../../../config');

const read = <T>(...parts: string[]): T => JSON.parse(readFileSync(join(CONFIG_DIR, ...parts), 'utf8'));

export const instruments: Instrument[] = readdirSync(join(CONFIG_DIR, 'instruments'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read<Instrument>('instruments', f));

export const instrument = (id: string): Instrument => {
  const found = instruments.find((i) => i.id === id);
  if (!found) throw new Error(`test fixture missing instrument ${id}`);
  return found;
};

export const rules = read<RoutingRules>('routing', 'rules.json');
export const flow = read<FlowConfig>('routing', 'flow.json');
export const ladder = read<Ladder>('ladder', 'ladder.json');
export interface CrisisResource {
  id: string;
  nameRef: string;
  phone: string;
  languages: string[];
  availability: string;
  verified: boolean;
}

/**
 * The whole registry, read from the directory the same way `directory:print`
 * does. Reading the folder rather than a hand-maintained list matters for the
 * same reason it does for instruments: a file nobody remembered to add to the
 * list is the file nobody tested.
 */
export const directory: DirectoryEntry[] = readdirSync(join(CONFIG_DIR, 'directory'))
  .filter((f) => f.endsWith('.json'))
  // Sector files are the ones carrying an `entries` array. Selecting on shape
  // rather than on a hand-maintained filename list keeps the "a file nobody
  // added to the list is the file nobody tested" property, while letting policy
  // files (human-fallback, while-you-wait) live in the same folder.
  .map((f) => read<{ entries?: DirectoryEntry[] }>('directory', f).entries)
  .filter((entries): entries is DirectoryEntry[] => Array.isArray(entries))
  .flat();

export const entry = (id: string): DirectoryEntry => {
  const found = directory.find((e) => e.id === id);
  if (!found) throw new Error(`test fixture missing directory entry ${id}`);
  return found;
};

export const crisisConfig = read<{ version: string; resources: CrisisResource[] }>('crisis.json');
/**
 * The i18n bundles, split by ownership: `ui` is Reitti's product copy, `clinical`
 * is the clinician's surface, `directory` is service data. `en` is the three
 * merged, which is what a ref-resolution test wants.
 */
export type BundleName = 'ui' | 'clinical' | 'directory';
export const BUNDLE_NAMES: BundleName[] = ['ui', 'clinical', 'directory'];
export const UI_LANGUAGES = ['en', 'fi', 'sv'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

export const bundle = (name: BundleName, language: UiLanguage): Record<string, unknown> =>
  read<Record<string, unknown>>('i18n', name, `${language}.json`);

/** Copy only — the `_note`, `_language` and `_translationStatus` keys are metadata. */
export const strings = (name: BundleName, language: UiLanguage): Record<string, string> =>
  Object.fromEntries(
    Object.entries(bundle(name, language)).filter(
      ([k, v]) => !k.startsWith('_') && typeof v === 'string',
    ),
  ) as Record<string, string>;

export const merged = (language: UiLanguage): Record<string, string> =>
  Object.assign({}, ...BUNDLE_NAMES.map((n) => strings(n, language)));

export const en = merged('en');

export const translationStatus = (language: UiLanguage): Record<string, string> =>
  (bundle('clinical', language)._translationStatus ?? {}) as Record<string, string>;

export interface FlagDeclaration {
  default: boolean;
  because: string;
  whenOn: string;
  whenOff: string;
}
export const flags = read<{ version: string; flags: Record<string, FlagDeclaration> }>('flags.json');

export const humanFallback = read<HumanFallbackConfig>('directory', 'human-fallback.json');

export const groups = read<GroupsConfig>('groups', 'topics.json');

export const feedback = read<{ address: string | null; subject: string; because: string }>(
  'feedback.json',
);


export const youthConfig = read<{ youthEntryIds: string[]; entries: DirectoryEntry[] }>(
  'directory',
  'youth.json',
);

export const whileYouWait = read<{
  afterRungs: string[];
  selfHelpEntryIds: string[];
  peerEntryIds: string[];
}>('directory', 'while-you-wait.json');

/** Answer every item of an instrument with the same value. */
export const answerAll = (id: string, value: number): Record<string, number> =>
  Object.fromEntries(instrument(id).items.map((i) => [i.key, value]));
