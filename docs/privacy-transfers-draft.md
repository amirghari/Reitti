# Draft for Amir: who handles the professionals' data, and the transfer basis

**Not in the page yet.** The privacy page says the basis "is still being confirmed" until Amir approves
wording below (`TRANSFERS_CONFIRMED` and `PRIVACY_WORDING_APPROVED` in `apps/web/pages/data.ts`).
Researched 6.11.2026 from each provider's own pages. The dates are the ones printed on those pages.

## What is true today

| # | Fact | Source | Date on the page |
|---|---|---|---|
| 1 | Vercel's processor terms (the DPA, with the 2021 SCCs) apply "for Customers who are on Enterprise and Pro plans". Hobby is not covered; Vercel is then controller under its own Privacy Notice. | https://vercel.com/legal/dpa | Updated 17.3.2026, effective 31.3.2026 |
| 2 | Vercel processes primarily in the US and "anywhere else in the world" its sub-processors operate. Static pages are cached on its worldwide CDN; pinning functions to an EU region (fra1, arn1) does not keep the data in the EU. | https://vercel.com/legal/dpa, https://vercel.com/docs/functions/configuring-functions/region | 17.3.2026; 11.8.2026 |
| 3 | Hobby is for "personal or non-commercial use" only, and on Hobby Vercel may use deployed content for AI model training unless opted out in Team settings. | https://vercel.com/legal/terms | Updated 19.10.2026 |
| 4 | Vercel Inc. is an **active** participant of the EU-U.S. Data Privacy Framework (participant 6847, next due 29.4.2027). | https://www.dataprivacyframework.gov/participant/6847 | Read 6.11.2026 |
| 5 | GitHub's Data Protection Agreement covers services "under a written and executed agreement" (GitHub Customer Agreement). A free personal account has none; GitHub is then controller under its Privacy Statement, and GitHub.com stores data in the US. EU data residency needs GitHub Enterprise. | https://github.com/customer-terms/github-data-protection-agreement, https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement | Version October 2025; effective 27.4.2026 |
| 6 | GitHub is an **active** DPF participant (6174, next due 3.8.2027). | https://www.dataprivacyframework.gov/participant/6174 | Read 6.11.2026 |
| 7 | Google Workspace's Cloud Data Processing Addendum is part of the Workspace agreement accepted at sign-up; with a Finnish billing address the contracting party is Google Cloud EMEA Ltd (Dublin). Transfers to the US rely on Google LLC's DPF certification, otherwise SCCs. The EU data region needs Business Standard or higher, and covers stored data only. | https://cloud.google.com/terms/data-processing-addendum, https://cloud.google.com/terms/alternative-transfer-solution, https://knowledge.workspace.google.com/admin/compliance/choose-a-geographic-location-for-your-data | 30.10.2026; 29.9.2026; 26.10.2026 |
| 8 | Google LLC is an **active** DPF participant (5780, next due 13.9.2027). | https://www.dataprivacyframework.gov/participant/5780 | Read 6.11.2026 |
| 9 | Until the MX records move, mail for mielenreitti.fi is handled by Zoner (mx1/mx2.zoner.fi), a Finnish host. | `dig MX mielenreitti.fi` | 6.11.2026 |

So the one basis that holds on any plan is the **EU-U.S. Data Privacy Framework adequacy decision
(GDPR Article 45)**. Nothing makes the data stay in the EU.

## Proposed wording (section "Who else handles it", after the sentence already there)

**English**

> Vercel Inc., GitHub, Inc. and Google LLC are US companies, so the data is processed outside the
> EU and EEA, in the United States and other countries where they operate, and Vercel serves the
> public pages from servers around the world. These transfers rely on the European Commission's
> adequacy decision for the EU-U.S. Data Privacy Framework (GDPR Article 45): all three are active
> participants on the official list at dataprivacyframework.gov.

Add only if the Vercel team is on **Pro**: "Vercel processes the data on our behalf under its data
processing agreement, which also contains the EU Standard Contractual Clauses." Add in any case, once
mail has moved to Workspace: "Google processes email on our behalf under its data processing
agreement." Never write that GitHub processes the data on our behalf: on a personal account it does
not.

**Suomi**

> Vercel Inc., GitHub, Inc. ja Google LLC ovat yhdysvaltalaisia yrityksiä, joten tietoja käsitellään
> EU:n ja ETA:n ulkopuolella, Yhdysvalloissa ja muissa maissa, joissa ne toimivat, ja Vercel välittää
> julkiset sivut palvelimilta eri puolilta maailmaa. Siirrot perustuvat Euroopan komission
> tietosuojan riittävyyttä koskevaan päätökseen EU:n ja Yhdysvaltojen välisestä tietosuojakehyksestä
> (tietosuoja-asetuksen 45 artikla): kaikki kolme ovat voimassa olevia osallistujia virallisessa
> luettelossa osoitteessa dataprivacyframework.gov.

**Svenska**

> Vercel Inc., GitHub, Inc. och Google LLC är amerikanska företag, så uppgifterna behandlas utanför
> EU och EES, i USA och andra länder där de verkar, och Vercel levererar de offentliga sidorna från
> servrar runt om i världen. Överföringarna bygger på Europeiska kommissionens beslut om adekvat
> skyddsnivå för ramen för dataskydd mellan EU och USA (artikel 45 i dataskyddsförordningen): alla tre
> är aktiva deltagare i den officiella förteckningen på dataprivacyframework.gov.

## For Amir to decide or do first

1. **Which Vercel plan is the team on?** If Hobby: the DPA does not apply, Hobby is for non-commercial
   use only (is the directory, next to the HUS pitch, non-commercial?), and the AI-training opt-out in
   Team settings should be switched off. If Pro: nothing to sign; email privacy@vercel.com to get
   sub-processor notices.
2. **GitHub:** accept that GitHub is its own controller for a personal account (DPF as the basis), or
   move Reitti-data under a GitHub Customer Agreement, or keep the data elsewhere.
3. **Workspace:** sign up with the Finnish billing address. Publish the Google sentence only once the
   MX records point at Google; until then the mail host is Zoner, in Finland.
4. Recheck the DPF list before the next due dates: Vercel 29.4.2027, GitHub 3.8.2027, Google 13.9.2027.

Not verified: where Vercel runs builds and stores logs (community logs say Washington, D.C.), and the
locations on Vercel's sub-processor list (the page renders only with JavaScript).
