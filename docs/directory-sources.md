# Directory sources: what each allows, what we take, how often

Phase A, step one of `docs/next-phase.md`. Every source was read at the source on **6.11.2026**:
its terms, its robots.txt, whether it offers an official feed, and what it actually shows. **No
importer exists yet and none runs until Amir has read this note** (his instruction, 6.11.2026).
Quotes are word for word; translations are ours.

## The short version

| Source | Terms allow reuse? | robots.txt | Official feed | Contact details | Our proposal |
|---|---|---|---|---|---|
| Kela, kuntoutuspsykoterapian palveluntuottajahaku | Yes, with the source named | Search page not disallowed | None found | Only what each therapist chose to show | Ask Kela for a feed first; meanwhile by hand or a slow, attributed read, on Amir's word |
| JulkiSoteri (LVV) | Not stated anywhere | None served | None found | **Not published yet** | Per-entry check only, no import; ask LVV |
| JulkiTerhikki (Valvira/LVV) | Not read yet | Not read yet | n/a | n/a | Read before the first licence check, which is by hand |

## 1. Kela: kuntoutuspsykoterapian palveluntuottajahaku

**Where.** <https://www.kela.fi/hae-palveluntuottajaa>. The old search was retired on 31.12.2025
and replaced by this one ([Kela, 13.1.2026](https://www.kela.fi/ajankohtaista/kelan-kuntoutuksen-palveluntuottajahaku-on-uudistunut)).
It is a client-side app: the page itself carries no data, the browser fetches it from a background
interface that Kela does not document or offer for reuse.

**What it allows.** Kela's "Tietoa palvelusta" page, under *Tekijänoikeudet*: *"Verkkopalvelun
tekijänoikeudet ja muut oikeudet kuuluvat Kelalle. Tästä huolimatta kela.fin sisällöt ovat vapaasti
hyödynnettävissä, kunhan ilmoittaa lähteen ja huolehtii omien sivujensa ylläpidosta. Voit myös
vapaasti linkittää Kelan sivuille."* (The content may be reused freely as long as the source is named
and our own pages are kept up to date; linking is free.) <https://www.kela.fi/tietoa-palvelusta>.
robots.txt disallows nine paths (`/web/apteekki/` and others, `/etti/`), **not** `/hae-palveluntuottajaa`.
No open-data set or published API for the provider search was found.

**What it shows, and why that matters.** Since spring 2026 **each therapist decides what the search
shows**: *"kuntoutuspsykoterapian palveluntuottajien täytyy itse valita, mitkä tiedot näkyvät
palveluntuottajahaussa"*, and they can add price level, whether they take new clients, and whether
remote therapy is possible ([Kela, 13.1.2026](https://www.kela.fi/ajankohtaista/kelan-kuntoutuksen-palveluntuottajahaku-on-uudistunut));
since 7.5.2026 they maintain it themselves, including *"hintatiedot, jonotusaika ja tieto
mahdollisuudesta etävastaanottoon"* ([Kela, 7.5.2026](https://www.kela.fi/ajankohtaista/kuntoutuspsykoterapian-palveluntuottajille-on-otettu-kayttoon-uusi-asiointipalvelu)).
A therapist who chose not to be shown can still be Kela-approved; Kela's own guide says to check
approval separately. So the search is a record of *what each therapist agreed to show to people
looking for therapy*, which is close to our purpose, but they agreed to it for Kela's search, not ours.

**What we would take.** Only fields the therapist chose to show: name, title, therapy method and
orientation, languages, municipality, website or booking link and phone or email if shown, price
level, waiting time, remote yes/no, new clients yes/no. Never the background interface's other
fields, whatever they contain. Every page names Kela as the source with the date read, as the terms
require.

**Refresh.** Monthly, and only by the refresh job's re-read; an entry missing from Kela at a refresh
is marked `stale` and hidden after 60 days (`docs/next-phase.md`).

**Proposal for Amir.** Kela's terms do not forbid automated reading, so the plan's rule ("if a source
forbids it, we don't") does not stop it. Two things still argue for asking first: the data comes
through an interface Kela never offered for reuse and can change without notice (the search is still
being redesigned in 2026), and the therapists consented to Kela's listing, not ours. So: **(a)** write
to Kela asking whether the provider search data may be reused and whether a feed exists; **(b)** until
they answer, either enter the first city's therapists by hand from the public search, or, on your word,
an importer that reads one search result page at a time with a pause, names Kela, and keeps nothing it
was not shown. Your call; nothing runs before it.

## 2. JulkiSoteri (Lupa- ja valvontavirasto)

**Where.** <https://julkisoteri.soteri.lvv.fi/>, the public view of the Soteri register of private
social and health care providers, their service points and services; described at
<https://lvv.fi/sosiaali-ja-terveydenhuolto/julkisoteri>. Also a client-side app with no published
interface.

**What it allows.** **No terms of use are published**: none on the service, none linked from LVV's
JulkiSoteri page or its footer (which links only Tietosuoja and Saavutettavuusseloste), no sitemap.
**The service serves no robots.txt** (the address returns the app's own page). LVV's main site asks
crawlers for `crawl-delay: 5`. No open-data set or API was found.

**What it shows.** Providers (by name, Y-tunnus, OID), service points and service types, searchable
by sector, field and municipality. Two limits LVV states itself: *"Palvelussa ei vielä julkaista
kaikkia valvontalain mukaisia tietoja. Tiedoissa voi olla puutteita tai korjaustarpeita"*, and
**"Alkuvaiheessa julkisessa tietopalvelussa ei julkaista palveluntuottajien yhteystietoja."** (At
first, providers' contact details are not published.) It lists businesses and service points, not
licensed people: it does not say who is a psychologist or psychotherapist.

**What we would take.** Per entry, as a check: is this provider registered, its Y-tunnus, the
municipality of its service point, and the date checked. Not contact details (there are none), not
a list of providers.

**Refresh.** At each entry's re-check, alongside Kela's monthly refresh.

**Proposal for Amir.** With no terms and no contact details, JulkiSoteri cannot be the importer the
plan imagined yet. Use it **one entry at a time, by hand or one request per entry with a pause**, to
confirm a provider is registered, and **write to LVV** asking for their reuse terms and whether a feed
is planned. Revisit when LVV publishes contact details.

## 3. JulkiTerhikki (licence checks)

Not read in this step; the plan uses it one professional at a time, never in bulk. Its terms and
robots.txt are read before the first licence check, and noted here then.

## Personal data, for all three

These are named people, so this is personal data whatever the source's copyright terms say. Legal
basis: legitimate interest (helping people find licensed help), with the Article 14 notice on every
page, removal within 7 days, and no field beyond what the source shows or the professional adds
(`docs/next-phase.md`). **One finding the plan did not anticipate: this repository is public.** A
dataset of professionals committed here would be published on GitHub alongside the site, and git
history would keep a removed person's details for good, which cannot meet "removed within 7 days".
`docs/directory-data-model.md` proposes keeping the dataset out of this repository.
