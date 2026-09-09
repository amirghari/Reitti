# Reitti

**Not sure what kind of mental-health support you need? Reitti helps you find a reasonable place to start.**

No account · Nothing leaves your device · About two minutes

<p align="center">
  <img src="docs/images/home.png" alt="The Reitti home page" width="820">
</p>

---

## The problem

Finland does not have a shortage of *directories*. It has a shortage of **navigation**.

Someone who is struggling can already find a list of therapists. What they cannot find out is
which *kind* of support fits what they are carrying, whether it is reachable on their budget and
in their language, and who is actually taking clients this month. So the first move is usually to
email therapists one at a time and wait.

Reitti sits between "I don't know what kind of help I need" and "here is the appropriate level of
care I can realistically get":

```
experience  →  validated signals  →  a band  →  a rung of the ladder  →  reachable options
```

It never returns a diagnosis. It returns a **band**, a **reflection**, and the **two or three rungs
that fit that band** — with what each costs and where to actually go — and the person chooses.

It deliberately does *not* return a single recommended rung. Every EU/UK tool that maps
questionnaire scores to a suggested care level turned out to be a regulated medical device (Omaolo
and Terapianavigaattori under MDR, Limbic UKCA IIa, the German DiGA apps), so that output sits
behind the `RECOMMEND_RUNG` flag, off by default, pending a regulatory opinion. The rules engine
still computes it — for the tests, the clinician's sign-off sheet, and a future regulated release.

## The two values

Every decision in this repo serves one of these. If it doesn't, it's out.

1. **The right session.** A non-diagnostic assessment routes each person to the *right kind* of
   care — a session, a group, a workshop, self-help, or nettiterapia — not just any open slot.
2. **Reachable for anyone.** A stepped-care ladder, groups, demand pooling and free public services
   make appropriate help reachable at every budget — including capacity that does not exist yet.

## The stepped-care ladder

```
self-help → peer/community → nettiterapia → group therapy → short-term individual → Kela
   free         free         free w/ ref       low cost          you pay          subsidised
```

Every rung shows a plain cost label, and names the free care that is actually there: Mielenterveystalo
on the first, Tukinet on the second, HUS Nettiterapiat on the third **with the referral stated**.
Where no free care exists — short-term individual, Kela — the row stays bare, because naming a
navigator as though it were treatment would be the same falsehood pointing the other way.

The product's central idea is that **starting lower is not lesser treatment**. A recommendation of
self-help is not a verdict that your problem is small; it is where the evidence says to begin, and
it is what keeps the scarce rungs available for the people who need them.

---

## How the routing actually works

The engine is a pure function. Clinical logic lives in `config/`, never in code — adding an
instrument or changing a cutoff is a JSON change, not a deploy of new logic.

```
                    config/                              packages/engine/          apps/web/
  ┌───────────────────────────────────────┐        ┌────────────────────────┐   ┌──────────────┐
  │ instruments/   one JSON per screener  │───────▶│ scoreInstrument()      │──▶│              │
  │   PHQ-4 · PHQ-9 · GAD-7 · AUDIT-C     │        │   answers → band       │   │  one         │
  │   PC-PTSD-5 · UCLA-3 · WHO-5          │        │   + severity + flags   │   │  questionnaire│
  ├───────────────────────────────────────┤        ├────────────────────────┤   │  component   │
  │ routing/flow.json   who sees what     │───────▶│ nextInstrumentId()     │──▶│  for every   │
  ├───────────────────────────────────────┤        ├────────────────────────┤   │  instrument  │
  │ routing/rules.json  if → then + why   │───────▶│ route()                │──▶│              │
  │ ladder/ladder.json  the six rungs     │        │   → rung + reasons     │   │              │
  ├───────────────────────────────────────┤        ├────────────────────────┤   ├──────────────┤
  │ crisis.json         invariants 1–3    │───────▶│ checkCrisis()          │──▶│ crisis panel │
  │ i18n/en.json        all clinical copy │        │   on every answer      │   │ (no AI)      │
  └───────────────────────────────────────┘        └────────────────────────┘   └──────────────┘
                                                     pure · no I/O · no clock
```

A routing rule is one readable line plus the reason a clinician signed off:

```jsonc
{
  "id": "R5",
  "because": "A moderate band is the evidence-based home of nettiterapia and professional groups.",
  "when": { "severityAtLeast": 2 },
  "then": { "rung": "nettiterapia", "tags": ["structured"] }
}
```

That `because` string is not only for the clinician. **It is what the person reads on their
result**, under "Why this" — one string, so the explanation can never drift from the rule that
actually fired.

<p align="center">
  <img src="docs/images/result.png" alt="A result screen: a suggested rung, the reasons behind it, and the rungs either side" width="820">
</p>

Run `npm run rules:print` to render the whole decision surface as a page a clinician can read,
mark up and sign.

---

## Safety invariants

Twenty-one, all executable in `packages/engine/test/invariants.test.ts`. If one fails, **the failure
is correct and the feature is wrong** — they are never edited to make a feature pass.

The original six, from architecture v2 §8:

1. The crisis control is reachable from every screen — no sign-up, no completed test.
2. A crisis-flagged answer (PHQ-9 item 9) triggers the crisis panel **before scoring continues**.
3. The crisis panel shows real 24/7 Finnish resources by language — never a chatbot, never AI.
4. No screen ever shows a disorder label.
5. The AI layer can never override crisis routing, emit a diagnosis, or reorder clinical matches.
6. Paid placement never reorders clinical recommendations.

The fifteen V2 added:

| # | Invariant |
|---|---|
| 7 | Budget never hides a rung — every budget returns a permutation of the full ladder |
| 8 | A safety flag bypasses rung 2 entirely |
| 9 | With `RECOMMEND_RUNG` off, no surface renders a single recommended rung — asserted over all 1,680 input combinations |
| 10 | `ageBand: under-18` never reaches an adult private rung, over the same 1,680 |
| 11 | No outbound request carries an answer, band, severity, rung or age |
| 12 | No filter — language, budget, age — empties a rung that has entries |
| 13 | A `fallbackOnly` entry never outranks a domestic one, and never renders without its caution |
| 14 | Every directory entry carries hours, language, anonymity, who-answers and a verification date |
| 15 | Every (language × age band) combination reaches a person |
| 16 | A referral rung never renders without a while-you-wait block |
| 17 | Key-set equality across en/fi/sv in every bundle |
| 18 | An instrument without its official translation is never offered in that language |
| 19 | The scope statement is present on every result render |
| 20 | `RECOMMEND_RUNG` never changes what `route()` computes — enforced by grepping the engine source |
| 21 | A rung labelled free names the care that is really there, and never a route as though it were care |

Two are structural rather than behavioural. **20** greps `packages/engine/src` (comments stripped)
for any feature-flag read, so the engine cannot branch on a flag it has no way to see. **11** asserts
the request-body builder key by key, so "just add the rung so we can segment" fails a test before it
reaches a person.

## Privacy model

The claim is narrow and literal, which is what makes it keepable:

- **No client accounts.** There is no client login anywhere in the codebase. Login exists only for
  *providers*, and only from V2.
- **Answers stay on the device.** `apps/web/src/store.ts` uses `localStorage` and may never gain a
  network call.
- **A half-finished assessment lives in `sessionStorage`**, not `localStorage` — it survives an
  accidental refresh but dies with the tab, because a partial set of symptom answers should not
  outlive the session on a shared or family device.
- **No fonts, scripts or assets from a CDN.** A font request that leaks an IP on every page load
  would undercut the whole claim. Fonts are self-hosted via `@fontsource`.
- **No session recording, heatmaps or behavioural analytics** — ever. A replay tool reconstructs
  exactly the thing we promised not to collect.
- **The client is always free.** No client payment path exists in the codebase. Revenue is provider
  SaaS, occupational-health B2B and public contracts.

## On AI

`packages/ai` is **an empty slot in V1**, and the app must work identically when it is absent. A
test enforces that it cannot import `packages/engine`.

The deterministic core is the source of truth and stays that way permanently. When the AI layer is
built its only permitted jobs are `understand-free-text`, `explain-result` and
`draft-referral-request` — never diagnose, route, override crisis, or reorder matches. It runs in
shadow mode first, and no model is trained until V3. Full contract: [`packages/ai/README.md`](packages/ai/README.md).

---

## Getting started

```bash
npm install
npm run dev            # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | Engine, scoring, routing, the relays and the safety invariants (313 tests, no browser) |
| `npm run typecheck` | `tsc --build` across every workspace |
| `npm run test:a11y:setup` | Once — downloads the browsers Playwright drives |
| `npm run test:a11y` | axe-core, the crisis path, focus, announcements and WCAG reflow, in a real browser |
| `npm run test:a11y:report` | Open the HTML report |
| `npm run rules:print` | The routing table, formatted for clinician sign-off |
| `npm run directory:print` | The full service registry, for clinician and partner review |
| `npm run directory:verify` | Directory completeness (blocks) · add `-- --live` for URL liveness (reports) |
| `npm run build` | Production build of the web app |

Both suites run in CI on every push and pull request
([`engine`](.github/workflows/test.yml), [`accessibility`](.github/workflows/a11y.yml)).

## Repo layout

```
config/                  THE governance surface — the clinician's editable layer
  instruments/           one JSON per instrument (Type 1 routing · 2 progress · 3 explore)
  routing/               rules.json (printable if→then table) + flow.json (the tiered funnel)
  ladder/                the stepped-care spine, with cost labels
  directory/             the cross-sector service registry, by sector, plus youth and policy files
  groups/                demand-pooling topics, thresholds and regions
  i18n/                  split by OWNERSHIP: ui · clinical · directory, each in en/fi/sv
  flags.json             RECOMMEND_RUNG and why it is off
  feedback.json          where product feedback goes
  crisis.json            invariants 1–3
packages/engine/         pure, framework-free, fully tested. No I/O, no clock, no React
packages/ai/             the isolated, assistance-only AI slot. Still empty
apps/web/                mobile-first React app
apps/web/api/            the one serverless endpoint: the feedback relay
services/pool-counter/   anonymous demand-pool counters. Written and tested, NOT deployed
services/feedback-relay/ forwards feedback to an inbox and stores nothing
services/share-code/     (not built yet) expiring, encrypted, consent-only
docs/                    architecture, test catalog, the V2 plan, decisions and test report
tests/a11y/              the browser gate: axe + crisis path + interaction + WCAG
tests/e2e/               the V2 scenarios, the privacy audit and i18n completeness
```

## Testing

Two gates, deliberately separate — the engine is pure and should never need a browser.

**`npm test`** — 313 tests, **143 of them safety invariants**. Published cutoffs reproduced exactly,
band tables with no gaps, every i18n ref resolving in all three languages, licensing enforced
(`license: "verify-commercial"` fails on purpose), no diagnostic label in any result-facing string,
and the twenty-one invariants below.

**`npm run test:a11y`** — 63 tests across four browser projects: desktop, OS high-contrast
(`forced-colors`), Android, and **WebKit** for iOS Safari. axe-core on every reachable screen in
**fi, sv and en**, plus the things a DOM scan cannot judge: focus containment in the crisis and
feedback dialogs, screen-reader announcement when the question changes, the progress bar agreeing
with the value it announces, reflow at 320 CSS px, WCAG text-spacing overrides,
`prefers-reduced-motion`, refresh durability, and that no question is ever asked twice.

It also carries the **privacy audit**: every request the app makes during a full assessment is
captured and asserted against an allowlist. A full run on the deployed site makes eleven requests,
all same-origin, no bodies, no cookies. The log is committed at
[`docs/evidence/network-request-log.json`](docs/evidence/network-request-log.json).

Green here means no *mechanical* failure. It is not a claim that a screen is usable by someone in
distress — that needs a moderated session and a clinician's read. See [`tests/a11y/README.md`](tests/a11y/README.md).

## Instruments

Seven, all validated and free or public domain. Nobody sees all of them: PHQ-4 runs for everyone
and the deeper screeners open only when the quick screen or the stated domain points to them.

| | Measures | Items | Signal |
|---|---|---|---|
| **PHQ-4** | The universal quick screen | 4 | The front door; its subscales open PHQ-9 and GAD-7 |
| **PHQ-9** | Depression severity | 9 | Band → rung. **Item 9 is the crisis trigger** |
| **GAD-7** | Anxiety severity | 7 | Band → rung for the anxiety domain |
| **AUDIT-C** | Alcohol use risk | 3 | Adds substance-aware resources; never a rung by itself |
| **PC-PTSD-5** | Trauma screen | 5 | Adds a trauma-informed tag |
| **UCLA-3** | Loneliness | 3 | Supplies the `social` domain tag that prefers a **group** |
| **WHO-5** | Wellbeing (Type 2) | 5 | The progress tracker; not in the funnel |

Because brief screeners are built by reusing items from longer ones — PHQ-4 *is* the first two
items of PHQ-9 and of GAD-7 — items declare a `concept`, and an answer is carried forward rather
than asked twice. Only when the concept, the recall window and the response scale all match
exactly, and **never** for a crisis item. What was reused is shown, and can be refused.

<p align="center">
  <img src="docs/images/carried.png" alt="GAD-7 showing five questions instead of seven, with a note explaining what was carried over" width="820">
</p>

Full detail — purpose, science, licensing, routing signal — in
[`docs/reitti-test-catalog.md`](docs/reitti-test-catalog.md).

---

## Status

**V2 is built and deployed to a preview.** Live at
[reitti-seven.vercel.app](https://reitti-seven.vercel.app) — publicly reachable, `noindex`, and
carrying a banner on every screen saying it is a preview.

Built in V2: the cross-sector free-first directory · the fitting-rungs result behind
`RECOMMEND_RUNG` · rung 2 talking support · the budget-aware ladder with cost labels · a human
option on every result · while-you-wait · fi/sv/en · demand pooling · the on-device follow-up · the
youth handoff · a feedback relay.

Not built or not deployed: the `pool-counter` service (written and tested; needs an EU store, rate
limiting that adds no identifier, and `connect-src` widened), the share-code service, Type-2
tracking, and the private provider directory.

> ### Nothing clinical is signed off
>
> **All 14 directory entries are `clinicianReviewed: false`.** So are the band thresholds, the
> deep-dive triggers, the reflection copy, the R0 age gate, the `role` classifications, and every
> machine-drafted Finnish and Swedish clinical string. The regulatory opinion on the fitting-rungs
> set has not been sought.
>
> **This should not be described to HUS or a wellbeing county as V2.** It is a preview to think
> with. See [`docs/v2-test-report.md`](docs/v2-test-report.md) §8 for exactly what is blocked and on
> whom.

**On translations:** `config/i18n/` is split by *ownership*. Product copy and the service directory
are fully translated into Finnish and Swedish. The **clinical** bundle is not: no instrument has an
official validated FI/SV translation yet, so `_translationStatus` marks all seven `absent` and the
questionnaire redirects to English with an explanation. A hand-translated screening item measures
something different. English-only for the questions is the honest state, not a gap papered over.

The language question in the app is about **the care you are pointed to**; the interface language is
separate and stored separately.

## Roadmap

| | |
|---|---|
| **Next** | Clinician sign-off — it unblocks the directory, the FI/SV instrument translations and the thresholds · deploy the pool counter so demand pooling exists in the product and not only the repo |
| **Then** | Share-code service · Type-2 tracking · the regulatory opinion on `RECOMMEND_RUNG` |
| **Later** | Therapist directory with Valvira verification and live availability · provider accounts · AI in shadow mode only — sequenced in [`docs/phase-2-marketplace-plan.md`](docs/phase-2-marketplace-plan.md), whose Gate 0 is **not met** |

## Documentation

| Document | What it holds |
|---|---|
| [`docs/reitti-master-plan.md`](docs/reitti-master-plan.md) | The index and the workstreams |
| [`docs/reitti-architecture-v2.md`](docs/reitti-architecture-v2.md) | Full technical architecture, the AI path, phases |
| [`docs/reitti-test-catalog.md`](docs/reitti-test-catalog.md) | Every instrument: purpose, science, licensing, routing signal |
| [`docs/v2-plan.md`](docs/v2-plan.md) | **The current plan.** Ten slices, the new invariants, CI, deploy, test plan |
| [`docs/v2-decisions.md`](docs/v2-decisions.md) | Sixteen judgement calls, and which need clinician sign-off |
| [`docs/v2-test-report.md`](docs/v2-test-report.md) | What passed, what is blocked on the clinician, what on the regulator |
| [`docs/phase-2-marketplace-plan.md`](docs/phase-2-marketplace-plan.md) | A **later** phase: provider accounts, verified directory, billing, AI. Gate 0 not met; `v2-plan.md` wins on any disagreement |
| [`packages/ai/README.md`](packages/ai/README.md) | The AI layer contract |
| [`CLAUDE.md`](CLAUDE.md) | The rules that matter when writing code here |

## Tech

TypeScript 5.6 · React 18 · Vite 6 · npm workspaces · Vitest 2 · Playwright 1.62 with axe-core.
No UI framework, no CSS-in-JS, no CDN. The design system is one stylesheet and three self-hosted
typefaces.
