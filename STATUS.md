# Status, Reitti / Mielenreitti (updated 8.11.2026)

## 1. Waiting on Amir
1. **Mailbox weekend:**
   - `tietosuoja@` and `hello@mielenreitti.fi` on Google Workspace;
   - a test message to `tietosuoja@`;
   - Resend: verify mielenreitti.fi as a sending domain (DNS at Zoner);
   - then `FEEDBACK_TO` to `hello@` and a test from the live site.

   Then PR #10 merges.
2. **Notice email:** sender and the per-person routine (docs/letters/professional-notice.md). The 14 days are approved and now enforced in code.
3. **Transfer lines:** docs/privacy-transfers-draft.md, final wording when moving to Pro (D-42).
4. **Lawyer list:** docs/open-items.md section 2a (L1 consent for feedback, L2 legitimate-interest assessment, L3 register reuse).

## 2. Done
- 8.11:
  - #11 merged after review: publish only professionals with a sourced email, notified at least 14 days before (D-41); hosting stays Hobby until the first real page, then Pro (D-42, `ON_VERCEL_PRO` blocker).
  - #10 updated (hello@ on Google Workspace, footer line, lawyer list).
- Live: `65a8cd3` (no visible change).

## 3. Open from before
- Native-speaker pass on FI/SV copy (B8, with `pro.*`, `privacy.*` and `app.onDevice`); clinician review of the 23 directory entries (C1); WHO-5 licence (C2); E4
- The refresh job (monthly source checks), after Kela's answer
- InfoFinland still lists MIELI's closed English line (Amir to report)
