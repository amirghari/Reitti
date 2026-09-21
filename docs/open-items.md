# Reitti — open items

*The single register of what is not done. Everything here is either waiting on a person who is not
me, or is engineering that was planned and has not been built.*

**Why this file exists.** The same items were scattered across `v2-plan.md` (as unbuilt slices),
`v2-decisions.md` (as sign-off gates), `v2-test-report.md` (as §9 "what is blocked") and, most
recently, an outside review of the live site. Four partial lists is how something falls between
them. This is the one list; the others link here rather than repeating themselves.

**Last reconciled:** 2026-09-21, when MIELI answered: section 1b closed entirely (M1–M4).
extended). Previously 2026-09-18, twice: after the rename to Mielenreitti (B3 closed, B8 opened), and
after finding MIELI closed its English crisis line (M1 revised, C1 now 15 entries, D-21).
Previously 2026-09-17, adding section 1b after the crisis-line audit, and closing E14 when
mielenreitti.fi went live.
Previously 2026-09-15, against the adoption plan (`reitti-adoption-plan.md`).
Previously 2026-09-10, against the outside review of the deployed build.

---

## 1. Blocked on the clinician

Nothing in this section is a coding problem, and it is the whole critical path. Decision D-18 says
so; the engineering has run ahead of it for two weeks.

| # | Item | Source | Notes |
|---|---|---|---|
| C1 | **All 18 directory entries are `clinicianReviewed: false`** | build | Hours and numbers verified against live sources on 2026-09-08; nobody clinical has read them. Four were added 2026-09-18 on the product owner's instruction and verified that day at source: Kirkon keskusteluapu (D-21), Nyyti's groups and Mind Matters course (D-22), and YTHS (D-23) |
| C2 | **Which instrument translations count as `official`**, per instrument per language | D-2 | **Highest-value unblock.** Until this exists, fi/sv redirect the questions to English. In Finland that is the difference between a demo and a product |
| C3 | "Rung 2" means `peer-community`, not ladder level 2 | D-1 | Confirm the reading; eight services hang off it |
| C4 | Age-band boundaries and the under-18 screen copy | D-8 | The wording has to land as a redirection to Sekasin, not a rejection |
| C5 | The R0 age gate and its `final` flag | build | A new clinical rule in the clinician's own table |
| C6 | The `care` / `gated-care` / `route` classification on all 18 entries | D-14 | A judgement about what a service *is* |
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
| E10 | **An embeddable widget** (script or iframe) | adoption plan §3.2 | The plan's strongest technical selling point: no login and results stay on the device, so embedding needs **no data-processing agreement**. That is usually the thing that kills these partnerships. The research's strongest finding reinforces it: Hub of Hope's iFrame became "the foundation for the charity's income-generating signposting partnerships" |
| E11 | A partner page: what Reitti does, what it never does, the privacy architecture, the embed snippet | adoption plan §3.3 | Needed before any organisation can say yes |
| E12 | Aggregate per-placement counters (completions, rung distribution, never content) | adoption plan §3.5 | The proof-of-value data for a pilot. Must hold no health data — same discipline as `pool-counter`. The research asks for **share of sessions in English**, which is one more integer of the same kind (one per interface language, no identifier). Nothing in the app can read it today, by design |
| E13 | DPIA for the share-code service | adoption plan §2.4 | Before it carries any real data. The service is not built yet, so this is not yet urgent |
| E15 | **Terapianavigaattori's `ageRange` says 16; its operators say 18+** | found 2026-09-19 | Suomi.fi: "for adults over 18"; hel.fi: "intended for adults"; DigiFinland: adults 18+, with a separate youth navigator for 13–19. A one-field fix in `config/directory/public.json`, but it is a directory fact on a live entry, so it wants the same verification note as the rest |

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
| B5 | **Recruit a paid clinical reviewer, ~10–20 hours** | adoption plan §1 | The plan reframes this usefully: offer the *smallest* role first. A reviewer engagement, not a co-founder ask. Muzio is Tier 1; Psykologiliitto's public search is the sourcing tool for the rest |
| B6 | Lead institutional pitches with **terapiatakuu** | adoption plan §0, §6.2 | Since 1.5.2025 under-23s must be reached within 28 days, organisers must publish compliance figures, and the Ministry found the data base thin. Reitti produces exactly that structured front-door signal. This is the opening, not "an app for mental health" |
| B7 | Legal opinion on the **employer / occupational-health channel** | adoption plan §5.4 | Deploying triage in an employment context sits closer to work-capability assessment than consumer self-help, and the EU AI Act treats employment differently. Needed *before* signing a pilot, not after |
| B8 | **Native-speaker pass on the Finnish and Swedish brand copy, before any of it goes in an outreach email** | brand, 2026-09-18 | Written by the product owner (FI) and machine-drafted (SV paragraph), reviewed by nobody. The strings are below. The FI paragraph and all three one-liners are the owner's; the **SV paragraph was not supplied and was drafted during the rename**, following the bundles' existing terms (FPA for Kela, `HUS Nettiterapiat` kept as a proper name). Also check the inflected brand inside sentences: *Mielenreitin kanssa*, *Mielenreitin palvelin*, *Käytit Mielenreittiä*, *Mielenreittis server* |
| B9 | **University international-student services**: Helsinki, Aalto, Metropolia, Haaga-Helia | research §4.2, §5 step 4b | The third step-4b email; not sent. Metropolia's is waiting on an address (METKA or Student Wellbeing Services) from the product owner |
| B10 | **One honest post** in r/Finland or one large expat group | research §4.4, §5 step 4c | The story, what it does and does not do, the URL. Answer every reply. Do **not** claim to be the only fi/sv/en front door: Terapianavigaattori is trilingual too |
| B11 | **InfoFinland: a listing request**, separate from the correction already filed | research §4.1 | The stale-number correction (0116) was filed 2026-09-18. Asking to be listed is a different ask to whoever edits the page, and who that is remains unverified |
| B12 | **Tell Kirkon keskusteluapu they are listed** | research §4.5 | Listed 2026-09-18 (D-21); the "then tell them you did" half is not done |
| B13 | **Employer HR for relocated staff** (Wolt, Supercell, Nokia, Kone) | research §4.3 | The occupational-health wedge from the side. B7's legal opinion applies before anything is signed |
| B14 | Lower-ranked channels: **Mielenterveystalo's own listings** via the HUS contact, **Sekasin's Discord** resource list, a **signposting-training** offer | research §4.6–4.8 | None started. Training is Hub of Hope's distribution model and is later chargeable |
| B15 | **Use the Hub of Hope precedent in two places**: one sentence in the clinician pitch (a signposting directory reached national scale without becoming a device), and "signposting partnerships" as a revenue line in the deck | research §3, §5 | Neither written. The revenue line is consistent with "no per-session take-rate, ever" |

**B8, the strings to review.** On the site: the paragraph is `home.lede` in each `config/i18n/ui/*.json`;
the EN one-liner is the meta description in `apps/web/index.html`. The FI and SV one-liners are not
rendered anywhere yet, because `index.html` is static English and the app sets no per-language meta.
They live here for outreach use.

| | One-liner | Paragraph (`home.lede`) |
|---|---|---|
| EN | Mielenreitti shows you what mental-health support exists in Finland, what it costs, and how to reach it. Free, no account, nothing stored. | Mielenreitti is a free directory of mental-health support in Finland, ordered free-first: self-help, peer and community support, HUS Nettiterapiat, groups, short-term therapy, and the Kela path. It shows what each one costs and what is needed to get in. There is no account and nothing is stored. Answers stay on your device. |
| FI | Mielenreitti näyttää, mitä mielenterveystukea Suomessa on, mitä se maksaa ja miten sinne pääsee. Maksuton, ei tiliä, ei tallennettuja tietoja. | Mielenreitti on maksuton hakemisto Suomen mielenterveystuesta, järjestyksessä maksuttomat ensin: omahoito, vertais- ja yhteisötuki, HUS Nettiterapiat, ryhmät, lyhytterapia ja Kelan polku. Se kertoo, mitä kukin maksaa ja mitä sinne pääseminen edellyttää. Ei tiliä eikä tallennettuja tietoja. Vastaukset pysyvät omalla laitteellasi. |
| SV | Mielenreitti visar vilket stöd för psykisk hälsa som finns i Finland, vad det kostar och hur du når det. Gratis, inget konto, inget sparas. | *(drafted, not supplied)* Mielenreitti är en gratis katalog över stöd för psykisk hälsa i Finland, ordnad med det kostnadsfria först: egenvård, kamrat- och gemenskapsstöd, HUS Nettiterapiat, grupper, korttidsterapi och FPA-vägen. Den visar vad varje alternativ kostar och vad som krävs för att komma in. Det finns inget konto och ingenting sparas. Svaren stannar på din enhet. |

Two deliberate departures from the supplied text: the EN and FI paragraphs each had an em dash
before the last clause, which `copy.test.ts` forbids in product copy, so it became a full stop. And
"nothing is stored" sits beside `result.clearData`, "Delete everything Mielenreitti has stored on
this device". The paragraph's next sentence scopes it to the device, but a careful reader can still
see the two side by side. Worth one look from whoever reviews this.

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
| B4: lift `noindex` | **Done 2026-09-21 (D-25)**, on the product owner's decision rather than because §1 closed: the gate said "only after clinical sign-off", and that has not happened. The preview banner stays, and it is now the only thing telling an arriving stranger the content is unreviewed. Preview hosts stay out of the index via a host condition on the header |
| M1–M4: what MIELI wants listed, and which lines are live | **Answered in writing: MIELI ry email, 21.9.2026, Susanna Winter.** 112 first; 09 2525 0111 Finnish 24/7; 09 2525 0112 Swedish Mon and Wed 16–20, Tue, Thu and Fri 9–13. Every other-language line (0113, 0114, 0115, 0116) is closed permanently, so there is no English crisis phone line to list and the panel's 112-then-Finnish order is confirmed as right. 0111 and 0112 are now `verified: true`; the four closed numbers moved from `pendingVerification` to `closedLines`, which is a record, not a queue. D-25 |
| B3: name collision with Pohde's "Reittis" wellbeing portal | Public brand renamed to **Mielenreitti** on 2026-09-18, matching the domain. `Reitti` stays the internal codename (packages, identifiers, repo), which is not public and collides with nothing |
| E14: one stable public URL that never changes | **mielenreitti.fi**, live 2026-09-17, valid certificate, `www` 308s to the apex. `npm run domain:verify` asserts it stays up, canonical and `noindex`. Adoption plan §3.1; also settles the URL half of B3 |
| Repo named Valvira as the licence register | Valvira ceased 31.12.2025. Replaced with JulkiTerhikki throughout, in docs, tests, config and the user-facing copy in all three languages; the authority (LVV, from 1.1.2026) and the provider register (Soteri) are pinned once in `reitti-architecture-v2.md`. Adoption plan §2.6 |

---

## 7. Not accepted

| Raised | Why not |
|---|---|
| "Early-stage / low public footprint; searches turn up little" | That is the configuration, not a defect. `noindex` is set three ways precisely so unreviewed clinical routing is not findable by somebody searching for help |
| "Mobile experience and accessibility of the full flow are untested" | Untested by the reviewer, stated as a product gap. 284 browser tests run on every push across desktop, OS high-contrast, Android and iOS WebKit, with axe on every screen in three languages |
