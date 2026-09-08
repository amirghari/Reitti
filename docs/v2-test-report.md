# Reitti V2 — Test Report

*Phase 3 deliverable. Run against the deployed preview, not localhost.*

**Live URL:** https://reitti-seven.vercel.app — **public production, no login.**
**Deployment target: production, publicly readable, on purpose.** This reverses what an earlier
version of this report said, and the reversal is the single most important line in it.

The history, because it matters: the GitHub integration auto-deployed `main` to production once by
accident. That was caught by this audit, deleted, and guarded against with
`git.deploymentEnabled.main = false` plus an ignored-build-step skipping `main`.

Then two things happened. The product owner asked for the new build to be served at
`reitti-seven.vercel.app`, the pre-existing public URL. And it emerged that the repo-root
`vercel.json` carrying those guards had been **breaking that project's builds since 8 September** —
it hard-coded a build command and output path that suited a different project's root directory, so
`reitti-seven` had been serving a build from 19 August. Fixing that meant removing the overrides,
and the guards went with them.

So the exposure this report first recorded as a mistake is now the deliberate configuration. It was
asked for and it is reasonable — a link for a prospective clinical advisor and for HUS has to be
openable. What it is not is protected: **Vercel Authentication does not cover production
deployments on this plan**, so there is no login to put in front of it and no plan to add one.

What stands in its place, added on 8 September:

- **`noindex` three ways** — a `robots` meta tag, an `X-Robots-Tag` response header, and
  `robots.txt`. Somebody searching for mental-health help should not land here.
- **A dismissible preview banner on every screen**, before the person starts, saying in their own
  language that every question, band and service is provisional and unreviewed, and that the crisis
  help is real regardless.

Neither is a substitute for review. They are what is available when the platform offers no lock.
**Date of run:** 2026-09-08
**Access:** open to anyone with the link, and to anyone who guesses the URL. No bypass token needed
and none available to require.

---

## 1. Summary

| Suite | Result |
|---|---|
| Engine + safety invariants (`npm test`) | **289 passed**, 0 failed |
| Browser suite | **264 passed** locally, **260 passed / 4 skipped** against the deployed preview, 0 failed |
| Accessibility (axe, 3 languages, 4 device profiles) | **0 serious, 0 critical** |
| Directory completeness | **14/14 entries complete** |
| Directory URL liveness | **13/14 return 200** (one non-blocking, below) |
| i18n completeness | **no unresolved refs in fi, sv or en** |
| Privacy audit | **0 outbound requests during a full assessment** |
| `npm run typecheck` | clean |

Baseline moved from **163 tests / 70 invariants** to **289 tests / 142 invariants**. No existing test
was weakened or deleted. The four skips are one test × four browser projects, and the reason is
recorded in §6.

---

## 2. Engine and safety invariants

`npm test` — 272 tests across 7 files.

| File | Tests |
|---|---|
| `packages/engine/test/invariants.test.ts` | 133 |
| `packages/engine/test/scoring.test.ts` | 40 |
| `packages/engine/test/routing.test.ts` | 39 |
| `packages/engine/test/directory.test.ts` | 23 |
| `packages/engine/test/carry.test.ts` | 14 |
| `services/pool-counter/test/handler.test.ts` | 12 |
| `packages/engine/test/pool.test.ts` | 11 |

The fourteen invariants V2 adds, all green:

| # | Invariant | Where |
|---|---|---|
| 7 | Budget never hides a rung — every budget returns a permutation of the full ladder | engine |
| 8 | A safety flag bypasses rung 2 entirely | engine + browser |
| 9 | `RECOMMEND_RUNG` off → no single recommended rung, over all 1,680 input combinations | engine + browser |
| 10 | `ageBand: under-18` never reaches an adult private rung, over all 1,680 combinations | engine + browser |
| 11 | No outbound request carries an answer, score, band, rung or identifier | engine + browser |
| 12 | No filter empties a rung that has entries | engine |
| 13 | A `fallbackOnly` entry never outranks a domestic one, and never renders without its caution | engine + browser |
| 14 | Every directory entry carries hours, language, anonymity, who-answers and `verifiedOn` | engine + build |
| 15 | Every (language × age band) reaches a person | engine |
| 16 | A referral rung never renders without a while-you-wait block | engine + browser |
| 17 | Key-set equality across en/fi/sv per bundle | engine |
| 18 | An instrument without its official translation is never offered in that language | engine |
| 19 | The scope statement is present on every result render | engine + browser |
| 20 | `RECOMMEND_RUNG` never changes what `route()` computes | engine |
| 21 | The free public options are reachable with no assessment, and a route is never named as care | engine + browser |

Two of these are worth calling out because they are structural rather than behavioural:

- **Invariant 20** greps the engine source (comments stripped) for any feature-flag read. The engine
  cannot branch on a flag it has no way to see, so this cannot regress by someone forgetting.
- **Invariant 10** needed a config change to hold. R0 (the age gate) as an ordinary base rule left
  modifier M5 free to prefer a *group* rung for a lonely sixteen-year-old — an adult paid rung. Base
  rules now carry `then.final`, R0 sets it, and the invariant asserts both the flag and the ordering.

### A gap this report originally missed

The first version of this report marked A1 shipped. It was half-shipped, and reviewing the deployed
preview caught it: **the directory rendered correctly but only on the result screen.** The home page
named no service at all. Two consequences:

- Someone who wanted the free option today had to answer ~12 screening questions to be told it was
  Mielenterveystalo omahoito — which needs no login, no referral and no assessment.
- Someone who **already held a Terapianavigaattori consent code** had to complete the whole screener
  to be told they did not need to. That affordance sat behind the exact thing it exists to let you
  skip.

A1 says Terapianavigaattori and Mielenterveystalo are first-class destinations *"at the public entry
point"*. They had been built as first-class destinations at the exit.

The first fix was an `EntryPoints` block on the home page: both services as full cards above the
fold. **That block was removed on the product owner's call.** It was a card grid heavy enough to
dominate the page directly under a hero that had just been rewritten to lead with what Reitti is,
and it pushed the argument down the page to make room for two links.

What survives is the ladder card naming free care per rung, which is the version of "first-class at
the entry point" that costs the page nothing: rung 0 names Mielenterveystalo, rung 1 Tukinet, rung 2
HUS Nettiterapiat with the referral stated. **What was lost with it is the "already have a
Terapianavigaattori code?" affordance** — a person holding a consent code once again has no way to
learn from the home page that they can skip the questions. Worth putting back in a lighter form;
recorded as an open item rather than quietly dropped.

### And a bug the fix introduced, caught before it shipped

Naming "the first free option on each rung" in the ladder card produced
**"Free here: Terapianavigaattori"** beside *Group therapy* and *Short-term individual therapy*, and
**"Interventionavigaattori"** beside peer support. Those are routes *into* care, not care — the card
was announcing free group therapy that does not exist.

The root cause was a modelling gap: `rungs` conflated "is care at this rung" with "is a route into
this rung". Entries now declare `role: 'care' | 'route'`, and only `care` may be named as the free
thing at a rung. The result reads truthfully:

```
0  Self-help and prevention        Free here: Mielenterveystalo self-help programmes   FREE
1  Peer and community support      Free here: Tukinet                                  FREE
2  Nettiterapia (online therapy)   Free with a referral: HUS Nettiterapiat             FREE · REFERRAL
                                   (ask your health station)
3  Group therapy                                                                       LOW COST
4  Short-term individual therapy                                                        YOU PAY
5  Kela rehabilitative psychotherapy                                                    SUBSIDISED
```

**An earlier version of this report drew the wrong conclusion from those blank rows** and said free
care runs out above the peer rung. It does not. Nettiterapia is real public treatment, free to the
patient, waiting behind a referral; classifying it as a `route` confused the gate with the thing
behind the gate, and a rung labelled FREE that names nobody reads as an unfinished card rather than
an argument. Decision D-14 adds `gated-care`, which names it with the gate stated.

Rungs 4 and 5 stay bare, and that part was right: short-term individual therapy and Kela
psychotherapy have no free path, and naming something there would be the same falsehood pointing the
other way. Rung 3 is bare because the directory lacks public group treatment, not because none
exists — see D-15, which flags HUS ryhmähoidot rather than adding it.

---

## 3. End-to-end scenarios, in fi / sv / en

All run against the deployed preview, on desktop, OS high-contrast, Pixel 5 and iPhone 13.

| Scenario | fi | sv | en |
|---|---|---|---|
| Front door: free public options with no assessment, consent-code affordance | ✅ | ✅ | ✅ |
| Mild band → free options first, every rung shows its cost | ✅ | ✅ | ✅ |
| Moderate band → 2–3 fitting rungs, ascending ladder order, no single recommendation | ✅ | ✅ | ✅ |
| PHQ-9 item 9 positive → crisis panel, rung 2 absent, a real phone number | ✅ | ✅ | ✅ |
| Under-18 → youth routing only, no ladder, no cost table, no private rung | ✅ | ✅ | ✅ |
| Budget "free only" → all six rungs still visible, reordered | ✅ | ✅ | ✅ |
| A person to talk to on every result screen, never 7 Cups first | ✅ | ✅ | ✅ |
| Referral rung → while-you-wait and the group waitlist follow it | ✅ | — | — |
| Rung 2 cards name who answers, hours, anonymity, verification date; 7 Cups last with caution | ✅ | — | — |
| Group waitlist → counter increments, body is three enum values | see §6 | | |
| Follow-up reminder is on-device only | ✅ | — | — |
| `careLanguage` and `uiLanguage` stored independently | ✅ | — | — |

**A note on the Finnish and Swedish runs.** They do not reach the questionnaire directly. Because we
hold no official validated Finnish or Swedish translation of any instrument, a non-English run meets
an honest notice first — *"the questions are only in English for now"* — and continues from there.
That notice is itself asserted as a screen: it must appear, resolve its copy, and pass axe. See §7.

---

## 4. Accessibility

`@axe-core/playwright`, WCAG 2.0 A/AA + 2.1 A/AA, on **every screen in all three languages**: home,
the English-only notice, context questions, questionnaire, result, youth result, crisis panel.

**Zero serious violations. Zero critical violations.**

Also green: focus containment in the crisis dialog, live-region announcements, progress-bar
truthfulness, 1.4.10 reflow at 320px and 305px, 1.4.12 text spacing, `prefers-reduced-motion`, and
OS forced-colors mode.

### Two accessibility regressions this work introduced, and fixed

1. **`.ladder-cost` overflowed the viewport at 320px.** Swapping the home-page ladder card to the new
   full cost label ("Kela-subsidised — you pay an omavastuu, typically €20–60 per session") pushed
   page content to 576px against a 320px viewport. Fixed by adding a separate short label
   (`costShortRef`) for compact contexts — different copy, not a truncation, because "Kela-subsidised"
   cut to fit says nothing useful.
2. **The header overflowed once it carried a language switcher.** Fixed by wrapping the header and
   the action group below 30rem.

Both were caught by the existing WCAG suite, not by review.

### The outstanding home-page contrast decision — reported, not fixed

The brief asked for this to be reported separately rather than silently changed, so it is:

> The home page's `--muted` (`#6f6a62`) on `--bg` (`#f6f4f0`) is used for supporting prose at
> 0.82–0.88rem. axe reports no serious violation at the sizes currently shipped, so nothing here is
> failing. The open question is whether the *smallest* muted text (`.option-verified` at 0.72rem,
> `.waitlist-privacy` and `.follow-up-privacy` at 0.78rem) should be darkened for comfortable reading
> rather than bare compliance — the V2 slices added several new uses of muted text at those sizes.
> **No change made.** This is a design decision, and it interacts with the palette rather than being
> local to one rule.

---

## 5. Directory integrity

`npm run directory:verify` — completeness blocks the build; liveness reports. (Decision D-7: a
third-party outage must not freeze a Reitti deploy, and a red check that is usually someone else's
fault teaches everyone to wave it through.)

**Completeness: 14/14 entries pass.** Every entry carries hours, language, anonymity, who-answers,
operator, rungs, url, origin, `role`, an ISO `verifiedOn` and a `verifiedBy`; every ref resolves in all three
languages; no duplicate ids; every `fallbackOnly` entry carries a caution.

**Liveness: 13/14 return 200.**

| Entry | Status |
|---|---|
| terapianavigaattori, mielenterveystalo-omahoito, hus-nettiterapiat, health-station, kela-kuntoutuspsykoterapia, tukinet, mieli-kriisichat, mieli-chat-en, mieli-kristelefonen, arligt-talat, sekasin, valoa-chat, interventionavigaattori | ✅ 200 |
| `7cups` | ⚠️ 403 |

7 Cups returns 403 to automated fetches (bot protection); the URL is fine in a browser. Non-blocking
by design.

### Verification findings — the brief's own table needed correcting

Hours and numbers were checked against the live sources on 2026-09-08. Three corrections:

1. **Ärligt talat has no crisis phone line.** The brief lists it as "chatt + svenskspråkig
   kristelefon". It is **chat only**. The Swedish-language crisis phone is MIELI's Kristelefonen,
   which is listed separately.
2. **Ärligt talat is staffed by licensed professionals**, not "trained" volunteers — psychologists,
   counsellors, sexual-health and eating-disorder specialists — and it is for **ages 13–29**, not
   adults generally.
3. **Valoa-chat is mixed, not purely peer.** Specialist advice runs weekdays 12–15; volunteers with
   lived experience run Wednesday and Thursday evenings 18–20. `whoAnswers` is `mixed` and the hours
   string says which is which, because the peer option is the reason it is listed at all.

Verified hours now shipping: MIELI Kristelefonen Mon/Wed 16–20, Tue/Thu/Fri 9–13 · Ärligt talat
Mon–Fri 9–12 and 19–22 · Sekasin Mon–Fri 9–24, Sat–Sun 15–24 · Valoa-chat as above.

Where a source could not be read (Sekasin and 7 Cups block automated fetches), the entry carries the
honest fallback — *"hours change — check the site"* — rather than an invented hour. **All 14 entries
are `clinicianReviewed: false` and print with a warning.**

---

## 6. Privacy audit

The claim under test, as it is stated to the person:

> Reitti's server holds counts, not people. It never receives your answers, your scores, or anything
> that identifies you or your device.

**A full assessment on the deployed preview makes 11 requests. All 11 are same-origin.** No request
bodies, no cookie headers, no authorization headers. Full log attached at
[`docs/evidence/network-request-log.json`](evidence/network-request-log.json).

```
GET  document    /                                    ← the page
GET  script      /assets/index-*.js                   ← the app
GET  stylesheet  /assets/index-*.css
GET  font        /assets/public-sans-*  ×3            ← self-hosted, per the no-CDN rule
GET  font        /assets/newsreader-*   ×2
GET  font        /assets/ibm-plex-mono-* ×2
```

### A real finding: Vercel injected a third-party script into the preview

The first deployed run failed the audit with three outbound requests to
`https://vercel.live/_next-live/feedback/feedback.js` — Vercel's preview feedback toolbar, injected
into the deployment, loading on every page view.

This is exactly what `CLAUDE.md` forbids: *"No fonts, scripts or assets from a CDN. The privacy claim
is that answers never leave the device; a font request that leaks an IP on every page load undercuts
it."* Our own CSP (`script-src 'self'`) would have blocked execution, but the request was still made.

**Fixed** by disabling `enablePreviewFeedback` and `enableProductionFeedback` on the Vercel project
and redeploying. The audit now reports zero outbound requests. Worth knowing that this is a platform
default that has to be actively turned off, and that it would have come back silently on a new
project.

### Response headers on the deployment

```
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
                         font-src 'self'; img-src 'self' data:; connect-src 'self';
                         form-action 'none'; frame-ancestors 'none'; base-uri 'self'
referrer-policy: no-referrer
x-content-type-options: nosniff
x-frame-options: DENY
permissions-policy: geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()
```

⚠️ **`connect-src 'self'` will block the pool-counter service when it is deployed.** Enabling demand
pooling means adding that origin to `connect-src` in `vercel.json`. Deliberately not pre-authorised.

### The four skipped tests

One test — *"the pool request is exactly three enum values, with no credentials"* — skips on the
deployed preview across all four browser projects, because **no counter service is deployed and
pooling is therefore off** (`data-pooling="off"`). That is correct behaviour, not a gap: the feature
degrades to read-only rather than offering a button that cannot work.

The assertion **does** run locally, where the suite sets `VITE_POOL_COUNTER_URL`, and it passes:
the intercepted request body is exactly `{topicId, region, careLanguage}`, all three values are
config enums, and there is no cookie, authorization or device header. The service side is covered by
12 handler tests, including that an extra key is a 400 rather than a silently-ignored field.

### Also verified

- The follow-up reminder is a date in `localStorage` and produces **zero** network traffic — no push
  token, no subscription, no endpoint that knows a reminder exists.
- "Delete everything Reitti has stored on this device" clears **every** `reitti.*` key, including the
  waitlist and the follow-up state.

---

## 7. i18n completeness

No unresolved refs on any screen in any language. This is checked by walking every screen in fi, sv
and en and failing on anything ref-shaped in the rendered text.

The design that makes this checkable: **`t()` returns the ref itself when a key is missing**, never
an English fallback. A silent English fallback is a bug that looks like a translation, and looking
like a translation is how it survives to production.

Key counts, all equal across languages: `ui` 203, `directory` 80, `clinical` 139 (en) / 51 (fi, sv).

**The clinical gap is deliberate and is the single biggest open item in V2.** `clinical/fi.json` and
`clinical/sv.json` contain rung labels, band reflections and crisis copy — but **no instrument items
and no response scales**, and they declare `translationStatus: "absent"` for all seven instruments.
A hand-translated screening item measures something different, so the questionnaire is not offered in
a language whose official validated translation we do not hold.

What that means in practice today: **the Finnish and Swedish apps are complete except for the
questions themselves.** The directory, the ladder, the cost labels, the human option, the youth
handoff and the crisis path are all fully translated and fully usable. The assessment redirects to
English with an explanation.

---

## 8. The gap that is the actual risk

**The engineering is ahead of the clinical and regulatory work, and that is the thing to worry
about.** Not one of the following is a coding problem, and every one of them is on the critical path:

| | |
|---|---|
| All 14 directory entries | `clinicianReviewed: false` |
| Instrument translations (D-2) | none official; fi/sv redirect the questions to English |
| D-1, D-8, R0 age rule, `role` classifications | unsigned |
| All machine-drafted fi/sv clinical copy | unsigned, and needs a native speaker too |
| Regulatory opinion on the fitting-rungs set | not sought |
| Demand pooling | written, tested, **not deployed** — the one unoccupied feature exists in the repo and not in the product |

D-2 is the highest-value unblock and it runs through a clinician. In Finland, an assessment whose
questions are English-only is the difference between a demo and a product.

Demand pooling is second, and it is engineering: an EU-hosted durable store, `connect-src` widened
to the counter origin, and rate limiting that does not introduce a per-person identifier. Until then
the deployed app runs with `data-pooling="off"` and the differentiator is invisible to anyone
opening the link.

---

## 9. What is blocked, and on whom

### Blocked on clinician sign-off — nothing here is done

- **Every one of the 14 directory entries** (`clinicianReviewed: false` on all of them).
- **D-1 — "rung 2" means `peer-community`.** Section D's content is attached to the second rung as a
  person counts them (`level: 1`), not to `nettiterapia` (`level: 2`). If that reading is wrong,
  eight chat lines are on the wrong rung.
- **D-2 — which instrument translations count as `official`**, per instrument, per language. Until
  that list exists, fi/sv ship with the assessment redirecting to English. PHQ-4/PHQ-9/GAD-7 permit
  translation freely and official Finnish and Swedish versions are believed to exist; WHO-5 and
  AUDIT-C likewise; PC-PTSD-5 and UCLA-3 need checking. **This is the highest-value unblock in V2.**
- **D-8 — the age-band boundaries and the under-18 screen copy.** Telling a sixteen-year-old this
  service is not for them is a clinical wording problem. It has to land as a redirection to Sekasin,
  not a rejection.
- **The three verification corrections in §5** (Ärligt talat has no phone line and is staffed by
  professionals aged 13–29; Valoa-chat is mixed).
- **The R0 age-gate rule and its `final` flag** — a new clinical rule in the clinician's table.
- **The `role: 'care' | 'gated-care' | 'route'` classification on all 14 entries** — a judgement
  about what a service *is*, which is yours rather than mine.
- **Whether the Terapianavigaattori consent-code affordance returns**, and where. It went with the
  entry-points block; a person holding a code currently cannot learn from the home page that they
  do not need to answer anything.
- **Group topics and their `formThreshold` values** in `config/groups/topics.json`.
- **All new band, rung and crisis copy in Finnish and Swedish.** Machine-drafted during the build and
  marked `_reviewStatus: machine-drafted-needs-native-review` / `...-needs-clinician-signoff` in every
  bundle. They need a native speaker as well as a clinician.

### Blocked on the regulatory opinion

- **Whether the fitting-rungs set is itself MDSW.** `RECOMMEND_RUNG` is off and the set renders in
  ascending ladder order so the computed rung cannot leak through position (D-3). That is a
  mitigation, not a guarantee: a set derived from a symptom score may still read as a device under
  the reading that caught Omaolo and Limbic. The flag means switching to the regulated presentation
  is a UI change, not a rewrite.
- **The scope statement wording** (B3), which is a regulatory claim as much as product copy.

### Blocked on infrastructure decisions

- **The pool-counter service is not deployed.** It is written, tested and documented, with an
  in-memory store behind a `CounterStore` interface; production needs an EU-hosted durable store and
  `connect-src` widened. It also needs **rate limiting** before facing the public internet — a
  counter anyone can increment is a counter anyone can forge — and the mitigation has to arrive
  without introducing a per-person identifier.
- **The `v2-preview` git branch does not exist.** This deployment was made from the working tree via
  the Vercel CLI. Committing and pushing is yours.

---

## 10. What was not done

- No AI component, chatbot or free-text interpretation. `packages/ai` is untouched.
- No production deploy.
- No new instrument, threshold or reflection beyond the catalog.
- No change to the crisis path. The Swedish and English crisis lines the brief asked for **already
  existed** in `config/crisis.json`; this work re-verified the Swedish number and its hours and
  changed nothing else.
- No service added to rung 2 or the directory beyond the ones named in the brief.
- No single automated suggested rung on any consumer screen.
