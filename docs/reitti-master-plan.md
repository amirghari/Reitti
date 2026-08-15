# Reitti — Master Plan

*The single entry point. Ties the two core values to every workstream and points to the detailed documents. Read the details in `reitti-architecture-v2.md` and `reitti-test-catalog.md`.*

---

## 0. The two core values (the north star)

Everything below serves one of these. If a decision doesn't, it's out.

1. **The right session.** A guided, non-diagnostic assessment routes each person to the *right kind* of care — a therapy session, a group, a workshop, a book circle, self-help, or nettiterapia — not just any open slot.
2. **Reachable for anyone.** A stepped-care ladder, professional groups, demand pooling, and free public services make appropriate help reachable at every budget — including capacity that doesn't exist yet.

These two lines belong at the top of the repo's CLAUDE.md so every build session inherits them.

---

## 1. Tests & questionnaires — the core content layer

**Detail: `reitti-test-catalog.md`.**

- **Three layers, clearly named.** Type 1 "Find your path" (routing/screening → drives value #1). Type 2 "Track your progress" (measurement-based care → serves the treatment/growth journey). Type 3 "Understand yourself" (optional, engaging, non-clinical → top-of-funnel growth, walled off from routing).
- **The ravanfix lesson:** take the engagement insight (people love and share personality/relationship/career tests), but swap every copyrighted or pseudo-scientific instrument (Enneagram, MBTI, NEO-PI-R, 16PF, GHQ) for a free, validated equivalent (IPIP Big Five, O*NET interests, etc.).
- **Quality bar:** every clinical instrument is validated and free/public-domain, uses official wording and cutoffs, and has an official Finnish/Swedish translation. Three instruments carry a `[verify commercial license]` flag to resolve before production.
- **Presentation pattern:** each test shows a one-line human *purpose* always, with an expandable "About this test" holding the scientific detail (what it measures, scoring, validation, licensing) for users — and clinicians — who want depth.

---

## 2. The routing / recommendation engine (value #1, made concrete)

**Detail: `reitti-architecture-v2.md` §4; per-test signals in the catalog.**

> The engine maps **(severity band + primary domain + duration + budget + language + safety flags)** → a suggested ladder rung, plus adjacent rungs shown as "if this feels like too much / not enough." Pure lookup against clinician-approved rules; printable for sign-off.

- Each instrument contributes a defined signal (severity, domain tag, or safety flag). PHQ-9 item 9 and PC-PTSD-5 short-circuit to safety routing.
- Budget and language shift the *suggestion*, never filter care out.
- No diagnosis, ever — a band and tags in, a suggestion out. Every rule is one readable line the clinician signs off.

---

## 3. Reachability (value #2, made concrete)

**Detail: architecture v2 §2–3; groups in the prototype.**

The stepped-care ladder is the spine: self-help → peer/community → nettiterapia → group therapy → short-term individual → Kela. Professional groups, **demand pooling** (form a group when enough people are waiting) and **waitlisting** (a cancellation promotes the next person instead of collapsing the group) are the mechanisms that create and preserve low-cost capacity. Free public services always appear first when clinically sensible.

---

## 4. Backend — what it actually is

**Detail: architecture v2 §5.**

Deliberately minimal, phased:
- **V1:** on-device storage for all client results + a tiny **share-code service** (expiring, encrypted, consent-only, unreadable to Reitti) + **content/config on a CDN**.
- **Phase 2:** a **therapist directory API** (business-listing data, not sensitive, verified against Valvira JulkiTerhikki).
- **Phase 3:** a **consented, opt-in, EU, identity-stripped outcomes store** — the only AI-training substrate.

Its smallness is a feature: cheap to run, easy to defend to HUS.

---

## 5. The AI layer — the standard, correct path

**Detail: architecture v2 §6.**

- **Deterministic core is the source of truth; AI is additive and isolated** behind one interface. If AI is absent or failing, the app works identically on rules alone.
- **Assistance-only:** free-text understanding, plain-language explanations, draft copy. Never a diagnosis, never the routing decision, never the crisis path.
- **Shadow-mode first + eval harness:** the model runs silently and is compared to the rules engine offline; nothing reaches a user until it's proven to agree with clinician-approved rules. Because routing is rules-based, every consented interaction is a labelled training example — the eval set builds itself.
- **Consented data pipeline** keeps privacy and AI compatible: training data comes only from opt-in users, stored separately.
- **AI Act:** a bounded, funded later gate (high-risk deadlines Dec 2027 / Aug 2028), contained because the architecture isolated the AI layer.

---

## 6. PDF result

**Detail: architecture v2 §7.** After any test, generate a printable summary **in the browser from on-device data** — a professional takeaway to print or hand a therapist, with zero new health-data liability. Pairs with the share code (PDF in person, code remote).

---

## 7. Tooling: MCPs, plugins, scaffolding, CLAUDE.md, skills

*(This section previously lived only in chat — captured here so the plan is complete.)*

- **MCPs/plugins for the app itself:** essentially none in V1 (a static web app + a tiny share-code service). MCP matters later, if the Phase-2 AI layer needs to reach external systems.
- **MCPs for building with Claude Code:** a GitHub server (repo/PRs), and later a Postgres/database server once the share-code store exists. Don't over-tool.
- **CLAUDE.md:** create a lean one (<200 lines) at the repo root — Claude Code reads it every session. Hold the two values, the six safety invariants, build/test commands, and "clinical logic lives in config"; **point to** the detailed docs rather than pasting them (a bloated file gets ignored). Auto-memory accumulates build learnings across sessions.
- **Skills:** yes — encode repeatable procedures like "add an instrument config" (with the licensing + no-diagnosis checks) and "add a routing rule," so content work stays safe and consistent.
- **Scaffolding order:** `git init` → lean CLAUDE.md → `docs/` (architecture + catalog) → `config/` (instruments, routing rules — the clinician's governance surface) → `packages/engine` (pure, tested) → the Type-1 flow → minimal share-code service. Full monorepo layout in architecture v2 §9.

---

## 8. Build phases (recap)

- **Phase 1 — V1 routing tool:** engine + Type-1 quick screen + routing + ladder + crisis + on-device store + PDF + minimal share-code + static therapist/group previews. Zero therapists, zero AI, fully useful.
- **Phase 2 — marketplace + first AI assistance:** therapist directory + verification + availability; groups/waitlist/pooling live; shadow-mode AI assistance behind guardrails.
- **Phase 3 — measurement-based care + trained models:** consented outcomes store; Type-2 trends/history; therapist app; model training/eval; AI-Act risk file.

The durable core is built once in Phase 1; everything else is additive, so new findings change a config or a later module — never the foundation.

---

## 9. Open decisions

Web framework; whether Type-3 ships in V1; PHQ-8 vs PHQ-9; the three `[verify commercial license]` instruments; when to open the consented outcomes lane; which AI-assistance feature is worth the AI-Act gate first. (Several are the clinician co-founder's to sign off.)

---

## Document map

- **This file** — the master plan / index.
- **`reitti-architecture-v2.md`** — full technical architecture (front + back + AI path + repo layout).
- **`reitti-test-catalog.md`** — every instrument: purpose, science, licensing, routing signal.
