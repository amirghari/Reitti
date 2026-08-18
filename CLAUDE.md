# Reitti

A Finnish mental-health **access layer**: a routing tool that guides people to the right kind of
help at the right intensity — not just any available professional.

## The two values

Every decision serves one of these. If it doesn't, it's out.

1. **The right session.** A non-diagnostic assessment routes each person to the *right kind* of care
   — a session, a group, a workshop, self-help, or nettiterapia — not just any open slot.
2. **Reachable for anyone.** A stepped-care ladder, groups, demand pooling and free public services
   make appropriate help reachable at every budget — including capacity that doesn't exist yet.

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
npm run test:a11y:setup   # once: downloads the browser Playwright drives
npm run test:a11y         # axe-core + the crisis path, in a real browser
npm run dev           # web app at localhost:5173
npm run build
npm run rules:print   # the routing table, formatted for clinician sign-off
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

V2 adds provider-side services (therapist directory, groups, notifications, billing,
consented-outcomes) *around* this unchanged core — see `docs/reitti-v2-phase-plan.md`.

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

## Status

**V1 (in progress).** Engine, config surface, Type-1 flow, crisis path, on-device store, printable
summary and marketplace previews are built. No AI and no client login by design. Not yet built: the
share-code service, Type-2 tracking, FI/SV translations, therapist directory.

Clinical content is **provisional** until the clinician co-founder signs off — see
`docs/reitti-test-catalog.md` "Open items before production".

## Detail lives here, not in this file

- `docs/reitti-master-plan.md` — the index and the workstreams
- `docs/reitti-architecture-v2.md` — full technical architecture, the AI path, phases
- `docs/reitti-test-catalog.md` — every instrument: purpose, science, licensing, routing signal
- `docs/how-it-works-scenarios.md` — the architecture told through worked user scenarios
- `docs/reitti-new-phase-plan.md` — the plan for the second version (Phase 2)
- `packages/ai/README.md` — the AI layer contract (jobs, guardrails, shadow-mode, consented data)