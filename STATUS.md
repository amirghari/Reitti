# Status, Reitti / Mielenreitti (updated 6.11.2026, afternoon)

## 1. Waiting on Amir
1. **PR #1** (directory sources, data model, D-39, letters): updated with your answers. Merge when happy.
2. **PR #3** (page templates, stacked on #1): look at the protected preview first, https://reitti-7ojdmrozs-amirs-projects-b107307b.vercel.app/pro-pages/ (needs a Vercel login). Nothing in it is public, and merging changes nothing on the live site.
3. **Two decisions in PR #3:** the mailbox for claim and removal requests; whether pages should show step numbers (the app counts from 1, so your 4 and 5 show as 5 and 6).
4. **Send the two letters** in `docs/letters/` (Kela, LVV) from your own address; the recipient lines are placeholders. No Kela reader runs until Kela answers.
5. **Small CI fix:** the a11y job on main has hit its 20-minute timeout since 1.10. One-line PR raising it, on your word.

## 2. Done
- 6.11: PR #2 merged (session routine). PR #1 updated: D-39, the removal path, schema without psychiatrists plus a `sample` flag, the plan's reference corrected to docs/v2-decisions.md, letters to Kela and LVV
- 6.11: private `amirghari/Reitti-data` with five invented sample rows, an empty suppression list and the removal path
- 6.11: PR #3, templates for the professional and city pages (fi/sv/en), gated: noindex, no sitemap, production build refuses
- Live: `b1748b7` (12.10), unchanged today

## 3. Open from before
- Native-speaker pass on FI/SV copy (B8, now with the `pro.*` keys too); clinician review of all 23 directory entries (C1); WHO-5 licence legal check (C2); E4 regions field
