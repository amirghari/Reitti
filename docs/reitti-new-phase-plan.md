# Reitti — V2 (Second Version / Phase 2) Architecture Plan

*This plans the product's **second version**, building on the shipped V1 routing tool. It reuses the
architecture in `reitti-architecture-v2.md` and only details the new surfaces V2 introduces.
Clinical specifics remain the clinician co-founder's to sign off.*

---

## 0. What V2 is, in one paragraph

V1 is an on-device, no-login, rules-based routing tool that sends people to services that already
exist, with therapists and groups shown as previews. **V2 turns on the two-sided product and the
first AI assistance:** a real therapist directory with license verification and live availability,
live groups with waitlisting and demand pooling, the AI layer filled in shadow-mode (understand
free text, explain results), the share-code service hardened to production, a consented outcomes
pipeline as the AI substrate, and the aligned monetization surfaces (therapist SaaS,
occupational-health B2B, public contracts). Nothing about the core changes.

**And, before any of that, V2 finishes the client experience** (§3): the result becomes
actionable against services that already exist, the routing rule's `because` line becomes the
person's explanation, and the home page stops arguing the product to three audiences at once.
Most of that needs no backend and is not gated on anything, which is why it is sequenced first.

---

## 1. Invariants carried over from V1 (non-negotiable)

Everything in V2 is additive around these; if a V2 choice conflicts, the invariant wins.

1. The **deterministic engine is the source of truth**; V2 adds no clinical decision-making.
2. **Client questionnaire data stays on-device** by default. Clients remain **accountless** — login
   arrives in V2 only for *providers*, never for clients.
3. The **crisis path stays deterministic**, always reachable, no AI.
4. **Config is the governance surface** — the clinician owns rules; V2 doesn't move them into code.
5. **AI assists, never decides.** `packages/ai` still cannot import `packages/engine`.

---

## 2. New architectural surfaces V2 introduces

### 2.1 Two identity planes (the most important new separation)
V2 introduces accounts — but only on the provider side. Keep two planes that never mix:
- **Client plane:** no accounts, health data on-device/ephemeral. Unchanged from V1.
- **Provider plane:** therapists and org admins get real accounts, auth, and role-based access.
  Their data is *business-listing* data (name, credentials, availability) — standard PII, **not**
  special-category health data.
Architecturally isolate these so client health data and provider business data are never in the
same store or the same trust boundary.

### 2.2 Therapist directory & verification service
- A **read API** that serves listings to the (accountless) client app.
- A **provider write/onboarding** path (self-service + admin review).
- **Valvira JulkiTerhikki verification** at onboarding, so every listed therapist is provably
  licensed. (No bulk-scraping the register — opt-in + verify.)
- **Availability management:** the weekly one-tap confirmation; stale listings are **demoted**, never
  shown as bookable. This is the freshness moat, made real.

### 2.3 Groups service (pooling + waitlist go live)
- Group entities with **capacity, a confirmed roster, and a waitlist**.
- **Auto-promotion on cancellation** + notification, so a cancellation frees a seat instead of
  shrinking the group.
- **Demand pooling:** a group forms when a threshold of N people have joined; "forming" state.
- Participation data is not health data, but it is personal — minimize and consent it.

### 2.4 Notifications service
- Waitlist promotions, pooling thresholds reached, forming-group starts, therapist availability
  nudges. EU provider; **no sensitive content in message bodies** (a nudge to open the app, not a
  disclosure).

### 2.5 AI assistance layer — filled, shadow-first
- Fill `packages/ai` behind its existing interface (still cannot reach the engine).
- Jobs: `understand-free-text` (enrich the routing inputs), `explain-result` (warm result copy),
  `draft-referral-request`.
- **Shadow mode:** the model runs silently, its output logged next to the rules engine's decision
  and compared offline. Nothing is shown to a user until it's proven to agree with clinician rules.
- **Eval harness + golden set** (built largely from consented labelled data — see 2.6).
- **Guardrails:** schema-constrained outputs, no diagnosis language, no crisis interception;
  prompt/model **versioning**; **no-PII logging**; human-in-the-loop review of samples.
- Uses an existing model via API. **No model training in V2** (that's V3).

### 2.6 Consented outcomes pipeline (the AI substrate)
- **Opt-in only**, EU-hosted, **identity-stripped** event store.
- Captures (consented) `inputs → decision → outcome` as labelled data.
- **Separate** from both the client on-device store and the provider plane.
- Feeds the eval harness now; it is *not* a training run yet.

### 2.7 Share-code service → production
- Harden the V1 minimal service: expiring, encrypted with the code as key (unreadable to Reitti),
  consent-only. **DPIA completed** before it carries real data.

### 2.8 Monetization surface (aligned model)
- **Subscription billing** for therapist SaaS (flat, never a per-session take-rate).
- **B2B / public-sector** revenue handled contractually (occupational health, wellbeing counties),
  largely out-of-app.
- **The client always free** — no client payment path exists in the codebase.

### 2.9 Optional product additions (engagement / precision)
- A **validated pictorial mood check** (Self-Assessment Manikin or affect grid) as an engaging,
  language-independent Type-2 tracker.
- **Client-side PDF export** (if not already in V1).
- Defer the Type-3 personality library; at most run **one** validated growth experiment.

---

## 3. The client experience — what V2 owes the person, not the provider

*This section exists because everything above it is a service. An outside review of the
repo put it plainly: the recommendation is currently stronger than the access layer, and
"reachability is the ultimate product, not merely an additional feature." Sections 2.1–2.9
describe the supply side. This one describes what the person actually meets, and it is
sequenced **before** the marketplace because most of it needs no backend at all.*

### 3.1 Reachable options as config — the missing step between preview and marketplace

Today the plan jumps from "static therapist previews" (V1) to a verified directory with
JulkiTerhikki checks, provider onboarding and live availability (2.2). That is a large,
gated, supply-side build. Between them sits something much smaller that delivers value #2
for the first time:

> **A `config/options/` file, keyed by ladder rung, listing services that already exist.**

Mielenterveystalo's nettiterapia, MIELI ry, the kriisikeskus network, Nyyti, Sekasin,
the HUS referral paths, opiskeluterveydenhuolto, public low-threshold services. Each entry
carries a rung, languages, cost band, access route and a link — the same shape as the rest
of the governance surface.

Why this belongs before the marketplace:

- **It needs no backend, no accounts, no onboarding and no clinician recruitment.** It is a
  JSON file in the shape the architecture already blesses, read by the existing engine.
- **It turns a suggestion into an action.** "You should start with structured online
  therapy" becomes "here are three ways to start it this week, and this one is free."
- **It is honest about the gap.** Reitti can point at capacity it does not own long before
  it has any of its own.
- **It de-risks the directory.** The rung → options mapping is the same data shape a
  provider listing will need; building it by hand first is how we learn the schema.

Constraints carried over unchanged: budget and language shift the ordering, never filter a
rung out; free and public options appear first when clinically sensible; every entry is
clinician-reviewed, because a wrong link at a bad moment is a safety issue, not a broken
link.

### 3.2 Surface the `because` line

`config/routing/rules.json` already carries a plain-language `because` on every base rule and
modifier, `Item.because` types it, and `npm run rules:print` renders it for clinician
sign-off. The person on the result screen sees none of it — they get
`matched R-04` in monospace.

**Decision: the clinician's sign-off line and the user's explanation are the same string.**

That single idea does a lot of work. It makes the result a recommendation with reasons
instead of a verdict; it guarantees the explanation can never drift from the rule that
actually fired, because there is only one string; and it means a clinician editing config
is editing what the person reads. It is also nearly built — the audit trail already names
the matched rule and every applied modifier.

Pairs with the reframing the review asked for: "a reasonable place to start", the reasons
underneath, then the existing "if this feels like too much / not enough" pair.

### 3.3 Three audiences, three surfaces

Reitti speaks to three people with different questions:

| Audience  | Their question                                       |
| --------- | ---------------------------------------------------- |
| Person    | "Help me work out where to start."                   |
| Clinician | "Show me your recommendations aren't arbitrary."     |
| Provider  | "Send me people who match what I offer."             |

The V1 home page answers all three at once — its own header comment says it "carries the
argument for the product". That is why it reads as a manifesto to someone who is
struggling.

**IA principle for V2: one surface per audience.** The person's path is minimal and gets
them moving. Clinical transparency stays available but expandable — the existing "About
this test" pattern, extended to the routing rules. The market argument, the ladder
rationale and the provider pitch move to their own pages. Nothing is deleted; it is
addressed to whoever asked for it.

### 3.4 Two language fields, not one

The context step asks which language the person wants *care* in, and the component copy
already explains the distinction ("This is about the care we point you to, not the language
of this page"). The stored model does not: `store.ts` keeps a single `language`.

**Decision: `careLanguage` and `uiLanguage` are separate stored values.** `careLanguage`
feeds routing and provider matching; `uiLanguage` selects the interface bundle. They are
independent — wanting therapy in Finnish while reading the app in English is an ordinary
combination, not an edge case. Conflating them becomes a real bug the moment the validated
FI/SV translations land, which §5 already lists as a V2 requirement.

Until those translations exist, `uiLanguage` has exactly one value, and saying so plainly is
better than implying otherwise.

### 3.5 Session durability and retention

Two decisions that were never written down.

**(a) An in-progress assessment survives a refresh, in `sessionStorage`.** Losing twelve
answers to an accidental reload is a hard exit for someone who took effort to start. But the
draft is deliberately *not* in `localStorage`, where completed results live: a finished
summary is something the person chose to keep and can delete on demand, while a
half-finished set of symptom answers is not — it would outlive the tab on a shared, family
or library device with nobody having decided to keep it. Session storage dies with the tab,
which is the correct lifetime for a draft. An answer that trips a crisis item is never
written to the draft, so a refresh mid-crisis re-asks the item and the crisis path fires
again rather than being swallowed by the restore.

**(b) Completed sessions need a retention policy.** They currently accumulate in
`localStorage` forever with no cap and no expiry. V2 must decide a bound — a session count,
an age limit, or both — and say so where the person can see it, alongside the existing
"delete everything" control. "On-device" is a claim about *where*; retention is the claim
about *how long*, and right now only the first is answered.

### 3.6 Crisis UI hardening

Not new invariants — clearer UI expressions of invariants 1 and 3, both testable:

- **112 first, and visually distinct**, under an explicit framing of immediate danger, so
  the most urgent action is not something the person has to infer from a list of resources.
- **The dialog traps focus and restores it on close.** `aria-modal="true"` is a promise to
  assistive technology, not an implementation of one. Without a trap, Tab walks out of the
  crisis panel and into the questionnaire behind it — the person is answering symptom items
  again while believing they are still in the crisis panel. That is invariant 1 failing in
  the one way `invariants.test.ts` cannot see, which is exactly why the browser suite exists.

### 3.7 Asking the same question once

Brief screeners are built by reusing items from longer ones: PHQ-4 *is* the first two items
of PHQ-9 and the first two of GAD-7, verbatim. So the funnel, working exactly as designed,
asks four of the twenty questions on the PHQ-4 → PHQ-9 → GAD-7 path twice. Being asked
something you just answered reads as not having been heard.

**The mechanism is identity, not similarity.** An item declares a `concept`; two items with
the same concept are the same question. Nothing infers, string-matches or guesses. A carry
happens only when config says the items are interchangeable, and every condition is a
clinical one: same concept, same `recallWindow` (a two-week question is not a one-month
question), an identical response scale option-for-option, and **never** a crisis item —
safety invariant 2 turns on an answer being *given*, so a crisis item is always asked
directly however recently something equivalent was answered.

What was reused is shown to the person, with the answer that was carried, and can be
refused. The engine decides what *may* be reused; the person decides whether it is.

For V2 this generalises in one direction worth naming now: as Type-2 progress tracking
arrives, the same `concept` vocabulary is what lets a WHO-5 answered last month be
recognised as the same measurement answered again — the basis of measurement-based care.
The carry rules deliberately do **not** cross sessions today, because "over the last 2
weeks" answered a month ago is a different measurement, not a reusable one.

### 3.8 UX evidence — what is automated, and what needs a person

§5 currently gives accessibility five words, and gives them to surfaces that do not exist
yet, while the surfaces that do exist have no UX plan at all.

**Automated, in CI:** axe-core across every reachable screen, in four browser projects
including WebKit and real OS high-contrast; the crisis path and safety invariants 1–4 in the
DOM; focus containment and restoration; screen-reader announcement of question changes;
progress-indicator honesty; reflow at 320 CSS px; WCAG text-spacing overrides;
`prefers-reduced-motion`; refresh durability; and no question asked twice. Worth adding as
V2 grows: visual-regression snapshots, a design-token contrast lint so a palette change
cannot silently break contrast, and a **readability gate over `config/i18n`** — a reading
level is a testable property, and someone in distress reads at a lower one.

**Needs a person, and should be scheduled, not hoped for:** a moderated session with people
from the target population; a cognitive walkthrough of the crisis path; a manual
VoiceOver/NVDA pass; and a clinician heuristic review of tone. Automated rules cover roughly
a third of WCAG and none of whether the result lands with warmth.

**Standing prohibition: no session recording, heatmaps, or always-on behavioural
analytics.** The privacy claim is that answers never leave the device, and a replay tool
reconstructs exactly the thing we promised not to collect. Any analytics in V2 is aggregate
and event-count only — never an answer, never a band, and never a rung paired with a domain,
which together are quasi-health data.

### 3.9 Demand pooling deserves its own slice

Pooling is currently a bullet inside the groups service (2.3). It is the most defensible
idea in the product and should be sequenced as its own thing.

A therapist directory inverts nothing: supply exists, and users are matched to it. Pooling
runs the other way — aggregated demand *creates* capacity that did not exist. "Twenty-seven
people in Helsinki are waiting for a low-cost anxiety group" is an offer to a provider, and
it is the one thing a directory competitor cannot copy without the same funnel underneath.

There is an **accountless, V1-compatible version**: a count of interest with no identity
attached. Registering interest in a group that does not exist yet requires a rung, a region
and a language — not a person. That can ship long before the groups service, and it is what
tells us whether pooling works at all.

---

## 4. Repo presentation as a workstream

Not a feature, but it gates every conversation with a clinician, an investor or an
interviewer, and it is currently the weakest surface in the project.

- **There is no `README.md` at the repository root.** The material exists — it is spread
  across four docs totalling ~600 lines. Someone landing on the repo should get the
  30-second version first: what Reitti is, a screenshot of the flow, how routing works, the
  safety invariants, the privacy model, local setup, and the roadmap. The architecture docs
  are what they read *second*.
- **`CLAUDE.md` points at two files that do not exist:** `docs/how-it-works-scenarios.md`
  and `docs/reitti-v2-phase-plan.md` (the real filename is `docs/reitti-new-phase-plan.md`).
  Either write them or fix the references.
- **Positioning has two registers, and they are not interchangeable.** "The access layer for
  Finnish mental health care" is pitch language and belongs on the pages aimed at clinicians,
  providers and investors. The person arriving in difficulty needs the plain version — not
  sure what kind of help you need, here is a reasonable place to start, private, no account,
  no diagnosis. §3.3 is where that split gets enforced.
---

## 5. Cross-cutting concerns that scale in V2

- **Auth & RBAC** for providers and org admins.
- **Observability** (logging, metrics, tracing) with a strict **no-PII** rule.
- **Data protection:** DPIAs for the share-code service, the outcomes store, and the provider plane;
  EU residency; retention/expiry policies; a consent-management surface.
- **CI/CD**, separate staging and production environments, infra-as-code, secrets management.
- **Privacy-respecting analytics** (aggregate, no cross-site identifiers).
- **i18n:** official, clinician-validated **FI/SV instrument translations** are now required for a
  real Finnish launch (English-only was acceptable for the V1 demo, not for V2).
- **Accessibility (WCAG)** across the new provider and group interfaces.
- **AI Act:** open the risk-management file for the (bounded) AI component — documentation,
  transparency notices, human-oversight design. Runway: high-risk deadlines Dec 2027 / Aug 2028.

---

## 6. Target shape

- **Client app** — web, mobile-first, **no login**, on-device data. Reads the directory and groups
  APIs; generates share codes; optionally sees an AI-explained result.
- **Provider app** — web, **login**, RBAC. Manage listing + availability, view client-shared
  summaries, facilitate groups.
- **Services (all EU):** directory+verification · groups · notifications · share-code ·
  AI-assist (shadow) · consented-outcomes · billing.
- **Unchanged core:** the deterministic engine + config remain the source of truth; client health
  data remains on-device.

---

## 7. Sequencing principle

Build the provider/marketplace and the AI as **additive modules around the unchanged V1 core**. The
client routing experience must keep working throughout, and each new service must be able to fail
without breaking routing. Ship V2 as **thin vertical slices**, not a big-bang release.

---

# Steps to take afterwards (sequenced)

## Gate 0 — prerequisites (V2 is meaningless without these)
1. **Ship V1 and get real usage.** V2's marketplace and AI only make sense on top of a live routing
   tool with users. Don't start V2 until V1 is out.
2. **Clinician co-founder onboard + routing rules signed off.** This gates the clinical config *and*
   provides the ground truth the AI is evaluated against.
3. **Official FI/SV instrument translations validated.** Required for a real Finnish launch.
4. **Secure funding / a paid pilot** sufficient to fund the larger V2 build and its compliance work.

## Client slices — before any of the supply-side build (§3)

*These need no backend, no accounts and no clinician recruitment, and every one of them
makes the shipped product better for the person using it today. They are numbered first
because "the recommendation is stronger than the access layer" is the product's largest
current gap, and none of it is gated on Gate 0.*

5. **Make the core journey excellent:** landing → assessment → result, with the home page
   split by audience (§3.3) and the plain-language positioning in front (§4). No new
   features; make the three steps that exist exceptional.
6. **Make the result actionable — `config/options/` (§3.1).** Real Finnish public, free and
   online services keyed by rung. This is the first delivery of value #2 and it unblocks
   nothing else — it just works.
7. **Surface the `because` line (§3.2)** and reframe the result as "a reasonable place to
   start" with its reasons, rather than a verdict.
8. **Client-experience hardening:** two language fields (§3.4), session durability and a
   retention policy (§3.5), crisis UI hardening (§3.6).

## Build slices (each independently shippable, roughly in order)
9. **Harden the share-code service to production** + complete its DPIA.
10. **Provider identity/auth + therapist directory** (read API, onboarding, JulkiTerhikki
   verification). *Seed supply before demand.*
11. **Availability management** (weekly confirmation, staleness demotion) → flip therapist matching
   from "coming soon" to live.
12. **Groups service** (capacity, waitlist auto-promotion, demand pooling) + **notifications** → flip
   groups live.
13. **Monetization:** stand up therapist SaaS subscription billing; formalize B2B / public contracts.
14. **Consented outcomes pipeline** (opt-in, EU, anonymized) — the AI substrate and eval set.
15. **AI layer in shadow mode:** fill `packages/ai`, run `understand-free-text` + `explain-result`
    behind guardrails, log against the rules engine, build the eval harness. **Nothing user-facing.**
16. **Promote AI from shadow to visible** only after evals show agreement with clinician rules —
    start with `explain-result` (lowest risk, highest engagement).
17. **Optional engagement/precision:** add the validated pictorial mood check (SAM); client-side PDF.
18. **Open the AI Act risk-management file** for the AI component.
19. **Continuous:** observability, DPIAs, and accessibility audits across every new surface.

## V3 horizon (name it, don't build it yet)
20. Train models on the consented dataset; add measurement-based-care history; mature the therapist
    app; expand to comparable Nordic/EU systems.

## The critical path, in one line
**Core journey (5) → reachable options (6) → V1 live (1) → clinician sign-off (2) → seed
therapists (10) → matching live (11) → groups live (12) → AI in shadow (15) → AI visible once
proven (16).** Everything else supports these. Slices 5–8 come first because they are not
gated on anything and they are what makes V1 worth shipping; after that the two hard gates
are 1 and 2 — without them, the rest of V2 is premature.

Demand pooling (§3.9) is the one item that can jump the queue: its accountless form — a count
of interest with no identity attached — needs neither the groups service nor provider accounts,
and it is the fastest way to learn whether the mechanism works at all.
