# Status, Reitti / Mielenreitti (updated 9.11.2026)

## 0. From "Mielenreitti status" (https://claude.ai/artifact/XcVQUkZ1bW5MJF7qfX8UJB), read 9.11.2026 (rev 6)
For the Reitti builder, none done yet. Ticked on the page when they are.
- [ ] After #13 merges: guide footers link to /privacy
- [ ] SEO steps 3–5 when Amir says: a path per directory entry (5–8 h), structured data and llms.txt (2–4 h), sitemap (1–2 h)
- [ ] Finnish and Swedish guides after the native reviewer's pass
- [ ] Real hand entries for the six cities, once Amir sends the Kela letter and says go; licence checked on each
- [ ] Refresh job with the monthly source check, after Kela answers
- [ ] Before the first real professional page: Vercel Pro and the GitHub Actions deploy, with the privacy notice's hosting lines updated in the same PR
- [ ] Later, not now: the pool counter, the share-code service

## 1. Waiting on Amir
1. **PR #12** (SEO 1, meta description "your answers never leave your phone"): merge on your word.
2. **PR #13** (SEO 2, five English guides): preview at reitti-alcbqj654…/en/guides. Merge on your word. When it merges, the guide footer can link to /privacy (live now).
3. **First winter:** docs/guides/first-winter-draft.md, yours to write.
4. **SEO 3–5:** a path per directory entry, JSON-LD and llms.txt, sitemap; estimates in the PR thread. Start on your word.
5. **Lawyer list:** docs/open-items.md 2a (L1 feedback consent, L2 legitimate-interest assessment, L3 register reuse).

## 2. Done
- 8.11:
  - **Production:** FEEDBACK_TO=hello@mielenreitti.fi and FEEDBACK_FROM=feedback@send.mielenreitti.fi in Vercel. A test from the live site arrived at hello@ (08:47 UTC). E17 closed.
  - **#10 merged and deployed:** /privacy is live in fi/sv/en and in the sitemap; the footer reads "Nothing is sent unless you choose to send feedback". Its six notice tests pass against production; domain:verify is clean.
- 9.11: #14 merged (CLAUDE.md: read and tick the status page every session).
- 8.11: #11 merged (D-41, D-42).
- **Live site:** `bec0ee5` (main is at `70887b3`, a docs-only change).

## 3. Open from before
- Native-speaker pass on FI/SV copy (B8: `pro.*`, `privacy.*`, `guide.*`, `meta.description`, `app.onDevice`); clinician review (C1); WHO-5 licence (C2); E4
- The refresh job (monthly source checks), after Kela's answer
- InfoFinland still lists MIELI's closed English line (Amir to report)
