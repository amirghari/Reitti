/**
 * The guides, in the order the index lists them: the most urgent first.
 * "The first winter in Finland" is Amir's to write (docs/guides/first-winter-draft.md).
 */
import type { Guide } from './types.ts';
import { freeHelpNow } from './en/free-help-now.ts';
import { therapyInEnglish } from './en/therapy-in-english.ts';
import { kelaPsychotherapy } from './en/kela-psychotherapy.ts';
import { psychologistWithoutReferral } from './en/psychologist-without-referral.ts';
import { whileYouWait } from './en/while-you-wait.ts';

/** Sources numbered in the order a reader first meets them. */
function inReadingOrder(guide: Guide): Guide {
  const seen: string[] = [];
  const all = [guide.intro.join(' '), ...guide.sections.map((s) => JSON.stringify(s))].join(' ');
  for (const [, id] of all.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) if (!seen.includes(id)) seen.push(id);
  const byId = new Map(guide.sources.map((s) => [s.id, s]));
  return { ...guide, sources: [...seen.filter((id) => byId.has(id)).map((id) => byId.get(id)!), ...guide.sources.filter((s) => !seen.includes(s.id))] };
}

export const GUIDES_EN: Guide[] = [freeHelpNow, therapyInEnglish, kelaPsychotherapy, psychologistWithoutReferral, whileYouWait].map(inReadingOrder);
