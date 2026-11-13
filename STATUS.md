# Status, Reitti / Mielenreitti (updated 13.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 13.11.2026 (rev 36; written to rev 39)
For the Reitti builder. Ticked on the page when done.
- [x] After #13 merges: guide footers link to /privacy
- [x] Review copies of the guides (10.11): `~/Desktop/Reitti/Mielenreitti-guides-fi-review-2026-11-10.docx` and `…-sv-review-2026-11-10.docx`. Sending is Amir's.
- [x] YTHS card "Run by" line in each language's own name: #21, merged 10.11
- [x] Crawler check (plan item 4), 10.11
- [x] Five English guides in sitemap.xml (18 → 24) and llms.txt: #22, merged and live 11.11
- [x] Structured data (plan item 6), on Amir's word 11.11: #24 merged 11.11 (08eb01e), deployed 12.11. Live Rich Results Test: guide 2 valid (Article, Organisation; optional "image" warning), home 1 valid (Organisation)
- [x] Clean-up (Amir, 12.11): #25 merged (2437012), deployed 12.11
- [x] Directory dates + daily-check line (E2): #26 merged (5214b87), deployed 12.11
- [x] Urgent (Amir, 12.11): MIELI Kriisichat link to tukinet.fi/fi/palvelut/mieli-kriisichat (MIELI's written confirmation, Susanna Winter, 12.11), hours Mon–Thu 15–21 read at source: #28 merged (428ed34) and deployed 12.11 on Amir's word; live in en/fi/sv
- [x] Re-verification pass (Amir, 12.11): #27 merged (6895b88), deployed 12.11 evening (b1d7e49). 22 of 23 re-dated 12.11 (health-station not). Open items: docs/open-items.md E18, sent to Amir as a split list 12.11
- [x] Guide source fix: English free-help guide's mieli-cc source to MIELI's own Crisis Centre Helsinki page: #29 merged (4815a7e), deployed 12.11 evening
- [x] A page per directory service (go 12.11; 22 services, 7 Cups left out): #30 merged (b1d7e49) on Amir's yes to the test-scope change, deployed 12.11 evening. Live: all 90 sitemap addresses 200, /directory/7cups and /fi/palvelut/7cups 404, llms.txt "All services"
- [x] Daily link check reports into STATUS (Amir, 12.11): #31 merged (ccac078; reviewer Ready on round 3, CI green). A manual run on main wrote the section to STATUS.md on the status branch (4 of 23: GitHub's servers refused by terapianavigaattori, sekasin, 7cups, interventionavigaattori; Nyyti's 500 fixed). The section sits at the end of this file and push-status keeps it. Follow-up: validate the carried "since" date (reviewer, non-blocking)
- [x] Guides link to service pages: #32 merged (4785ec0), deployed 13.11 on Amir's word
- [x] E18 decisions (Amir, 12.11 night): #33 merged (1fb1161), deployed 13.11 on Amir's word. Rules sheet with the section 9 addendum: ~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-12.pdf
- [x] Language data (Amir, 13.11): #34 merged (62e1f49; reviewer Ready twice, CI green), deployed once 13.11 on Amir's word. Kela psychotherapy fi/sv/en from Kela's provider search; one language rule for order, card, filter and the person to talk to; Nyyti groups link labelled English; health station fi/sv pages, English labelled "in Finnish"
- [ ] Partner page (E11) as a preview only: **#35, a draft PR, not to be merged until Amir has read it.** Preview: https://reitti-git-feat-partner-page-preview-amirs-projects-b107307b.vercel.app/partners/ (Vercel sign-in). Production builds skip it; noindex; in no sitemap or link
- [ ] Monthly re-verification of every entry: proposed below (section 1), not built; starting it is Amir's
- [ ] Finnish and Swedish guides after the native reviewer's pass (one PR per language, publishes it and adds it to sitemap/llms.txt)
- [ ] Real hand entries for the six cities, once Amir says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
- **Read the partner page preview** (#35, draft): https://reitti-git-feat-partner-page-preview-amirs-projects-b107307b.vercel.app/partners/ (sign in to Vercel). The company-ops draft word for word; its claims hold against the repo. Going live is its own PR: drop the production guard, settle the address, and the draft's own pre-live list (test tietosuoja@, the review line after 26.11, fi/sv after the native reviewers).
- **Monthly re-verification:** proposal below. Say go, or not.
- **Follow-ups (not changed):**
  - Kela's English rests on Kela's search offering "englanti" as a therapist-language choice; no result list was seen (the search's location list didn't load on 13.11, during a Microsoft disruption Kela's banner reported). A reviewer can run the search with englanti.
  - Other single-language links stay unlabelled: Kela (Finnish page; Kela has /rehabilitative-psychotherapy and /rehabiliterande-psykoterapi, the obvious next localUrls), YTHS (/en/), Nyyti life skills (/en/), HUS Nettiterapiat (/fi/).
  - The daily link check checks each entry's main address only, so the health station's Swedish page isn't checked daily yet.
  - Item 8, in one line: mieli-chat-en's card says "Chat and email only", but MIELI has offered booked English crisis counselling by video or phone since 27.3.2026 (not listed: clinician question 3 on 26.11), so "only" is no longer quite true.
  - 112 is listed first for English readers while 112.fi doesn't promise English (D-21): on record for the clinician.
- **IndexNow (estimate only, not built):** about half a day. A key file at /<key>.txt, and a step after `vercel deploy --prod` that compares the new sitemap with the last one sent and posts the new or changed addresses (or all 90; the limit is 10,000) to api.indexnow.org, with tests. €0; Bing and Yandex use it, Google doesn't. It sends our public addresses to an outside service on every deploy, so it needs your yes once.
- **New fi/sv strings for the native reviewer:** `directory.visitIn.fi`: "Avaa sivusto (suomeksi)", "Öppna webbplatsen (på finska)" (with 12.11's in reports/daily/2026-11-12.md).
- **Aalto** asked how the site stays up to date: a short answer is at the end of the proposal below, for the company session to use (Amir carries it).
- **Clinician on 26.11:** rules sheet section 9 (AI chatbots on Sekasin and 7 Cups; ages; MIELI's English video/phone counselling). Send the PDF by 20.11.
- **Guide review files:** Finnish to the native reviewer; a Swedish-speaking reviewer to name.
- **Search visibility plan:** items 3, 8, 9 wait for the clinician and Kela; item 5 (indexing by hand) is his.
- **First winter** guide (his); lawyer list (docs/open-items.md 2a).

### Proposal: monthly re-verification of every directory entry (not built)

**What runs today.** The daily check (`directory-liveness.yml`) checks each service's main address and reports failures in STATUS. A dead link is caught within a day. A changed page is not: if a service changes its hours, ages, fee or languages on a page that still loads, nothing notices until a person re-reads it. The 12.11 re-verification pass was a person reading all 23 entries.

**Proposal.** A scheduled GitHub Action on the 1st of each month, plus a person's read of what it flags.
1. **Claims per entry.** Each entry gets a `claims` list: the exact phrases from its source that the card relies on. Most of these are already quoted in the entry's note, e.g. Kela's 'jos olet 16–67-vuotias' and '57,60 euroa/käyntikerta'. The verifier requires at least one claim per entry.
2. **The monthly job.** It fetches each entry's address, and its pages in other languages, and checks that every claim still appears. It writes a "Monthly re-verification" section to STATUS on the status branch with three lists:
   - **Holds:** every claim found.
   - **Changed:** a claim is missing, so a person re-reads the page.
   - **Can't check from GitHub:** the four sites that block GitHub's servers (Terapianavigaattori, Sekasin, 7 Cups, Interventionavigaattori), which are read by hand or from the Mac.
   
   It also lists every entry whose `verifiedOn` is older than 40 days.
3. **A person re-reads only what is flagged**, updates the entry and re-dates it. Nothing is re-dated by the job: a phrase still being on a page is not the same as a person having read it, which is the rule the 12.11 pass followed.
4. **The crisis panel is left out of the job's conclusions.** Its lines need the written confirmation invariant 3 requires; the job can only flag that 112's or MIELI's source page changed.

**Time it would cost:**
- **Build, once:** about one working day.
  - Half a day to write claims for 23 entries from their notes.
  - Half a day for the job, its STATUS section and tests, reusing the daily check's fetch and the liveness-status pattern.
- **Each month:**
  - GitHub Actions: about 2 minutes of runner time, within the free tier, so €0.
  - Builder: about 30 to 60 minutes re-reading the flagged pages (expect 2 to 5 a month), plus about 20 minutes for the four bot-blocked sites. Without the job, a full re-read of 23 entries is about 2 to 3 hours.
  - Amir: only when a change needs a decision, as E18 did.
- **Starting it is a token-burning job each month, so it's yours to start.**

**For Aalto (a short answer they could be given):** "Every service in Mielenreitti's directory shows the date it was last checked. A daily automatic check catches dead links, and the information on each card is re-read against the service's own pages, with any change corrected and re-dated. The crisis numbers are confirmed in writing by MIELI, not taken from a web page." The second sentence is true today only as a manual pass, so it should say "monthly" only once the job runs.


## 2. Done
- 13.11:
  - **#34 merged** (62e1f49): Kela psychotherapy's languages from Kela's provider search ("Palveluntuottajan kielitaito", a required field with suomi, ruotsi, englanti), so it is under the English filter again; not re-dated (only the search was read). One engine rule, `languageMismatch`, for the card's warning and the order; `speaks` (stated only) for the filter; the person to talk to uses the same rule, so it stays the health station. Nyyti groups link labelled English. Health station: `localUrls` gives Swedish readers Psykporten's page; English gets the Finnish page labelled "in Finnish". `visitLink` picks every outbound link. Reviewer Ready (then Ready on the follow-up fixing the human-option change, Kela's date and a test's independence); CI green.
  - **Deployed main once** on Amir's word: 62e1f49 (#32, #33, #34) by `vercel deploy --prod`. Vercel's GitHub integration also built main on the merge, 10 s earlier, from the same commit; the CLI build is the one live. Live: Kela psychotherapy under ?spoken=en in en and fi; Kela's page lists English; health station fi/sv/en links as above; Nyyti groups "(englanniksi)"; sitemap 90; /partners 404; crisis-control and directory browser tests (40) pass against mielenreitti.fi on desktop and mobile; crisis lines on /, /fi, /sv. The crisis config changed since the last deploy only in 112's source address, date and note (#33), none of it shown.
  - **#35 opened as a draft** (partner page preview), not merged.
- 12.11:
  - **#25 merged** (2437012): Terapianavigaattori 18+ (City of Helsinki pages en/fi/sv, read 12.11; verifiedOn left at 8.9 since only the age was re-read); fi/sv guides name their English original (`translationOf`), sitemap pairs by name, shape test catches a swapped pair; Swedish YTHS card "SHVS, Studenternas hälsovårdsstiftelse"; robots.txt comment; CI actions v4 → v7. Reviewer Ready (nitpicks fixed), CI green. E9, E15 closed.
  - **#26 merged** (5214b87): each card's "Details checked" date in the reader's format in a <time>; one shared formatDate; /directory line "checked daily to see whether it still answers" in en/fi/sv. Reviewer said Not ready on the first fi/sv wording ("so that we know it still works") because 5 of 23 addresses fail the daily check (403 ×4, 500 Nyyti life-skills); reworded, re-review Ready, CI green. E2 closed.
  - **#24 deployed once** on Amir's word (08eb01e). Live: one JSON-LD block on /, /fi, /sv and each of the five guides (Article on all five), none on /en/guides or /why; no reviewedBy, FAQPage or isAccessibleForFree. Sitemap still 200 with 24 locs; llms.txt still lists the five guides; no fi/sv guide paths.
  - **Rich Results Test on the live URLs:** /en/guides/free-help-now 2 valid items (Article, Organisation; one optional warning, no image); / 1 valid item (Organisation). The first guide run failed with "DNS server unresponsive" on Google's side; our DNS answered from 8.8.8.8, 1.1.1.1, 9.9.9.9 and both Zoner nameservers; the retry 40 s later crawled fine.
- 11.11:
  - **Merge rule (Amir, 11.11):** the builder merges its own PRs once proof-checked, reviewer Ready and CI green; deploys, sends, costs, token-burning work, a test's expected answer and undictated CLAUDE.md rules stay his. Recorded in CLAUDE.md and D-45: #23, merged 11.11 (reviewer Ready, CI green).
  - **#22 merged** (reviewer Ready, all checks green) and **deployed once** on Amir's word. Live: sitemap.xml 200 with 24 locs (18 views + /en/guides + five guides), no /fi/oppaat or /sv/guider; llms.txt has a "Guides" section with all five titles.
- 10.11:
  - **Guide review files** for fi and sv (Word, landscape, numbered rows, English beside the draft, a correction column, plus page labels). Not sent.
  - **#21 merged by Amir:** YTHS "Run by" per language (en FSHS, fi YTHS, sv SHVS) via `operatorRef`.
  - **Crawler check (plan item 4):** Googlebot and GPTBot get identical full HTML on /, /fi and a guide without JavaScript; Googlebot, Bingbot, GPTBot, ClaudeBot and PerplexityBot all get 200 on robots.txt, /, /fi, a guide, llms.txt and sitemap.xml; robots.txt `User-agent: * Allow: /`.
  - **#22 opened:** English guides into sitemap.xml and llms.txt, with tests that an unpublished guide never appears under any of the 8 publish-flag combinations.
- 9.11: #12–#20 merged and live (see reports/daily/2026-11-09.md).
- **Main and live** `62e1f49` (deployed 13.11 on Amir's word: #32, #33, #34). Before that live `b1d7e49` (12.11 evening: #27, #29, #30 on top of #28). Live check: 90 of 90 sitemap addresses 200; service pages 200 in en/fi/sv with hreflang; 7 Cups pages 404; Sekasin Swedish hours, Ärligt talat 12 to 29 and the Klubitalot link live; crisis line on /.
- Earlier live `428ed34` (#28 on top of #25/#26).
  - Live check 12.11: /directory, /fi/palvelut, /sv/tjanster each 200 with the daily-check line in its language and 23 cards with a labelled `<time>` ("8 September 2026" / "8.9.2026"); Swedish YTHS card reads "SHVS, Studenternas hälsovårdsstiftelse"; robots.txt has the new comment; sitemap 24 locs; /, /fi, /sv and /en/guides/free-help-now 200.

## 3. Open from before
- The two rules-sheet contradictions stay unchanged until the clinician answers (Amir, 9.11).
- Reviewer note on #22 still open: CLAUDE.md's sitemap bullet could say guides carry alternates only among published translations (a CLAUDE.md wording change, so Amir's).
- Liveness, the five that failed on 12.11: **bot-blocking (403 to GitHub's servers, all open from a normal connection): terapianavigaattori, sekasin, 7cups, interventionavigaattori.** **Not bot-blocking: nyyti-life-skills**, whose 500 came from our check sending no Accept-Language header, now fixed (#31). The daily section at the end of this file now reports them. Don't run push-status from a branch cut before #31 (App-wt3 on feat/service-pages, Amir's to delete): its old script would overwrite the section.
- Native-speaker pass on FI/SV copy (B8); clinician review (C1); WHO-5 licence (C2); E4.
- One Google fetch of the guide failed on DNS (12.11, retry fine). If Search Console reports DNS errors, look at the Zoner nameservers.
- InfoFinland still lists MIELI's closed English line (Amir to report).

<!-- liveness:start (written daily by .github/workflows/directory-liveness.yml; not edited by hand) -->
## Directory links, daily check: 2026-11-13

**4 of 23 addresses did not answer 200** at 11:45 UTC ([run](https://github.com/amirghari/Reitti/actions/runs/43419547565)). Not blocking (D-7); each needs a person to look.

| Service | Answer | Failing since | Usually means |
|---|---|---|---|
| terapianavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| sekasin | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| 7cups | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| interventionavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |

If this date is not today, the daily check did not run: look at the workflow.
<!-- liveness-data {"day":"2026-11-13","failing":{"terapianavigaattori":{"status":403,"since":"2026-11-12"},"sekasin":{"status":403,"since":"2026-11-12"},"7cups":{"status":403,"since":"2026-11-12"},"interventionavigaattori":{"status":403,"since":"2026-11-12"}}} -->
<!-- liveness:end -->
