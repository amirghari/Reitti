# Reitti — System Architecture v2

*Supersedes v1. Incorporates the test catalog (three-layer taxonomy) and the standard, correct path for an AI-enabled product. Clinical specifics remain provisional until the clinician co-founder signs off. Read alongside `reitti-test-catalog.md`.*

---

## 0. What changed since v1, and why

Two new inputs reshape the architecture:

1. **The three-layer test taxonomy** (Type 1 routing / Type 2 progress / Type 3 engagement) means the questionnaire engine now has to serve *three different downstream consumers* from *one* engine — so "instrument type" becomes a first-class dimension of the config, and the data flows diverge cleanly by type.
2. **The decision to build as an AI-ready product** means we adopt the standard pattern for AI apps in safety-critical domains: a **deterministic core that is the source of truth**, with AI added later as an **isolated, evaluated, guardrailed, assistance-only layer** — never as the thing that makes the clinical decision. Everything below is arranged so that adding AI in Phase 2/3 is a contained, auditable change, not a rewrite.

---

## 1. Architectural stance (the five principles)

1. **Deterministic core, additive AI.** Routing and scoring are rules-based and remain so permanently. The AI layer only ever *assists* (explains, understands free text, drafts) around the deterministic decision. This is both the safest and the standard pattern for regulated/health-adjacent AI.
2. **Config is the governance layer.** Instruments, cutoffs, routing rules, the ladder, and translations are versioned configuration — the clinician's editable surface — not code. Policy lives in config; the engine that executes it is dumb and stable.
3. **Privacy-first / on-device by default.** Client results live on the device. The only server that touches health data is the minimal share-code service, and it can't read the contents. AI training data is a *separate, consented, opt-in* pipeline — never the default store.
4. **Compliance-by-design.** V1 is deliberately out of medical-device and EU-AI-Act scope (rules-based guidance, no diagnosis). The seams are drawn so that when AI is added it is a clearly-bounded high-risk component with its own risk management, documentation, and human oversight — not diffused through the whole app.
5. **Evaluation before exposure.** No AI output reaches a user until it has been evaluated offline against clinician-approved rules and run in shadow mode. The rules engine is the ground truth the AI is measured against.

---

## 2. Layered architecture

```
┌───────────────────────────────────────────────────────────────┐
│ PRESENTATION  (mobile-first web app)                          │
│  • home / one-page value story  • tiered questionnaire UI     │
│  • Your-path ladder  • groups/therapist previews (V1)         │
│  • crisis path (always reachable)  • client-side PDF export   │
│  • i18n FI/SV/EN                                              │
├───────────────────────────────────────────────────────────────┤
│ DOMAIN / LOGIC  (deterministic, config-driven — the core)     │
│  • Questionnaire Engine (one engine, config per instrument)   │
│  • Scoring + band lookup (published cutoffs)                  │
│  • Routing/Recommendation Engine (rules → suggested rung)     │
│  • Crisis rules (deterministic triggers)                     │
├───────────────────────────────────────────────────────────────┤
│ AI LAYER  (Phase 2+, ISOLATED behind an interface)            │
│  • assistance only: free-text understanding, plain-language   │
│    explanations, triage support                              │
│  • guardrails · shadow-mode · human-in-the-loop · eval harness│
│  • CANNOT override crisis routing or emit a diagnosis         │
├───────────────────────────────────────────────────────────────┤
│ DATA  (minimal, phased)                                       │
│  • on-device store (all client results)                      │
│  • share-code service (expiring/encrypted/consent-only)      │
│  • content+config CDN (instruments, rules, translations)     │
│  • therapist directory API (Phase 2, non-sensitive)          │
│  • consented outcomes store (Phase 3, opt-in, EU, anon)      │
└───────────────────────────────────────────────────────────────┘
```

The AI layer is a *slot*, not a dependency. V1 ships with the slot empty; nothing in the core needs to change to fill it later.

---

## 3. The questionnaire engine v2 (one engine, three consumers)

One engine renders items, scales a response, sums a score, looks up a band, and emits a result. What differs per instrument is config, and the new first-class field is `type`, which routes the result to the correct consumer.

```
Instrument {
  id, name, version
  type: "routing" | "progress" | "explore"      // Type 1 / 2 / 3
  license: "free" | "public-domain" | "verify-commercial"
  items: [ { key, textRef, scale:[{labelRef,value}] } ]
  scoring: "sum" | "mean" | "subscales"
  bands: [ { min, max, bandId, reflectionRef } ]
  crisisItem?: { key, triggerIf }               // e.g. PHQ-9 item 9
  branchesTo?: [ { ifBandAtLeast, instrumentId } ] // Type-1 escalation
  routingSignal?: { domainTag, weight }         // how it feeds routing
}
```

Result routing by `type`:
- **routing** → feeds the Routing Engine (§4). May branch to a deeper routing instrument.
- **progress** → written to the on-device history; optionally to the consented outcomes store; shareable via code/PDF.
- **explore** → engagement only; never touches routing or the clinical record.

Adding an instrument = adding a config object + its translations. No engine change. This is the cost lever and the safety lever at once (the engine can't be broken by content edits).

---

## 4. The routing / recommendation engine

Pure, printable, clinician-owned lookup.

```
inputs  = { severityBand, primaryDomain, duration, budget, language,
            safetyFlags (crisis, trauma, substance) }
rules   = ordered [ if(condition) → suggestRung + tags ]
output  = { suggestedRung, adjacentRungs:[above,below], providerTags }
```

- Higher band → higher rung; long duration biases up; budget/language shift the *suggestion* and tags, never filter care out.
- Safety flags short-circuit: a crisis flag routes to the crisis path immediately; a trauma flag adds a trauma-informed tag.
- Every rule is one readable line; the whole table prints for clinician sign-off. No AI, no inference, no diagnosis — a band and tags in, a suggestion out.

---

## 5. Data & storage

- **On-device (default):** answers, bands, timestamps, prefs. Never transmitted. "Clear my data" is real and instant.
- **Share-code service:** the only health-data-touching server. Consent-created, single-purpose, expiring (TTL), encrypted with the code as part of the key so Reitti stores an unreadable locked box. API: `POST /share`, `GET /share/:code`, scheduled purge.
- **Content + config CDN:** versioned instrument configs, routing rules, ladder, translation bundles. The clinician ships a cutoff change by releasing a new config version — no engine deploy.
- **Therapist directory API (Phase 2):** business-listing data (not special-category), therapist opt-in, verified against Valvira JulkiTerhikki, therapist-confirmed availability.
- **Consented outcomes store (Phase 3):** opt-in only, EU-hosted, identity-stripped. The AI training substrate — separate from everything else by design (§7).

---

## 6. The AI layer — the standard, correct path

This is how a responsible AI product adds intelligence. All of it is Phase 2+; V1 only prepares the seams.

**6.1 Isolation.** The AI sits behind a single internal interface (e.g. `assist(input) → suggestionForHuman`). The core calls it optionally; if it's absent, disabled, or failing, the app works identically on rules alone. AI is never on the critical path.

**6.2 Assistance-only scope.** Permitted AI jobs: understanding the optional free-text a user writes, generating plain-language explanations of a (rules-produced) result, drafting "why these matches" copy, helping a user phrase a doctor-referral request. Forbidden: producing a diagnosis, making or overriding the routing decision, and anything on the crisis path. These are enforced as guardrails, not conventions.

**6.3 Shadow-mode first.** Before any AI output is shown, it runs in shadow: the model produces a suggestion, the system logs it next to the rules engine's decision, and the two are compared offline. You accumulate evidence that the model agrees with clinician-approved rules *before* a single user sees AI. This is also the cheapest way to validate.

**6.4 Evaluation harness.** A golden dataset of (inputs → clinician-approved decision) is the eval set. Every model/prompt version is scored against it offline; regressions block release. Because routing is rules-based, you already generate labelled examples — the eval set builds itself from consented data.

**6.5 Consented data pipeline.** The training/eval substrate comes only from users who opt in. Events are captured to the Phase-3 outcomes store, identity-stripped, EU-hosted, structured as (inputs → decision → outcome). You are not choosing between privacy and AI — you build a separate, consented lane so the default stays fully private.

**6.6 Guardrails & observability.** Input/output guardrails (no diagnosis language, no crisis interception, schema-constrained outputs), full logging without PII, monitoring for drift, and human-in-the-loop review of samples. Prompts and model versions are versioned like code.

**6.7 The AI Act gate.** Adding this layer is the deliberate moment Reitti approaches high-risk-AI territory. Treat it as a funded gate with its own risk-management file, transparency notices, human-oversight design, and documentation — bounded to this component because the architecture isolated it. You have runway: the high-risk medical-AI deadlines were moved to Dec 2027 (standalone) / Aug 2028 (embedded).

---

## 7. Client-side PDF export

The result PDF is generated in the browser from on-device data — nothing sent to a server. It's the professional takeaway a person can print or hand to a therapist, and it adds zero health-data liability. Pairs with the share code (PDF = in person; code = remote).

---

## 8. Safety invariants (must always hold; automated tests)

1. Crisis control reachable from every screen, no sign-up, no completion required.
2. A crisis-flagged answer (e.g. PHQ-9 item 9) triggers the crisis panel before scoring continues.
3. Crisis panel shows real 24/7 Finnish resources (MIELI ry by language; 112) — never a chatbot, never AI.
4. No screen ever shows a disorder label; output is band + reflection + suggested rung.
5. The AI layer can never override crisis routing, emit a diagnosis, or reorder clinical matches.
6. Paid placement never reorders clinical recommendations.

---

## 9. Repo & dev architecture (the standard build path)

Monorepo, so app + share-code service + configs evolve together:

```
reitti/
  CLAUDE.md              # lean (<200 lines): values, invariants, commands, pointers
  docs/
    reitti-architecture-v2.md
    reitti-test-catalog.md
  .claude/
    skills/              # e.g. "add-instrument", "add-routing-rule"
    rules/               # path-scoped rules
  config/                # THE governance surface
    instruments/         # one file per instrument (Type 1/2/3)
    routing/             # the printable rules table
    ladder/  i18n/
  apps/
    web/                 # mobile-first web app (presentation + engine)
  services/
    share-code/          # tiny serverless + EU store
  packages/
    engine/              # questionnaire + scoring + routing (pure, tested)
    ai/                  # empty interface in V1; filled in Phase 2
```

- **CLAUDE.md** stays lean and command-first, holds the two values + safety invariants + "clinical logic lives in config," and *points to* the docs rather than pasting them (a bloated file gets ignored). Auto-memory accumulates build learnings across sessions.
- **Skills** encode repeatable procedures (how to add an instrument config safely, with the licensing + no-diagnosis checks) so content work is safe and consistent.
- **Testing:** unit tests on scoring (deterministic, easy); invariant tests on the six safety rules; eval tests on the AI layer (Phase 2+).
- **CI/CD, secrets hygiene (never commit keys), IaC, EU data residency** throughout.
- **The `packages/engine` is pure and framework-agnostic** so it's trivially testable and reusable across the client and (later) any server-side use.

---

## 10. Build phases (with AI-readiness seams)

- **Phase 1 — V1 routing tool.** Engine + Type-1 quick screen + routing + ladder + crisis + on-device store + PDF + minimal share-code + static therapist/group previews. The `ai/` interface exists but is empty. Ships with zero therapists and zero AI.
- **Phase 2 — marketplace + first AI assistance.** Therapist directory + JulkiTerhikki verification + availability; groups/waitlist/pooling live; AI layer filled with shadow-mode assistance (free-text understanding, explanations) behind guardrails and evals.
- **Phase 3 — measurement-based care + trained models.** Consented outcomes store; Type-2 trend/history; therapist app; model training/eval on consented labelled data; the AI-Act risk file.

The durable core (engine, config model, on-device store, safety invariants, i18n) is built once in Phase 1. Everything AI is additive and isolated — so new findings or a pivot change a config file or a Phase-2/3 module, never the foundation.

---

## 11. Open decisions

1. Web framework (React/Svelte) — team familiarity.
2. Whether Type-3 (engagement) tests ship in V1 or wait.
3. PHQ-8 vs PHQ-9 (self-harm item ↔ crisis trigger). *Clinician.*
4. The three `[verify commercial license]` instruments (ISI, PSS, ORS/SRS).
5. When to open the consented outcomes lane (Phase 3 trigger) and its exact minimization.
6. Which AI-assistance features are worth the AI-Act gate first (likely: free-text understanding + result explanations).
