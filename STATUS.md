# Status, Reitti / Mielenreitti (updated 9.11.2026)

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
1. **PR #15**: no banner, quiet review line, /about (points 1+3, D-43). Preview linked in the PR.
2. **PR #17**: pre-render (point 2). Stacked on #15: merge #15 first. When #15 merges, retarget #17 to main before its branch is deleted.
3. **PR #16**: legitimate-interest assessment draft for the lawyer (point 5); "immediate" vs "7 days" removal wording.
4. **PR #18**: fi/sv guide drafts (point 4), not public until the native reviewer has read them; questions in docs/FINNISH-STYLE.md.
5. **First winter** guide (yours); lawyer list (docs/open-items.md 2a).

## 2. Done
- 8.11:
  - **Production:** FEEDBACK_TO=hello@mielenreitti.fi and FEEDBACK_FROM=feedback@send.mielenreitti.fi in Vercel. A test from the live site arrived at hello@ (08:47 UTC). E17 closed.
  - **#10 merged and deployed:** /privacy is live in fi/sv/en and in the sitemap; the footer reads "Nothing is sent unless you choose to send feedback". Its six notice tests pass against production; domain:verify is clean.
- 9.11 (afternoon): #15, #16, #17, #18 opened for Amir's five points. The Kela and LVV letters were sent at 10:05–10:06 (company-ops session).
- 9.11: #12 and #13 merged by Amir and live: the meta description, and five English guides at /en/guides with footers linking to /privacy.
- 9.11: merge rule (memory): merge on reviewer approval, on Amir's "merge", or merge and deploy on "go live".
- 9.11: #14 merged (CLAUDE.md: read and tick the status page every session).
- 8.11: #11 merged (D-41, D-42).
- **Live:** `362a7e8`.

## 3. Open from before
- Native-speaker pass on FI/SV copy (B8: `pro.*`, `privacy.*`, `guide.*`, `meta.description`, `app.onDevice`); clinician review (C1); WHO-5 licence (C2); E4
- The refresh job (monthly source checks), after Kela's answer
- InfoFinland still lists MIELI's closed English line (Amir to report)
