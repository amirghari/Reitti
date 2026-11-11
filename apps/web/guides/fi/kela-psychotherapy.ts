import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const kelaPsychotherapyFi: Guide = {
  lang: 'fi',
  slug: 'kelan-kuntoutuspsykoterapia',
  title: 'Kelan kuntoutuspsykoterapia: kuka voi saada ja miten haetaan',
  description: 'Kuka voi saada Kelan korvaamaa kuntoutuspsykoterapiaa, miten sitä haetaan lomakkeella KU 131, paljonko Kela korvaa käynniltä ja kuinka kauan.',
  checkedOn: '2026-11-09',
  intro: [
    'Kela korvaa osan pidemmän psykoterapian kustannuksista, kun mielenterveyden häiriö uhkaa työ- tai opiskelukykyäsi. Tätä kutsutaan kuntoutuspsykoterapiaksi. Tällä sivulla ovat Kelan omat ehdot ja korvausmäärät, ja jokainen tieto on linkitetty Kelan sivulle.',
  ],
  sections: [
    {
      heading: 'Kuka voi saada',
      body: [
        'Kelan mukaan voit saada Kelan korvaamaa psykoterapiaa, jos [[kela-fi]]',
        {
          list: [
            'olet 16–67-vuotias [[kela-fi]];',
            'työ- tai opiskelukykysi on uhattuna mielenterveyden häiriön vuoksi [[kela-fi]];',
            'sinulla on todettu mielenterveyden häiriö, johon olet saanut asianmukaista hoitoa vähintään 3 kuukauden ajan [[kela-fi]];',
            'psykiatrin lausunnon perusteella voidaan arvioida, että kuntoutuspsykoterapia on tarpeen. Hakemukseen tarvitaan B-lausunto, BC-lausunto tai kuntoutussuunnitelma, joka ei saa olla yli vuotta vanhempi [[kela-fi]].',
          ],
        },
        'Kelan etuusohjeen mukaan asiakkaan on lisäksi oltava Suomessa sairausvakuutuslain mukaan vakuutettu [[kela-guideline]].',
      ],
    },
    {
      heading: 'Hakeminen',
      body: [
        'Täytä lomake KU 131 ja lähetä se liitteineen OmaKelassa tai postitse osoitteeseen Kela, PL 10, 00056 KELA [[kela-fi]].',
        'Hae kuntoutuspsykoterapiaa ennen kuin terapia alkaa, kuitenkin aikaisintaan 2 kuukautta ennen terapian aloitusta. Kela voi korvata terapiaa aikaisintaan sen kuukauden alusta, jolloin hakemuksesi on saapunut Kelaan [[kela-fi]].',
        'Kaksi kustannusta jää sinun maksettavaksesi. Tutustumiskäynnit mahdollisten terapeuttien luona maksat itse [[kela-fi]], eikä Kela korvaa kuntoutuskustannuksena hakemusta varten tehtyä lääkärinlausuntoa. Lääkärinpalkkiosta voi kuitenkin olla mahdollista saada sairausvakuutuslain mukainen korvaus [[kela-guideline]].',
      ],
    },
    {
      heading: 'Korvauksen määrä',
      body: [
        'Kela korvaa kiinteän summan käyntikerralta [[kela-amounts]]:',
        {
          table: {
            head: ['Terapia', 'Kelan korvaus'],
            rows: [
              ['Yksilöpsykoterapia', '57,60 euroa käyntikerralta [[kela-amounts]]'],
              ['Ryhmäterapia', '42,05 euroa käyntikerralta [[kela-amounts]]'],
              ['Perhe- tai paripsykoterapia, 1 tunnin käynti', '63,91 euroa [[kela-amounts]]'],
              ['Perhe- tai paripsykoterapia, 1,5 tunnin käynti', '95,87 euroa [[kela-amounts]]'],
            ],
          },
        },
        'Kelan sivulla ei kerrota, mistä päivästä alkaen nämä määrät ovat voimassa [[kela-amounts]]. Korvaus on usein pienempi kuin terapiakäynnin hinta, joten voit joutua maksamaan osan hinnasta itse [[kela-fi]]. Helmikuussa 2025 Kela kertoi, että käynnin hinta liikkuu sadan euron molemmin puolin ja että asiakkaan omavastuuosuus voi olla noin 40–60 euroa käynniltä [[kela-stats]]; hinnat ovat voineet muuttua sen jälkeen.',
        'Yleensä terapeutti vähentää korvauksen suoraan terapiakäynnin hinnasta. Jos et saa korvausta terapiakäynnillä, voit hakea sitä jälkikäteen lomakkeella KU 204 kuuden kuukauden kuluessa siitä, kun olet maksanut kustannukset [[kela-fi]].',
      ],
    },
    {
      heading: 'Kuinka kauan terapiaa korvataan',
      body: [
        'Kela korvaa enintään 80 käyntikertaa vuodessa ja kaikkiaan enintään 200 käyntikertaa, ja kuntoutuspsykoterapiaa voi saada enintään 3 vuoden ajan [[kela-fi]]. Toiselle ja kolmannelle vuodelle hoitavan lääkärin lausunto riittää, jos terapia on toteutunut suunnitellusti [[kela-fi]]. Erityisin perustein Kela voi myöntää kuntoutuspsykoterapiaa uudelleen enintään 3 vuodeksi, jos edellisen jakson päättymisestä on kulunut vähintään 5 vuotta [[kela-fi]].',
      ],
    },
    {
      heading: 'Terapeutin löytäminen',
      body: [
        'Voit etsiä terapeuttia Kelan palveluntuottajahausta. Haussa ovat vain ne Kelan hyväksymät terapeutit, jotka ovat halunneet ilmoittaa yhteystietonsa hakupalveluun [[kela-fi]]. Kelan englanninkielisen sivun mukaan haku on käytettävissä suomeksi ja ruotsiksi [[kela-rehab-en]]. Kela voi järjestää vieraan kielen tulkkausta yksilöterapiaan, mutta ei pari-, perhe- tai ryhmäterapiaan [[kela-guideline]].',
      ],
    },
    {
      heading: 'Lapset ja nuoret: terapiatakuu on eri reitti',
      body: [
        'Lasten ja alle 23-vuotiaiden nuorten perusterveydenhuoltoon kuuluva lyhytpsykoterapia tai psykologiseen vuorovaikutukseen perustuva määrämuotoinen ja aikarajoitteinen psykososiaalinen hoito on 1.5.2025 alkaen aloitettava 28 vuorokauden kuluessa siitä, kun tarve hoidolle on todettu [[finlex-1107]]. Kyse on julkisesta terveydenhuollosta, ei Kelasta: hoitoon hakeudutaan oman terveysaseman tai opiskeluterveydenhuollon kautta.',
      ],
    },
  ],
  sources: cite('kela-fi', 'kela-guideline', 'kela-amounts', 'kela-stats', 'kela-rehab-en', 'finlex-1107'),
};
