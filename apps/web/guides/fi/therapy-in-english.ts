import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const therapyInEnglishFi: Guide = {
  lang: 'fi',
  slug: 'terapia-englanniksi',
  title: 'Mielenterveyden hoitoa englanniksi Suomessa',
  description: 'Julkinen terveydenhuolto, opiskelu- ja työterveyshuolto, Kela ja yksityiset palvelut: mitä kunkin virallinen lähde kertoo englannin kielestä.',
  checkedOn: '2026-11-09',
  intro: [
    'Suomessa ei ole yhtä reittiä terapiaan. Alla ovat reitit, jotka ovat olemassa, ja se, mitä kunkin virallinen lähde kertoo englannin kielestä. Kun lähde lupaa tulkin eikä hoitoa englanniksi, kerromme sen.',
  ],
  sections: [
    {
      heading: 'Ensin oma sosiaali- ja terveyskeskus',
      body: [
        'InfoFinland neuvoo ottamaan ensin yhteyttä omaan sosiaali- ja terveyskeskukseen, jos teillä on kotikunta Suomessa [[infofinland]]. Perusterveydenhuoltoon hakeudutaan ottamalla itse yhteyttä palveluntuottajaan; lääkärin lähete tarvitaan erikoissairaanhoitoon [[mtalo-where]].',
        'Hoitoon pääsylle on laissa aikarajat. Arkipäivisin virka-aikana terveyskeskukseen on saatava yhteys saman päivän aikana, ja samana päivänä on saatava yksilöllinen arvio hoidon tarpeesta ja kiireellisyydestä [[stm-guidance]]. Hoitoon on päästävä viimeistään kolmessa kuukaudessa, ja alle 23-vuotiaiden viimeistään 14 vuorokaudessa, jos kyse on sairauden tai vamman tutkimuksesta tai hoidosta [[stm-hoitotakuu]]. Sääntely koskee samalla tavoin psyykkisiä ja fyysisiä terveysongelmia [[stm-guidance]].',
        'Mielenterveystyö avosairaanhoidon palveluissa on maksutonta, eikä hoitajakäynneistä saa periä maksua. Terveyskeskuslääkärin käynnin kertamaksu on vuonna 2026 enintään 30,20 euroa, ja sen voi periä 18 vuotta täyttäneeltä [[stm-fees]].',
        '**Englannin kielestä:** lukemamme julkisen terveydenhuollon sivut lupaavat tulkin, eivät englantia puhuvaa henkilökuntaa. Esimerkiksi Helsingin Mielenterveyspalvelupiste Mieppi palvelee maksutta yli 13-vuotiaita helsinkiläisiä ja voi käyttää tulkkia, jos äidinkielenne ei ole suomi tai ruotsi [[mieppi]].',
      ],
    },
    {
      heading: 'Nettiterapia on maksutonta, mutta ei englanniksi',
      body: [
        'Mielenterveystalon nettiterapia on julkisen terveydenhuollon tuottamaa, potilaalle maksutonta hoitoa, ja kuka tahansa lääkäri voi tehdä lähetteen nettiterapiaan [[mtalo-internet]]. Mielenterveystalon englanninkielisen sivun mukaan hoitoa on tällä hetkellä saatavilla vain suomeksi ja ruotsiksi [[mtalo-internet-en]].',
        'Omahoito-ohjelmat ovat eri asia: niitä voi käyttää ilmaiseksi, nimettömästi ja kirjautumatta, eikä diagnoosia tarvita [[mtalo-selfhelp]]. Osa ohjelmista on englanniksi, muun muassa ahdistukseen, masennukseen, unettomuuteen ja keskittymisvaikeuksiin [[mtalo-selfhelp-en]].',
      ],
    },
    {
      heading: 'Jos opiskelette yliopistossa tai ammattikorkeakoulussa',
      body: [
        'YTHS:n palvelujen piiriin kuuluvat yliopistojen ja ammattikorkeakoulujen tutkinto-opiskelijat. Jatkotutkintoa suorittavat, avoimen yliopiston tai avoimen ammattikorkeakoulun opiskelijat sekä ulkomailta tulleet vaihto-opiskelijat, jotka eivät suorita tutkintoa suomalaiseen korkeakouluun, eivät kuulu YTHS:n palvelujen piiriin [[yths-who]].',
        'Korkeakouluopiskelijan terveydenhoitomaksu on vuonna 2026 35,35 euroa lukukaudessa, ja se maksetaan Kelaan [[kela-shf]]. YTHS:n kielistrategian mukaan muita kieliä kuin ruotsia tai suomea äidinkielenään puhuvia palvellaan ”vähintään tyydyttävällä englannin kielellä” [[yths-lang]].',
        'Yksi ero terveyskeskuksiin: korkeakouluopiskelijoiden opiskeluterveydenhuollossa 14 vuorokauden enimmäisaika ei koske psykologin vastaanottokäyntejä edes alle 23-vuotiailla [[stm-guidance]].',
      ],
    },
    {
      heading: 'Jos olette työssä',
      body: [
        'InfoFinlandin mukaan työterveyslääkärille voi puhua mielenterveyteen liittyvistä asioista, ja työterveyshuollossa voi olla tarjolla myös psykologin vastaanotto [[infofinland]]. Mielenterveystalon mukaan työterveyshuolto on usein ilmaista työntekijälle [[mtalo-where]].',
      ],
    },
    {
      heading: 'Kelan kuntoutuspsykoterapia',
      body: [
        'Pidempää terapiaa varten Kela korvaa osan kuntoutuspsykoterapian kustannuksista, jos sen ehdot täyttyvät; ehdot on kerrottu [Kelan kuntoutuspsykoterapiaa koskevassa oppaassamme](/fi/oppaat/kelan-kuntoutuspsykoterapia). Kelan englanninkielisen sivun mukaan terapeuttihaku on käytettävissä vain suomeksi ja ruotsiksi [[kela-rehab-en]]. Kela voi järjestää vieraan kielen tulkkausta yksilöterapiaan, mutta ei pari-, perhe- tai ryhmäterapiaan [[kela-guideline]].',
      ],
    },
    {
      heading: 'Yksityinen hoito',
      body: [
        'InfoFinlandin mukaan yksityiselle vastaanotolle voi joskus saada ajan nopeammin, mutta käynti maksaa asiakkaalle huomattavasti enemmän [[infofinland]]. Yksityisen terveydenhuollon asiakkaana vastaatte itse hoitomaksuista [[mtalo-where]], eikä Kela maksa sairaanhoitokorvausta psykologin antamasta hoidosta [[kela-partner]]. Oppaamme [psykologille ilman lähetettä](/fi/oppaat/psykologille-ilman-lahetetta) kertoo, mitä korvataan ja mitä ei.',
      ],
    },
    {
      heading: 'Kriisitukea englanniksi',
      body: [
        'MIELIn englanninkielinen kriisipuhelin päivysti viimeisen kerran maanantaina 23.3.2026. Tilalle MIELI tarjoaa englanniksi ajanvarauksellista kriisichattia, etävastaanottoa videolla tai puhelimitse sekä kriisisähköpostia, maksutta ja ilman lähetettä [[mieli-en]]. Ajan varaaminen vaatii nimettömän Tukinet-tilin, aika on varattava vähintään 30 minuuttia etukäteen, ja sähköpostivastaus voi viipyä jopa kaksi viikkoa [[tukinet-en]].',
        'MIELI Kriisikeskus Helsinki tarjoaa maksutonta ja luottamuksellista keskusteluapua myös englanniksi, ja se palvelee koko pääkaupunkiseutua [[mieli-cc]].',
        'InfoFinlandin sivulla on yhä englanninkielisen kriisipuhelimen numero 09 2525 0116 [[infofinland]]. Linja on suljettu [[mieli-en-fi]].',
        'Hätätilanteessa soittakaa 112. Soitto on maksuton mistä tahansa puhelimesta [[e112-en]]. Hätäkeskusten velvollisuus on palvella suomeksi ja ruotsiksi, ja muilla kielillä päivystäjä voi ottaa avuksi tulkkauspalvelun [[e112]].',
      ],
    },
  ],
  sources: cite(
    'infofinland',
    'mtalo-where',
    'stm-guidance',
    'stm-hoitotakuu',
    'stm-fees',
    'mieppi',
    'mtalo-internet',
    'mtalo-internet-en',
    'mtalo-selfhelp',
    'mtalo-selfhelp-en',
    'yths-who',
    'kela-shf',
    'yths-lang',
    'kela-rehab-en',
    'kela-guideline',
    'kela-partner',
    'mieli-en',
    'tukinet-en',
    'mieli-cc',
    'mieli-en-fi',
    'e112-en',
    'e112',
  ),
};
