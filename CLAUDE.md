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

A Sept 2026 review of ~27 comparable services settled three things:

1. **HUS already ships our assessment.** Terapianavigaattori (HUS / Terapiat etulinjaan) is
   anonymous, validated, consent-coded, CE-marked under MDR, and had 367,506 cumulative users by
   Jan 2026. It deliberately makes **no automated conclusion or recommendation** — a professional
   decides at the ensijäsennys visit. We are the layer *around* it, not a better navigator.
   Terapianavigaattori and Mielenterveystalo.fi are destinations in our directory, not competitors.
2. **Mapping questionnaire scores to a suggested care level makes you a medical device.** No
   exception was found in the EU or UK — Omaolo (MDR), Terapianavigaattori (MDR), Limbic (UKCA
   IIa), Wysa Gateway (UKCA I), the German DiGA apps. Our automated suggested rung is very likely
   MDSW, plausibly Class IIa. A regulatory opinion is being sought.
3. **Only three of our values are unique:** cross-sector free-first routing (public + Kela +
   third-sector + private in one view), budget-aware suggestions that never filter care out, and
   demand-pooled group formation with waitlist promotion. Everything else — no diagnosis,
   anonymity, rules-not-AI, share code, validated free instruments, crisis to humans — is **parity
   with HUS, not differentiation.** Engineering effort follows that split.

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
npm test              # engine + invariants (must be green before any commit)
npm run typecheck
npm run test:a11y:setup   # once: downloads the browsers Playwright drives
npm run test:a11y         # axe-core, crisis path, focus/announcements, WCAG reflow
npm run dev           # web app at localhost:5173
npm run build
npm run rules:print   # the routing table, formatted for clinician sign-off
npm run directory:print   # the full provider registry, for clinician/partner review
npm run directory:verify  # directory completeness (blocking)
npm run directory:verify -- --live   # + URL liveness (reporting only, never blocks)
```

## Architecture in one breath

**Deterministic core is the source of truth; AI is additive and isolated.** Scoring and routing are
rules-based and stay that way permanently. `packages/ai` is an empty slot in V1 — the app must work
identically when it is absent.

```
config/            THE governance surface — the clinician's editable layer
  instruments/     one JSON per instrument (Type 1 routing / 2 progress / 3 explore)
  routing/         rules.json (printable if→then table) + flow.json (the tiered funnel)
  ladder/          the stepped-care spine
  i18n/            all user-facing wording, by ref
  crisis.json      invariants 1–3
packages/engine/   pure, framework-free, fully tested. No I/O, no clock, no React.
packages/ai/       the isolated, assistance-only AI slot. Empty in V1. Contract: packages/ai/README.md
apps/web/          mobile-first React app
services/share-code/  (not built yet) expiring, encrypted, consent-only
docs/              master plan, architecture, test catalog, scenarios, V2 plan
```

A **later** phase adds provider-side services (therapist directory, groups, notifications, billing,
consented outcomes) around this unchanged core — see `docs/phase-2-marketplace-plan.md`. That phase
is **not** what V2 built, and its Gate 0 prerequisites are not met.

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
- **`config/i18n` is the clinical content surface, not all copy.** Instrument wording, band
  reflections, rung labels and crisis resources live there because the clinician owns them.
  Product and marketing copy (the home page, button labels) lives in the components — putting it
  in the clinician's governance surface would only bury the content they need to review.
- **Never hand-translate an instrument.** A translated screening item measures something different.
  `config/i18n/fi.json` and `sv.json` stay absent until the *official validated* translations are
  obtained. English-only is the honest state, not a gap to paper over.
- **Visual formats: response scale yes, interpretation no.** A validated pictorial *response* scale
  (the Self-Assessment Manikin, an affect grid) is fine and helps accessibility. A projective or
  image-*interpretation* test (inkblots, "which picture are you") never is. Never re-format a
  validated instrument's response scale — use a separately-validated instrument instead.
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
- **Hours are never invented.** A directory entry records `verifiedOn` unconditionally; its hours
  string is either verified against the live source or the honest fallback ("hours change — check
  the site") with the link. A stale hour presented as current sends someone to a closed line.

## Status

**V1 (in progress).** Engine, config surface, Type-1 flow, crisis path, on-device store, printable
summary and marketplace previews are built. No AI and no client login by design. Not yet built: the
share-code service, Type-2 tracking, FI/SV translations, therapist directory.

Clinical content is **provisional** until the clinician co-founder signs off — see
`docs/reitti-test-catalog.md` "Open items before production".

**V2 is built and deployed to a preview.** All ten slices in `docs/v2-plan.md` are implemented: the
cross-sector directory, the fitting-rungs result behind `RECOMMEND_RUNG`, rung 2, the budget-aware
ladder, the human option, while-you-wait, fi/sv/en parity, demand pooling, the follow-up loop and the
youth handoff. Results and open items: `docs/v2-test-report.md`.

Baseline to keep green: **284 engine tests, 143 of them safety invariants**, plus **264 browser
tests** (`npm run test:a11y`). Not built or not deployed: the `pool-counter` service (written and
tested, needs an EU store, rate limiting and a widened `connect-src`), the share-code service,
Type-2 tracking, the private provider directory.

**Every one of the 14 directory entries is `clinicianReviewed: false`**, and no instrument has an
official Finnish or Swedish translation yet — so the assessment redirects to English in fi/sv while
everything else is translated. That list of official translations is the highest-value unblock.

## Detail lives here, not in this file

- `README.md` — the 30-second version: what Reitti is, how routing works, setup
- `docs/reitti-master-plan.md` — the index and the workstreams
- `docs/reitti-architecture-v2.md` — full technical architecture, the AI path, phases
- `docs/reitti-test-catalog.md` — every instrument: purpose, science, licensing, routing signal
- `docs/how-it-works-scenarios.md` — **not written yet**; would tell the architecture through worked user scenarios
- `docs/v2-plan.md` — **THE CURRENT PLAN.** The V2 build: ten slices, new invariants, CI, deploy, tests
- `docs/v2-decisions.md` — every V2 judgement call, and which ones need clinician sign-off
- `docs/v2-test-report.md` — what passed, what is blocked on the clinician, what is blocked on the
  regulatory opinion
- `docs/phase-2-marketplace-plan.md` — a **later** phase (provider accounts, verified directory,
  billing, AI). **Not being built**: its Gate 0 prerequisites are unmet. `v2-plan.md` wins on any
  disagreement. V2 absorbed only its §3.1, §3.4 and §3.9.
- `packages/ai/README.md` — the AI layer contract (jobs, guardrails, shadow-mode, consented data)
