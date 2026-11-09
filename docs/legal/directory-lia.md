# Legitimate-interest assessment: the professionals directory

**Draft for the lawyer, 9.11.2026.** Not legal advice, and not final until a lawyer has read it. No
real professional page goes public before that (Amir, 9.11.2026). Controller: Amir Ghari, Helsinki,
tietosuoja@mielenreitti.fi (D-40). Basis assessed: GDPR Article 6(1)(f).

## 1. Purpose: is there a legitimate interest?

**The interest.** Helping people in Finland find licensed mental-health professionals who fit them:
their languages, methods, whether Kela reimburses them, and how to reach them. Today that
information is scattered. Kela's provider search is in Finnish and Swedish only and lists only
Kela-approved therapists ([Kela](https://www.kela.fi/rehabilitative-psychotherapy), read 8.11.2026).

**Whose interest.** The public's (access to care), the professionals' (being found by clients), and
the controller's (running the service). **A commercial interest comes later:** paid claimed profiles
(`docs/next-phase.md`, Phase B). It is not pursued now, and the privacy page will name it before it
starts.

**Legitimate?** Lawful, specific and real: the service exists, and the information it lists is
already public for exactly this use, which is clients finding a professional.

## 2. Necessity: is this processing needed for that purpose?

- **A directory cannot work without** the name, title, city, languages and a way to make contact.
- **Only what a public source shows, or the professional adds.** Name, licensed title, languages,
  city and wellbeing services county, methods, Kela provider status, remote sessions, new clients,
  waiting time and prices as stated, and the website, booking link, phone, email and business ID the
  source gives. Also the source of each field and the date it was checked.
- **Never:** a personal identity code, a home address, anything about the professional's health,
  ratings or reviews. The business ID is kept for matching but never shown.
- **Less intrusive options considered.** Linking to Kela's search alone fails readers who need
  another language and gives no free-first context. Listing practices only, not people, fails the
  many professionals who work alone under their own name.

## 3. Balancing: do the professional's rights override the interest?

| Factor | Assessment |
|---|---|
| Nature of the data | Professional data a person published to be found by clients. Kela's search shows what each therapist chose to show (since spring 2026). The licence register is public by law. Low sensitivity |
| Reasonable expectations | Listing in another directory is foreseeable but not certain. Hence the notice before publication and the right to refuse (section 4). Kela was asked on 9.11.2026 whether it agrees to reuse with attribution |
| Possible harm | An unwanted listing; outdated or wrong details shown under the person's name; contact from clients the person did not seek |
| Possible benefit | Clients who need the person's language or method can find them; free help is shown first |
| Power and vulnerability | The data subjects are licensed professionals acting in their professional role, not vulnerable individuals |

## 4. Safeguards

1. **Professional public data only**, from official sources or the professional, per field, dated.
2. **Notice before publication.** v1 lists only professionals whose source gives an email address.
   Each is emailed the Article 14 notice **at least 14 days before** their page goes live; an
   objection in that time means the page is never published (D-41, enforced in code).
3. **Removal.** At any time, on request: the page comes down and the address answers 410 Gone. The
   data is deleted within 7 days, earlier copies within 30. A coded suppression entry stops
   re-adding. *Amir's brief says "immediate removal": the takedown can be the same day, but the
   approved privacy page promises at most 7 days. The lawyer may want one wording.*
4. **Accuracy.** Each licence is checked by hand in JulkiTerhikki before listing, one entry at a time
   (the register shows a CAPTCHA after a few searches in a row: no bulk lookup). Sources are re-checked
   monthly by the refresh job; a listing the source drops is hidden at once and deleted after 60 days.
5. **Transparency.** The notice on every professional page, the directory privacy page, and
   claim and correction requests to tietosuoja@mielenreitti.fi.
6. **No profiling and no ranking by payment.** No ratings. No paid placement in clinical ordering
   (safety invariant 6). Nothing is decided about the professional by automated means.
7. **Gated.** No page is public until every production blocker is cleared, this assessment's
   approval among them.

## 5. Conclusion (draft)

With these safeguards, the interest in helping people find licensed help appears to outweigh the
limited impact on professionals whose data is already public for this purpose. **For the lawyer
to confirm.**

**Questions for the lawyer:**
- Does a reuse of Kela-search data stand under Article 6(1)(f) before Kela answers the letter of
  9.11.2026?
- Is "removal within 7 days" or "immediate removal" the right promise?
- Does the claim line in the notice email need changing before claimed profiles are paid?
- The transfer basis (Vercel, GitHub, Google; `docs/privacy-transfers-draft.md`).
