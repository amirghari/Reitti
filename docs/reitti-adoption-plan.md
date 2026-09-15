# Reitti — Adoption & Promotion Plan

**Status:** working plan, v1 · September 2026
**Owner:** Amir Ghari
**Rule for this document:** every step has a named target, a named action, and a way to
tell whether it worked. Nothing here is a slogan.

> **Note on the contact line in §1.4.** This repository is public, so the email address is
> a placeholder rather than the real one. Fill it in when you send. The address was
> deliberately removed from the live site for the same reason: a mail address on a public
> page is published permanently to every scraper that passes.

---

## 0. Read this first

Three honest constraints shape everything below.

1. **The client is free and there is no per-session take-rate.** There is no consumer
   lifetime value, so you cannot buy users. Every user has to arrive through a channel
   that is free, earned, or institutional.
2. **You cannot deploy into any institution without a clinician.** Not a nice-to-have.
   A wellbeing services county, an occupational-health provider or a university will ask
   "who signed off the clinical logic" in the first meeting. If the answer is "a software
   engineer", the conversation ends there.
3. **The biggest single tailwind is the therapy guarantee (terapiatakuu).** Since
   1 May 2025, under-23s must reach certain primary-care mental-health services within
   28 days of the need being identified (30 days in social care). The Ministry's spring
   2026 interim review found it is mostly being met, but that the weak data base makes it
   hard to evaluate; the full report is due to the Social Affairs and Health Committee by
   1 May 2027. Service organisers have to publish their compliance figures.
   **This is Reitti's opening.** Reitti is a structured, pre-visit triage instrument that
   produces exactly the kind of consistent, recordable signal that makes the 28-day clock
   easier to manage and to report. Lead with that, not with "an app for mental health".

**Do not** start with consumer marketing. HUS's Mielenterveystalo already reports over
4 million visitors a year, with institutional search authority you will not beat, and
mental-health paid advertising is restricted on the major platforms anyway.

---

## Priority order at a glance

| # | Step | Blocking? | Rough window |
|---|------|-----------|--------------|
| 1 | Recruit the clinician | **Yes — blocks 3–7** | Weeks 1–8 |
| 2 | Close the content gates (translations, disclaimers, DPIA) | **Yes — blocks 5–7** | Weeks 2–12 |
| 3 | Build the embed (Reitti as a component, not a site) | No | Weeks 4–10 |
| 4 | Trust layer: NGO and student links | No | Weeks 6–16 |
| 5 | First paid pilot: occupational health or one employer | No | Months 3–8 |
| 6 | Public sector: counties, HUS, terapiatakuu framing | No | Months 3–18 |
| 7 | Funding | No | Months 2–10 |

---

## STEP 1 — Recruit the clinician (do this first, this week)

You asked for a list of named psychologists to email. I won't invent one — a fabricated
list of names and addresses would waste your time and could damage your reputation with
exactly the people you need. What follows is better: the real, public sources the list is
built from, and the order to work through them.

### 1.1 What you are actually recruiting

Be precise in every email, because "co-founder" scares people off and "advisor" gets
ignored. There are three distinct roles and you should offer the smallest one first:

- **Clinical reviewer (paid, ~10–20 hours).** Reads the routing rules, the instrument
  set and the crisis path; signs or refuses each. This is the minimum to unblock Steps
  5–7.
- **Clinical advisor (ongoing, small equity or retainer).** Owns the clinical config;
  is named publicly as the person who stands behind the content.
- **Clinician co-founder (equity, real commitment).** Only raise this after a reviewer
  engagement has gone well. Nobody says yes to this cold.

### 1.2 Where the names actually come from — in priority order

**Tier 1 — the warm one you already have.**
Emiliano Muzio, PhD (psychologist and licensed psychotherapist, Helsinki; Kela and HUS
service provider; co-founder of Terapiatalo Sointu; works in Finnish, English, French and
Italian; contact via the form at muzio.net). He fits the reviewer profile well — assessment
is literally his specialism. **Email him in week 1.** One person, one tailored message.

**Tier 2 — institutional routes that carry credibility.**

- **Suomen Psykologiliitto (Finnish Psychological Association)** — psyli.fi, office at
  Bulevardi 30 B 3, 00120 Helsinki. Around 8,300–8,400 members; over 85% of Finnish
  psychologists belong. It runs a public psychologist search (*psykologihaku*) with wide
  filters — this is your primary sourcing tool for individual names, and it is public and
  consented, unlike scraping. It also has **18 regional member associations**; the
  Helsinki-area one is the right entry point for a talk or a newsletter mention.
- **University psychology departments.** Psychologists are trained at seven universities:
  Jyväskylä, Helsinki, Itä-Suomi, Turku, Tampere, Oulu and Åbo Akademi. Target clinical
  psychology professors and senior lecturers; their contact details are public on
  department pages. An academic reviewer brings more institutional weight than a
  practitioner, and some will take it on as supervision or a thesis topic.
- **Terapiat etulinjaan** (terapiatetulinjaan.fi) — the national front-line therapies
  programme. Its people are the exact population thinking about triage and stepped care
  all day. Reitti should be positioned as complementary to it, never as a replacement.
- **Kela's rehabilitation service-provider search** (kela.fi/hae-palveluntuottajaa) —
  lists Kela rehabilitative-psychotherapy providers. Note the register moved to a new
  search service at the end of 2025 and gains psychotherapist-specific features during
  2026; also note that not every Kela-approved therapist opts in, so it is not complete.
- **JulkiTerhikki — now at julkiterhikki.lvv.fi.** Important correction for your repo:
  **Valvira ceased to exist on 31 December 2025.** Its duties moved to the new
  **Lupa- ja valvontavirasto (LVV)** on 1 January 2026, and the provider register is
  **Soteri**. `docs/` and `CLAUDE.md` still say "Valvira JulkiTerhikki" — fix that before
  any investor or county reads them. Use the register to *verify* a licence, never to
  bulk-harvest contacts.

**Tier 3 — organisations that employ many clinicians at once.**
Private therapy houses and chains in the Helsinki region (Terapiatalo Sointu, Mehiläinen,
Terveystalo, Pihlajalinna, Heltti and the smaller independent *terapiatalot*). One
conversation with a clinical director beats twenty cold emails to individuals.

### 1.3 How to build the shortlist (2–3 hours of work)

1. Open the Psykologiliitto psychologist search. Filter for the Helsinki/Uusimaa region
   and for anyone whose listed specialism touches assessment, brief interventions,
   digital services, young people, or occupational psychology.
2. Take **25 names maximum.** More is worse — you cannot follow up on 100.
3. Add 5 academics from the seven departments above and 3 clinical directors from Tier 3.
4. Put them in a simple sheet: name, role, organisation, why them (one line), public
   contact route, date contacted, reply, next action.
5. Only ever use publicly published professional contact details. Do not scrape, do not
   buy lists, do not use a private register to derive an email address.

### 1.4 The email

Send individually. Never a mass mail-out. Subject lines that work: specific, low-demand.

> **Subject:** Clinical review of a non-diagnostic routing tool (paid, ~10 hours)
>
> Hi [Name],
>
> I'm a Helsinki software engineer building Reitti, a free tool that helps someone work
> out *what kind* of mental-health support fits their situation — self-help, a group,
> guided online therapy, short-term individual therapy, or the Kela path — and points
> them to what's actually reachable. It uses free, validated instruments (PHQ-4, GAD-7,
> PHQ-9, WHO-5 and similar). It does not diagnose, does not label, and routes any crisis
> answer straight to MIELI ry and 112, deterministically.
>
> The routing logic is rules-based and printable — one readable line per rule. I need a
> clinician to read it and either sign it off or tell me what's wrong with it. Everything
> in the product is marked "not clinician-reviewed" until someone does.
>
> This is a paid engagement, roughly 10–20 hours, and I'd be glad to discuss it being
> ongoing if it's a fit. I found you via [specific, honest source] and thought of you
> because [one specific reason].
>
> Would a 30-minute call be possible? I can send the rule set in advance.
>
> Amir Ghari — amirghari.com · [your email]

Four notes on this template:
- The **crisis path and the "no diagnosis" line go in the first paragraph.** That is what
  a clinician is scanning for. If they don't see it, they assume the worst.
- **"Paid" is what separates you from the dozens of students asking for free advice.**
- **Never attach the app.** Offer the rule set. Clinicians read rules, not marketing.
- **One specific reason per email.** If you can't write one, drop that name.

### 1.5 Follow-up discipline

One follow-up after 7–10 days, one line, no guilt. Then stop. Log everything in the sheet.

### 1.6 What "done" looks like

25–35 contacted → 5–8 replies → 2–3 calls → **1 signed paid review engagement.**
If you get zero replies from 30 well-targeted emails, the problem is the pitch, not the
list. Rewrite the first paragraph and try 15 more.

---

## STEP 2 — Close the content gates

These are unglamorous and they block every institutional channel.

- **2.1 Official FI/SV instrument translations.** Never hand-translate. Track down the
  published official Finnish and Swedish versions of each instrument and record the
  source and licence for each one in the test catalogue. Flag anything where the licence
  is unclear and leave it out until it is resolved.
- **2.2 Clinician sign-off pass.** Walk the reviewer through the rules, the instruments,
  the directory entries and the crisis copy. Record a dated sign-off per item. Remove the
  "NOT CLINICIAN-REVIEWED" flags only as each one is actually signed.
- **2.3 The "not a medical device / guidance, not diagnosis" line.** Have it written the
  same way everywhere: the app, the docs, the pitch deck, the website. Inconsistency here
  is what makes a regulator or a county lawyer nervous.
- **2.4 DPIA for the share-code service** before it carries any real data.
- **2.5 Accessibility (WCAG).** Public-sector buyers in Finland will check this. It is
  cheaper to do now than to retrofit.
- **2.6 Fix the stale register names in the repo** (Valvira → LVV; JulkiTerhikki now at
  julkiterhikki.lvv.fi; provider register Soteri).

---

## STEP 3 — Turn Reitti into a component

Today Reitti is a website. A website has to win attention. A component gets placed.

- **3.1 One stable public URL** that never changes and can be linked from anywhere.
- **3.2 An embeddable widget** — a small script or iframe any organisation can drop into
  its own page. Because there is no login and results stay on the device, embedding
  requires **no data-processing agreement**, which is normally the thing that kills these
  partnerships. Say that explicitly in the sales conversation; it is your strongest
  technical selling point.
- **3.3 A partner page** at reitti.\* with: what Reitti does, what it never does, the
  privacy architecture in five lines, the embed snippet, and a contact address.
- **3.4 Optional co-branding** — partner logo in the widget header. Costs you an hour,
  removes a common objection.
- **3.5 Aggregate, privacy-respecting counters** per placement (completions, rung
  distribution — never content). You need this to prove value later, and it has to be
  designed so it holds no health data.

---

## STEP 4 — The trust layer (NGOs and students)

This produces credibility more than traffic. Do it anyway, because Steps 5 and 6 are
impossible without it.

- **4.1 Understand the state of the sector before you ask.** Government grants to social
  and health NGOs are being cut sharply — roughly a 30% level cut for next year, with the
  total halving over this government term. MIELI ry opened change negotiations in August
  2026 that could affect up to 20 of its roughly 160 staff, with crisis work, the
  Sekasin chat and Rikosuhripäivystys excluded. **So do not approach them for money,
  effort or a co-development project.** Approach with something that costs them nothing
  and reduces their load: a free tool their callers can be pointed to. Frame it that way
  explicitly.
- **4.2 Targets:** MIELI ry and its local crisis-centre network, Tukinet, Nyyti ry,
  Mieli's Sekasin collective, Ärligt talat and the Swedish-language services already in
  your rung-2 directory. You are *already* sending people to them — say so. You are a
  referrer to them, not a competitor.
- **4.3 Students.** YTHS serves an average of roughly 301,000 enrolled higher-education
  students (2024), of whom about 41% used general or mental-health services. The therapy
  guarantee also applies to student healthcare. Route: student unions (HYY, AYY, Metropolia's
  METKA and the other AMK unions) first — they move far faster than YTHS itself and their
  wellbeing officers are actively looking for things to recommend.
- **4.4 Your own alumni route.** Metropolia. A student-union newsletter mention or a
  wellbeing-week stand is a real, cheap first placement.
- **4.5 Success measure:** 5–10 live inbound links or embeds from named organisations.
  This is your reference list for Step 5.

---

## STEP 5 — The first paid pilot (occupational health or one employer)

This is where the numbers are. In 2024, employer-arranged occupational health covered
about **2.09 million employees — 92% of Finnish wage earners**, with private medical
centres providing the service for 1.9 million of them. Employers spent €1,277 million,
and Kela reimbursed €500 million.

- **5.1 Pick ONE target, not ten.** Either one occupational-health provider (Terveystalo,
  Mehiläinen, Pihlajalinna, Heltti, Aava) or one mid-sized Finnish employer with a
  visible wellbeing programme.
- **5.2 The pitch is not "an app".** It is: *your nurses and occupational physicians need
  a consistent, fast way to decide what level of support an employee needs, before the
  appointment. Reitti gives them that, the employee keeps their own data, and you get no
  new health-data liability.*
- **5.3 Define the pilot tightly:** one site or one employer, 3 months, an agreed number
  of completions, one success metric agreed in advance. Charge something, even if small —
  a free pilot is treated as a free pilot.
- **5.4 The regulatory caution.** Deploying a mental-health triage tool in an
  employment context sits closer to work-capability assessment than consumer self-help,
  and the EU AI Act treats employment contexts differently. **Get a specific legal
  opinion on the employer channel before you sign, not after.** I'm not a lawyer; this is
  a flag, not a ruling. Design the pilot so the employer never sees an individual result.
- **5.5 Success measure:** one signed pilot, one named reference customer.

---

## STEP 6 — Public sector (slow, but it's where the model lives)

- **6.1 Know the buyers.** Finland has **21 wellbeing services counties**, plus the
  **City of Helsinki**, which organises its own services, and the **HUS group** for
  specialist care in Uusimaa. Åland is separate. That's your buyer map.
- **6.2 Lead with terapiatakuu.** Your pitch line: *the guarantee is being met but the
  data base is thin, and you are required to publish the figures. Reitti produces
  consistent structured triage data at the front door, without you taking on new health
  data.* This maps to a live legal obligation, which is what gets a public meeting.
- **6.3 Keep the Mielenterveystalo relationship right.** HUS owns it and it works. Reitti
  is the layer that gets someone *to* the right service; do not pitch a replacement. The
  same applies to Terapianavigaattori — you already decided to position around it, so
  hold that line in every deck.
- **6.4 Warm the HUS thread you have.** Your existing HUS contact (Digital and
  Psychosocial Treatments) responded positively. Go back with the clinician's name
  attached — that is the single change that moves that conversation forward.
- **6.5 Expect quarters, not weeks.** Procurement law, budget cycles, DPIA review. Run
  this in the background; never let it be the only plan.

---

## STEP 7 — Funding

- **7.1 Business Finland has changed — check before you plan around it.** Tempo has
  closed and is not reopening; a new **Sprint** grant was announced for early 2026 as the
  first-stage R&D instrument. **NIY remains closed** because of cuts to state innovation
  funding. Verify current terms at businessfinland.fi before writing any application;
  this area is moving.
- **7.2 A paid pilot beats a grant.** One occupational-health contract proves demand in a
  way no grant does, and it is what a VC or angel will ask about.
- **7.3 Angels and Nordic health-tech investors** — only after Steps 1 and 5. A solo
  technical founder with no clinician is a pass for almost every health investor.
- **7.4 Don't build the funding story on a per-user projection.** Build it on placements
  and contracts, because that's your actual model.

---

## STEP 8 — How you'll know it's working

Track these, in this order. Everything else is vanity.

1. Clinician signed and named publicly — yes/no.
2. Number of organisations with Reitti **embedded or linked**.
3. Number of completed routings per month, per placement.
4. Number of paid pilots signed.
5. Only then: total users.

The mental shift this whole document rests on: **you are not building an audience, you
are collecting placements.**

---

## Appendix A — Things that will waste your time

- Cold-emailing 500 psychologists with the same message.
- Paid social advertising (restricted for mental health, and you have no LTV to recover).
- SEO against Mielenterveystalo.
- Building the therapist marketplace before you have therapists, or the AI layer before
  you have V1 usage — both already deferred in your plan; keep them deferred.
- Approaching NGOs for money or co-development while their funding is being halved.
- Pitching any institution before the clinician sign-off exists.

## Appendix B — Verified sources behind the numbers in this document

| Claim | Source |
|---|---|
| Therapy guarantee: 28 days primary care / 30 days social care, under-23s, from 1.5.2025 | THL; STM |
| Interim review: mostly met, data base weak; full report due 1.5.2027 | valtioneuvosto.fi, June 2026 |
| Mielenterveystalo: 4M+ annual visitors after redesign | HUS redesign case studies |
| Occupational health: 2.09M employees, 92% of wage earners, €1,277M spend, €500M Kela reimbursement (2024) | Kela occupational-health statistics 2024 |
| YTHS: ~301,011 enrolled students, 41% used general/mental-health services (2024) | Kela self-monitoring report, Sept–Dec 2025 |
| Psykologiliitto: ~8,300–8,400 members, >85% of Finnish psychologists, 18 regional associations | psyli.fi |
| 21 wellbeing services counties + City of Helsinki + HUS group | vm.fi; yrittajat.fi |
| Valvira ceased 31.12.2025; LVV from 1.1.2026; julkiterhikki.lvv.fi | valtioneuvosto.fi; valvira.fi |
| NGO grant cuts ~30% next year, halving over the term; MIELI change negotiations Aug 2026 | MIELI ry release, 17.8.2026 |
| Business Finland: Tempo closed, Sprint from early 2026, NIY closed | Business Finland; regional business services |

**Still needs a real source or a professional opinion:**
- Whether the occupational-health deployment falls under EU AI Act employment provisions — **lawyer**.
- Licensing status of every instrument in the FI/SV translations — **clinician + licence check**.
- Whether any county already has a triage tool under contract — **ask them directly**.
