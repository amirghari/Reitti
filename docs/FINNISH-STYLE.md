# Finnish and Swedish style for Mielenreitti

Applies to every Finnish and Swedish text on mielenreitti.fi: the app, the guides, the site's pages
and replies to people who write to us. Written 9.11.2026 from Amir's decision of that day, using what
Tiski's native reviewer taught us on 2.11.2026 (company-ops and quote-desk-demo
`docs/FINNISH-STYLE.md`). **The native reviewer has the last word:** his corrections come back into
this file as rules and examples.

## Who we are talking to

**Mielenreitti speaks to one person.** Someone looking for mental-health help, often on their own,
sometimes in distress. So:

- **Finnish uses sinä, everywhere**: the app, the guides, the about and privacy pages. *voit, saat,
  sinun, ota yhteyttä, vastauksesi*. Not *voitte, saatte, teidän, ottakaa yhteyttä, vastauksenne*.
- **Swedish uses du, everywhere**, as Finland-Swedish public services write (FPA, Psykporten,
  MIELI).
- **Buttons and menu commands keep the short command form:** "Aloita", "Katso kaikki palvelut",
  "Börja", "Se alla tjänster".

Tiski's file uses te because Tiski writes to companies. That rule does not apply here.

## Rules

1. **Write the official concept, not a translation of the English word.** Use the word the official
   page uses for the thing:
   - Finnish: *kuntoutuspsykoterapia, hoitotakuu, terapiatakuu, lähete, omavastuu, hyvinvointialue,
     opiskeluterveydenhuolto, työterveyshuolto, Kriisipuhelin*.
   - Swedish: *FPA, rehabiliterande psykoterapi, vårdgaranti, terapigaranti, remiss, självrisk,
     välfärdsområde, studerandehälsovård, företagshälsovård*.
   When an English word comes to mind first, find the official page in that language and take its
   word. If no page settles it, mark the text for the reviewer. Don't guess.
2. **Names are the services' own.** Mielenterveystalo is **Psykporten** in Swedish (its own Swedish
   name, Amir 9.11.2026). Kela is **FPA** in Swedish. YTHS is **SHVS** in Swedish.
3. **"jokin tieto" when one detail is missing**, not a bare "tieto", which reads as all of it.
4. **Short labels the way public services label them.** Take Kela's, THL's or Mielenterveystalo's own
   headings as the model, not an English label put into Finnish.
5. **Figures and quotes come from the page in that language** where one exists, linked with its
   date; not translated back from the English page.

## How a new Finnish or Swedish text is made

1. Write it in that language from the start, from the official pages in that language.
2. Check it against this file.
3. **Nothing in Finnish or Swedish goes public before the native reviewer has read it.** The guides
   enforce this in code: `GUIDES_PUBLISHED` in `apps/web/guides/index.ts`. The app's machine-drafted
   copy carries `_needsNativeReview` in its bundles.
4. Keep the meaning. A language fix must not change what a sentence promises, least of all on the
   privacy pages or about crisis help.
