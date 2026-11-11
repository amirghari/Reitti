# Status, Reitti / Mielenreitti (updated 11.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 11.11.2026 (rev 19)
For the Reitti builder. Ticked on the page when done.
- [x] After #13 merges: guide footers link to /privacy
- [x] Review copies of the guides (10.11): `~/Desktop/Reitti/Mielenreitti-guides-fi-review-2026-11-10.docx` and `…-sv-review-2026-11-10.docx`. Sending is Amir's.
- [x] YTHS card "Run by" line in each language's own name: #21, merged 10.11
- [x] Crawler check (plan item 4), 10.11
- [x] Five English guides in sitemap.xml (18 → 24) and llms.txt: #22, merged and live 11.11
- [ ] Structured data (plan item 6), on Amir's word 11.11: #24 merged 11.11 (08eb01e; reviewer Ready after a summer-time fix, CI green), not deployed. Rich Results Test: guide 2 valid (Article, Organisation; optional "image" warning), home 1 valid (Organisation). Deploy is Amir's after merge.
- [ ] SEO: a path per directory entry (5–8 h), when Amir says
- [ ] Finnish and Swedish guides after the native reviewer's pass (one PR per language, publishes it and adds it to sitemap/llms.txt)
- [ ] Real hand entries for the six cities, once Amir says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
- **Deploy #24** (structured data, merged as 08eb01e): say "deploy" and I deploy once and re-run the Rich Results Test on the live pages.
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
- 11.11:
  - **Merge rule (Amir, 11.11):** the builder merges its own PRs once proof-checked, reviewer Ready and CI green; deploys, sends, costs, token-burning work, a test's expected answer and undictated CLAUDE.md rules stay his. Recorded in CLAUDE.md and D-45: #23, merged 11.11 (reviewer Ready, CI green).
  - **#22 merged** (reviewer Ready, all checks green) and **deployed once** on Amir's word. Live: sitemap.xml 200 with 24 locs (18 views + /en/guides + five guides), no /fi/oppaat or /sv/guider; llms.txt has a "Guides" section with all five titles.
- 10.11:
  - **Guide review files** for fi and sv (Word, landscape, numbered rows, English beside the draft, a correction column, plus page labels). Not sent.
  - **#21 merged by Amir:** YTHS "Run by" per language (en FSHS, fi YTHS, sv SHVS) via `operatorRef`.
  - **Crawler check (plan item 4):** Googlebot and GPTBot get identical full HTML on /, /fi and a guide without JavaScript; Googlebot, Bingbot, GPTBot, ClaudeBot and PerplexityBot all get 200 on robots.txt, /, /fi, a guide, llms.txt and sitemap.xml; robots.txt `User-agent: * Allow: /`.
  - **#22 opened:** English guides into sitemap.xml and llms.txt, with tests that an unpublished guide never appears under any of the 8 publish-flag combinations.
- 9.11: #12–#20 merged and live (see reports/daily/2026-11-09.md).
- **Live:** `d05d98d` (main, deployed 11.11).

## 3. Open from before
- The two rules-sheet contradictions stay unchanged until the clinician answers (Amir, 9.11).
- The Swedish YTHS card name still reads "YTHS, Studenternas hälsovårdsstiftelse (SHVS)"; out of #21's scope.
- robots.txt's comment still mentions the preview banner (gone since #15); harmless, fix with the next robots change.
- Reviewer notes on #22 for the Finnish publish PR: translations are paired by position (fi[i] ↔ en[i]) with no test that they line up; CLAUDE.md's sitemap bullet should say guides carry alternates only among published translations.
- Native-speaker pass on FI/SV copy (B8); clinician review (C1); WHO-5 licence (C2); E4.
- InfoFinland still lists MIELI's closed English line (Amir to report).
