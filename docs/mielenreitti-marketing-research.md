> **Status as of 2026-09-19. Read this before quoting the document below.** The research is kept as
> written. Five of its facts have since changed or turned out wrong:
>
> 1. **The closure date.** MIELI's own notice ("New ways to receive support in English", 24.3.2026)
>    says the English line was open for the last time on **23 March 2026**. §0 cites Oulu's news item
>    of 13 May 2026, which relayed it.
> 2. **The crisis card.** It now leads English readers with 112, then 0111 marked "Answered in
>    Finnish." **The appointment-based chat was deliberately not put on the card.** Invariant 3
>    forbids chats in the crisis panel, and MIELI describes the chat as booked 30 minutes to a day
>    ahead. It is in the directory as `mieli-chat-en`. See D-21.
> 3. **The directory is no longer "14 services".** It has 18. Kirkon keskusteluapu is in (D-21),
>    verified on the church's own page: 0400 221 180 daily 18–24, chat Mon–Fri 16–20. Nyyti (D-22)
>    and YTHS (D-23) are in too.
> 4. **Terapianavigaattori *is* available in English.** Suomi.fi lists its languages as "Finnish,
>    Swedish, English". So §1's "the only fi/sv/en front door I could confirm", and §2's "a segment
>    where the CE-marked incumbent doesn't clearly compete", do not hold as written. Do not use either
>    line in outreach.
> 5. **"Share of sessions in English" (§5) cannot be read off anything.** Mielenreitti has no
>    analytics by design. It needs an aggregate counter of the E12 kind: an integer per interface
>    language, no identifiers.
>
> What is still outstanding from this document is registered in `docs/open-items.md` (B9–B15, E15, and
> additions to E10 and E12), per the single-register rule.

---

# Mielenreitti — Independent marketing research

**Date:** 18 September 2026
**Purpose:** a fresh look at how to get this used, done separately from the six-step plan so
anything better can be lifted into it. Nothing here is committed. Every number has a source
at the bottom; everything unverified says so.

---

## 0. One urgent thing before the marketing

While researching the English-speaker angle I found this, dated 13 May 2026, on the
University of Oulu's news page relaying MIELI's own announcement:

> **The English-language crisis helpline, previously available 12 hours per week, has been
> discontinued**, and the focus has shifted to appointment-based support services.

MIELI now offers English speakers an appointment-based Crisis Chat, scheduled phone/video
counselling, and a Crisis Email "coming soon". There is no English phone line.

Yesterday's crisis-path change set English to 09 2525 0116. If the line is gone, that number
may be dead, and the config has an English speaker in crisis calling it. **This goes into
the MIELI email as the first question and is one more reason it has to go today.** Until they
answer, the English crisis card should lead with 112, then the Finnish 24/7 line (0111), then
the appointment-based chat — not a phone number nobody has confirmed answers.

---

## 1. What is actually marketable (from the repo, not the pitch)

Reading the code rather than the copy, these are the assets:

| Asset | Why it sells | Who cares |
|---|---|---|
| A free-first ladder with cost labels | Nobody else in Finland shows "what does this cost and what's the gate" | Everyone; especially the uninsured and students |
| 14 services across public, third-sector, Kela and youth in one place | The expat guides I found list a scattered mess of 8–10 links each; Mielenreitti is the consolidated version | Immigrants, newcomers, anyone outside the system |
| No account, on-device data | Removes the data-processing agreement — the thing that kills embed partnerships | Every institutional partner |
| Deterministic crisis path to real humans | No AI anywhere near the crisis decision — a clean story in a year of chatbot headlines | Clinicians, counties, NGOs |
| Demand pooling for groups (built, not deployed) | The one idea nobody else has: count people waiting for the same group so someone can start one | Counties and therapists — it's a supply signal |
| fi / sv / en interface | Terapianavigaattori's English coverage is unverified; the only fi/sv/en front door I could confirm | Foreign-language speakers |

Two gaps that limit the marketing:

- **Kirkon keskusteluapu is not in the directory.** The Evangelical Lutheran Church's talking
  support has run for 60 years, has 700+ volunteers in 60 localities, and answers the phone
  every evening 18–24 plus chat, web letter and post. It is free, open to non-members, and
  probably the single largest free listening service in Finland. Its absence is visible to any
  Finnish reviewer.
- **The English rung is thin.** After MIELI's helpline closure the English talking-support
  options are Tukinet, MIELI's appointment chat, and 7 Cups with a quality warning. That is
  the honest state, and it's also exactly why the segment below is underserved.

---

## 2. Finding A — the segment nobody is serving

At the end of 2025 Finland had **646,392 foreign-language speakers, 11.4% of the population**,
up 36,244 in one year. Nearly half live in the capital region: Vantaa 30.5%, Espoo 26%,
Helsinki 21.2%, Uusimaa overall 20.1%. Statistics Finland projects the share reaching 18–20%
by 2040, and actual net migration since 2022 has run above that forecast. In 2025, 18% of
babies were born to foreign-language mothers.

What the research says about this group and mental health: immigrants use services less
than the general population despite documented need, and the barriers are exactly the ones
Mielenreitti was built for — lack of information, language, cost, not knowing how the local
system works, long waits. A Helsinki private practice serving foreign-language clients writes
that the lack of subsidy for their clients to see a psychologist "has been a huge issue", and
that many arrive asking how Kela psychotherapy works.

What they currently get: expat guides listing Mielenterveystalo, MIELI, YTHS, BetterHelp
and "check your HR" in no particular order. That's the un-consolidated version of your
directory. And the one dedicated English crisis phone line in the country just closed.

**Why this matters more than "all of Finland":**

- It's a segment where the CE-marked incumbent doesn't clearly compete, and where Reitti's
  English-only assessment is a feature, not a gap.
- It's concentrated: 300,000 people in three cities you can reach on a tram.
- It has named, reachable institutions with a mandate to signpost — listed in §4.
- **It's your own story.** The founder narrative ("I graduated here, didn't know where to go,
  built this") is exactly this user's experience, told by one of them. That's not a marketing
  angle; it's the truth, and it's the most credible thing you have.
- It's not a niche you're stuck in. Every Finnish speaker who lands on the same page gets the
  same directory. You'd be entering through the door with no queue.

This does not replace the county or occupational-health tracks. It's the channel where you
can get real users **now**, with nobody's permission.

---

## 3. Finding B — the proof this model works: Hub of Hope (UK)

The closest thing to Mielenreitti anywhere is the **Hub of Hope**, run by the charity
Chasing the Stigma. It's worth studying because it started the same way and ended up where
you want to be.

**Origin.** Founded 2017 by Jake Mills, a Liverpool comedian, after his own suicide attempt in
2013 — he realised people didn't know where to turn. It began as a spreadsheet at his mum's
kitchen table.

**What it is.** A directory of mental-health support — local, national, peer, community,
charity, private and NHS — in one place. Now over 9,000 services. Free to use, free for
organisations to register. It has a "Need Help Now?" button to Samaritans and Shout, and
carries every NHS trust's 24/7 urgent mental-health line. **It is not a medical device. It
doesn't assess anyone.** It signposts.

**How it grew — this is the part to copy:**

1. **The iFrame.** Their agency built an embeddable iFrame so any third-party site could
   carry the directory, plus admin access so partners update their own listings. That embed
   "has become the foundation for the charity's income-generating signposting partnerships."
   Partners include NHS trusts, Mind, Network Rail, NCP Parking, Bauer Media (radio),
   shopping centres, GP surgeries, schools, universities and emergency services.
2. **The institutional listing.** In April 2021 NHS England added the Hub of Hope to nhs.uk.
   Over 40,000 people used it in the first four months from that one placement.
3. **Training as distribution.** "Ambassador of Hope" training — how to talk about mental
   health and signpost — has reached 17,000+ people, including whole retail workforces. Every
   trainee is a person who now points others at the directory.
4. **Scale it reached.** 300,000+ people a year find help through it; 350,000+ directed since
   launch. Team of four staff plus freelancers.

**What it confirms for Mielenreitti:**

- The embed is the business model, not just distribution. Organisations pay to signpost.
  That's revenue that isn't a per-session take-rate and isn't the client paying.
- A directory can reach national scale without being a device, because it never assesses.
  The safer regulatory position and the scalable position are the same position.
- One national listing (nhs.uk) did more than years of outreach. The Finnish equivalents are
  Mielenterveystalo's service listings, Suomi.fi, InfoFinland, and Terapiat etulinjaan's
  materials. Getting listed *in* the incumbent beats competing with it.
- The founder's personal story was the origin and the credibility, not a liability.

---

## 4. Channels not in the current plan, ranked

Ranked by how fast they produce actual users, given no budget and no clinician yet.

| # | Channel | Why | Cost | Speed |
|---|---|---|---|---|
| 1 | **International House Helsinki / InfoFinland** | The official front doors for newcomers in the capital region, run by the city; InfoFinland publishes in 12 languages and has a mental-health page. A listing there is the Finnish nhs.uk for this segment | one email | weeks |
| 2 | **University international-student services** (Helsinki, Aalto, Metropolia, Haaga-Helia) | Concentrated English-speaking population under acute pressure; the services exist to signpost; you're an alumnus of one | one email each | weeks |
| 3 | **Employer HR for relocated staff** (Wolt, Supercell, Nokia, Kone, the Helsinki tech scene) | Companies relocating foreign staff have a wellbeing duty and an English-speaking population with no idea how the Finnish system works. This is the occupational-health wedge, entered through the side | one intro | months |
| 4 | **Expat communities** — r/Finland, Facebook expat groups, Helsinki Times, Yle News in English | Where the segment actually asks "where do I get help" — the exact question you answer. Post once, honestly, with the story. Not ads | free | days |
| 5 | **Kirkon keskusteluapu** — as a directory entry first, then a link partner | Largest free listening service in Finland, 60 localities, missing from your directory. Add it, then tell them you did | one edit, one email | weeks |
| 6 | **Mielenterveystalo's own service listings** | Being listed inside the incumbent beats competing with it. HUS maintains it "with all wellbeing services counties" — your HUS contact is the route | one conversation | months |
| 7 | **Sekasin's Discord** (youth) | You already route under-18s there. Their moderators signpost constantly. Ask to be on their resource list | one message | weeks |
| 8 | **A signposting-training offer** | Hub of Hope's model: a 45-minute "how to point someone at help" session for student-union wellbeing officers, HR, library staff. Each trainee becomes a placement. Later, chargeable | your time | months |

Channels 1–4 need no clinician, no domain change, no code. They need the story, the
one-liner, and the URL.

---

## 5. What I'd propose adding to the plan

Not replacing it — the six steps stand. These slot in alongside.

**Add to Step 1 (today):** the English helpline closure goes into the MIELI email as question
one. The English crisis card falls back to 112 → 0111 → appointment chat until confirmed.

**New Step 3b — directory completeness.** Add Kirkon keskusteluapu (Palveleva puhelin
0400 22 11 80, every evening 18–24, plus chat and web letter at kirkonkeskusteluapua.fi).
Verify from the church's own site before writing hours. Mark NOT CLINICIAN-REVIEWED like
everything else. This is a config edit, and the directory is the product.

**New Step 4b — the newcomer channel, in parallel with Nyyti.** Three emails: International
House Helsinki, InfoFinland's editorial contact, and one university's international student
services. Lead with the story — you *are* this user — and the fact that the English crisis
line closed. Ask for a listing, not a partnership.

**New Step 4c — one honest post.** r/Finland or one large expat group. The story, what it
does, what it doesn't, the URL. No framing as a launch. Answer every reply. This is the
fastest route to your first hundred real users and your first quotes.

**Reframe Step 5's pitch.** When you find the Finnish clinician, the Hub of Hope precedent is
worth a sentence: a signposting directory reached 300,000 people a year without becoming a
device, because it never assessed anyone. That's the frame you want them reviewing under.

**Reframe Step 6's model.** "Signposting partnerships" — organisations paying to embed — is
a proven revenue line for exactly this product. It belongs in the deck next to public
contracts and occupational-health B2B.

**Measure differently.** Add one number to the dashboard: **share of sessions in English.**
If the newcomer channel works, it shows up there first.

---

## 6. What still looks like a waste of time

Same conclusions as before, with one addition.

- Paid ads, SEO against Mielenterveystalo, cold-emailing hundreds of psychologists.
- **Pitching a county as "a triage tool"** — Terapianavigaattori is CE-marked, state-owned, in
  nearly every region, and now has an occupational-health section. Pitch upstream of it or
  not at all.
- **Waiting for the clinician before getting any users.** Channels 1–4 above don't need one.
  A clinician reviews a product with users more willingly than a product with none.

---

## 7. Sources

| Claim | Source |
|---|---|
| MIELI English crisis helpline discontinued; shift to appointment-based chat/phone/email | University of Oulu news, 13 May 2026, relaying MIELI |
| 646,392 foreign-language speakers, 11.4%, +36,244 in 2025; Vantaa 30.5%, Espoo 26%, Helsinki 21.2%, Uusimaa 20.1%; 18% of births | Statistics Finland, population structure 2025 (published April 2026); City of Vantaa statistics |
| Projection 18–20% by 2040 | Statistics Finland population forecast 2021, as cited by mamutus.info |
| Immigrant barriers: information, language, cost, system knowledge, waits | Peer-reviewed review of non-European immigrants' perceptions of Finnish mental-health services (PMC9790472) |
| Foreign-language clients lack subsidy; ask about Kela | Compass Psychology, Helsinki, Feb 2025 |
| Mielenterveystalo run by HUS Psychiatry with all wellbeing services counties | mielenterveystalo.fi/en/about-us |
| Hub of Hope: 2017, Jake Mills, spreadsheet origin, 9,000+ services, 300k+/yr, 350k+ since launch, NHS listing April 2021, 40k in four months, iFrame as revenue foundation, 17k Ambassadors, team of four | Charity Today; hubofhope.co.uk; GoodShip agency case study; The Guide Liverpool; Hillstreet/NewRiver |
| Kirkon keskusteluapu: 60 years, 700+ volunteers, 60 localities, every evening 18–24, chat and web letter, 0400 22 11 80 | Rauhan Tervehdys (25.9.2024); Suomen Yrittäjät news |

**Unverified — check before using:**
- Whether Terapianavigaattori has an English interface. I could not confirm either way.
- Whether InfoFinland's mental-health page accepts external listings, and who edits it.
- Kirkon keskusteluapu's current hours and numbers — verify on the church's own site, not the
  secondary sources above.
