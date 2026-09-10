# Reitti

A Finnish mental-health **access layer**: a routing tool that guides people to the right kind of
help at the right intensity — not just any available professional.

## The two values

Every decision serves one of these. If it doesn't, it's out.

1. **The right session.** A non-diagnostic assessment routes each person to the *right kind* of care
   — a session, a group, a workshop, self-help, or nettiterapia — not just any open slot.
2. **Reachable for anyone.** A stepped-care ladder, groups, demand pooling and free public services
   make appropriate help reachable at every budget — including capacity that doesn't exist yet.

## V2 positioning — read this before proposing a feature

> **HUS routes people inside the public system. Reitti routes people across all of it, tells them
> what each rung costs, and creates group capacity that doesn't exist yet.**

Terapianavigaattori already ships our assessment, anonymously and CE-marked, and deliberately makes
no automated recommendation. It and Mielenterveystalo are **destinations in our directory, not
competitors**. Only three things here are ours: cross-sector free-first routing, budget-aware
ordering that never filters care out, and demand-pooled group formation. Everything else is parity
with HUS. Engineering effort follows that split.

Full reasoning, and the regulatory finding behind `RECOMMEND_RUNG`, in `docs/v2-plan.md` §0.

## Safety invariants — never weaken these

Enforced by `packages/engine/test/invariants.test.ts`. If one fails, the failure is correct and the
feature is wrong. Never edit a test to make a feature pass.

1. The crisis control is reachable from every screen — no sign-up, no completed test.
2. A crisis-flagged answer (PHQ-9 item 9) triggers the crisis panel **before scoring continues**.
3. The crisis panel shows real 24/7 Finnish resources (MIELI ry by language; 112) — never a
   chatbot, never AI.
4. No screen ever shows a disorder label. Output is band + reflection + suggested rung.
5. The AI layer can never override crisis routing, emit a diagnosis, or reorder clinical matches.
6. Paid placement never reorders clinical recommendations.

## Commands

```bash
npm install
npm test              # engine + relays + invariants (must be green before any commit)
npm run typecheck
npm run test:a11y:setup   # once: downloads the browsers Playwright drives
npm run test:a11y         # axe-core, crisis path, focus/announcements, WCAG reflow
npm run dev           # web app at localhost:5173
npm run build
npm run rules:print   # the routing table, formatted for clinician sign-off
npm run directory:print   # the full provider registry, for clinician/partner review
npm run directory:verify  # directory completeness (blocking)
npm run directory:verify -- --live   # + URL liveness (reporting only, never blocks)
vercel deploy --prod --yes           # deploy. Pushing to main is unreliable — see Deploying below
```

## Architecture in one breath

**Deterministic core is the source of truth; AI is additive and isolated.** Scoring and routing are
rules-based and stay that way permanently. `packages/ai` is still an empty slot — the app must work
identically when it is absent.

`config/` is THE governance surface, the clinician's editable layer: instruments, routing rules and
the tiered funnel, the ladder with cost labels, the cross-sector `directory/`, `groups/` topics,
`flags.json`, `feedback.json`, `crisis.json`, and `i18n/` **split by ownership** into `ui`,
`clinical` and `directory`, each in en/fi/sv.

`packages/engine/` is pure and framework-free. `apps/web/` is the React app, with the one serverless
endpoint in `apps/web/api/`. `services/` holds `pool-counter` (counters, not rows — not deployed),
`feedback-relay` (forwards, stores nothing) and the unbuilt `share-code`.

Full tree in `README.md`.

## The rules that matter when writing code here

- **Clinical logic lives in config, never in code.** Adding an instrument or changing a cutoff is a
  JSON change plus i18n. If you find yourself writing a condition about PHQ-9 in a `.tsx` file,
  stop — it belongs in `config/`.
- **The engine stays pure.** No fetch, no localStorage, no `Date.now()`, no framework imports in
  `packages/engine`. Timestamps are stamped by `apps/web/src/store.ts`.
- **AI assists, never decides.** `packages/ai` cannot import `packages/engine` (a test enforces it).
  Its only permitted jobs are `understand-free-text`, `explain-result`, `draft-referral-request` —
  never diagnose, route, override crisis, or reorder matches. When built it runs **shadow-mode
  first**, every output is labelled `aiGenerated`, and **no model is trained** until V3 (a live
  product + a consented, opt-in, EU, identity-stripped dataset + clinician-validated rules). Full
  contract: `packages/ai/README.md`.
- **No client accounts or login.** Clients are accountless and their data is on-device. Login exists
  only for *providers*, and only from V2. `apps/web/src/store.ts` must never gain a network call.
- **The client is always free.** No client payment path exists in the codebase — revenue is provider
  SaaS, occupational-health B2B, and public contracts. (Invariant 6 keeps paid placement out of
  clinical ordering.)
- **`config/i18n` is split by ownership.** `clinical/` is the clinician's — instrument wording,
  bands, rung labels, crisis copy. `ui/` is product copy. `directory/` is service data. All UI copy
  lives in config now, not in components, so fi/sv parity is testable.
- **Product copy avoids the em dash.** One is a pause; forty across a page reads as breathless,
  which is the opposite of what someone anxious needs. `copy.test.ts` enforces it for `ui/` and
  `directory/` and asserts `clinical/` is left alone — never satisfy that test by restyling governed
  content.
- **Never hand-translate an instrument.** A translated screening item measures something different.
  `config/i18n/fi.json` and `sv.json` stay absent until the *official validated* translations are
  obtained. English-only is the honest state, not a gap to paper over.
- **Visual formats: response scale yes, interpretation no.** A validated pictorial *response* scale
  is fine. A projective or image-*interpretation* test (inkblots, "which picture are you") never is,
  and a validated instrument's response scale is never re-formatted.
- **No fonts, scripts or assets from a CDN.** The privacy claim is that answers never leave the
  device; a font request that leaks an IP on every page load undercuts it. Fonts are self-hosted
  via `@fontsource`.
- **Never ship an instrument whose licence is unresolved.** `license: "verify-commercial"` fails a
  test on purpose. ISI, PSS and ORS/SRS are flagged in the catalog and are not in V1.
- **Budget and language shift the suggestion, never filter care out.** No rung is ever hidden.
- **On-device by default.** The only server that may touch health data is the share-code service,
  with explicit consent, and it cannot read the contents.
- **Every routing rule carries a `because` line** a clinician can read and sign off.

- **No automated single suggested rung on a consumer screen.** `RECOMMEND_RUNG` (declared in
  `config/flags.json`, default **off**, overridable at build time by `VITE_RECOMMEND_RUNG`) governs
  this. With it off, a result shows band + reflection + **2–3 fitting rungs in ascending ladder
  order** with cost labels and a human option, and the person chooses. The computed rung carries no
  positional, visual or textual distinction — ordering by anything but ladder level makes the
  recommendation through position, which is the same regulated act. The engine keeps computing
  `suggestedRung` for tests, clinician review and a future regulated release; **`packages/engine`
  never reads the flag** and `route()` returns identical output in both states. Every result screen
  carries the scope statement: guidance and information, not a medical device, not a diagnosis, the
  decision stays with the person and their professional.
- **Rung 2 (`peer-community`) is talking support, never the crisis path.** Any safety flag bypasses
  rung 2 entirely and goes to Kriisipuhelin 09 2525 0111 / 112, with the Swedish and English crisis
  lines selected by language. Every rung-2 entry shows, on the card and not behind a disclosure: who
  runs it, hours, language, anonymity, professional vs volunteer, and its verification date. Finnish
  and Swedish public and third-sector entries always render before any international service; 7 Cups
  is `fallbackOnly`, English only, always last, and always carries its caution label. **No service
  is added to rung 2 or the directory without clinician review.**
- **The free public options live on the front door, not behind the questionnaire.** Terapianavigaattori
  and Mielenterveystalo are first-class destinations at the *public entry point* — the home page —
  because the assessment is a way in, not a toll gate. Someone holding a Terapianavigaattori consent
  code must never have to answer a screener to be told they can use it (`config/directory/entry-points.json`,
  invariant 21).
- **`role` distinguishes care from a route to care.** Terapianavigaattori lists `group-therapy` among
  its rungs because it routes people there; it is not free group therapy. Only `role: 'care'` may be
  named as the free thing available at a rung. Where no free care exists the rung says nothing —
  free options running out above the peer rung is the argument, not a hole to fill.
- **`role` distinguishes care from a route to it.** `care` is support you can use today,
  `gated-care` is real free care behind a referral (nettiterapia), `route` is a navigator
  (Terapianavigaattori, a health station). Only the first two may be named as the free thing at a
  rung, and `gated-care` only ever with the gate stated. A rung labelled free that names nobody
  argues that free care has run out; where it genuinely has — rungs 4 and 5 — the row stays bare.
- **Nothing new goes in the directory without being flagged.** A service the brief does not name is
  recorded in `docs/v2-decisions.md` and left out, not added on our judgement. D-15 is the worked
  example.
- **Servers relay or count; they never store.** `pool-counter` keeps one integer per
  (topic, region, language) and has no withdraw endpoint, because a withdraw token would be a
  per-person identifier. `feedback-relay` forwards to an inbox and keeps nothing, because free text
  on a mental-health site is special-category data the moment it lands in a database. Rate limiting
  is a global token bucket, never per-IP, for the same reason.
- **Reduced motion is the base case, never a fallback.** Any animated state hides its content only
  inside a `prefers-reduced-motion: no-preference` query *and* behind a class JavaScript adds on
  mount. If the query does not match or the script never runs, the finished state is what renders.
  A page that animates itself into visibility will otherwise stay invisible for somebody.
- **Hours are never invented.** A directory entry records `verifiedOn` unconditionally; its hours
  string is either verified against the live source or the honest fallback ("hours change — check
  the site") with the link. A stale hour presented as current sends someone to a closed line.

## Deploying

Two Vercel projects build this repo and the plan allows one concurrent build, so **pushing to `main`
is not reliably deploying** — builds get cancelled at the millisecond they start, with no events.
Deploy with `vercel deploy --prod --yes` after linking to the `reitti` project. The redundant
`reitti-v2-preview` project should be deleted; it is the other half of the contention.

`vercel.json` lives at **`apps/web/vercel.json`**, not the repo root, because that project's Root
Directory is `apps/web` and Vercel reads the file from there. A config at the repo root governs
nothing that ships — it silently broke this project's builds for a day, and the security headers it
declared were never sent.

Production is publicly readable and cannot be put behind a login on this plan. `noindex` is set
three ways (meta tag, `X-Robots-Tag`, `robots.txt`) and a preview banner runs on every screen. Lift
all three together, and only after clinical sign-off.

## Status

**V1 shipped; V2 built and live** at https://reitti-seven.vercel.app. All ten slices in
`docs/v2-plan.md` are implemented, plus a feedback relay reachable from the header.

Baseline to keep green: **313 engine tests, 143 of them safety invariants**, plus **63 browser
tests** (`npm run test:a11y`, four device projects).

Not built or not deployed: the `pool-counter` service (written and tested — needs an EU store, rate
limiting that adds no identifier, `connect-src` widened), the share-code service, Type-2 tracking,
the private provider directory.

> **Nothing clinical is signed off.** All 14 directory entries are `clinicianReviewed: false`; no
> instrument has an official FI/SV translation, so the questionnaire redirects to English there; the
> R0 age gate, the `role` classifications and every machine-drafted FI/SV clinical string are
> unreviewed; the regulatory opinion has not been sought.
>
> **The engineering is ahead of the clinical and regulatory work, and that gap is the risk.** Do not
> describe this build to HUS or a wellbeing county as V2. What is blocked and on whom:
> `docs/v2-test-report.md` §8.

## Detail lives here, not in this file

- `README.md` — the 30-second version: what Reitti is, how routing works, setup
- `docs/reitti-master-plan.md` — the index and the workstreams
- `docs/reitti-architecture-v2.md` — full technical architecture, the AI path, phases
- `docs/reitti-test-catalog.md` — every instrument: purpose, science, licensing, routing signal
- `docs/how-it-works-scenarios.md` — **not written yet**; would tell the architecture through worked user scenarios
- `docs/v2-plan.md` — **THE CURRENT PLAN.** The V2 build: ten slices, new invariants, CI, deploy, tests
- `docs/v2-decisions.md` — sixteen V2 judgement calls, and which ones need clinician sign-off
- `docs/open-items.md` — **the single register of what is not done**, and who unblocks each thing.
  Read it before proposing work; the other docs point here rather than keeping their own lists
- `docs/v2-test-report.md` — what passed, and how it was verified
- `docs/phase-2-marketplace-plan.md` — a **later** phase (provider accounts, verified directory,
  billing, AI). **Not being built**: its Gate 0 prerequisites are unmet. `v2-plan.md` wins on any
  disagreement. V2 absorbed only its §3.1, §3.4 and §3.9.
- `packages/ai/README.md` — the AI layer contract (jobs, guardrails, shadow-mode, consented data)
- `.claude/skills/add-instrument/` — how to add a screener safely (licensing, translation, no-label)
- `.claude/skills/add-directory-entry/` — how to add a service safely (verification, role, honesty)
