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
  /**
   * When the operator has an official name in each language (YTHS in Finnish,
   * SHVS in Swedish, FSHS in English), the key holding it. Shown in place of
   * `operator`, which stays as the name the checks and notes use.
   */
  operatorRef?: string;
  rungs: string[];
  sector: Sector;
  costBand: CostBand;
  costNoteRef?: string;
  /** The language of the *care*, not of our interface. */
  languages: string[];
  /**
   * When the service's own pages state no language (Interventionavigaattori; a
   * health station), the key of the honest fallback, "not stated, so check the
   * site", shown in place of the list, like an hours fallback (Amir, 12.11.2026).
   * The card then claims no language and warns of no mismatch, a /directory
   * language filter (which shows services stated to be in that language) leaves
   * it out, and ordering reads what the card shows (`speaks`, `languageMismatch`,
   * Amir 13.11.2026), so it is never demoted for a language it was never said to
   * lack. `languages` stays only because invariant 14 requires every entry to
   * carry one; nothing that orders, matches or shows reads it.
   */
  languagesRef?: string;
  ageRange: { min: number; max: number | null };
  formats: Format[];
  /**
   * Either verified hours or the honest fallback ("hours change — check the
   * site"). Never a stale hour presented as current: someone who turns up to a
   * closed line because we displayed last year's hours is the worse outcome.
   */
  hoursRef: string;
  anonymity: Anonymity;
  /**
   * When the answer differs by part of the service (FinFami Uusimaa: counselling
   * can be anonymous, most groups ask you to sign up), the key of a sentence that
   * states both, shown in place of the `anonymity` label (Amir, 12.11.2026).
   */
  anonymityRef?: string;
  whoAnswers: WhoAnswers;
  url: string;
  /**
   * The language of the page `url` opens, when that page is in one language and
   * the service is in more (Nyyti's trilingual resources link to their English
   * page). A reader in another interface language sees the link labelled with it
   * (Amir, 12.11.2026).
   */
  urlLanguage?: string;
  /**
   * The same page in another interface language, where the service has one (the
   * health station's Mielenterveystalo page in Swedish). A reader in that
   * language is sent there; everyone else gets `url`, labelled with
   * `urlLanguage` when it differs from theirs (Amir, 13.11.2026). `visitLink`
   * is the one place that decides.
   */
  localUrls?: Partial<Record<string, string>>;
  /**
   * Exact phrases from the page at `url` that the card rests on. The monthly
   * re-verification (scripts/reverify.mjs, Amir 14.11.2026) looks for each and
   * flags the entry for a person to re-read when one is gone. Never shown, never
   * a reason to re-date: only a person reading the page re-dates an entry.
   */
  claims?: string[];
  /** Why the monthly job cannot read this entry's page (a script-only site): a person reads it. */
  claimsManual?: string;
  phone?: string;
  /** Domestic Finnish/Swedish services always order before international ones. */
  origin: 'domestic' | 'international';
  /** Whether this is the care itself, or a way of reaching it. */
  role: EntryRole;
  /** Shown last, always, whatever else matches. 7 Cups is the only one in V2. */
  fallbackOnly?: boolean;
  /** A required caution rendered with the entry whenever it appears. */
  cautionRef?: string;
  /**
   * Who the service is for, when that is narrower than "anyone": Nyyti's groups
   * are for adult students. Shown on the card, because someone who is not a
   * student should find out before they register, not after.
   *
   * Never a filter. Reitti does not ask whether you are a student and must not
   * guess, so the entry stays listed for everyone and says who it is for. It is
   * also never named as a rung's free option on the home ladder, which speaks
   * to everyone at once (see `isNameableCare`).
   */
  audienceRef?: string;
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

/** Stated at the source to be offered in `language`: never, when no language is stated. */
export function speaks(entry: DirectoryEntry, language: string): boolean {
  return !entry.languagesRef && entry.languages.includes(language);
}

/**
 * What the card warns of: a service whose stated languages leave the person's
 * out. Ordering asks the same question, so the order and the card always agree
 * (Amir, 13.11.2026). A service whose languages are not stated is not a known
 * mismatch: the card says "check the site" and the order does not demote it.
 */
export function languageMismatch(entry: DirectoryEntry, language: string): boolean {
  return !entry.languagesRef && !entry.languages.includes(language);
}

/**
 * The link out to a service for a reader in `language`: its page in that
 * language when it has one (`localUrls`), otherwise `url`, with the language to
 * label it by when that page is in another (`urlLanguage`).
 */
export function visitLink(entry: DirectoryEntry, language: string): { href: string; labelLanguage?: string } {
  const local = entry.localUrls?.[language];
  if (local) return { href: local };
  return entry.urlLanguage && entry.urlLanguage !== language
    ? { href: entry.url, labelLanguage: entry.urlLanguage }
    : { href: entry.url };
}

/**
 * The ordering key, most significant first.
 *
 * Language sits above cost deliberately: a service you cannot speak to is not a
 * cheaper option, it is an unusable one. Nothing is removed either way, and an
 * entry that exists in only one language says so rather than disappearing.
 */
function sortKey(entry: DirectoryEntry, filter: DirectoryFilter): number[] {
  const languageMiss = filter.careLanguage && languageMismatch(entry, filter.careLanguage) ? 1 : 0;

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
  // Same rule as the order and the card: a service whose languages are not stated
  // (the health station) is not a known mismatch, so it stays a candidate.
  const matching = ordered.filter((e) => !languageMismatch(e, careLanguage));

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

/**
 * Domestic, non-fallback, not a navigator, and open to anyone. The shared floor
 * for both lookups.
 *
 * The last condition is because the name these return is printed on the home
 * ladder as "the free option at this rung", read by everyone. A service for
 * students only, named there, tells every non-student reader something free
 * exists for them when it does not. Such entries still appear in the rung's
 * full list, carrying their audience line; they are just never the headline.
 */
function isNameableCare(entry: DirectoryEntry): boolean {
  return entry.origin === 'domestic' && !entry.fallbackOnly && entry.role !== 'route' && !entry.audienceRef;
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
        // As the card shows them: languages its source does not state, and an
        // anonymity sentence that states two parts, are printed as such.
        `  ${''.padEnd(22)} ${e.languagesRef ? 'languages not stated at source (card: check the site)' : e.languages.join('/')} · ` +
          `ages ${e.ageRange.min}–${e.ageRange.max ?? '∞'} · ${e.whoAnswers} · ` +
          `${e.anonymityRef ? `${e.anonymity}, card states both parts (${e.anonymityRef})` : e.anonymity}`,
      );
      lines.push(`  ${''.padEnd(22)} ${e.formats.join(', ')} · verified ${e.verifiedOn} by ${e.verifiedBy}`);
      lines.push(`  ${''.padEnd(22)} ${e.url}${e.urlLanguage ? ` (${e.urlLanguage})` : ''}${e.phone ? ` · ${e.phone}` : ''}`);
      for (const [l, u] of Object.entries(e.localUrls ?? {})) lines.push(`  ${''.padEnd(22)} ${l}: ${u}`);
      if (e.note) lines.push(`  ${''.padEnd(22)} NOTE: ${e.note}`);
      lines.push('');
    }
  }

  if (unreviewed > 0) {
    lines.push(`⚠ ${unreviewed} of ${entries.length} entries are NOT clinician-reviewed.`);
  }
  return lines.join('\n');
}
