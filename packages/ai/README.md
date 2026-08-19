# `@reitti/ai` — the AI layer contract

**This package is deliberately empty in V1.** It exports types, a list of forbidden jobs, and a
`nullAssistant` that always declines. That is the whole implementation, and it is the point.

> The deterministic core is the source of truth. AI is additive and isolated.
> If this package is absent, disabled, or failing, **the app must work identically on rules alone.**

Reitti is not another product that says "talk to our AI about your feelings." Scoring and routing
are rules-based and stay that way permanently. This layer exists so that when AI is added, it is
added somewhere it cannot do harm — not so that AI eventually takes over the decisions.

## Safety invariant 5, structurally

> *The AI layer can never override crisis routing, emit a diagnosis, or reorder clinical matches.*

This is enforced by architecture, not by convention:

- **This package cannot import `packages/engine`.** A test enforces it. There is no code path from
  here to a band, a rung, or a routing decision.
- **The interface cannot express a clinical output.** `AssistResponse` is `{ job, text, aiGenerated }`.
  There is no field for a rung, a severity, a band, or a diagnosis, so no implementation can return
  one without changing this contract in a reviewed commit.
- **`AssistRequest.context` never carries raw answers and never carries a crisis context** — only
  what the deterministic core has already decided. Filling the slot in Phase 2 must not widen it.
- **The app never branches on the assistant's presence.** Callers treat `null` as the normal case
  and render the rules-only experience. That is what keeps AI off the critical path rather than
  merely beside it.

## The only three permitted jobs

| Job | What it may do |
|---|---|
| `understand-free-text` | Turn optional free text the person wrote into domain tags the config already knows. Enriches the *inputs* to the deterministic core; never replaces them. |
| `explain-result` | Restate, in plain language, a result the rules engine has already produced. |
| `draft-referral-request` | Draft copy the person may choose to send to a doctor to request a referral. |

And the jobs it may never perform, listed in code as `FORBIDDEN_JOBS`:

```ts
['diagnose', 'route', 'override-crisis', 'reorder-clinical-matches']
```

The crisis path is deterministic and has no AI in it at any point — not as a fallback, not as a
triage step, not as a chat companion. Invariant 3 says the crisis panel shows real 24/7 Finnish
resources: **never a chatbot, never AI.**

## Every output is labelled

`aiGenerated: true` is a required literal on the response type, so an implementation cannot return
AI text that the UI is free to present as the product's own voice. The person always knows which
words came from a model.

This matters most on the result screen, which now shows the routing rules' own `because` lines
under "Why this" — and says plainly: *"These are the rules a clinician approved, quoted as written.
Nothing here was generated for you."* If `explain-result` is ever switched on, that sentence has to
stop being true in exactly one visible, labelled place, and nowhere else.

## Shadow mode first

When the slot is filled in Phase 2, nothing reaches a user immediately:

1. **Shadow mode.** The model runs silently. Its output is logged beside the rules engine's
   decision and compared offline.
2. **Eval harness + golden set.** Because routing is rules-based, every consented interaction is a
   labelled example — the eval set builds itself.
3. **Promotion only on agreement.** Output becomes visible only after evals show it agrees with the
   clinician-approved rules, starting with `explain-result` as the lowest-risk job.

Guardrails at that point: schema-constrained outputs, no diagnosis language, no crisis
interception, prompt and model versioning, no-PII logging, and human review of samples. Phase 2
uses an existing model via API.

## No training until V3

**No model is trained on Reitti data in V1 or V2.** Training requires all of:

- a live product with real usage,
- a **consented, opt-in, EU-hosted, identity-stripped** dataset, stored separately from both the
  on-device client store and the provider plane,
- and clinician-validated rules to evaluate against.

The consented outcomes pipeline is built in V2 to feed the *eval harness* — that is not a training
run.

## EU AI Act

The AI component is a bounded, funded later gate rather than an open-ended risk, precisely because
the architecture isolated it. The risk-management file — documentation, transparency notices,
human-oversight design — opens in V2. Runway: high-risk deadlines December 2027 and August 2028.

## If you are about to change this package

Ask first whether the change widens what AI can decide. Adding a field to `AssistRequest` or
`AssistResponse`, adding a job, or importing anything from `@reitti/engine` are all changes to
invariant 5 and need to be argued as such, not slipped in as a refactor.

Further detail: `docs/reitti-architecture-v2.md` §6, and §3 of `docs/reitti-new-phase-plan.md`.
