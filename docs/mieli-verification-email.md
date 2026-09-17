# Verification email to MIELI ry

**Status: BLOCKING. Send today.** **Open items:** M1–M4 in [`docs/open-items.md`](open-items.md).

The crisis panel currently shows an English number that no human at MIELI has confirmed. The
previous number was not confirmed either, so this is not a regression, but it is not a state to sit
in: only MIELI replying closes it. Nothing else in the adoption plan comes before this.

Send to MIELI ry's info address (`info@mieli.fi` at the time of writing — check the current address
on mieli.fi/yhteystiedot before sending). Finnish version first; the English one below is for
forwarding, not for sending instead.

**Why this is worth the five minutes.** Four numbers in `config/crisis.json` are the only thing in
Reitti where being wrong reaches somebody directly. Everything else routes to a waiting list. These
route to a phone, at the moment a person has the least capacity to work out why nobody answered.
MIELI's own pages disagree about which number serves English, so this cannot be settled by reading
the site more carefully.

**Before sending:** replace `[nimesi]` / `[your name]` and `[sähköposti]` / `[your email]`.

---

## Finnish

> **Aihe:** Kriisipuhelimen numeroiden ja aukioloaikojen varmistus (maksuton palveluopas Reitti)
>
> Hei,
>
> Olen [nimesi] ja olen tehnyt Reitin, maksuttoman verkkosivun, joka auttaa Suomessa asuvia
> löytämään mielenterveyspalveluita. Se on ei-kaupallinen, siihen ei kirjauduta eikä se kerää
> käyttäjistä tietoja. Kun sivu tunnistaa, että tilanne voi olla kiireellinen, se näyttää MIELIn
> Kriisipuhelimen numerot ja hätänumeron 112.
>
> Haluaisin varmistaa numerot ja ajat teiltä suoraan, koska sivuiltanne löytyy niistä keskenään
> ristiriitaista tietoa enkä halua ohjata ketään numeroon, johon ei vastata.
>
> Neljä kysymystä:
>
> 1. **Minkä numeron haluatte englanninkielisenä Kriisipuhelimena?** Löysin kolme keskenään
>    ristiriitaista tietoa omilta sivuiltanne:
>    - Uutisenne "New opening hours for MIELI Crisis Helpline" (12.5.2025) kertoo numeron
>      **09 2525 0116**, ajat ma 16–20 sekä to ja pe 9–13.
>    - Osa muista sivuistanne kuvaa numeroa **09 2525 0113** englanninkielisenä linjana eri
>      aukioloajoilla.
>    - Englanninkielinen yhteystietosivunne (mieli.fi/en/contact-information/) listaa vain
>      suomenkielisen 09 2525 0111 (24 h) ja ruotsinkielisen 09 2525 0112 **eikä mainitse
>      englanninkielistä linjaa lainkaan**.
>
>    Mikä näistä on oikein?
> 2. **Mikä numero 09 2525 0113 on tällä hetkellä ja mitkä ovat sen ajat?** Emme näytä sitä tällä
>    hetkellä lainkaan, koska emme saaneet sitä varmistettua.
> 3. **Ovatko ruotsinkielisen Kristelefonin (09 2525 0112) ajat edelleen ma ja ke 16–20 sekä ti, to
>    ja pe 9–13?**
> 4. **Päivystääkö 09 2525 0111 edelleen suomeksi ympäri vuorokauden?** Ja ovatko numerot
>    09 2525 0114 (ukraina) ja 09 2525 0115 (venäjä) käytössä, ja mitkä ovat niiden ajat?
>
> Lisäksi: sopiiko teille, että näytämme numeronne, ja onko teillä sivua tai listaa, jota
> kannattaisi seurata, kun ajat muuttuvat? Päivitämme tiedot mielellämme heti.
>
> Sivu on osoitteessa https://reitti-seven.vercel.app. Se ei ole vielä kliinisesti tarkistettu, ja
> sivulla kerrotaan se.
>
> Kiitos työstänne, ja kiitos ajastanne.
>
> Ystävällisin terveisin
> [nimesi]
> [sähköposti]

---

## English

> **Subject:** Confirming Crisis Helpline numbers and opening hours (Reitti, a free service guide)
>
> Hello,
>
> I'm [your name]. I built Reitti, a free web page that helps people living in Finland find mental
> health services. It is non-commercial, has no accounts, and collects nothing about the people who
> use it. When the page sees that a situation may be urgent, it shows MIELI's Crisis Helpline
> numbers and the emergency number 112.
>
> I would like to confirm the numbers and hours with you directly, because your own pages give
> conflicting information and I do not want to send anyone to a line that will not answer.
>
> Four questions:
>
> 1. **Which number do you want listed as the English-language Crisis Helpline?** Your own pages
>    gave me three different answers:
>    - Your news item "New opening hours for MIELI Crisis Helpline" (12.5.2025) gives
>      **09 2525 0116**, Mondays 16–20 and Thursdays and Fridays 9–13.
>    - Some of your other pages describe **09 2525 0113** as an English line with different hours.
>    - Your English contact page (mieli.fi/en/contact-information/) lists only Finnish 09 2525 0111
>      (24hrs) and Swedish 09 2525 0112, and **does not mention an English line at all**.
>
>    Which of these is right?
> 2. **What is 09 2525 0113 now, and what are its hours?** We are not showing it at all at the
>    moment, because we could not confirm it.
> 3. **Are the Swedish Kristelefon (09 2525 0112) hours still Mon and Wed 16–20, Tue, Thu and Fri
>    9–13?**
> 4. **Is 09 2525 0111 still answered in Finnish around the clock?** And are 09 2525 0114
>    (Ukrainian) and 09 2525 0115 (Russian) in service, with what hours?
>
> Also: are you happy for us to list your numbers, and is there a page or a list we should follow so
> we catch changes to the hours? We will update the same day.
>
> The site is at https://reitti-seven.vercel.app. It has not been clinically reviewed yet, and the
> site says so.
>
> Thank you for the work you do, and for your time.
>
> Best regards,
> [your name]
> [your email]

---

## When they reply

1. Correct `config/crisis.json`: numbers, `hours`, `sourceUrl`, `sourceReadOn`.
2. Set `verified: true` **only** on the lines MIELI confirmed in writing, and paste the confirmation
   date into `verifyNote`. A line they did not mention stays `false`.
3. Either promote a `pendingVerification` number into `resources` with real hours, or delete it.
4. Update the `crisis.mieli-*.name` strings in all three `config/i18n/clinical/` bundles if a
   language label changed.
5. Close M1–M4 in `docs/open-items.md` and move them to section 6.
6. `npm test && npm run typecheck && npm run test:a11y`.
