import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const whileYouWaitFi: Guide = {
  lang: 'fi',
  slug: 'kun-odotat-hoitoa',
  translationOf: 'while-you-wait',
  title: 'Kun odotat hoitoa: aikarajat ja tuki odotuksen aikana',
  description: 'Julkisen terveydenhuollon hoitoon pääsyn enimmäisajat, maksuton tuki, jota voit käyttää jo odottaessasi, ja mihin soittaa, jos vointi heikkenee.',
  checkedOn: '2026-11-09',
  intro: [
    'Hoitoa joutuu usein odottamaan. Tällä sivulla kerrotaan, kuinka kauan julkisessa terveydenhuollossa voi enintään joutua odottamaan, mitä maksutonta tukea on sillä välin tarjolla ja mihin voit soittaa, jos odottaminen käy liian raskaaksi. Sivu on tietoa, ei hoito-ohje.',
  ],
  sections: [
    {
      heading: 'Hoitoon pääsyn enimmäisajat',
      body: [
        {
          list: [
            'Arkisin terveyskeskuksen aukioloaikana sinne on saatava välittömästi yhteys [[stm-hoitotakuu]], ja arvio hoidon tarpeesta on saatava saman päivän aikana [[stm-guidance]].',
            'Perusterveydenhuollossa hoitoon on päästävä viimeistään kolmessa kuukaudessa [[stm-hoitotakuu]].',
            'Alle 23-vuotiaiden on päästävä hoitoon viimeistään 14 vuorokaudessa, jos kyse on sairauden tai vamman tutkimuksesta tai hoidosta [[stm-hoitotakuu]].',
            'Erikoissairaanhoidossa, lähetteen jälkeen: hoidon tarpeen arviointi on aloitettava kolmessa viikossa lähetteen saapumisesta, tarvittavat tutkimukset ja erikoislääkärin arviointi on tehtävä kolmessa kuukaudessa, ja hoito on aloitettava viimeistään kuudessa kuukaudessa hoidon tarpeen toteamisesta [[stm-hoitotakuu]].',
          ],
        },
        'Enimmäisajat koskevat samalla tavoin psyykkisiä ja fyysisiä terveysongelmia [[stm-guidance]]. Hoitosuunnitelman mukaiset käynnit, kuten psykoterapiaan liittyvät käynnit, eivät kuulu hoitotakuusääntelyn piiriin [[stm-guidance]].',
        'Lasten ja alle 23-vuotiaiden nuorten perusterveydenhuoltoon kuuluva lyhytpsykoterapia tai psykologiseen vuorovaikutukseen perustuva määrämuotoinen ja aikarajoitteinen psykososiaalinen hoito on 1.5.2025 alkaen aloitettava 28 vuorokauden kuluessa siitä, kun tarve on todettu [[finlex-1107]].',
      ],
    },
    {
      heading: 'Maksutonta tukea jo nyt',
      body: [
        {
          list: [
            'Mielenterveystalon omahoito-ohjelmia voi käyttää ilmaiseksi, nimettömästi ja kirjautumatta, riippumatta siitä, onko sinulla diagnoosia. Suomeksi ohjelmia on esimerkiksi ahdistukseen ja masennukseen, ja nuorille on omat ohjelmansa [[mtalo-selfhelp]]. Englanniksi on ohjelmat muun muassa ahdistukseen, masennukseen, unettomuuteen ja keskittymisvaikeuksiin [[mtalo-selfhelp-en]].',
            'MIELI Kriisichat päivystää maanantaista torstaihin klo 15–21, ja kirjoittamalla saatavaan keskusteluapuun saa vastauksen yleensä viikon sisällä [[mieli-chat]].',
            'Englanniksi MIELI tarjoaa ajanvarauksellista kriisichattia, etävastaanottoa ja kriisisähköpostia maksutta ja ilman lähetettä [[mieli-en]]. Sähköpostivastaus voi viipyä jopa kaksi viikkoa [[tukinet-en]].',
            'Sekasin-chat 12–29-vuotiaille on anonyymi ja ilmainen, ja se on auki arkisin klo 9–24 ja viikonloppuisin klo 15–24 [[sekasin]].',
          ],
        },
        'Mielenreitin [Kaikki palvelut -sivu](/fi/palvelut) näyttää ensin maksuttomat vaihtoehdot ja kielet, joilla kutakin palvelua tarjotaan.',
      ],
    },
    {
      heading: 'Jos vointisi heikkenee odotuksen aikana',
      body: [
        'MIELIn kriisipuhelin 09 2525 0111 päivystää suomeksi joka päivä 24 tuntia vuorokaudessa. MIELI ry ei peri maksua keskusteluista, ja voit soittaa nimettömästi [[mieli-fi]].',
        'Soita Päivystysapuun 116117, jos hengenvaaraa ei ole, mutta tilanne on vakava tai vaatii päivystyksellistä apua, ja hätänumeroon 112, jos jonkun henki tai turvallisuus on uhattuna [[mtalo-where]]. Kumpikin puhelu on maksuton [[m116117]] [[e112-en]].',
      ],
    },
  ],
  sources: cite('stm-hoitotakuu', 'stm-guidance', 'finlex-1107', 'mtalo-selfhelp', 'mtalo-selfhelp-en', 'mieli-chat', 'mieli-en', 'tukinet-en', 'sekasin', 'mieli-fi', 'mtalo-where', 'm116117', 'e112-en'),
};
