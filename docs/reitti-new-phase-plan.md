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

## 3. Cross-cutting concerns that scale in V2

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

## 4. Target shape

- **Client app** — web, mobile-first, **no login**, on-device data. Reads the directory and groups
  APIs; generates share codes; optionally sees an AI-explained result.
- **Provider app** — web, **login**, RBAC. Manage listing + availability, view client-shared
  summaries, facilitate groups.
- **Services (all EU):** directory+verification · groups · notifications · share-code ·
  AI-assist (shadow) · consented-outcomes · billing.
- **Unchanged core:** the deterministic engine + config remain the source of truth; client health
  data remains on-device.

---

## 5. Sequencing principle

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

## Build slices (each independently shippable, roughly in order)
5. **Harden the share-code service to production** + complete its DPIA.
6. **Provider identity/auth + therapist directory** (read API, onboarding, JulkiTerhikki
   verification). *Seed supply before demand.*
7. **Availability management** (weekly confirmation, staleness demotion) → flip therapist matching
   from "coming soon" to live.
8. **Groups service** (capacity, waitlist auto-promotion, demand pooling) + **notifications** → flip
   groups live.
9. **Monetization:** stand up therapist SaaS subscription billing; formalize B2B / public contracts.
10. **Consented outcomes pipeline** (opt-in, EU, anonymized) — the AI substrate and eval set.
11. **AI layer in shadow mode:** fill `packages/ai`, run `understand-free-text` + `explain-result`
    behind guardrails, log against the rules engine, build the eval harness. **Nothing user-facing.**
12. **Promote AI from shadow to visible** only after evals show agreement with clinician rules —
    start with `explain-result` (lowest risk, highest engagement).
13. **Optional engagement/precision:** add the validated pictorial mood check (SAM); client-side PDF.
14. **Open the AI Act risk-management file** for the AI component.
15. **Continuous:** observability, DPIAs, and accessibility audits across every new surface.

## V3 horizon (name it, don't build it yet)
16. Train models on the consented dataset; add measurement-based-care history; mature the therapist
    app; expand to comparable Nordic/EU systems.

## The critical path, in one line
**V1 live (1) → clinician sign-off (2) → seed therapists (6) → matching live (7) → groups live (8) →
AI in shadow (11) → AI visible once proven (12).** Everything else supports these; the two hard
gates are 1 and 2 — without them, V2 is premature.
