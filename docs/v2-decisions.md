# Reitti V2 — Decisions this plan had to make

*Phase 0 deliverable. Every decision below is one the kickoff prompt did not settle. Each carries a
recommendation. Nothing here is implemented; the plan gate covers this document too.*

**Legend:** 🩺 needs clinician sign-off · ⚖️ blocked on / affected by the regulatory opinion ·
🔧 engineering call, decidable now.

---

## D-1 🩺 "Rung 2" means `peer-community`, not ladder level 2

**The problem.** The prompt's section D is titled *"Rung 2 — someone to talk to, free, now"* and
lists chat and phone support staffed by crisis workers, trained volunteers and peers. The existing
ladder in `config/ladder/ladder.json` is zero-indexed:

| level | id | |
|---|---|---|
| 0 | `self-help` | |
| 1 | `peer-community` | ← what section D describes |
| 2 | `nettiterapia` | ← what "rung 2" says literally |
| 3 | `group-therapy` | |
| 4 | `short-term-individual` | |
| 5 | `kela-rehabilitative` | |

Read literally, "rung 2" is `nettiterapia` — structured online therapy programmes, which is not what
any of the eight listed services is.

**Recommendation.** Section D's content maps to **`peer-community` (level 1)**, counted the way a
person counts rungs (first, second, third), not the way the array is indexed. Every rung-2 rule in
the prompt reads correctly under this mapping: peer/talking support, not the crisis path, bypassed
by a safety flag.

**Consequence if wrong.** Eight talking-support services would be attached to the nettiterapia rung,
where someone expecting a structured programme would find a chat line. Worth thirty seconds of your
confirmation before S3 runs.

---

## D-2 🩺 Language parity requires splitting the i18n bundle by ownership

**The problem.** C5 demands fi/sv/en at full parity. `CLAUDE.md` says the opposite, deliberately:

> Never hand-translate an instrument. A translated screening item measures something different.
> `config/i18n/fi.json` and `sv.json` stay absent until the official validated translations are
> obtained. English-only is the honest state, not a gap to paper over.

Both are right. The conflict is that one bundle currently holds two kinds of string: product copy
(translatable by any competent translator) and instrument items (translatable only by whoever holds
the official validated translation).

**Recommendation.** Split `config/i18n/` three ways by *ownership*, not by language:

- `ui/` — product copy. Professionally translated into fi/sv. No clinical claim, no sign-off needed
  beyond ordinary review.
- `clinical/` — instrument items, band names, reflections, rung labels. Each language declares
  `translationStatus: "official" | "absent"` per instrument, with a citation. **An instrument whose
  official translation is absent in a language is not offered in that language** — the app says so
  and offers it where the translation is official.
- `directory/` — entry names, hours, cost notes. Names of Finnish organisations are not translated.

This delivers real parity for everything except an instrument we do not have the right translation
for, and it never papers over that gap.

**What you need to confirm.** PHQ-4/PHQ-9/GAD-7 permit translation freely and official Finnish and
Swedish versions exist; WHO-5 has official translations; AUDIT-C has WHO translations; PC-PTSD-5 and
UCLA-3 need checking. **Which of these we may treat as `official` is your call, per instrument, per
language.** S7 does not start until that list exists.

---

## D-3 ⚖️ The fitting-rungs set is presented in ladder order, never recommendation order

**The problem.** B1 removes the single suggested rung and replaces it with "2–3 fitting options".
The rules engine still computes a specific rung. If the UI puts that rung first, or styles it
differently, or names it first in the text, the recommendation is still being made — through
position instead of through words. That is the same regulated act with a thinner disguise.

**Recommendation.** `fittingRungs()` returns the set **sorted ascending by ladder level**, and the
computed rung carries no visual, positional or textual distinction. Invariant 9 asserts the ordering
is strictly ascending, so a later "helpful" reorder fails a test rather than shipping.

**Note.** This does not make the feature certainly out of scope. A set of rungs derived from a
symptom score may still be MDSW under the reading that caught Omaolo and Limbic. The mitigation is
presentation as information about a band plus the B3 scope statement — **and the regulatory opinion
is the thing that actually settles it.**

---

## D-4 🔧 No withdraw endpoint for the demand pool; on-device TTL instead

**The problem.** People who join a waitlist should be able to leave it. The obvious design gives the
client a token the server can use to decrement. That token is a per-person identifier, which turns an
anonymous counter into a pseudonymous store and moves the service inside GDPR's personal-data
perimeter — for a feature nobody asked for.

**Recommendation.** No withdraw endpoint in V2. Interest carries an on-device `expiresAt`; when it
lapses the client simply stops counting itself as waiting, and the server-side count is refreshed
from a re-declaration rather than decremented. The person's "delete everything" control clears the
local record, as it does for everything else.

**Cost, stated honestly.** Counts drift high between expiries. For a threshold whose only job is to
tell a facilitator "there is probably enough demand here", a count that is slightly stale is a much
smaller problem than a per-person token in a health-adjacent database.

---

## D-5 🔧 Say "the server holds counts, not people" — not "no health data leaves the device"

**The problem.** The prompt asks the A3 and C3 data-flow diagrams to prove "no health data or
identifiers leave the device". Identifiers: provably true, and invariant 11 enforces it. Health
data: a person declaring interest in an anxiety group is disclosing something health-adjacent about
themselves, even with no name attached. Claiming otherwise would be the kind of privacy claim that
does not survive its first serious reading.

**Recommendation.** Make the precise claim everywhere — in the docs, in the consent copy, and on the
privacy page:

> Reitti's server holds counts, not people. It never receives your answers, your scores, or anything
> that identifies you or your device. When you put your hand up for a group, one number goes up.

Then enforce it: invariant 11's allowlist means the request body is exactly three enum values, and
the service stores integers rather than rows. The claim is narrower than "no health data" and it is
one we can defend line by line.

---

## D-6 🔧 Outcome counters ship bucket-only — no rung attached

**The problem.** C3's counter is far more useful with the rung attached ("of people pointed at
group therapy, 40% got in"). That is also the version somebody will ask for in the first week.

**Recommendation.** V2 ships **three integers and nothing else.** Rung × bucket is 18 cells; at pilot
volume, a single county, and a network observer who can see request timing, some of those cells will
contain very few people. Aggregate-only is only meaningfully aggregate when the buckets are coarse
and the volume is real.

**When to revisit.** Once the pilot is producing hundreds of submissions per bucket per month, with a
documented minimum cell size below which a cell is not reported at all. Not before, and not as a
quiet schema addition.

---

## D-7 🔧 Directory URL liveness does not block the build; field completeness does

**The problem.** Phase 3 asks that every URL in the registry return 200 and that the build fail if
an entry is incomplete. Combining those into one blocking check means MIELI ry's website being down
for ten minutes stops us from deploying a fix to Reitti — and worse, teaches everyone to bypass a
red check that is usually not our fault.

**Recommendation.** Split them:

- **Field completeness** — offline, deterministic, ours. **Blocks every push and PR.**
- **URL liveness** — scheduled daily, plus on demand, plus once as part of the Phase 3 report.
  Reports; does not block. A dead link opens an issue rather than a deploy freeze.

This is the one place the plan knowingly departs from the prompt's letter, which is why it is here
rather than buried in the CI config.

---

## D-8 🩺 Age is collected as a band, not a number

**The problem.** C4 needs the 18+ boundary and the 12–29 youth-service boundary. A date of birth or
an exact age answers both and collects far more than either needs.

**Recommendation.** One question, three answers — `under-18`, `18-29`, `30+` — plus an explicit
"I'd like youth services" option shown to `18-29`. It answers both boundaries, it is never
transmitted (invariant 11 forbids it), and it is the smallest thing that works.

**Sign-off needed on:** the band boundaries, and the copy on the under-18 screen. Telling a
sixteen-year-old that this service is not for them is a clinical wording problem, not a product one —
it has to land as a redirection to Sekasin, not as a rejection.

---

## D-9 🔧 `RECOMMEND_RUNG` lives in the app layer; the engine never reads it

**The problem.** A flag that changes clinical output could plausibly live in `config/`, in the
engine, or in the build.

**Recommendation.** `config/flags.json` declares the default (`false`) so it is visible on the
governance surface and testable; `apps/web/src/flags.ts` reads it, with a
`VITE_RECOMMEND_RUNG` env override for a future regulated build. **`packages/engine` never reads it**
— `route()` returns the same `RoutingOutput` in both states, and invariant 20 asserts exactly that.
The flag governs *rendering*, not *computation*, which is what makes switching it on later a UI
change rather than a clinical one.

---

## D-10 🩺 The `because` lines stay on screen, reworded

**The problem.** `RoutingOutput.reasons` currently renders under "Why this" — a heading that
describes a recommendation. With `RECOMMEND_RUNG` off there is no "this" to explain.

**Recommendation.** Keep the lines (they are the clinician's own text, and dropping them would make
the result less transparent, not more compliant) and rename the section to **"How these were
chosen"**. The rules that fired explain how the *set* was assembled, which is what actually happened.

**Sign-off needed on** the new heading and lead-in, since they frame text the clinician owns.

---

## D-11 🔧 Verified hours are recorded, unverified hours are not invented

**The problem.** Section D says to verify every hour and number against the live source at build time.
Some of these hours will not be confirmable from the site — MIELI's Swedish line in particular
publishes limited hours that change.

**Recommendation.** Every entry carries `verifiedOn` unconditionally. `hoursRef` resolves either to a
confirmed hours string **or** to "hours change — check the site", with the link. Never a stale hour
presented as current. A person who turns up to a closed line because we displayed last year's hours
is a worse outcome than one who clicks through to check.

---

## D-12 🔧 The private directory ships empty

**The problem.** A1 asks for a registry tagged by sector including private. We have no private
providers and no verification pipeline (JulkiTerhikki is a Phase-2 supply-side build).

**Recommendation.** `config/directory/private.json` ships with the schema and **zero entries.** The
cost band and the sector tag exist so the ladder can honestly say "private therapy typically costs
X" without listing anyone we have not verified. Listing unverified private providers would break the
one thing the directory is for.

---

## D-13 🔧 Baseline test count is 163, not 119

`npm test` on the current tree: **163 tests across 4 files, 70 of them safety invariants.** The
prompt's 119/55 predates recent work. No action needed beyond reading the rule against the real
number — 163 green before every commit, invariant count only ever rising.

---

## D-14 🩺 `gated-care`: a rung labelled free must name somebody

**The problem.** The first version of the care/route split had only two roles, and it produced a
card that argued the wrong thing. Rung 2 rendered as `FREE · REFERRAL` and named nobody; rung 3 as
`LOW COST` and named nobody. Read as a whole, the ladder said free care runs out above peer support.

It does not. **Nettiterapia is real treatment, delivered publicly and free to the patient**, once a
health station or doctor refers you. Classifying it as a `route` because a referral stands in the
way confused the gate with the thing behind the gate. A rung that claims to be free and names nobody
is internally inconsistent, and it reads as an unfinished card rather than as an argument.

**Decision.** A third role, `gated-care`: care that is real and free but reached through a referral.
It is named on the ladder *with the gate stated* — "Free with a referral: HUS Nettiterapiat (ask
your health station)" — rather than either hidden or presented as available today.

This tells the truth in both directions. Free care exists above peer support, and what stands
between a person and it is a referral and a queue. **That is precisely the case for demand pooling,
made concrete instead of implied by a blank space.**

Invariant: every rung whose cost band claims free must name either ungated or gated care.

**Where the gap is genuinely real:** rungs 4 and 5. Short-term individual therapy and Kela
rehabilitative psychotherapy have no free path, and those rows stay bare. Naming something there
would be the same falsehood in the other direction, so a test asserts they remain empty.

---

## D-15 🩺 Public group treatment on rung 3 — flagged, deliberately not added

**The problem.** Rung 3 (group therapy) is labelled `LOW COST` and names nobody. Public group
treatment does exist: **HUS ryhmähoidot**, and the group interventions in the Terapiat etulinjaan
portfolio. Those are free-or-near-free care, not navigators, and they would fill the row honestly.

**Why they are not in the directory.** The V2 brief is explicit: *"Do not add services to rung 2 or
the directory that are not in this prompt without flagging them."* Neither service is named in the
brief. Adding them on my own judgement is exactly the move that rule exists to prevent, and a wrong
entry on a rung is a safety issue rather than a broken link.

**Recommendation.** Add both, once you confirm three things per entry:

1. **Availability is not national.** Group provision varies by wellbeing county, so an entry that
   promises a group in Kainuu because one runs in Uusimaa is worse than an empty row. The entry may
   need a `regions` field, which the schema does not have yet.
2. **The cost band.** "Free with a referral" or a small public health-centre fee changes which
   label the ladder shows.
3. **The role.** Almost certainly `gated-care` rather than `care`, on the same reasoning as D-14.

Until then rung 3 stays bare and the ladder under-claims, which is the correct direction to be wrong
in.

---

## D-16 🔧 Interventionavigaattori is not someone to talk to

It sat on `peer-community`, the rung whose entire meaning is "a person you can talk to". It is a
self-guided navigator used *with* a professional who works with young people, so it is `role:
'route'` and produced no "Free here" line — harmless, but categorically wrong, and it made the
rung-2 print list nine entries when the brief names eight.

**Decision.** Off the peer rung. It stays reachable through the C4 youth handoff, which addresses it
by id rather than by rung, so nothing is lost. `PEER-COMMUNITY` now prints exactly the eight
services the brief names.

---

## D-17 🩺 Therapy-prep is a Type-3 layer serving value #1, not a third core value

**What was proposed.** A section where a person answers self-understanding instruments, saves the
result on-device, and shares it with their therapist to make the session more efficient — floated as
a possible *third* core value.

**Decision.** Keep the **two** core values. This is not a third one; it is the second face of value
#1 ("the right session"): getting a person *into* the right session, and making that session work.
Framing it as a third value would dilute the "if a decision doesn't serve one of these two, it's
out" discipline that keeps the product focused, and would nudge positioning toward the crowded
personality-quiz category Reitti is deliberately distinct from.

Built, when it is built, as a bounded Type-3 layer:

- **Free and validated instruments only.** Relationships: CSI-4/16, the Relationship Assessment
  Scale, or ECR-R. Values: Schwartz PVQ. Personality: a free Big Five (IPIP). 🩺 The clinician
  chooses and frames the final set.
- **Never** MMPI, NEO-PI-R, 16PF, SCL-90, Beck, Millon, DISC (licensed), or Enneagram, MBTI or any
  projective test (not validated). That is precisely the set the Iranian consumer test sites run on,
  and not copying it is the point.
- **Walled off from routing**, like the existing `type: "explore"` instruments. A Type-3 result is
  never a signal `route()` reads and cannot change anybody's care path.
- **On-device, shared through the share-code service**, which is one of the things that service is
  for: an expiring, encrypted, consent-only summary the person chooses to share.

**Status: roadmap, post-launch.** No code, no config, no instrument added. It must not delay the
launch-critical path.

---

## D-18 🔧 What the critical path actually is

Unchanged and prioritised over everything in D-17 and D-19:

1. 🩺 **Clinician sign-off** — unblocks the directory, the FI/SV instrument translations, the
   thresholds, and the regulatory opinion on `RECOMMEND_RUNG`.
2. **A first institutional pilot** (wellbeing county, occupational health, or HUS) — the same
   channel that delivers first users, impact evidence and first revenue.

Therapy-prep, the communication layer, Type-2 tracking and the AI shadow layer are all **downstream
of those two**. Recording it here because the engineering has repeatedly run ahead of the clinical
work, and each new buildable idea makes that gap wider rather than narrower.

---

## D-19 ✅ Publish the decision diagram in the app rather than holding it back

**Question.** Should the routing logic be visible to users, or kept back for presentations as
something confidential?

**Decision. Publish it**, as an optional "How Reitti decides" page. Three reasons:

- **It is not a moat, so hiding it protects nothing.** The instruments are published and free, the
  cutoffs are Kroenke et al.'s public numbers, and `npm run rules:print` already renders the table.
  The moat is the cross-sector directory, the budget-aware ordering and demand pooling, none of
  which the diagram gives away.
- **Transparency *is* the trust claim.** What separates Reitti from an AI-therapy chatbot is that it
  can show the exact line that decided a result. Hiding the logic would quietly concede the one
  thing that makes it not-a-chatbot.
- **The person already sees a slice of it** — the "Why this" line on every result is the `because`
  string of the rule that fired. This page is the same honesty, one level up.

**Shipped 2026-09-10.** Plain language, not the raw rules table. Reachable from the footer on every
screen and from the "How these were chosen" block on the result, which is where somebody reading why
they were routed somewhere is most likely to want the mechanism.

It carries the same provisional banner as the rest: **the mechanism is final, the thresholds and the
wording are not.**

Three things the build changed from the reference mockup, each for a reason:

1. **HTML boxes with SVG connectors, not one SVG drawing.** SVG text does not wrap, and the Finnish
   and Swedish strings are half again as long as the English — an all-SVG version reads correctly in
   one language and overflows in the other two. It also makes the diagram real text rather than
   glyphs in a picture.
2. **Contrast.** The mockup's `#cfddd3` on `#4a6e5a` measures **4.07:1** and fails AA for small
   text; the shipped pairing is `--accent-soft` on `--accent-deep` at **6.52:1**. The mockup's
   `#9a958c` captions on white were 2.97:1 and are now `--muted`. A test asserts the ratio rather
   than the colour, so a future palette change cannot quietly undo it.
3. **Reduced motion is the base case, not a fallback.** The starting (hidden) state lives inside a
   `prefers-reduced-motion: no-preference` query *and* behind a class JavaScript adds on mount. If
   the query does not match, or the script never runs, or `IntersectionObserver` is missing, what
   renders is the finished diagram rather than an empty box.

---

## Summary — what blocks what

| Blocks | Decisions |
|---|---|
| **S3 cannot start** until you confirm | D-1 |
| **S7 cannot start** until you confirm | D-2 |
| **S10 cannot start** until you confirm | D-8 |
| **S2 wording is provisional** pending | D-3, D-10, and the regulatory opinion |
| **Rung 3 stays bare** until you confirm | D-15 (HUS ryhmähoidot, county availability, cost band, role) |
| **The `gated-care` classification** needs | D-14 sign-off, per entry |
| Decidable now, no sign-off needed | D-4, D-5, D-6, D-7, D-9, D-11, D-12, D-13 |
