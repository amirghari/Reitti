# Status, Reitti / Mielenreitti (updated 9.11.2026, late)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 9.11.2026 (rev 7)
For the Reitti builder. Ticked on the page when done.
- [x] After #13 merges: guide footers link to /privacy (live 9.11, ticked)
- [ ] SEO steps 3–5 when Amir says: a path per directory entry (5–8 h), structured data and llms.txt (2–4 h), sitemap (1–2 h)
- [ ] Finnish and Swedish guides after the native reviewer's pass
- [ ] Real hand entries for the six cities, once Amir sends the Kela letter and says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
2. **First winter** guide (yours); lawyer list (docs/open-items.md 2a) with the assessment's Word file; a Swedish-speaking reviewer (S1).
4. **Rules sheet for the clinician: ready.** `~/Desktop/Reitti/Mielenreitti-rules-sheet-2026-11-09.pdf` (4 pages: how a result is reached, the crisis path and lines, the ladder, questionnaires and severity levels, R0–R7, M1–M6, two worked examples checked against the engine, six review questions, signature line). Yours to send the week before the review; nothing was sent.
   - Two of its questions are real inconsistencies in the config, not just provisional values: a risky AUDIT-C or a positive PC-PTSD-5 alone counts as moderate and leads to R5 (nettiterapia), while M2/M3's reasons say they don't change intensity; and PHQ-9 item 9 is asked only when PHQ-4's depression items reach 3. Left for the clinician, unchanged.

## 1a. From company-ops (9.11)
- **Clinician review booked** for the week of 23.11, about 2 h at EUR 116/h; licence checked 9.11 (name in company-ops). The reply is drafted for Amir.
- **Replies to the letters:** YTHS broadly accurate (chat-hours request already noted above); Arcada forwarded to its student well-being team; Kela and LVV automatic receipts only; Metropolia, Aalto, UH no reply yet.
- **JulkiTerhikki:** 4 of the 10 professionals checked and licensed (9.11); the other 6 unchecked because of the CAPTCHA.
- **company-ops rule change:** its agent now approves contacts after checking, and merges its own PRs after proof-checking.

## 2. Done
- 9.11 (late): #19 (one address per language, D-44) and #20 (YTHS hours fallback, at YTHS's request) merged by Amir; deployed once to production. Live: /fi and /sv addresses, ?lang= 308s to the clean path, sitemap 18 locs with no ?lang=, YTHS card shows the fallback in en/fi/sv. Main's browser checks red since #17 (three locators still asked for a button); fixed in both PRs, all green.
- 8.11:
  - **Production:** FEEDBACK_TO=hello@mielenreitti.fi and FEEDBACK_FROM=feedback@send.mielenreitti.fi in Vercel. A test from the live site arrived at hello@ (08:47 UTC). E17 closed.
  - **#10 merged and deployed:** /privacy is live in fi/sv/en and in the sitemap; the footer reads "Nothing is sent unless you choose to send feedback". Its six notice tests pass against production; domain:verify is clean.
- 9.11 (evening): #15, #17, #16, #18 merged in Amir's order (#12, #14 were already in). Live: no banner, /about, pre-rendered pages, new title; fi/sv guide drafts 404 in production as gated. #19 opened.
- 9.11 (afternoon): #15, #16, #17, #18 opened for Amir's five points. The Kela and LVV letters were sent at 10:05–10:06 (company-ops session).
- 9.11: #12 and #13 merged by Amir and live: the meta description, and five English guides at /en/guides with footers linking to /privacy.
- 9.11: merge rule (memory): merge on reviewer approval, on Amir's "merge", or merge and deploy on "go live".
- 9.11: #14 merged (CLAUDE.md: read and tick the status page every session).
- 8.11: #11 merged (D-41, D-42).
- **Live:** `362a7e8`.

## 3. Open from before
- The two rules-sheet contradictions stay unchanged until the clinician answers (Amir, 9.11); a safety question for everyone would be an add-instrument task, on the clinician's direction only.
- YTHS card's "Run by" line is one string in every language, so fi/sv readers see (FSHS); a per-language operator is a small PR if Amir wants it.
- Native-speaker pass on FI/SV copy (B8: `pro.*`, `privacy.*`, `guide.*`, `meta.description`, `app.onDevice`); clinician review (C1); WHO-5 licence (C2); E4
- The refresh job (monthly source checks), after Kela's answer
- InfoFinland still lists MIELI's closed English line (Amir to report)
