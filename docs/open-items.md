# Reitti — open items

*The single register of what is not done. Everything here is either waiting on a person who is not
me, or is engineering that was planned and has not been built.*

**Why this file exists.** The same items were scattered across `v2-plan.md` (as unbuilt slices),
`v2-decisions.md` (as sign-off gates), `v2-test-report.md` (as §9 "what is blocked") and, most
recently, an outside review of the live site. Four partial lists is how something falls between
them. This is the one list; the others link here rather than repeating themselves.

**Last reconciled:** 2026-09-10, against the review of the deployed build.

---

## 1. Blocked on the clinician

Nothing in this section is a coding problem, and it is the whole critical path. Decision D-18 says
so; the engineering has run ahead of it for two weeks.

| # | Item | Source | Notes |
|---|---|---|---|
| C1 | **All 14 directory entries are `clinicianReviewed: false`** | build | Hours and numbers verified against live sources on 2026-09-08; nobody clinical has read them |
| C2 | **Which instrument translations count as `official`**, per instrument per language | D-2 | **Highest-value unblock.** Until this exists, fi/sv redirect the questions to English. In Finland that is the difference between a demo and a product |
| C3 | "Rung 2" means `peer-community`, not ladder level 2 | D-1 | Confirm the reading; eight services hang off it |
| C4 | Age-band boundaries and the under-18 screen copy | D-8 | The wording has to land as a redirection to Sekasin, not a rejection |
| C5 | The R0 age gate and its `final` flag | build | A new clinical rule in the clinician's own table |
| C6 | The `care` / `gated-care` / `route` classification on all 14 entries | D-14 | A judgement about what a service *is* |
| C7 | Three verification corrections to the brief | test report §5 | Ärligt talat has no phone line, is staffed by licensed professionals, and is 13–29; Valoa-chat is mixed, not purely peer |
| C8 | Group topics and their `formThreshold` values | build | `config/groups/topics.json` |
| C9 | All machine-drafted Finnish and Swedish clinical copy | build | Marked `machine-drafted-needs-clinician-signoff`; needs a native speaker as well |
| C10 | Band thresholds, deep-dive triggers, reflection copy | test catalog | Carried over from V1 and never closed |

---

## 2. Blocked on the regulatory opinion

| # | Item | Source | Notes |
|---|---|---|---|
| R1 | **Whether the fitting-rungs set is itself MDSW** | D-3 | `RECOMMEND_RUNG` is off and the set renders in ascending ladder order so the computed rung cannot leak through position. That is a mitigation, not a guarantee |
| R2 | The scope-statement wording | B3 | A regulatory claim as much as product copy |

---

## 3. Engineering: planned, not done

| # | Item | Source | Why it matters |
|---|---|---|---|
| E1 | **Deploy the pool-counter service** | v2-plan S8 | Written, tested, 12 handler tests, **not deployed**. Demand pooling is the one genuinely unoccupied idea in the product and it exists only in the repo. Needs an EU durable store, `connect-src` widened, and rate limiting that introduces no per-person identifier |
| E2 | **Surface freshness** | review | Every entry carries `verifiedOn` and a daily liveness job runs. Neither is visible, so from outside it looks like there is no update mechanism at all. Cheap to fix |
| E3 | **Publish the cutoffs and the rules table** | D-19, review | "How Reitti decides" names the questionnaires but not their thresholds. A clinician still cannot check our numbers from the site |
| E4 | **A `regions` field on directory entries** | D-15, review | Blocks two things at once: honest regional availability, and adding HUS ryhmähoidot to the group rung |
| E5 | Share-code service | architecture §5 | Never built. Type-3 therapy-prep sharing depends on it |
| E6 | Type-2 progress tracking | architecture §10 | WHO-5 ships as a tracker with nothing to track into |
| E7 | Private provider directory | D-12 | Deliberately empty; needs JulkiTerhikki verification first |
| E8 | Delete the redundant `reitti-v2-preview` Vercel project | build | It contends for the single build slot and has cancelled real deploys of `reitti` |
| E9 | Bump `actions/checkout` and `actions/setup-node` to v5 | CI | Node 20 deprecation warnings on every run |

---

## 4. Raised by the outside review, and valid

Sorted from the review of the live site. Items it raised that were already handled, or that were not
actually criticisms, are in §6.

| # | Item | Status | Notes |
|---|---|---|---|
| V1 | **Explicitly unfinished** | open | The same thing as §1. Every other weakness is downstream of it |
| V2 | **Regional variation, waiting times, non-HUS areas** | partly | Now *admitted* on the page, which is not the same as fixed. Regional availability needs E4; waiting times we genuinely cannot know |
| V3 | **Cannot solve underlying supply** | partly | True and now stated plainly. Demand pooling is the only answer and it is E1 |
| V4 | **No clinical validation or outcome data** | open | The follow-up counter is the seed and is not deployed. See E1, E2 |
| V5 | **Potential for misuse despite warnings** | mitigated, not solved | The strongest mitigation shipped and the review missed it: with `RECOMMEND_RUNG` off there is no single recommendation to over-trust. The banner is the weaker half |
| V6 | **Cutoffs and scoring not inspectable** | open | See E3 |

---

## 5. Business and brand

| # | Item | Source | Notes |
|---|---|---|---|
| B1 | **Contact Muzio** | D-18 | The critical path. Unblocks all of §1 |
| B2 | A first institutional pilot | D-18 | Wellbeing county, occupational health, or HUS. Delivers first users, impact evidence and first revenue together |
| B3 | **Name collision with Pohde's "Reittis" wellbeing portal** | review | The most useful line in an otherwise invalid bullet. A Finnish wellbeing-county portal shares the name, and a wellbeing county is exactly the institutional buyer being pitched. Worth settling before launch |
| B4 | Lift `noindex` | build | Set three ways on purpose. Lift only after §1 closes, together with the preview banner |

---

## 6. Closed, and what closed them

Kept so the same points do not get re-raised as new.

| Item | Closed by |
|---|---|
| The decision logic is not visible | "How Reitti decides", promoted from the footer to the nav |
| The page named 3 of 5 deeper screeners | Derived from config; invariant 22 asserts it stays complete |
| Homepage content-heavy, ~4750px | Market argument behind a disclosure: 4796 → 3342 desktop, 8764 → 6281 mobile |
| Adolescents unhandled | R0 age gate and the Sekasin handoff, asserted over 1,680 input combinations. Was handled but invisible; now stated |
| The Terapianavigaattori consent-code affordance | Returned as one line under the hero |
| The `v2-preview` branch does not exist | Created, pushed, then merged to `main` |
| CI red for days | Lockfile drift after adding a workspace; `npm ci` could not install |

---

## 7. Not accepted

| Raised | Why not |
|---|---|
| "Early-stage / low public footprint; searches turn up little" | That is the configuration, not a defect. `noindex` is set three ways precisely so unreviewed clinical routing is not findable by somebody searching for help |
| "Mobile experience and accessibility of the full flow are untested" | Untested by the reviewer, stated as a product gap. 284 browser tests run on every push across desktop, OS high-contrast, Android and iOS WebKit, with axe on every screen in three languages |
