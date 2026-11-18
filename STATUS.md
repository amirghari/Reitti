# Status, Reitti / Mielenreitti (updated 18.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 17.11.2026 (rev 48; written to rev 50)
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
- [x] Monthly re-verification: #37 merged 17.11, deployed. First run by hand on GitHub 17.11: 0 changed, 19 hold, 4 by hand
- [x] Kela per language, Swedish health-station page in the daily check, MIELI card without "only": #36 merged 17.11 (Amir's yes to its test change), live
- [x] IndexNow after each deploy: #38 merged 17.11; the deploy is now `npm run deploy`; first run sent 91 addresses
- [x] "Did you get in?" card under the photo: #39 merged 17.11, live; menu intact for a returning visitor
- [x] Interventionavigaattori fi/sv/en, checked 17.11, age range sourced to Terapiat etulinjaan (Amir, 18.11): #43 merged, deployed once 18.11, live in en/fi/sv
- [x] Rules sheet addendum items 4 (Sekasin video walk-in) and 5 (navigator fault notices, confirm our AUDIT-C cut-offs): ~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-18.pdf
- [ ] Finnish and Swedish guides after the native reviewer's pass (one PR per language, publishes it and adds it to sitemap/llms.txt)
- [ ] Real hand entries for the six cities, once Amir says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
- **Partner page, still open from 14.11:** the site-wide review line says "in progress"; the feedback sentence; the tietosuoja@ test mail; nothing links to /partners.
- **From the hand reads of 17.11 (nothing changed on the site; yours to decide):**
  - Sekasin's video walk-in therapy (Tuesdays 17–19): decided 18.11, off the site until the clinician has seen it; in the rules sheet addendum (item 4).
  - 7 Cups advertises listeners for teens; our card lists it for 18+ only. That is our choice, unchanged.
  - The navigators' fault notices: decided 18.11, in the rules sheet addendum (item 5), asking her to confirm our AUDIT-C cut-offs.
- **Status-branch pushes** create preview builds that fail on Vercel (harmless noise). `"status": false` under `deploymentEnabled` would stop them; not done.
- **Clinician on 26.11:** send the rules sheet by 20.11. Use the 18.11 PDF (`~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-18.pdf`): section 9 now has five items. The 12.11 PDF is left as it was.
- **Earlier, still open:** the guide review files; Search visibility items 3, 5, 8, 9; the first-winter guide; the lawyer list.

## 2. Done
- 18.11, on Amir's word:
  - **#43 merged** (5971293; reviewer Ready, CI 8/8): Interventionavigaattori lists Finnish, Swedish and English, from its own language menu read 17.11.2026; check date 17.11.2026. The entry records its age-range source: Terapiat etulinjaan, https://terapiatetulinjaan.fi/lapset-ja-nuoret/nuorten-interventionavigaattori/, read 18.11.2026 ("suunnattu 13–19-vuotiaille nuorille"). The only test expectation changed: the "languages not stated" list is now the health station alone.
  - **No automatic build** for the merge. **Deployed once** with `npm run deploy`; IndexNow sent 6 addresses.
  - **Live:** the card shows the three languages and "checked 17.11.2026" in en, fi and sv, and now appears under the English filter; the service pages too, with no "check the site"; 7 crisis tests pass against the live site; crisis files unchanged; sitemap 91.
  - **Rules sheet** for the clinician regenerated with section 9 items 4 and 5: ~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-18.pdf, its HTML source beside it. Not sent.
- 17.11 (evening), on Amir's word:
  - **#41 merged:** CLAUDE.md's Deploying paragraph is Amir's words, and the deploy line under Commands is `npm run deploy`. Nothing else changed.
  - **#42 merged:** the partner page's "How it is kept up to date" gains the monthly sentence.
  - **Deployed once** (e662df9) with `npm run deploy`. No automatic build for either merge. IndexNow sent 1 address (/partners).
  - **Live:** the sentence is on /partners; crisis lines in place; sitemap 91; 7 crisis tests pass against the live site.
  - **The first monthly run is complete: the four entries to read by hand were read on 17.11.2026, all holding against their cards.**
    - **Terapianavigaattori** (in Chrome): Suomeksi, På svenska, In English; anonymous; the code restores answers "only for a month".
    - **Interventionavigaattori** (in Chrome): anonymous; the code works the same way. The 13–19 ages come from Terapiat etulinjaan, not this page.
    - **Sekasin** (fi and sv pages): fi weekdays 9–24, weekends 15–24; sv weekdays 15–19, weekends 17–21; anonymous, free, ages 12 to 29.
    - **7 Cups:** trained volunteer listeners 24/7, "anonymous and completely free".
    - **112.fi** (crisis source, read by hand): still "vuoden ympäri 24/7".
- 17.11 (later), on Amir's word:
  - **#40 merged:** `git.deploymentEnabled.main: false` in apps/web/vercel.json. Verified: no Vercel production build and no GitHub deployment for its merge, e7611b9, nor for the four merges after it; PR previews still build.
  - **Merged #39, #36, #37 (moved onto main after #36), #38.** Main a180930 is identical to a local merge of all five that passed 687 unit tests and 120 browser tests.
  - **Deployed once** with `npm run deploy`. IndexNow sent 91 addresses (its first run).
  - **Live:**
    - for a returning visitor, the card sits under the photo and all 7 menu controls are uncovered (desktop and phone);
    - Kela's three links go to /rehabilitative-psychotherapy, /kuntoutuspsykoterapia and /rehabiliterande-psykoterapi;
    - the health station links its fi page and its sv page;
    - MIELI's card reads "Chat and email:";
    - crisis-control (14) and follow-up (4) browser tests pass against mielenreitti.fi, and the crisis files are unchanged;
    - sitemap 91; the IndexNow key file is live;
    - /partners has both of Amir's edits.
  - **Monthly re-check run by hand** (actions run 44060016158): 0 changed, 19 hold, 4 to read by hand, MIELI crisis sources hold, 112.fi 403 from GitHub. The section is at the end of this file.
- 17.11: **#39 built** (follow-up card under the hero), reviewed Ready after its focus, label and test notes were fixed, CI green, held.
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
## Directory links, daily check: 2026-11-18

**4 of 26 addresses did not answer 200** at 12:30 UTC ([run](https://github.com/amirghari/Reitti/actions/runs/44304543656)). Not blocking (D-7); each needs a person to look.

| Service | Answer | Failing since | Usually means |
|---|---|---|---|
| terapianavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| sekasin | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| 7cups | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |
| interventionavigaattori | 403 | 2026-11-12 | the site refused an automated request from GitHub; open it in a browser to check |

If this date is not today, the daily check did not run: look at the workflow.
<!-- liveness-data {"day":"2026-11-18","failing":{"terapianavigaattori":{"status":403,"since":"2026-11-12"},"sekasin":{"status":403,"since":"2026-11-12"},"7cups":{"status":403,"since":"2026-11-12"},"interventionavigaattori":{"status":403,"since":"2026-11-12"}}} -->
<!-- liveness:end -->

<!-- reverify:start (written monthly by .github/workflows/directory-reverify.yml; not edited by hand) -->
## Directory re-verification, monthly: 2026-11-17

Checked at 09:55 UTC ([run](https://github.com/amirghari/Reitti/actions/runs/44060016158)): 0 changed, 4 to read by hand, 19 hold. Nothing is re-dated by this job: a person re-reads each flagged page, updates the entry and re-dates it.

### Changed: re-read these (0)

None.

### Read by hand (4)

- terapianavigaattori: a script-only site: its text is not in the page the job fetches, so a person reads it each month
- sekasin: answered 403 (refuses GitHub's servers; read it from a normal connection), https://sekasin.fi/
- 7cups: answered 403 (refuses GitHub's servers; read it from a normal connection), https://www.7cups.com/
- interventionavigaattori: a script-only site: its text is not in the page the job fetches, so a person reads it each month

### Hold (19)

kela-kuntoutuspsykoterapia, mielenterveystalo-omahoito, hus-nettiterapiat, health-station, yths, tukinet, mieli-kriisichat, mieli-chat-en, mieli-kristelefonen, arligt-talat, valoa-chat, suomen-klubitalot, finfami-uusimaa, kirkon-keskusteluapu, nyyti-mind-matters, nyyti-life-skills, nyyti-mental-health-info, nyyti-groups, nyyti-support-discussion

### Crisis-line sources (report only: a crisis line changes only with written confirmation, invariant 3)

- mieli-fi: holds (https://mieli.fi/tukea-ja-apua/kriisipuhelin/)
- mieli-sv: holds (https://mieli.fi/sv/stod-och-hjalp/kristelefon/)
- emergency: answered 403, read it by hand (https://112.fi/ekasikirja-hatakeskuspaivystajan-tyopaiva)

### Checked more than 40 days ago (0)

None.

If this month is not the current one, the monthly job did not run: look at the workflow.
<!-- reverify:end -->
