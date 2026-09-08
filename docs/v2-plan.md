# Reitti V2 — Build Plan

> ## ✅ This is the current plan
>
> **V2 as built: the ladder and cost labels foregrounded, a cross-sector free-first directory,
> demand pooling, the automated rung removed from consumer output behind `RECOMMEND_RUNG`, the
> rung-2 talking-support directory, a human in the loop, and the close-the-loop follow-up.
> No provider accounts, no billing, no AI.**
>
> Where this disagrees with `docs/phase-2-marketplace-plan.md` (the two-sided marketplace, formerly
> `phase-2-marketplace-plan.md`), **this document wins.** That one is a later phase whose Gate 0
> prerequisites are not met.
>
> **Status honesty.** This is a preview to think with, not a shipped V2. All 14 directory entries
> are `clinicianReviewed: false`, no instrument has an official FI/SV translation, and the
> regulatory opinion on the fitting-rungs set has not landed. It should not be described to HUS or
> a wellbeing county as V2 — see `docs/v2-test-report.md` §8 for exactly what is blocked and on whom.

*Phase 0 deliverable, now **built**. All ten slices are implemented, the preview is deployed and
Phase 3 has run — see `docs/v2-test-report.md` for results. Slice status is marked in §1.*

Read alongside `docs/v2-decisions.md` (every judgement call this plan had to make) and
`docs/phase-2-marketplace-plan.md` (the later two-sided-marketplace phase; §3.1, §3.4 and §3.9 of
that document are absorbed into slices S1, S7 and S8 here, and the rest of it is not being built).

---

## 0. Positioning, restated as a build constraint

> HUS routes people inside the public system. **Reitti routes people across all of it, tells them
> what each rung costs, and creates group capacity that doesn't exist yet.**

Three consequences that decide what gets built:

1. **We are the layer around Terapianavigaattori, not a better navigator.** Terapianavigaattori and
   Mielenterveystalo.fi are first-class destinations in our directory, not competitors to route
   around.
2. **An automated single-rung recommendation is very likely MDSW (plausibly Class IIa).** Every
   EU/UK comparator that maps scores to a care level is a regulated device. V2 therefore does not
   surface one. The rules engine keeps computing it — for tests, clinician review and a future
   regulated release — behind `RECOMMEND_RUNG`, default off.
3. **Only three things here are ours:** cross-sector free-first routing, budget-aware ordering that
   never filters care out, and demand-pooled group formation. Those three get the most engineering.
   Everything else is parity with HUS and gets exactly enough.

### Baseline correction

The kickoff prompt cites "119 engine tests (incl. 55 safety invariants)". The repository as it
stands is **163 tests across 4 files, of which 70 are safety invariants** (`npm test`, verified at
the start of this session). The rule is unchanged and now reads against the real number: **163/163
green before every commit, and the invariant count only ever goes up.**

---

## 1. Slice map

Built in the order the prompt fixes: A1 → B1/B2/B3 → D → A2 → C1 → C2 → C5 → A3 → C3 → C4.
One PR-sized commit per slice. Config and translations land before engine or UI code in every slice.

| # | Slice | Delivers | New backend? | Status |
|---|---|---|---|---|
| S1 | Cross-sector directory | A1 | no | ✅ built · front door added after review, see report §2 |
| S2 | Behind the HUS line | B1, B2, B3 | no | ✅ built |
| S3 | Rung 2 — someone to talk to | D | no | ✅ built · 3 corrections to the brief, see report §5 |
| S4 | Budget-aware ladder | A2 | no | ✅ built |
| S5 | A human in the loop | C1 | no | ✅ built |
| S6 | While you wait | C2 | no | ✅ built |
| S7 | Language parity | C5 | no | ✅ built · instrument items stay English-only until official translations land |
| S8 | Demand pooling + waitlist | A3 | **yes** — anonymous counter | ✅ built · service not deployed |
| S9 | Closing the loop | C3 | **yes** — same counter service | ✅ built · service not deployed |
| S10 | Youth handoff | C4 | no | ✅ built · needed a `final` flag on R0, see report §2 |

Two prerequisites are pulled forward into the slice that first needs them rather than getting their
own commit: the `RECOMMEND_RUNG` flag module lands in S2, and the `uiLanguage` / `careLanguage`
split (`docs/phase-2-marketplace-plan.md` §3.4) lands in S7.

---

## S1 — Cross-sector, free-first directory (A1)

**User story.** *As someone who just finished the questions, I see actual services I can use this
week — public, Kela, third-sector and private in one list — with the free ones first, so the
suggestion becomes something I can act on rather than a category name.*

### Config / schema
New governance surface: `config/directory/`, one JSON file per sector so a clinician reviews a
readable file rather than a 400-entry blob.

```
config/directory/
  public.json        HUS, Terapianavigaattori, Mielenterveystalo, health stations
  third-sector.json  MIELI ry, Tukinet, MTKL, Nyyti, Sekasin, Ärligt talat
  kela.json          Kela-subsidised psychotherapy, rehabilitation courses
  private.json       (empty in V2 — the schema exists, no entries ship)
```

```ts
interface DirectoryEntry {
  id: string;
  nameRef: string;                 // i18n ref, never a literal
  operator: string;                // who runs it — shown verbatim, not translated
  rungs: string[];                 // ladder rung ids this entry serves
  sector: 'public' | 'kela' | 'third-sector' | 'private';
  costBand: 'free' | 'free-with-referral' | 'kela-subsidised'
          | 'employer-paid' | 'self-pay';
  costNoteRef?: string;            // e.g. typical omavastuu, self-pay range
  languages: string[];             // ['fi','sv','en'] — care language, not UI
  ageRange: { min: number; max: number | null };
  formats: ('phone'|'chat'|'email'|'video'|'in-person'|'group'|'self-guided')[];
  hoursRef: string;                // i18n ref; see "hours are never hard-coded"
  anonymity: 'anonymous' | 'registration-optional' | 'identified';
  whoAnswers: 'professional' | 'trained-volunteer' | 'peer-lived-experience'
            | 'mixed' | 'not-applicable';
  url: string;
  phone?: string;
  verifiedOn: string;              // ISO date, required
  verifiedBy: string;              // 'build-check' | a person's initials
  fallbackOnly?: boolean;          // S3 uses this for 7 Cups
  clinicianReviewed: boolean;      // false blocks nothing, but prints loudly
}
```

**Hours are never hard-coded as fact.** `hoursRef` resolves to a string that is either a verified
hour ("Mon–Fri 9–15") *or* the honest fallback ("hours change — check the site"). An entry whose
hours could not be confirmed at build time renders the fallback and a link, never a stale hour
claim. `verifiedOn` records when the check ran either way.

**Terapianavigaattori affordance.** The public entry carries `hasConsentCode: true`, which renders
the "you may already have a Terapianavigaattori code" line and links to the professional-facing
route rather than restarting our questions.

### Engine
`packages/engine/src/directory.ts` — new, pure, no I/O:
- `entriesForRung(entries, rungId, filter): DirectoryEntry[]` — filter is `{ careLanguage, ageBand,
  budget }`. It **orders**; it never removes. The only removals allowed anywhere in the engine are
  the two the invariants demand: age (S10) and `fallbackOnly` de-prioritisation (S3).
- `orderFreeFirst(entries)` — free public and third-sector before Kela before private, stable within
  a band so config order is the clinician's tiebreak.
- Directory data is passed in as an argument. The engine gains no import of `config/`.

### UI
- `apps/web/src/components/Options.tsx` — renders entries under each fitting rung on the result
  screen: name, operator, cost label, languages, who answers, anonymity, hours, link.
- `Previews.tsx` shrinks to the parts that genuinely do not exist yet (the private marketplace);
  everything the directory now covers stops being a "coming soon" card.

### Tests
- *Unit* — `directory.test.ts`: free-first ordering; stable-within-band; language filter reorders
  and never drops; an entry serving several rungs appears under each.
- *Invariant* — **no filter empties a rung that has entries** (the generalisation of "budget never
  hides a rung", asserted across the full cartesian product of language × budget × age band).
- *Invariant* — every directory entry resolves every i18n ref it names, in every shipped bundle.
- *Playwright + axe* — result screen shows at least one free option above any paid one; axe clean.

### i18n keys
`directory.<id>.name`, `directory.<id>.hours`, `directory.<id>.costNote`,
`directory.section.free`, `directory.section.subsidised`, `directory.section.private`,
`directory.label.whoAnswers.*`, `directory.label.anonymity.*`, `directory.label.format.*`,
`directory.verifiedOn`, `directory.terapianavigaattori.haveCode`.

### Risk
A wrong link or a wrong phone number at a bad moment is a safety issue, not a broken link. Mitigated
by: `verifiedOn` required on every entry, the honest-hours fallback, `clinicianReviewed` printed by
`npm run directory:print`, and the S3 liveness check. **Directory content is provisional until
clinician sign-off.**

---

## S2 — Behind the line HUS drew (B1, B2, B3)

**User story.** *As someone finishing the questions, I get my band, a reflection, and two or three
rungs that fit it with what each costs — and I choose. Nothing tells me "you need X".*

### Config / schema
- `config/flags.json` — `{ "RECOMMEND_RUNG": false }`, the single declared default.
- `config/routing/rules.json` unchanged. This is the point: the table still exists and still prints.

### Engine
No change to `route()`. `RoutingOutput.suggestedRung` keeps being computed — it is what the tests,
`rules:print` and any future regulated build depend on. One addition:

```ts
export function fittingRungs(output: RoutingOutput, ladder: Ladder): Rung[]
```

Returns the computed rung plus its adjacent pair, **sorted by ladder level ascending** — never with
the computed one first. Ordering by anything else would leak the recommendation through position,
which is the whole thing B1 removes. 2 rungs at the ends of the ladder, 3 in the middle.

### UI
- `apps/web/src/flags.ts` — reads `import.meta.env.VITE_RECOMMEND_RUNG` and falls back to
  `config/flags.json`. The engine never reads it.
- `Result.tsx` rewritten around the flag:
  - **off (default):** band + reflection + "These rungs fit this band" (2–3, in ladder order, each
    with its cost label and directory entries) + a "talk it through with a person" option (S5) +
    the scope statement. No single rung is styled, ordered or worded as the answer.
  - **on:** today's single-suggestion screen, unchanged.
- The `because` lines stay, reworded in the UI as "How these were chosen" rather than "Why this" —
  with the flag off they explain a *set*, not a recommendation.
- **B3 scope statement**, on every result screen and in the print view: guidance and information,
  not a medical device, not a diagnosis, the decision stays with the person and their professional.

### Tests
- *Invariant* — **with `RECOMMEND_RUNG=off`, no consumer surface renders exactly one rung as
  recommended**: `fittingRungs` returns ≥2 whenever the ladder allows, output order is strictly
  ascending by level, and the rendered DOM carries no "recommended"/"suggested" singular affordance.
- *Invariant* — `RECOMMEND_RUNG` has no effect on `route()`: identical `RoutingOutput` both ways.
- *Invariant* — the scope statement is present on every result render, both flag states.
- *Unit* — `fittingRungs` at both ladder ends returns 2, in the middle returns 3.
- *Playwright + axe* — moderate band shows 2–3 rungs and no singular recommendation, fi/sv/en.

### i18n keys
`result.fittingRungs.heading`, `result.fittingRungs.help`, `result.howChosen`,
`result.scopeStatement.title`, `result.scopeStatement.body`, `result.youChoose`.

### Risk
The regulatory opinion may come back saying even a *set* of rungs derived from scores is MDSW. The
flag does not protect against that reading; the mitigation is that the set is presented as
information about the band rather than as a decision, and the scope statement says so. **Flagged for
the regulatory opinion, and the wording is flagged for clinician sign-off.**

---

## S3 — Rung 2: someone to talk to, free, now (D)

**User story.** *As someone who does not want a programme and does not need an emergency line, I can
find a real human to talk to today, in my language, free, and I can see who I would be talking to.*

**Naming.** The prompt's "rung 2" is the second rung of the ladder as a person counts it — the
`peer-community` rung (`level: 1`). It is *not* `nettiterapia`, which sits at `level: 2`. See
`docs/v2-decisions.md` D-1; this mapping needs confirmation.

### Config / schema
The eight entries from the prompt land in `config/directory/third-sector.json` with
`rungs: ["peer-community"]`. Verification of hours and numbers happens **at build time against the
live source** during this slice, and each entry records `verifiedOn`.

| id | languages | ageRange | whoAnswers | anonymity | notes |
|---|---|---|---|---|---|
| `tukinet` | fi (+some sv/en) | 18+ | mixed | registration-optional | default entry |
| `mieli-kriisichat` | fi | 18+ | mixed | anonymous | formerly Solmussa |
| `mieli-chat-en` | en | 18+ | mixed | anonymous | booked via Tukinet; **states that Finnish replies come faster** |
| `mieli-kristelefonen` | sv | all | mixed | anonymous | separate sv number, limited hours |
| `arligt-talat` | sv | 13+ | trained-volunteer | anonymous | sv continuity when Sekasin sv is closed |
| `sekasin` | fi, sv | 12–29 | mixed | anonymous | youth entry (S10 uses it) |
| `valoa-chat` | fi | 18+ | peer-lived-experience | anonymous | monthly group chat |
| `7cups` | en | 18+ | peer-lived-experience | registration-optional | `fallbackOnly: true` |

7 Cups ships with a required, non-optional label: *international volunteer listeners; quality
varies; not moderated in real time; not a crisis service.*

### Engine
`orderRungTwo(entries, careLanguage)` in `directory.ts`: Finnish and Swedish public/third-sector
entries first, then other domestic entries, then anything `fallbackOnly` — always last, regardless
of language match or any other signal.

### UI
Rung-2 cards carry the five required facts on the card itself, not behind a disclosure: who runs it,
hours, language, anonymity, professional vs volunteer — plus `verifiedOn`.

### Tests
- *Invariant* — **a safety flag bypasses rung 2 entirely**: with `crisis` in `safetyFlags`, no
  rung-2 entry is reachable in the routing output or rendered on any screen; the crisis panel is.
- *Invariant* — `fallbackOnly` entries never render above a non-fallback entry, under every
  `careLanguage` including `en`.
- *Invariant* — every rung-2 entry has non-empty `whoAnswers`, `anonymity`, `hoursRef`, `languages`
  and `verifiedOn`. Missing any one fails the build.
- *Invariant* — the 7 Cups label ref resolves and is rendered whenever the entry is.
- *Playwright* — English run reaches a human option that is not 7 Cups before 7 Cups appears.

### i18n keys
`directory.<id>.name|hours|costNote` for all eight, `directory.7cups.caution`,
`directory.mieli-chat-en.replyTimeNote`, `rung2.heading`, `rung2.help`.

### Risk
Hours and numbers drift. Mitigated by the honest-hours fallback and a scheduled liveness job (§4).
**No service is added to rung 2 beyond these eight without clinician review.**

---

## S4 — Budget-aware ladder (A2)

**User story.** *As someone with no money for private care, the free routes come first and I can
still see everything else — nothing is hidden from me because I am poor.*

### Config
`config/ladder/ladder.json` gains `costLabelRef` per rung. Cost bands are the five in the
`DirectoryEntry` schema so a rung and its entries speak the same language.

### Engine
`orderRungsForBudget()` already exists and already only reorders. Extended to all four budget
values (today only `none` reorders) and to return an explicit `{ rung, costBand }` pair.

### UI
A plain cost label on every rung, in both flag states, and on the print view. Budget is a preference
control on the result screen too, not only in the context questions — changing it reorders in place
and visibly says so.

### Tests
- *Invariant* — **budget never hides a rung**: for all four budgets, `orderRungsForBudget` returns a
  permutation of the full ladder — same length, same set of ids. Asserted as a set equality, not a
  count, so a substitution cannot pass.
- *Invariant* — every rung resolves a cost label in every shipped bundle.
- *Playwright* — "free only" reorders and still renders all six rungs, fi/sv/en.

### i18n keys
`rung.<id>.costLabel` ×6, `cost.band.free|free-with-referral|kela-subsidised|employer-paid|self-pay`,
`budget.reorderNotice`.

### Risk
Low. The invariant is mechanical.

---

## S5 — A human in the loop, cheaply (C1)

**User story.** *Whatever the questions said, there is a person I can talk to about it, and a route
into the public system that does not depend on Reitti.*

### Config
`config/directory/public.json` gains the health-station / ensijäsennys route and the
Terapianavigaattori entry. A per-language, per-age-band **default human option** is declared in
config, not chosen in code: `config/directory/human-fallback.json` maps `(language, ageBand)` → an
entry id, with a documented fallback chain.

### Engine
`humanOptionFor(entries, careLanguage, ageBand)` — total function, returns an entry or throws a
`ConfigError`. A configuration in which someone gets no human option is a config bug that fails the
build, not a blank space on a screen.

### UI
A "talk it through with a person" block on every result screen, above the rung list, plus the
"book an ensijäsennys / contact your health station" link.

### Tests
- *Invariant* — **every (language × age band) combination yields at least one human option**, over
  the full cartesian product. No hole is reachable.
- *Playwright + axe* — the block is present on every result screen in all three languages.

### i18n keys
`human.heading`, `human.help`, `human.publicRoute`, `human.ensijasennys`.

### Risk
Low.

---

## S6 — Support while waiting (C2)

**User story.** *I have been pointed at a waiting list. I am not leaving with only a link.*

### Config
`config/directory/while-you-wait.json` — Mielenterveystalo omahoito, peer chat (reusing the S3
entries by id, not duplicated), and the S8 waitlist. Entries here are references, so a change to an
entry propagates.

### UI
A "while you wait" block after any referral-shaped rung (`nettiterapia`, `short-term-individual`,
`kela-rehabilitative`).

### Tests
- *Invariant* — **no result screen renders a referral rung without a while-you-wait block.**
- *Invariant* — every id referenced here exists in the directory (no dangling reference).
- *Playwright* — the block appears on a moderate-band run.

### i18n keys
`whileYouWait.heading`, `whileYouWait.help`, `whileYouWait.selfHelp`, `whileYouWait.peer`,
`whileYouWait.waitlist`.

### Risk
Low.

---

## S7 — Language parity, fi / sv / en (C5)

**User story.** *I use Reitti in Finnish or Swedish and get the same product, not an English app with
some words translated.*

This is the largest slice and it collides with a standing rule in `CLAUDE.md`: **never hand-translate
an instrument.** The resolution is a split bundle — see `docs/v2-decisions.md` D-2, which needs
clinician sign-off before this slice starts.

### Config
`config/i18n/` splits by ownership, not by language:

```
config/i18n/ui/{en,fi,sv}.json          product copy — professionally translated, no clinical claim
config/i18n/clinical/{en,fi,sv}.json    instrument items, bands, reflections, rung labels
config/i18n/directory/{en,fi,sv}.json   entry names, hours, cost notes
```

Each `clinical/<lang>.json` declares, per instrument, `"translationStatus": "official" | "absent"`
with a source citation. **An instrument whose official translation is absent in a language is not
offered in that language** — the app says so plainly and offers it in a language where it is
official, rather than silently falling back to English mid-questionnaire.

### Engine
No change. Refs stay refs.

### UI
- `i18n.ts` gains real bundle selection, `uiLanguage` ≠ `careLanguage`
  (`docs/phase-2-marketplace-plan.md` §3.4), and a language switcher.
- `store.ts` stores both fields. Still no network call.
- Component-literal copy (`App.tsx`, `Home.tsx`, `ContextQuestions.tsx`, `Result.tsx`, `Previews.tsx`)
  moves into `config/i18n/ui/`. This is the bulk of the diff.

### Tests
- *Invariant* — **key-set equality across en/fi/sv in all three bundles.** A key in one and not the
  others fails.
- *Invariant* — no bundle value is byte-identical to the English one unless whitelisted (proper
  nouns, phone numbers) — catches copy-paste stubs pretending to be translations.
- *Invariant* — an instrument with `translationStatus: "absent"` is never rendered in that language.
- *Playwright* — fi and sv runs show **no English fallback string** on any screen; axe clean in all
  three.

### i18n keys
Every existing key ×3, plus every key introduced by S1–S6.

### Risk
**High, and it is the clinical risk of the whole plan.** A hand-translated screening item measures
something different. The plan does not translate a single instrument item; it only ships items whose
official validated translation is obtained and cited. Product copy is separate and can be translated
normally. **Every clinical string is flagged for clinician sign-off.**

---

## S8 — Demand pooling + waitlist (A3)

**User story.** *There is no group near me for what I need. I put my hand up, I can see how many
others have, and when enough of us exist a facilitator can start one — without Reitti knowing who I
am.*

This is the V2 pilot feature for a wellbeing county, and the first new backend since V1.

### Config
`config/groups/topics.json` — group topics with `id`, `nameRef`, `rungs`, `formThreshold`
(configurable per topic), `regions` (the enumerated wellbeing counties), `languages`.

### Service
`services/pool-counter/` — one tiny EU-hosted service, shared with S9.

```
POST /pool/interest    { topicId, region, careLanguage }   → { count, threshold, ready }
GET  /pool/:topicId    ?region=&language=                  → { count, threshold, ready }
```

Storage is **counters, not rows**: one integer per `(topicId, region, language)` triple. There is no
per-person record to leak, subpoena or re-identify. No withdraw endpoint, because a withdraw token
would be a per-person identifier — interest expires on-device instead (D-4).

### Data flow — proving nothing identifying leaves the device

```
  ON DEVICE (localStorage + memory)                 NETWORK              SERVER (pool-counter)
  ─────────────────────────────────────           ───────────         ─────────────────────────
  answers, subscales, bands, severity,
  safetyFlags, domain, computed rung
        │
        │   ✗  none of this is in the request body. Enforced by a schema
        │      whitelist on the client and by the privacy-audit test.
        │
  person taps "tell me if a group forms"
        │
        ▼
  poolKey = { topicId, region, careLanguage }
        │      ↑ all three chosen from fixed enums in config.
        │        None is derived from a score, a band or an answer.
        │
        ├──────────  POST /pool/interest  ─────────────────►  counters[topicId|region|lang] += 1
        │            body: exactly 3 enum values                    │
        │            no cookie, no auth header,                     │  stored: one integer.
        │            no device id, no nonce                         │  not stored: IP, UA,
        │                                                           │  per-event timestamp,
        │            ◄──────  { count, threshold, ready }  ─────────┘  any per-person row
        ▼
  localStorage: { topicId, region, language, expiresAt }
        └── the person's own record of what they joined, never re-sent.
            Cleared by "delete everything", and by TTL expiry.
```

The strongest claim this design supports, stated exactly: **the server holds counts, not people.**
It does receive a self-declared topic interest, which is health-adjacent; it never receives an
identifier, so no count can be attributed to anyone. D-5 records why that is the honest phrasing
rather than "no health data leaves the device".

### Engine
`readyToForm(count, threshold): boolean` and waitlist promotion ordering — pure, deterministic,
tested. Promotion is **first-in-first-promoted within a topic**, computed from positions the client
already holds; the server never orders people because it does not know about people.

### UI
- A "waiting for a group" affordance on group-suitable rungs.
- A visible count and threshold ("14 of 20 people waiting in Uusimaa").
- Explicit consent copy before the single request, naming exactly the three values sent.

### Tests
- *Invariant* — **no network call carries screener answers**: the privacy-audit harness captures all
  requests during full runs and asserts every body against an allowlist schema. Any key outside
  `{topicId, region, careLanguage}` fails.
- *Invariant* — the request carries no cookie, auth header, device id or nonce.
- *Unit* — threshold and promotion ordering.
- *Playwright* — joining increments the count; the captured request body is exactly the three enums.

### Risk
This is the first outbound call the client makes. It is also the one place where a careless later
change ("just add the rung so we can segment") would break the privacy claim. Mitigated by the
allowlist-schema invariant rather than by review discipline.

---

## S9 — Closing the loop (C3)

**User story.** *Weeks later my phone reminds me to say whether I got in. It helps the next person
and it says nothing about me.*

### Storage
On-device only: `reminderAt`, `dismissed`, `answered`. No push, no server-side schedule, no account —
the reminder is a local check on next open. Nothing about the reminder is transmitted.

### Service
Same `pool-counter` service, one more endpoint:

```
POST /outcome   { bucket: 'got-in' | 'still-waiting' | 'gave-up' }   → 204
```

Three integers, total. **No rung, no band, no domain, no region, no timestamp, no session id.**
Attaching the rung would make the outcomes story better and is the obvious next ask; D-6 records why
V2 ships bucket-only and what volume would justify revisiting.

### Data flow

```
  ON DEVICE                                        NETWORK          SERVER (outcome counters)
  ────────────────────────────────                ─────────       ──────────────────────────
  reminderAt (local), session history
        │
        │  ✗ the reminder is never scheduled server-side: no push token,
        │    no subscription, no endpoint knows a reminder exists.
        ▼
  on next open, if now > reminderAt → prompt
        │
  person taps one of three buttons
        │
        ▼
  explicit consent, per submission (not a stored preference)
        │
        ├────────  POST /outcome { bucket }  ────────►  counters[bucket] += 1
        │          body: one enum value                       │
        │          no id, no rung, no time                     │  server does not log
        │                                                      │  request time or IP
        ▼          ◄──────────  204  ────────────────────────┘
  localStorage: { answered: true }   ← so it is never asked twice
```

### Tests
- *Invariant* — the outcome body has exactly one key, whose value is one of three literals.
- *Invariant* — no reminder state is ever included in any outbound request.
- *Playwright* — the reminder fires from local state alone with the network offline.

### Risk
Aggregate counters are a weak outcomes story on purpose. The alternative — richer records — is the
thing that turns Reitti into a health-data controller. **Flagged as a product decision, not a
technical one.**

---

## S10 — Youth handoff (C4)

**User story.** *I am 16. Reitti does not pretend to serve me, and it does not send me to a private
adult therapist. It sends me to Sekasin.*

### Config
- `ContextQuestions` gains an **age band**, not an age: `under-18`, `18-29`, `30+`. Coarser is
  deliberate — it answers both routing questions (the 18+ boundary and the 12–29 youth-service
  boundary) while collecting less. Plus an explicit "I'd like youth services" option for 12–29.
- `config/directory/youth.json` — Sekasin (fi/sv) and Interventionavigaattori.

### Engine
`ageBand` becomes a `RoutingInput` field and a `RuleCondition` (`ageBandIn`). Youth routing is a
**base rule at the top of the table** with its own `because` line — it is a clinical rule, so it
lives in the clinician's config like every other one, not in a component.

### UI
An under-18 result screen that shows youth services and the crisis path, and nothing else.

### Tests
- *Invariant* — **`ageBand: 'under-18'` never yields a private or adult-paid entry**, over every
  combination of domain, duration, budget, language and severity.
- *Invariant* — under-18 always yields at least one youth entry and the crisis path.
- *Playwright* — the under-18 run reaches youth routing only, in fi/sv/en.

### Risk
Asking age is new personal data on a product that asks for as little as possible. The age band is
on-device like everything else and is never transmitted (the S8 allowlist forbids it). **The 12–29
youth-service boundary and the under-18 screen copy need clinician sign-off.**

---

## 2. New safety invariants introduced by this plan

Added to `packages/engine/test/invariants.test.ts` (and, where they are about rendering, to the
Playwright suite). The five the prompt requires are marked ★.

| # | Invariant | Slice |
|---|---|---|
| 7 ★ | Budget never hides a rung — every budget returns a permutation of the full ladder | S4 |
| 8 ★ | A safety flag bypasses rung 2 entirely | S3 |
| 9 ★ | With `RECOMMEND_RUNG` off, no consumer surface renders a single recommended rung | S2 |
| 10 ★ | `ageBand: 'under-18'` never yields an adult private rung or entry | S10 |
| 11 ★ | No outbound request body carries a screener answer, band, severity, rung or age | S8, S9 |
| 12 | No filter (language, budget, age) empties a rung that has entries | S1 |
| 13 | `fallbackOnly` entries never order above a domestic entry | S3 |
| 14 | Every directory entry carries hours, language, anonymity, who-answers and `verifiedOn` | S1, S3 |
| 15 | Every (language × age band) yields at least one human option | S5 |
| 16 | A referral rung never renders without a while-you-wait block | S6 |
| 17 | Key-set equality across en/fi/sv in every bundle | S7 |
| 18 | An instrument without an official translation is never rendered in that language | S7 |
| 19 | The scope statement is present on every result render, both flag states | S2 |
| 20 | `RECOMMEND_RUNG` never changes `route()`'s output | S2 |

---

## 3. Tooling

- `npm run rules:print` — **must keep working after every slice.** S10 adds the youth base rule to
  its output; nothing else about it changes.
- `npm run directory:print` — new. The full provider registry, printable for clinician and partner
  review: grouped by rung then sector, showing cost band, languages, age range, who answers,
  anonymity, hours, `verifiedOn`, and a loud marker on any entry with `clinicianReviewed: false`.
- `npm run directory:verify` — the liveness and completeness check (§4).

---

## 4. CI

| Job | Runs on | Blocks? |
|---|---|---|
| `npm test` (163 + new) | every push and PR | **yes** |
| `npm run typecheck` | every push and PR | **yes** |
| directory **completeness** (every required field present) | every push and PR | **yes** — offline and deterministic |
| directory **URL liveness** (every URL returns 200) | scheduled daily + manual | **no** — see D-7 |
| `npm run test:a11y` | every push and PR | **yes** |

Third-party downtime must not block a deploy of Reitti; a missing field is our bug and must. That
split is D-7 and is the one place this plan does not do exactly what the prompt says — flagged
rather than done silently.

---

## 5. Phase 2 — deploy

- Vercel project, git branch `v2-preview`, **preview environment only.** Production is explicitly not
  a target of this work.
- `vercel.json` is new (the repo has none): build `npm run build`, output `apps/web/dist`,
  `VITE_RECOMMEND_RUNG=false` set in the preview environment.
- The `pool-counter` service deploys separately to an EU region; the preview points at a preview
  instance whose counters are throwaway.

**Preview URL:** https://reitti-v2-preview-git-v2-preview-amirs-projects-b107307b.vercel.app
(target `null` = preview; production was not deployed to.)

Deployed from the working tree with the Vercel CLI, so the `v2-preview` git branch does not exist
yet — committing and pushing is the repo owner's. The preview stays behind Vercel Deployment
Protection; browser automation reaches it with an automation bypass header rather than the preview
being made public, which is the right default for a mental-health preview.

Two platform facts worth carrying forward:

- **Vercel injects a preview feedback script by default.** It broke the privacy audit on the first
  deployed run and had to be turned off at the project level (`enablePreviewFeedback`). It will come
  back on any new Vercel project.
- **`connect-src 'self'` in `vercel.json` will block the pool-counter service.** Enabling demand
  pooling means widening it deliberately.

---

## 6. Phase 3 — test after deployment

Against the deployed preview URL, not localhost. Full detail lives in `docs/v2-test-report.md` when
it runs; the shape is fixed here:

1. Engine + invariants — full suite green, count reported.
2. E2E scenarios in fi, sv and en — mild band free-first + cost labels; moderate band 2–3 rungs and
   no single recommendation; PHQ-9 item 9 positive → crisis, rung 2 absent; under-18 → youth only;
   budget "free only" → all rungs visible, reordered; group waitlist → counter increments with no
   identifier; follow-up reminder on-device only.
3. Accessibility — `@axe-core/playwright` on every screen ×3 languages, zero serious/critical.
   **The outstanding home-page contrast decision is reported separately and not silently fixed.**
4. Directory integrity — URLs 200, every entry complete.
5. Privacy audit — full request capture, allowlist assertion, **request log attached to the report.**
6. i18n completeness — no missing keys, no English fallback visible in fi/sv.
7. `docs/v2-test-report.md` — passed, failed, blocked-on-clinician, blocked-on-regulatory. Clinical
   content is never marked done.

**Result: 284 engine tests (143 invariants) and 264 browser tests green against the deployed
preview, 4 skipped with the reason recorded. Zero serious or critical axe violations in all three
languages. Zero outbound requests during a full assessment.** Full detail in
`docs/v2-test-report.md`.

---

## 7. What this plan does not do

- No AI, no chatbot, no free-text interpretation. `packages/ai` is untouched.
- No production deploy.
- No new instrument, threshold or reflection beyond the catalog.
- No change to the crisis path. The Swedish and English crisis lines the prompt asks for **already
  exist** in `config/crisis.json` (`mieli-sv`, `mieli-en`); this plan re-verifies their numbers and
  hours in S3 and changes nothing else.
- No single automated suggested rung on any consumer screen while `RECOMMEND_RUNG` is off.
