/**
 * The cross-sector directory — value #1 of V2, made executable.
 *
 * HUS routes people inside the public system. This module is how Reitti routes
 * across all of it: public, Kela, third-sector and private in one ordering, with
 * the free routes first.
 *
 * The single rule the whole module exists to enforce: **it orders, it never
 * filters.** The only removal permitted anywhere here is the age gate, because
 * showing an adult private therapist to a fifteen-year-old is not a preference
 * question. Budget, language and format shift position only. Invariant 12 asserts
 * that no combination of them can empty a rung that has entries.
 */
import { ConfigError } from './scoring.js';
import type { AgeBand, Budget } from './types.js';
export type { AgeBand };

export type Sector = 'public' | 'kela' | 'third-sector' | 'private';

export type CostBand =
  | 'free'
  | 'free-with-referral'
  | 'kela-subsidised'
  | 'employer-paid'
  | 'self-pay';

export type Format =
  | 'phone'
  | 'chat'
  | 'email'
  | 'video'
  | 'in-person'
  | 'group'
  | 'self-guided';

export type Anonymity = 'anonymous' | 'registration-optional' | 'registration-required' | 'identified';

/**
 * Who is on the other end. A person choosing between a crisis professional, a
 * trained volunteer and a peer with lived experience is making a real choice,
 * and flattening it to "support" would take that choice away.
 */
export type WhoAnswers =
  | 'professional'
  | 'trained-volunteer'
  | 'peer-lived-experience'
  | 'mixed'
  | 'not-applicable';

/**
 * What an entry *is* on a rung.
 *
 * `care` is the support itself — a chat you can have, a programme you can work
 * through, a group you can sit in. `route` is a way of getting to it: an
 * assessment, a referral desk, a navigator.
 *
 * Conflating the two produced a real bug on the home page. Terapianavigaattori
 * lists `group-therapy` among its rungs because it routes people there, so
 * "the first free option on the group rung" resolved to it, and the ladder card
 * announced "Free here: Terapianavigaattori" next to Group therapy — implying
 * free group therapy exists when what exists is a way to be assessed for it.
 *
 * `gated-care` is the third case, and leaving it out was a mistake. Nettiterapia
 * is real treatment, delivered publicly and free to the patient — but only once a
 * health station or doctor refers you. Treating it as a `route` left rung 2
 * labelled FREE · REFERRAL while naming nobody, which reads as an unfinished card
 * rather than as an argument, and implies free care stops above peer support. It
 * does not. What stands between a person and it is a referral and a queue, which
 * is exactly the case for demand pooling, so the card should say so rather than
 * leave a blank space to be read as absence.
 *
 * Both belong on the result screen. Only `care` may be named as freely available
 * at a rung; `gated-care` is named with the gate stated.
 */
export type EntryRole = 'care' | 'gated-care' | 'route';

export interface DirectoryEntry {
  id: string;
  nameRef: string;
  /** Who runs it. Shown verbatim and never translated — it is a proper noun. */
  operator: string;
  rungs: string[];
  sector: Sector;
  costBand: CostBand;
  costNoteRef?: string;
  /** The language of the *care*, not of our interface. */
  languages: string[];
  ageRange: { min: number; max: number | null };
  formats: Format[];
  /**
   * Either verified hours or the honest fallback ("hours change — check the
   * site"). Never a stale hour presented as current: someone who turns up to a
   * closed line because we displayed last year's hours is the worse outcome.
   */
  hoursRef: string;
  anonymity: Anonymity;
  whoAnswers: WhoAnswers;
  url: string;
  phone?: string;
  /** Domestic Finnish/Swedish services always order before international ones. */
  origin: 'domestic' | 'international';
  /** Whether this is the care itself, or a way of reaching it. */
  role: EntryRole;
  /** Shown last, always, whatever else matches. 7 Cups is the only one in V2. */
  fallbackOnly?: boolean;
  /** A required caution rendered with the entry whenever it appears. */
  cautionRef?: string;
  /** Renders the "you may already have a Terapianavigaattori code" affordance. */
  hasConsentCode?: boolean;
  verifiedOn: string;
  verifiedBy: string;
  /** false blocks nothing, but `npm run directory:print` says so loudly. */
  clinicianReviewed: boolean;
  note?: string;
}

export interface DirectoryFilter {
  careLanguage?: string;
  ageBand?: AgeBand;
  budget?: Budget;
}

const COST_RANK: Record<CostBand, number> = {
  free: 0,
  'free-with-referral': 1,
  'kela-subsidised': 2,
  'employer-paid': 3,
  'self-pay': 4,
};

const SECTOR_RANK: Record<Sector, number> = {
  public: 0,
  'third-sector': 1,
  kela: 2,
  private: 3,
};

/** The age a band is treated as, for range checks. Coarse on purpose — see D-8. */
const AGE_OF: Record<AgeBand, number> = { 'under-18': 16, '18-29': 24, '30-plus': 40 };

export function servesAge(entry: DirectoryEntry, ageBand: AgeBand): boolean {
  const age = AGE_OF[ageBand];
  if (age < entry.ageRange.min) return false;
  if (entry.ageRange.max !== null && age > entry.ageRange.max) return false;
  return true;
}

export function speaks(entry: DirectoryEntry, language: string): boolean {
  return entry.languages.includes(language);
}

/**
 * The ordering key, most significant first.
 *
 * Language sits above cost deliberately: a service you cannot speak to is not a
 * cheaper option, it is an unusable one. Nothing is removed either way, and an
 * entry that exists in only one language says so rather than disappearing.
 */
function sortKey(entry: DirectoryEntry, filter: DirectoryFilter): number[] {
  const languageMiss = filter.careLanguage && !speaks(entry, filter.careLanguage) ? 1 : 0;

  // A budget of "none" pushes self-pay to the back of its group. It never
  // removes it — invariant 7 and 12 both depend on that staying true.
  const costPenalty =
    filter.budget === 'none' && (entry.costBand === 'self-pay' || entry.costBand === 'employer-paid')
      ? 1
      : 0;

  return [
    entry.fallbackOnly ? 1 : 0,
    entry.origin === 'international' ? 1 : 0,
    languageMiss,
    costPenalty,
    COST_RANK[entry.costBand],
    SECTOR_RANK[entry.sector],
  ];
}

function compare(a: DirectoryEntry, b: DirectoryEntry, filter: DirectoryFilter): number {
  const ka = sortKey(a, filter);
  const kb = sortKey(b, filter);
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return 0; // config order is the clinician's tiebreak — Array.prototype.sort is stable.
}

/** Free public and third-sector first, then Kela, then private. Ordering only. */
export function orderFreeFirst(
  entries: DirectoryEntry[],
  filter: DirectoryFilter = {},
): DirectoryEntry[] {
  return [...entries].sort((a, b) => compare(a, b, filter));
}

/**
 * The entries that serve one rung, ordered.
 *
 * Age is the only filter: an under-18 must never be handed an adult private
 * rung (invariant 10). Language and budget reorder and nothing more.
 */
export function entriesForRung(
  entries: DirectoryEntry[],
  rungId: string,
  filter: DirectoryFilter = {},
): DirectoryEntry[] {
  const onRung = entries.filter((e) => e.rungs.includes(rungId));
  const ageAppropriate = filter.ageBand
    ? onRung.filter((e) => servesAge(e, filter.ageBand!))
    : onRung;
  return orderFreeFirst(ageAppropriate, filter);
}

/**
 * Rung 2 ordering (D). Finnish and Swedish domestic services always render
 * before any international one, and a `fallbackOnly` entry is always last —
 * which is the whole reason 7 Cups can be included at all.
 */
export function orderRungTwo(
  entries: DirectoryEntry[],
  careLanguage: string,
): DirectoryEntry[] {
  return orderFreeFirst(entries, { careLanguage });
}

export interface HumanFallbackConfig {
  publicRouteEntryId: string;
  preferences: { language: string; because: string; entryIds: string[] }[];
}

/** Does a person answer here, in a format you can actually reach a person through? */
function isHuman(entry: DirectoryEntry): boolean {
  return (
    entry.whoAnswers !== 'not-applicable' &&
    entry.formats.some((f) => f === 'phone' || f === 'chat' || f === 'email')
  );
}

/**
 * The human option for a language and age band (C1).
 *
 * The clinician's preference list wins where it applies; otherwise the ordering
 * derives one from the directory. Either way the function is **total** — a
 * configuration where somebody gets no human to talk to is a config bug that
 * fails the build, not a blank space on a screen for a person who needed one.
 *
 * A `fallbackOnly` entry is never offered here. The first person we suggest
 * should not be an unmoderated international service.
 */
export function humanOptionFor(
  entries: DirectoryEntry[],
  careLanguage: string,
  ageBand: AgeBand,
  config?: HumanFallbackConfig,
): DirectoryEntry {
  if (config) {
    const preference = config.preferences.find((p) => p.language === careLanguage);
    for (const id of preference?.entryIds ?? []) {
      const found = entries.find((e) => e.id === id);
      if (found && isHuman(found) && !found.fallbackOnly && servesAge(found, ageBand)) return found;
    }
  }
  return deriveHumanOption(entries, careLanguage, ageBand);
}

function deriveHumanOption(
  entries: DirectoryEntry[],
  careLanguage: string,
  ageBand: AgeBand,
): DirectoryEntry {
  const humans = entries.filter((e) => isHuman(e) && servesAge(e, ageBand));

  const ordered = orderFreeFirst(humans, { careLanguage });
  const matching = ordered.filter((e) => speaks(e, careLanguage));

  // Prefer their language; fall back to any human rather than to nothing, because
  // "no one to talk to" is never the right answer to give someone.
  const chosen = matching[0] ?? ordered[0];
  if (!chosen) {
    throw new ConfigError(
      `No human option for language "${careLanguage}", age band "${ageBand}". ` +
        'Every language and age band must reach a person.',
    );
  }
  return chosen;
}

/** Domestic, non-fallback, and not a navigator. The shared floor for both lookups. */
function isNameableCare(entry: DirectoryEntry): boolean {
  return entry.origin === 'domestic' && !entry.fallbackOnly && entry.role !== 'route';
}

/**
 * Free care you can walk into today: the support itself, no referral, no gate.
 *
 * Returns nothing where none exists. That is the honest answer, and above the
 * peer rung it is usually the true one — but it does NOT mean free care has run
 * out, only that none of it is ungated. Ask `gatedFreeCareAt` before concluding
 * a rung has nothing.
 */
export function freeCareAt(
  entries: DirectoryEntry[],
  rungId: string,
  filter: DirectoryFilter = {},
): DirectoryEntry | undefined {
  return entriesForRung(entries, rungId, filter).find(
    (entry) => isNameableCare(entry) && entry.role === 'care' && entry.costBand === 'free',
  );
}

/**
 * Free care that exists and is real, but is reached through a referral: HUS
 * nettiterapiat, and public group treatment where a county runs it.
 *
 * Named separately from `freeCareAt` so the UI has to state the gate rather than
 * quietly presenting a referral-only programme as something you can start now.
 */
export function gatedFreeCareAt(
  entries: DirectoryEntry[],
  rungId: string,
  filter: DirectoryFilter = {},
): DirectoryEntry | undefined {
  return entriesForRung(entries, rungId, filter).find(
    (entry) =>
      isNameableCare(entry) &&
      entry.role === 'gated-care' &&
      (entry.costBand === 'free' || entry.costBand === 'free-with-referral'),
  );
}

/** Renders the whole registry for clinician and partner review. */
export function printDirectory(entries: DirectoryEntry[], rungOrder: string[]): string {
  const lines: string[] = [];
  const unreviewed = entries.filter((e) => !e.clinicianReviewed).length;

  for (const rungId of rungOrder) {
    const onRung = orderFreeFirst(entries.filter((e) => e.rungs.includes(rungId)));
    if (onRung.length === 0) continue;
    lines.push(`\n${rungId.toUpperCase()}  (${onRung.length})`);
    for (const e of onRung) {
      const flags = [
        e.fallbackOnly ? 'FALLBACK-ONLY' : '',
        e.clinicianReviewed ? '' : '⚠ NOT CLINICIAN-REVIEWED',
      ]
        .filter(Boolean)
        .join('  ');
      lines.push(`  ${e.id.padEnd(22)} ${e.sector.padEnd(13)} ${e.costBand.padEnd(18)} ${flags}`);
      lines.push(
        `  ${''.padEnd(22)} ${e.languages.join('/')} · ages ${e.ageRange.min}–${e.ageRange.max ?? '∞'} · ` +
          `${e.whoAnswers} · ${e.anonymity}`,
      );
      lines.push(`  ${''.padEnd(22)} ${e.formats.join(', ')} · verified ${e.verifiedOn} by ${e.verifiedBy}`);
      lines.push(`  ${''.padEnd(22)} ${e.url}${e.phone ? ` · ${e.phone}` : ''}`);
      if (e.note) lines.push(`  ${''.padEnd(22)} NOTE: ${e.note}`);
      lines.push('');
    }
  }

  if (unreviewed > 0) {
    lines.push(`⚠ ${unreviewed} of ${entries.length} entries are NOT clinician-reviewed.`);
  }
  return lines.join('\n');
}
