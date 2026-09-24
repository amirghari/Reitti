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

*Gates only. The full picture of everything outstanding, including the engineering that was planned
and not built and the points raised by the outside review, is in
[`docs/open-items.md`](open-items.md).*

| Blocks | Decisions |
|---|---|
| **S3 cannot start** until you confirm | D-1 |
| **S7 cannot start** until you confirm | D-2 |
| **S10 cannot start** until you confirm | D-8 |
| **S2 wording is provisional** pending | D-3, D-10, and the regulatory opinion |
| **Rung 3 stays bare** until you confirm | D-15 (HUS ryhmähoidot, county availability, cost band, role) |
| **The `gated-care` classification** needs | D-14 sign-off, per entry |
| Decidable now, no sign-off needed | D-4, D-5, D-6, D-7, D-9, D-11, D-12, D-13 |

---

## D-20 🩺 Change the English crisis number, and show nothing we could not source

**Date.** 2026-09-17. **Open items.** M1–M4.

**Question.** The V2 brief permitted exactly one change to the crisis path: adding the Swedish and
English lines by language. An audit of those lines found the English number may be wrong and the
generic hours label actively unsafe. Fix it now, or wait for MIELI to answer?

**What was wrong.**

- **The English line pointed at 09 2525 0113, labelled "English / Arabic".** MIELI's own English
  announcement, dated 12.5.2025, gives 09 2525 0116 for English with different hours. Other MIELI
  pages still describe 0113 as an English line. Their pages contradict each other.
- **Every limited-hours line printed "limited hours, check before calling".** The actual hours are
  public. Somebody in distress at 2am got a number that would not answer and nothing to do next.
  This was the worse of the two bugs, and it was ours, not MIELI's.

**Decision. Fix both now, and treat sourcing as the gate on what renders.**

- English moves to **09 2525 0116** with the hours from MIELI's dated English announcement. Where
  two sources conflict, prefer the one that is in the language being served, is dated, and is itself
  announcing a change.
- **09 2525 0113 is no longer shown at all.** We could not establish from a page we read directly
  what language it serves. A number under an invented language label in a crisis panel is precisely
  the failure this change exists to fix, so it moved to a `pendingVerification` block the component
  never reads. Same for 0114 and 0115.
- **Real hours are printed** from a machine-readable `hours` array, per line, in the interface
  language. An `hours` array may only exist alongside `sourceUrl` and `sourceReadOn` — this extends
  CLAUDE.md's "hours are never invented" from the directory to the crisis path, where it matters
  more, and an invariant now enforces it.
- **No "open now" badge.** It would need the device clock and timezone, which are not ours, and a
  badge reading "open" over a closed line is worse than no badge. Instead a standing line says what
  to do when a line is shut, naming no number, so it survives any sort order.
- **Everything stays `verified: false`** until MIELI confirms in writing. Reading a web page is not
  verification.

**Superseded in part by D-21 (2026-09-18).** The English line D-20 moved to, 09 2525 0116, had
already closed on 23.3.2026. The 12.5.2025 announcement relied on here was replaced by a later one
that D-20 did not find, because it read that announcement and search summaries instead of MIELI's
news index. The sourcing rule below was right; the source was stale.

**Why not wait.** Waiting leaves a likely-wrong number and a definitely-unsafe hours label live
while an email sits unanswered. The brief's restriction on the crisis path exists to stop casual
changes, not to freeze a known defect in place. This is recorded here rather than done quietly
because it exceeds what the brief permitted, and a clinician should see that it happened.

**Needs sign-off on:** the 0116-over-0113 choice, dropping 0113 rather than showing it with a
caveat, and the `crisis.ifClosed` wording in all three languages.

---

## D-21 🩺 No English crisis line exists: lead English readers with 112, and add Kirkon keskusteluapu

**Date.** 2026-09-18. **Open items.** M1 (answered in part), C1.

**What was found.** MIELI closed its English crisis line. Their own news item, "New ways to receive
support in English" (mieli.fi/en/news/new-ways-to-receive-support-in-english/, 24.3.2026): *"MIELI
Crisis Helpline in English is open for the last time on Monday, March 23rd, from 4 pm to 8 pm."*
English support moved to appointment-based chat and phone or video counselling. D-20 had put English
on that number the day before, so the panel offered English speakers a closed line.

**Decision, on the product owner's instruction.**

- **0116 leaves the panel** for `pendingVerification`, with the primary source quoted. It is held
  rather than deleted only until MIELI says what to list for English.
- **An English reader's panel leads with 112**, which answers in English, then the Finnish 24/7 line.
  The panel sorts by the person's chosen support language and, before they have chosen one, by the
  interface language. Previously it did not sort at all until the context step, so an English reader
  opening the panel from the home page got the Finnish line first and 112 last. That was the most
  likely way to arrive in a hurry, and it is now covered by a browser test that fails on the old
  behaviour.
- **A line not answered in the reader's language says so** ("Answered in Finnish."), in the reader's
  language, before they dial. An invariant requires the note on any line that does not answer in all
  three interface languages.

**Not done: MIELI's appointment-based English chat in the crisis panel.** The instruction asked for it
third. It was left out, for three reasons:

1. Invariant 3 forbids it twice: the config test requires every crisis resource to be a phone number,
   and `crisis-path.spec.ts` asserts the dialog never contains the word "chat". CLAUDE.md says a
   failing invariant means the feature is wrong, and never to edit the test to fit.
2. It is not crisis help. MIELI describes it as single-session support for people "feeling anxious,
   overwhelmed, or struggling", booked at least 30 minutes ahead and ideally a day ahead. A person in
   the panel may not have a day.
3. It is already reachable. The directory lists it as `mieli-chat-en` on the talking-support rung,
   verified against the same page on 2026-09-08 and again on 2026-09-18.

If it should be in the panel anyway, that is a change to invariant 3 and needs the clinician, not a
config edit.

**Kirkon keskusteluapu added to the directory.** It was named by the product owner, so it is recorded
here in the way D-15 requires, but it is *added*, not left out. It is Finnish-language talking support
on rung 2 (`peer-community`, `role: care`), anonymous, answered by confidentiality-bound trained
volunteers and church workers. Phone 0400 221 180 daily 18–24; chat Mon–Fri 16–20. Each fact was read
on the church's own page (evl.fi/apua-ja-tukea/kirkon-keskusteluapu/, where kirkonkeskusteluapua.fi
redirects). Two things a reviewer should see:

- **Parish pages disagree on the hours.** They say the line runs to 01, and to 03 on Fridays and
  Saturdays. The church's own page says 18–24, and it wins.
- **The service is free but the call is not.** It is an ordinary mobile number and the operator
  charges it at the caller's usual rate. `costBand` is `free`, and the cost note says this plainly.

**Needs sign-off on:**

- Leading English readers with 112, which is an emergency number, rather than with a talking line.
- The `languageNote` wording in all three languages.
- `mieli-chat-en` staying out of the panel.
- Kirkon keskusteluapu's whole entry, including `whoAnswers: mixed` for "volunteers and church
  workers" and `sector: third-sector` for a public-law church.


---

## D-22 🩺 Add Nyyti, say who it is for, and leave NyytiCoaching out

**Date.** 2026-09-18. **Open items.** C1, C6.

**Why now.** An outreach email told Nyyti ry that Mielenreitti would like to list them. The listing
has to exist and be right before they look.

**Instruction.** Add peer support groups, online courses and NyytiCoaching on rungs 0/1
(`self-help`, `peer-community`), free, for higher-education students, fi/sv/en. Verify everything on
nyyti.fi and flag it NOT CLINICIAN-REVIEWED.

**What nyyti.fi actually says, and what was added.**

- **`nyyti-groups`, on `peer-community`.** The groups are for *"kaikki täysi-ikäiset opiskelijat"*
  (all adult students), with registration in advance. They are free, online, and run in Finnish,
  Swedish and English. So the audience is **adult students**, broader than "higher education" and
  narrower than everyone. Some individual groups are for higher-education students only. On Toivo
  mielessä, *"Ryhmän ohjaajana toimii Nyytin työntekijä"* (a Nyyti staff member leads it); the other
  groups' pages were not each checked.
- **`nyyti-mind-matters`, on `self-help`.** Nyyti's page: *"The course and its materials are
  available to everyone free of charge."* It takes about 2–2.5 hours, can be done in parts, and needs
  no sign-up. **English only as listed:** the site has fi/sv language switches, but no Finnish or
  Swedish version of the course itself could be confirmed. It is open to everyone, so no audience
  line.

**Not added: NyytiCoaching.** Nyyti describes it as *"individual coaching where the coach helps the
student clarify their goals and opportunities"*, about career direction, for students near the end
of higher education, delivered by volunteer professional coaches. That is working-life coaching, not
mental-health support. On a mental-health ladder at rung 0 or 1, it would tell someone struggling
that a career coach is their free support. Recorded and left out, in the way D-15 requires. If the
owner still wants it listed, it needs a place that says what it is. It is not a rung-1 care entry.

**Also not added:** Nyyti's other online courses and its self-tests. Mielenreitti runs its own
validated instruments, and third-party tests beside them would muddy what a result means.
University notices also mention Nyyti *tukikeskustelut* (one-to-one support conversations). They
were not verified on nyyti.fi and not requested, so they are recorded here as the Nyyti service a
reviewer might most want added next.

**New field: `audienceRef`.** The schema had no way to say "for students only", and there were two
wrong places to put it. In a cost note it would be fine print on a fact that decides whether the
service is open to you at all. Left out, a non-student could find out only after registering. So:

- An optional `audienceRef` is rendered on the card above the cost ("For adult students.").
- It is **never a filter.** Mielenreitti does not ask whether you are a student and must not guess.
  The entry stays listed for everyone and says who it is for, consistent with "age is the only
  permitted removal".
- An entry with an audience is **never named as the free option on the home ladder**
  (`isNameableCare`). That line speaks to every reader at once. Before this, what kept Nyyti off it
  was only the order of entries in the file: move the groups above Tukinet and every visitor would
  have been told "free: Nyyti's peer support groups". Invariant 21 now forbids it in every care
  language, and was mutation-checked both ways. The home ladder names exactly what it named before
  this change.

**Needs sign-off on:**

- Both entries.
- `whoAnswers: professional` for the groups, which rests on one group's page.
- The English-only listing of Mind Matters.
- Leaving NyytiCoaching out.
- The `audienceRef` mechanism itself.

---

## D-23 🩺 List YTHS as the student's front door, and say exactly who it is for

**Date.** 2026-09-18. **Open items.** C1, C6.

**Why.** The adoption plan (§4.3) names YTHS as the student route, and the product owner asked for it
in the directory. YTHS is, for eligible students, what `health-station` is for everyone else: the
place they start, where an assessment team decides the care.

**What was added, from yths.fi on 2026-09-18.** One entry, `yths`, in `public.json`:

- **Audience,** printed on the card. The source: *"You can use FSHS services if you are studying for a
  Bachelor's or Master's degree and you have registered as present for the current semester."*
  Doctoral, open-university and non-degree exchange students are excluded. This is the case
  `audienceRef` (D-22) exists for. Most readers are not eligible, and until this field existed the
  only way to find out was after contacting YTHS.
- **Rungs:** `group-therapy` and `short-term-individual` only. Those are the levels the YTHS
  mental-health page says YTHS provides itself (groups, and a psychologist for short-term therapy).
  Nettiterapia and Kela referrals were not claimed, because the page does not say so.
- **Cost:** `free`, with the cost note stating why. There are no per-visit charges, the student
  healthcare fee is paid to Kela, and missing an appointment you did not cancel is charged. **The fee
  amount is not printed.** It changes every year, and sources disagree on whether €70.70 is the 2026
  figure per term or per year.
- **Languages:** fi/sv/en, from YTHS's language strategy: Finnish and Swedish in bilingual areas, and
  *"at least acceptable English"* for others. Groups run mainly in Finnish.
- **Hours:** chat only, Mon–Thu 8–15 and Fri 8–14, which two YTHS pages state. The phone line was
  marked as on *"exceptional opening hours"* the day this was verified. A phone hour printed from that
  would be wrong within weeks, so the card says to check.
- **`role: route`,** matching `health-station`. YTHS is also a provider behind its assessment, so a
  reviewer may reasonably prefer `gated-care`; that belongs in C6. Either way it is never named on the
  home ladder: routes cannot be, and neither can entries with an audience.

**Needs sign-off on:** the entry, the rung mapping, `route` versus `gated-care`, and listing it at all
given how narrow its audience is.

---

## D-24 🩺 An optional rating, and the three places it must never appear

**Date.** 2026-09-21. **Invariants.** 11 (extended), 23 (new).

**What was asked.** An optional 1–5 rating at the bottom of the result, through the existing relay,
sending only the rating, the interface language and the screen. Never on the crisis panel, the
under-18 screen, or in a session where the crisis path has opened. Dismissible, no reply, three
languages.

**What is sent.** Exactly `{ rating, locale, screen }`, built key by key by `ratingBody()` in the
engine, the same way `poolInterestBody()` is. The band, the score, the rung, the instruments and the
answers are never passed in, so they cannot ride along; invariant 11 proves it by passing all of them
in at once and asserting the body still has three keys. The relay validates the same three fields
again and tells a rating from a note by its exact key set, so a body carrying both matches neither
and is a 400. The email it forwards is three lines and holds no IP, timestamp or session.

**Where it may be asked.** `mayAskForRating()` is a list of refusals, not a permission list, so a
screen nobody thought about is silently not asked rather than silently asked. It refuses:

- the crisis panel and the under-18 screen (`FORBIDDEN_SCREENS`, **in code**, which config cannot
  widen: an invariant adds them to `screens` and asserts the answer is still no);
- any session in which the crisis path has opened, however it opened. `App` holds a sticky
  `crisisSeen` flag, set both when an answer trips the crisis item and when somebody reaches for the
  control themselves, and **`reset()` does not clear it**: a person who restarts after a crisis panel
  is the same person on the same afternoon;
- any result carrying a safety flag;
- under-18s.

**Deliberately wider than asked: any safety flag, not only the crisis one.** Trauma and substance
flags do not open the crisis panel, but they are not a moment to ask somebody to rate a web page
either. The cost of over-suppressing is a rating we do not collect.

**Two judgement calls worth a reviewer's eye.**

- **"Above the existing feedback box" could not be honoured literally: the result screen has no
  feedback box.** The form lives on the home page and in the header dialog. The rating sits at the
  bottom of the result, above the print and restart actions. Putting a free-text box on the result
  screen is a separate decision and was not taken here.
- **Dismissal is component state and touches no storage.** It is a "not now" for this visit. A
  `localStorage` key would be one more thing to explain on a page whose claim is that it keeps
  nothing.

**Buttons, not radios.** A radio group moves selection with the arrow keys, and since picking a
number sends it, that would fire a send per keypress.

**Amended the same day: the note box joins it.** The product owner asked for the feedback form on the
result screen, directly under the rating. It renders there as one block, `.result-feedback`, and the
pair is gated by the same call: **both appear together or not at all.**

Suppressing the box alongside the rating on the crisis path takes nothing away, which is why it is
the safer default. The header carries the same form on every screen, including that one, so anybody
who wants to write still can in one click. What it avoids is a free-text box sitting under a
crisis-flagged result, which is precisely the use the copy inside it warns against.

It also fixed a latent bug rather than doubling it. `FeedbackBody` hard-coded `id="feedback-message"`,
and the dialog plus an in-page section can be mounted together: on the home page that was already
possible, and on the result screen it is normal. Two controls sharing one id points the label at
whichever the browser finds first, so somebody using a screen reader types into the box they were not
told about. The id now comes from `useId`, and a browser test opens the dialog over the result and
asserts the two fields have different, non-empty ids.

**Needs sign-off on:** asking for a rating on a result screen at all, the wording in three languages
(the Finnish and Swedish are machine-drafted; B8 applies), the decision to suppress on every safety
flag rather than only on the crisis one, and hiding the note box on the crisis path when the header
still offers it.

---

## D-25 🩺 MIELI answered: two lines verified, four closed, and no English crisis line exists

**Date.** 2026-09-21. **Closes.** M1–M4. **Source.** MIELI ry email, 21.9.2026, Susanna Winter.

**What MIELI said.** 112 first. **09 2525 0111** is Finnish, 24/7. **09 2525 0112** is Swedish, Mon and Wed
16–20, Tue, Thu and Fri 9–13. **Every other-language line is closed permanently**: 0113, 0114, 0115 and
0116.

**What that settles.**

- **The panel's order for English readers is right, not merely cautious.** 112 then the Finnish 24/7 line
  marked "Answered in Finnish." was a holding position taken on 2026-09-18 (D-21) because MIELI's pages
  contradicted each other. It is now the confirmed answer: there is no English crisis phone line in
  Finland run by MIELI, and none is planned.
- **0111 and 0112 are `verified: true`**, the first two in this file that are. The new `confirmedBy` field
  names who said so, and an invariant requires it on anything claiming `verified` other than 112.
  Reading a web page was never verification; this is.
- **The four closed numbers moved from `pendingVerification` to `closedLines`.** A queue implies something
  left to check. There is nothing left to check. They stay on record rather than being deleted because
  third-party pages still list them, InfoFinland included, and the record is what stops one being re-added
  from a stale source later. An invariant asserts none of them is ever rendered.

**The English chat entry.** `mieli-chat-en` now points at mieli.fi/en/support-and-help/ and says plainly
"By appointment, and not always available." Its copy states that MIELI's English crisis phone line closed
in March 2026, that booking goes through Tukinet and needs an anonymous account, and that MIELI says English
replies take longer than Finnish ones. It stays in the directory and out of the crisis panel, because it is
not a crisis line (D-21).

**Tukinet's English page was not added as a separate entry.** It is the same service: MIELI runs the English
chat and email, and tukinet.fi/fi/palvelut/support-in-english is the booking step behind it. Listing it twice
on the same rung would offer somebody two options that are one. The page was read on 2026-09-21 and its
facts are recorded in the entry's note; the entry links to the page MIELI maintains.

**`noindex` lifted on mielenreitti.fi, by the owner's decision.** This was raised as contradicting a gate
written in this repo, *"Lift all three together, and only after clinical sign-off"*, and the owner confirmed
it anyway. Recorded plainly because the gate was real: MIELI confirming the crisis numbers is **not**
clinical sign-off. Still unreviewed by a clinician registered in Finland: all 18 directory entries, the band
thresholds and deep-dive triggers, the R0 age gate, the `role` classifications, and every machine-drafted
Finnish and Swedish clinical string. The regulatory opinion (R1) has not been sought.

**The preview banner stays.** It was not part of the instruction, and it is now the only thing that tells an
arriving stranger the content is provisional. Removing it should be a decision of its own.

**How "production domain only" was implemented.** The three signals cannot be split the same way:

- **The meta tag is gone.** `index.html` is static and served byte-for-byte to every host the deployment
  answers on, so it cannot say one thing on mielenreitti.fi and another on a preview URL. A script that
  injected it per host would make a crawler's view depend on JavaScript, which is a bad thing to depend on
  for this.
- **`robots.txt` is open**, for the same reason, and says so in its own comments.
- **`X-Robots-Tag` carries the distinction**, conditioned on `missing: host = mielenreitti.fi`, so every
  other host — including `reitti-seven.vercel.app`, which still serves this app — stays out of the index.
  It is also the right one to carry it: robots.txt asks a crawler not to *fetch* a page, while
  `X-Robots-Tag` tells it not to *index* one it already has.

`npm run domain:verify` now asserts **both** directions, and the daily job runs it. A real domain that
quietly falls out of the index is as much a failure as a preview host that quietly enters it.

---

## D-26 ⚖️ The clinical sign-off gate is superseded for indexing, and for nothing else

**Date.** 2026-09-21. **Supersedes, in part.** The rule in CLAUDE.md: *"Lift all three together, and only
after clinical sign-off."*

**What changed.** mielenreitti.fi is open to search engines. The decision is the product owner's, taken
with MIELI's written confirmation of the crisis numbers in hand (D-25), and it was raised first as
contradicting the gate above.

**What the gate was protecting, and why indexing was split off it.** The gate bundled two different
risks under one switch. The first is somebody arriving at provisional clinical content with no context.
The second is somebody being told something wrong at the moment it matters most. They are not the same
size, and after D-25 they are not in the same state either:

- **The crisis path is now the best-verified part of the app.** The numbers are confirmed in writing by
  the organisation that answers them. That was the part where being wrong reaches a person directly, and
  it no longer rests on a web page somebody read.
- **The directory half is factual and freshly checked at source**: what exists, what it costs, what gets
  you in. A person searching today is better served by finding it than by not.
- **The screener half is still provisional**, and that is what the banner is for.

**What is superseded: indexing only.** The gate stands, unchanged, for everything else it covered:

| Still gated on clinical sign-off | State |
|---|---|
| Band thresholds and deep-dive triggers | Provisional, unreviewed |
| All 18 directory entries | `clinicianReviewed: false` |
| The R0 age gate and the `care`/`gated-care`/`route` classifications | Unreviewed |
| Every machine-drafted Finnish and Swedish clinical string | Unreviewed, and B8 covers the brand copy |
| **Removing the preview banner** | **Not covered by this decision.** It stays |

The banner matters more now, not less. Before this, an arriving stranger was unlikely; now the banner is
the only thing that tells one the content is provisional. Removing it is a separate decision and needs
its own argument.

**How production-only is enforced.** Three signals, two mechanisms, same direction:

- **The meta tag is gone.** `index.html` is static and byte-identical on every host, so it cannot say one
  thing on the real domain and another on a preview. Injecting it per host with a script would make a
  crawler's view depend on JavaScript, which is a bad thing to depend on here.
- **`robots.txt` is now a function**, `apps/web/api/robots.ts`, reached by a rewrite. It reads the Host
  header: the real domain gets `Allow: /`, everything else gets `Disallow: /`, and **an unrecognised host
  gets `Disallow: /`** because the safe default for a mistake is invisibility. The static
  `public/robots.txt` was deleted, not just edited: a rewrite only fires when the filesystem has no match,
  so leaving the file would have silently kept the old behaviour. Host matching is exact, so
  `mielenreitti.fi.evil.example` is not the real domain; a test asserts that.
- **`X-Robots-Tag`** carries the same split, conditioned on `missing: host = mielenreitti.fi`. It is the
  stronger of the two: robots.txt asks a crawler not to *fetch*, this tells it not to *index*.

`npm run domain:verify` asserts both directions, daily: the real domain open, the other host closed by
header and by robots.txt.

---

## D-27 🔧 Outside review of the live site: the copy half

**Date.** 2026-09-24. **Source.** A reviewer walking the deployed site. The visual notes (type, grid,
button styling, icons) are being handled separately; this records the copy and content decisions.

**Cost notes stop repeating the card.** Every entry card already prints a cost pill, Anonymity, Who you
talk to, Languages, How and When. Fifteen cost notes opened by restating two or three of those, so the
card said "Free" twice and "Anonymous" twice before saying anything new. The note is now only for what
the rows cannot say. `mieli-kriisichat` went from *"Free and anonymous. Always a real person: a crisis
worker or a trained volunteer, never a bot"* to *"Never a bot. There is always a person at the other
end."* The rows already said free, anonymous, and who answers; only the last clause was information.

Nothing factual was dropped. Facts that live nowhere else stayed: the age ranges on Sekasin and Ärligt
talat, which no row carries; the call charge on Kirkon keskusteluapu; the peer-not-professional nuance
on Valoa-chat.

**"Anonymity: Anonymous" was a stutter**, and so were the other three values. The value now answers the
label rather than echoing it: "No name needed", "No real name, but you register first".

**The MIELI English entry led with the wrong fact.** *"Free, and the only English-language support MIELI
still runs: their English crisis phone line closed in March 2026"* made a reader work out what is
available from a sentence about what is not. Now: *"Chat and email only: MIELI closed its English crisis
phone line in March 2026."* What you can use, then why that is all there is.

**"It does not know who has room" was read as confusing.** It was our shorthand. Replaced with the
question a person actually has: *"It cannot tell you how long you will wait."*

**The second question assumed an answer to the first.** *"How long has this been going on?"* has no
referent if you answered "I'm not sure yet" to *"What brings you here?"*, which is the answer most
likely to be true for somebody who has not worked out what is wrong yet. Now *"How long have things
been hard?"*, which stands on its own whatever came before it.

**The visual notes were done too, except the typefaces.**

- **"Open the site" is a button**, bordered in the accent with an arrow glyph, and it carries an
  accessible name rather than repeating four bare words down the page: "Open the site: MIELI
  Kriisichat (opens in a new tab)". The tab change was never announced before, which matters more than
  the contrast did.
- **The fact values are semibold**, so When, Who you talk to and How can be scanned instead of read.
- **Two cards per row wherever two fit.** The first attempt used a 21rem minimum, which never produced
  a second column inside the roughly 680px reading column and so shipped nothing; 18rem gives two
  333px columns. `min(100%, …)` keeps one column on a phone, so the 320px reflow checks are unaffected.
- **The ground was cooled out of the cream family** into the green the product already owns. The
  reviewer's first impression of the live site was that it read as somebody else's brand, and the warm
  paper was the loudest part of that. Contrast was computed, not eyeballed: ink 13.4:1, muted 5.0:1,
  accent 5.2:1 against the new ground, all above 4.5:1, and the axe suite passes on all four device
  projects.
- **The typefaces are untouched.** Changing them means swapping self-hosted `@fontsource` packages,
  and which faces a product wears is a brand decision, not something to slip into a copy pass. That
  half of the note stays with the design work (E16).

**The ladder links a rung only where the rung is one service.** Nettiterapia is HUS Nettiterapiat; Kela
rehabilitative psychotherapy is Kela's. Those two link. Self-help, peer and community support, group
therapy and short-term individual therapy are categories with several providers, and linking one would
pick a winner among services that are all listed below anyway. A rung may never link to a `route`: a
navigator that sends people to a rung is not the care at it, which is D-14's distinction and is now
asserted by invariant 21.
