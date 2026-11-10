/**
 * The guides, in the order the index lists them: the most urgent first.
 * "The first winter in Finland" is Amir's to write (docs/guides/first-winter-draft.md).
 */
import type { Guide } from './types.ts';
import { freeHelpNow } from './en/free-help-now.js';
import { therapyInEnglish } from './en/therapy-in-english.js';
import { kelaPsychotherapy } from './en/kela-psychotherapy.js';
import { psychologistWithoutReferral } from './en/psychologist-without-referral.js';
import { whileYouWait } from './en/while-you-wait.js';
import { freeHelpNowFi } from './fi/free-help-now.js';
import { therapyInEnglishFi } from './fi/therapy-in-english.js';
import { kelaPsychotherapyFi } from './fi/kela-psychotherapy.js';
import { psychologistWithoutReferralFi } from './fi/psychologist-without-referral.js';
import { whileYouWaitFi } from './fi/while-you-wait.js';
import { freeHelpNowSv } from './sv/free-help-now.js';
import { therapyInEnglishSv } from './sv/therapy-in-english.js';
import { kelaPsychotherapySv } from './sv/kela-psychotherapy.js';
import { psychologistWithoutReferralSv } from './sv/psychologist-without-referral.js';
import { whileYouWaitSv } from './sv/while-you-wait.js';

/** Sources numbered in the order a reader first meets them. */
function inReadingOrder(guide: Guide): Guide {
  const seen: string[] = [];
  const all = [guide.intro.join(' '), ...guide.sections.map((s) => JSON.stringify(s))].join(' ');
  for (const [, id] of all.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) if (!seen.includes(id)) seen.push(id);
  const byId = new Map(guide.sources.map((s) => [s.id, s]));
  return { ...guide, sources: [...seen.filter((id) => byId.has(id)).map((id) => byId.get(id)!), ...guide.sources.filter((s) => !seen.includes(s.id))] };
}

export const GUIDES_EN: Guide[] = [freeHelpNow, therapyInEnglish, kelaPsychotherapy, psychologistWithoutReferral, whileYouWait].map(inReadingOrder);

/**
 * Finnish and Swedish (Amir, 9.11.2026): drafted, and **not public until the
 * native reviewer has read them.** An unpublished language is built only off
 * production (previews, local), with noindex; production builds skip it. Setting
 * one to true is the reviewer's sign-off, made as a reviewed edit.
 */
export const GUIDES_PUBLISHED: Record<'en' | 'fi' | 'sv', boolean> = { en: true, fi: false, sv: false };

export const GUIDES_FI: Guide[] = [freeHelpNowFi, therapyInEnglishFi, kelaPsychotherapyFi, psychologistWithoutReferralFi, whileYouWaitFi].map(inReadingOrder);
export const GUIDES_SV: Guide[] = [freeHelpNowSv, therapyInEnglishSv, kelaPsychotherapySv, psychologistWithoutReferralSv, whileYouWaitSv].map(inReadingOrder);

export const GUIDES: Record<'en' | 'fi' | 'sv', Guide[]> = { en: GUIDES_EN, fi: GUIDES_FI, sv: GUIDES_SV };
