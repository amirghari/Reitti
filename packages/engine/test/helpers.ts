import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Instrument, Ladder, RoutingRules } from '../src/types.js';
import type { FlowConfig } from '../src/flow.js';

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

export const crisisConfig = read<{ version: string; resources: CrisisResource[] }>('crisis.json');
export const en = read<Record<string, string>>('i18n', 'en.json');

/** Answer every item of an instrument with the same value. */
export const answerAll = (id: string, value: number): Record<string, number> =>
  Object.fromEntries(instrument(id).items.map((i) => [i.key, value]));
