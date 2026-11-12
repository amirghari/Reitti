# Status, Reitti / Mielenreitti (updated 12.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 12.11.2026 (rev 33)
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
- [ ] Finnish and Swedish guides after the native reviewer's pass (one PR per language, publishes it and adds it to sitemap/llms.txt)
- [ ] Real hand entries for the six cities, once Amir says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
- **New fi/sv strings for the native reviewer:** hand-off text in reports/daily/2026-11-12.md; Amir carries it to the company session (drafts/for-proofreader/).
- **E18 decisions** (docs/open-items.md), sent 12.11 as two lists. Amir: 112 sourceUrl (proposal: https://112.fi/en/erc-number; crisis.json untouched until he says), Ärligt talat who-answers, FinFami anonymity, Nyyti Swedish groups and links, unstated languages (Kela, Interventionavigaattori), HUS video, health-station link. Clinician 26.11: ages that widen routing (7 Cups 13+, Valoa, Tukinet), MIELI's English phone/video counselling, AI chatbots on Sekasin and 7 Cups.
- **Guide review files:** send the Finnish (and, once a Swedish-speaking reviewer is named, the Swedish) file to the native reviewer. Corrections come back → one PR per language.
- **Search visibility plan:** items 3, 8 and 9 wait for the clinician and for Kela (Amir, 10.11). Item 5 (Search Console indexing by hand) is his.
- **Rules sheet for the clinician: ready.** `~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-09.pdf`. His to send the week before the review.
  - Two of its questions are real inconsistencies in the config (AUDIT-C risky or PC-PTSD-5 positive alone reaches R5, contradicting M2/M3; PHQ-9 item 9 asked only when PHQ-4 depression reaches 3). Left for the clinician, unchanged.
- **First winter** guide (his); lawyer list (docs/open-items.md 2a); a Swedish-speaking reviewer (S1).

## 1a. From company-ops (9.11)
- Clinician review booked for the week of 23.11, about 2 h at EUR 116/h; licence checked.
- Letter replies: YTHS broadly accurate; Arcada forwarded; Kela and LVV automatic receipts only; Metropolia, Aalto, UH no reply yet.
- JulkiTerhikki: 4 of 10 professionals checked; 6 blocked by the CAPTCHA.

## 2. Done
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
- **Main** `ccac078` (#31, CI and scripts only, nothing deployable changed). **Live:** `b1d7e49` (deployed 12.11 evening on Amir's word: #27, #29, #30 on top of #28). Live check: 90 of 90 sitemap addresses 200; service pages 200 in en/fi/sv with hreflang; 7 Cups pages 404; Sekasin Swedish hours, Ärligt talat 12 to 29 and the Klubitalot link live; crisis line on /.
- Earlier live `428ed34` (#28 on top of #25/#26).
  - Live check 12.11: /directory, /fi/palvelut, /sv/tjanster each 200 with the daily-check line in its language and 23 cards with a labelled `<time>` ("8 September 2026" / "8.9.2026"); Swedish YTHS card reads "SHVS, Studenternas hälsovårdsstiftelse"; robots.txt has the new comment; sitemap 24 locs; /, /fi, /sv and /en/guides/free-help-now 200.

## 3. Open from before
- The two rules-sheet contradictions stay unchanged until the clinician answers (Amir, 9.11).
- Reviewer note on #22 still open: CLAUDE.md's sitemap bullet could say guides carry alternates only among published translations (a CLAUDE.md wording change, so Amir's).
- Liveness: 5 of 23 addresses failed the daily check on 12.11 (403 from terapianavigaattori, sekasin, 7cups, interventionavigaattori: GitHub's servers refused, all answer from here; nyyti-life-skills 500 only without Accept-Language). Now reported daily in the section at the end of this file (#31); the Nyyti one is fixed. Don't run push-status from a branch cut before #31 (App-wt3 on feat/service-pages, which I couldn't remove): its old script would overwrite the section.
- Native-speaker pass on FI/SV copy (B8); clinician review (C1); WHO-5 licence (C2); E4.
- One Google fetch of the guide failed on DNS (12.11, retry fine). If Search Console reports DNS errors, look at the Zoner nameservers.
- InfoFinland still lists MIELI's closed English line (Amir to report).

<!-- liveness:start (written daily by .github/workflows/directory-liveness.yml; not edited by hand) -->
## Directory links, daily check: 2026-11-12

**4 of 23 addresses did not answer 200** at 20:09 UTC ([run](https://github.com/amirghari/Reitti/actions/runs/43297466480)). Not blocking (D-7); each needs a person to look.

| Service | Answer | Failing since | Usually means |
|---|---|---|---|
| terapianavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| sekasin | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| 7cups | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| interventionavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |

If this date is not today, the daily check did not run: look at the workflow.
<!-- liveness-data {"day":"2026-11-12","failing":{"terapianavigaattori":{"status":403,"since":"2026-11-12"},"sekasin":{"status":403,"since":"2026-11-12"},"7cups":{"status":403,"since":"2026-11-12"},"interventionavigaattori":{"status":403,"since":"2026-11-12"}}} -->
<!-- liveness:end -->
