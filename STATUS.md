# Status, Reitti / Mielenreitti (updated 14.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 14.11.2026 (rev 41; written to rev 46)
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
- [x] Guides link to service pages: #32 merged (4785ec0). Went live on merge 12.11 22:45 through Vercel's automatic build (found 14.11), again in the 13.11 deploy
- [x] E18 decisions (Amir, 12.11 night): #33 merged (1fb1161). Went live on merge 12.11 23:45 through Vercel's automatic build, before Amir's word (found 14.11); again in the 13.11 deploy. Rules sheet with the section 9 addendum: ~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-12.pdf
- [x] Language data (Amir, 13.11): #34 merged (62e1f49; reviewer Ready twice, CI green), deployed once 13.11 on Amir's word. Kela psychotherapy fi/sv/en from Kela's provider search; one language rule for order, card, filter and the person to talk to; Nyyti groups link labelled English; health station fi/sv pages, English labelled "in Finnish"
- [x] Partner page (E11) live at /partners (Amir, 14.11): #35 merged (ea91a8f; reviewer Ready, CI green) with his two edits, deployed once 14.11 on his word. In the sitemap (91) and llms.txt
- [ ] Monthly re-verification (Amir's yes, 14.11): #37 built, reviewed Ready (after a Not ready on Klubitalot's claim, fixed). **Held: a merge deploys** (section 1)
- [ ] Kela per language, the health station's Swedish page in the daily check, MIELI card without "only" (Amir's yes, 14.11): #36, reviewed Ready. **Held**, and it changes one test's expected answer (Kela's date 12.11 to 14.11): Amir's word
- [ ] IndexNow after each deploy (Amir's yes, 14.11): #38, reviewed Ready. **Held**
- [ ] Finnish and Swedish guides after the native reviewer's pass (one PR per language, publishes it and adds it to sitemap/llms.txt)
- [ ] Real hand entries for the six cities, once Amir says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
- **Automatic deploys: what I found (nothing changed).** Every merge to main deploys to mielenreitti.fi on its own. Vercel's GitHub integration builds main as production, and the project assigns mielenreitti.fi to it within about a minute (`aliasAssigned` on each). With `reitti-v2-preview` deleted, nothing cancels those builds any more, so CLAUDE.md's "pushing to main is unreliable" is now wrong in the other direction.
  - Concretely: #31 went live 12.11 22:09, #32 at 22:45, and **#33 at 23:45 on 12.11, before your word**. Earlier, #25, #27 and #29 went live on merge, hours before the CLI deploys on your word. My "merged, not deployed" lines were wrong; corrected above and on the status page.
  - **Proposed fix:** `"git": {"deploymentEnabled": {"main": false}}` in apps/web/vercel.json, in a reviewed PR. Pull-request previews stay, and only `vercel deploy --prod` from here goes live. (The other switch, turning off the automatic domain assignment in the project settings, would also stop my own deploy taking the domain.) Say yes and I'll do it. The CLAUDE.md Deploying section would then need its first paragraph rewritten: yours.
  - **Until then I merge only what you gave a deploy word for.** #36, #37 and #38 are built, reviewed Ready and CI-checked, and held unmerged.
- **#36 needs your word on one test's expected answer:** Kela's date in language-data.test.ts goes from 12.11 to 14.11. All three Kela pages were read 14.11 and state the card's facts.
- **When #38 (IndexNow) merges,** the deploy command becomes `npm run deploy`. CLAUDE.md's Commands and Deploying lines still say `vercel deploy --prod --yes`: yours to change.
- **Partner page, from its review (not changed):**
  - The review line on /about, the home page and the footer still says "in progress", while the partner page now says "booked for the week of 23 November 2026". CLAUDE.md asks that line to stay true everywhere: change the site line too?
  - "Feedback ... carries only what they type" (the draft's words) is slightly broader than /privacy, which says feedback also carries the interface language, and a rating is a number and a screen.
  - The draft's pre-live step 1 was a test mail to tietosuoja@: done?
  - Nothing on the site links to /partners yet.
  - Once the monthly job has run, its line goes into "How it is kept up to date".
- **Monthly job:** the first run is 1.12 once #37 is merged (or sooner by a manual run). Today's run from this Mac: 0 changed, 3 to read by hand (Terapianavigaattori and Interventionavigaattori are script-only, 7 Cups refuses), 20 hold. 112.fi's source can't be fetched by Node (its certificate chain is incomplete), so it is always "read by hand".
- **MIELI English page drift:** mieli.fi/en/support-and-help/ no longer carries the wording mieli-chat-en's card notes quote (that came from Tukinet's booking page). The card is unchanged; it is now claimed on what the page says today.
- **New fi/sv strings for the native reviewer:** in #36, the MIELI English chat cost note now begins "Chat ja sähköposti:" and "Chatt och e-post:".
- **Aalto:** the partner page now answers "how the site stays up to date" (the company session has the reply draft).
- **Clinician on 26.11:** rules sheet section 9; send the PDF by 20.11.
- **Earlier, still open:** the guide review files; Search visibility items 3, 5, 8, 9; the first-winter guide; the lawyer list.

## 2. Done
- 14.11:
  - **#35 merged** (ea91a8f) and **deployed once** on Amir's word (`vercel deploy --prod`; Vercel's automatic build of the merge went live 11 s before it, same commit). Live: /partners 200 with "booked for the week of 23 November 2026 and not yet done" and "How it is kept up to date", the crisis lines on top, no noindex; sitemap 91 with /partners; llms.txt lists it; 14 crisis-control browser tests pass against the live site; crisis config unchanged.
  - **#36, #37, #38 built**, each reviewed Ready (#37 after one Not ready: Klubitalot's only claim was a clubhouse blurb, now checked on "Mikä on Klubitalo?" via `claimsUrl`), held unmerged.
  - **Vercel finding** (section 1): read-only investigation, nothing changed.
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
- **Main and live** `ea91a8f` (14.11: the partner page). Before: `62e1f49` (13.11: #32, #33, #34, though #32 and #33 were already live on merge). Before that live `b1d7e49` (12.11 evening: #27, #29, #30 on top of #28). Live check: 90 of 90 sitemap addresses 200; service pages 200 in en/fi/sv with hreflang; 7 Cups pages 404; Sekasin Swedish hours, Ärligt talat 12 to 29 and the Klubitalot link live; crisis line on /.
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
