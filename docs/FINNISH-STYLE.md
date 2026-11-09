# Finnish style for Mielenreitti

Applies to Finnish text on mielenreitti.fi: the guides, the site's pages, and replies to people who
write in Finnish. Adapted on 9.11.2026 from Tiski's file (company-ops and quote-desk-demo
`docs/FINNISH-STYLE.md`, written from a native reviewer's corrections of 2.11.2026). Amir decides
where the two differ.

The reviewer's verdict on Tiski was that the Finnish read as non-native for two reasons: it addressed
the reader with "sinä" where Finnish public text uses "te", and it translated English phrases word for
word. Both apply here.

## Rules

1. **te-form on the site's pages and in the guides** (Amir, 9.11.2026): *voitte, saatte, teidän,
   ottakaa yhteyttä, vastauksenne*. Not *voit, saat, sinun, ota yhteyttä*.
   - **Buttons and menu commands keep the short command form:** "Aloita", "Katso kaikki palvelut".
   - **The app itself still uses sinä** ("Vastauksesi pysyvät tällä laitteella"). Whether the app
     moves to te, or stays sinä because one person in distress reads it, is open question 1 below.
     Nothing in the app is switched until the reviewer answers.
2. **Write the Finnish concept, not a translation of the English word.** Use the word the official
   Finnish page uses for the thing: *kuntoutuspsykoterapia*, *hoitotakuu*, *terapiatakuu*,
   *lähete*, *omavastuu*, *hyvinvointialue*, *opiskeluterveydenhuolto*, *työterveyshuolto*,
   *Kriisipuhelin*. When an English word comes to mind first, find the official Finnish page and
   take its word. If no page settles it, mark the text for the reviewer. Don't guess.
3. **"jokin tieto" when one detail is missing**, not a bare "tieto", which reads as all of it.
4. **Short labels the way Finnish public services label them.** Headings such as "Jos jotain
   sattuu" are English labels in Finnish. Take Kela's, THL's or Mielenterveystalo's own headings as
   the model.
5. **Figures and quotes come from the Finnish page** where one exists, linked with its date; not
   translated back from the English page.

## Swedish

No reviewer has looked at our Swedish yet. Until one does: follow Finland-Swedish public usage
(Kela's, Mielenterveystalo's and MIELI's Swedish pages), which addresses the reader as **"du"**.
Use the Finland-Swedish official terms (*FPA*, *rehabiliterande psykoterapi*, *vårdgaranti*,
*välfärdsområde*, *studerandehälsovård*, *remiss*). Open question 2 below.

## How a new Finnish or Swedish text is made

1. Write it in that language from the start, from the official pages in that language, not from
   the English sentence.
2. Check it against this file.
3. **Nothing in Finnish or Swedish goes public before the native reviewer has read it.** The guides
   enforce this in code: `GUIDES_PUBLISHED` in `apps/web/guides/index.ts`.
4. Keep the meaning. A language fix must not change what a sentence promises, least of all on the
   privacy pages or about crisis help.

## Open questions for the reviewer

1. te on the site and in the guides; sinä in the app, which one person reads, often in distress.
   Should the app move to te as well, or stay sinä?
2. Swedish: "du", as Finland-Swedish public services write, or "ni"?
