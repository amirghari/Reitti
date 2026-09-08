/**
 * Loads the governance surface.
 *
 * V1 bundles config at build time. Architecture v2 §5 replaces this module with a
 * fetch from a versioned CDN so a clinician can ship a cutoff change without a
 * deploy — nothing outside this file needs to change when that happens.
 */
import type {
  DirectoryEntry,
  FlowConfig,
  GroupsConfig,
  HumanFallbackConfig,
  Instrument,
  Ladder,
  RoutingRules,
} from '@reitti/engine';

import phq4 from '@config/instruments/phq-4.json';
import phq9 from '@config/instruments/phq-9.json';
import gad7 from '@config/instruments/gad-7.json';
import who5 from '@config/instruments/who-5.json';
import auditC from '@config/instruments/audit-c.json';
import pcPtsd5 from '@config/instruments/pc-ptsd-5.json';
import ucla3 from '@config/instruments/ucla-3.json';
import rulesJson from '@config/routing/rules.json';
import flowJson from '@config/routing/flow.json';
import ladderJson from '@config/ladder/ladder.json';
import crisisJson from '@config/crisis.json';
import directoryPublic from '@config/directory/public.json';
import directoryThirdSector from '@config/directory/third-sector.json';
import directoryKela from '@config/directory/kela.json';
import directoryPrivate from '@config/directory/private.json';
import directoryYouth from '@config/directory/youth.json';
import humanFallbackJson from '@config/directory/human-fallback.json';
import whileYouWaitJson from '@config/directory/while-you-wait.json';
import groupsJson from '@config/groups/topics.json';
import feedbackJson from '@config/feedback.json';

export const instruments = [phq4, phq9, gad7, who5, auditC, pcPtsd5, ucla3] as unknown as Instrument[];
export const rules = rulesJson as unknown as RoutingRules;
export const flow = flowJson as unknown as FlowConfig;
export const ladder = ladderJson as unknown as Ladder;

/**
 * The cross-sector registry, in sector order so config order — the clinician's
 * tiebreak inside an ordering band — is public, third-sector, Kela, private.
 * `private.json` is deliberately empty; see decision D-12.
 */
export const directory = [
  ...directoryPublic.entries,
  ...directoryThirdSector.entries,
  ...directoryKela.entries,
  ...directoryPrivate.entries,
  ...directoryYouth.entries,
] as unknown as DirectoryEntry[];

/**
 * C4. Reitti remains 18+. An under-18 sees these and the crisis path, and
 * nothing else — a redirection, not a rejection.
 */
export const youth = {
  entryIds: [...directoryYouth.youthEntryIds, ...directoryYouth.entries.map((e) => e.id)],
};

/** C1: which person we offer first, per care language. The clinician's call. */
export const humanFallback = humanFallbackJson as unknown as HumanFallbackConfig;

/**
 * Where product feedback goes. `address` is null until an alias is set, and the
 * section hides itself until then.
 */
export const feedback = feedbackJson as unknown as { address: string | null; subject: string };

/** A3: the group topics people can pool demand for. */
export const groups = groupsJson as unknown as GroupsConfig;

/** C2: what follows a referral, so nobody leaves with only a link. */
export const whileYouWait = whileYouWaitJson as unknown as {
  afterRungs: string[];
  selfHelpEntryIds: string[];
  peerEntryIds: string[];
};

export interface CrisisResource {
  id: string;
  nameRef: string;
  phone: string;
  languages: string[];
  availability: string;
  verified: boolean;
}

export const crisis = crisisJson as unknown as { version: string; resources: CrisisResource[] };

export const instrumentById = (id: string): Instrument => {
  const found = instruments.find((i) => i.id === id);
  if (!found) throw new Error(`No instrument config "${id}"`);
  return found;
};

/**
 * What the person tells us before any instrument runs. Feeds routing and the flow.
 * Labels are refs, not literals, so the context step translates with everything
 * else — see `config/i18n/ui/`.
 */
export const DOMAINS = [
  { id: 'mood', labelRef: 'domain.mood' },
  { id: 'anxiety', labelRef: 'domain.anxiety' },
  { id: 'work', labelRef: 'domain.work' },
  { id: 'social', labelRef: 'domain.social' },
  { id: 'grief', labelRef: 'domain.grief' },
  { id: 'substance', labelRef: 'domain.substance' },
  { id: 'general', labelRef: 'domain.general' },
] as const;

export const DURATIONS = [
  { id: 'under-a-month', labelRef: 'duration.under-a-month' },
  { id: '1-6-months', labelRef: 'duration.1-6-months' },
  { id: '6-12-months', labelRef: 'duration.6-12-months' },
  { id: 'over-a-year', labelRef: 'duration.over-a-year' },
] as const;

export const BUDGETS = [
  { id: 'none', labelRef: 'budget.none' },
  { id: 'low', labelRef: 'budget.low' },
  { id: 'moderate', labelRef: 'budget.moderate' },
  { id: 'flexible', labelRef: 'budget.flexible' },
] as const;

/**
 * The CARE language — which language the person wants support in. Independent of
 * the interface language: wanting therapy in Finnish while reading the app in
 * English is an ordinary combination, not an edge case.
 *
 * These labels are endonyms and are deliberately NOT translated. "Suomi" is what
 * a Finnish speaker looks for, in any interface language.
 */
export const LANGUAGES = [
  { id: 'fi', label: 'Suomi' },
  { id: 'sv', label: 'Svenska' },
  { id: 'en', label: 'English' },
] as const;

/**
 * Age band rather than an age (decision D-8). It answers both boundaries the
 * product needs — 18+ and the 12–29 youth-service range — while collecting less.
 * Never transmitted: invariant 11 forbids it.
 */
export const AGE_BANDS = [
  { id: 'under-18', labelRef: 'ageBand.under-18' },
  { id: '18-29', labelRef: 'ageBand.18-29' },
  { id: '30-plus', labelRef: 'ageBand.30-plus' },
] as const;
