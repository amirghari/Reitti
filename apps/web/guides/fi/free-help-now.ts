import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const freeHelpNowFi: Guide = {
  lang: 'fi',
  slug: 'ilmainen-apu-nyt',
  title: 'Maksutonta mielenterveysapua heti',
  description: 'Maksuttomat kriisipuhelimet, chatit ja palvelut aukioloaikoineen ja kielineen: hätänumero 112, Päivystysapu 116117 sekä MIELIn puhelin ja chatit.',
  checkedOn: '2026-11-09',
  intro: [
    'Alla olevat palvelut eivät peri käytöstä maksua. Aukioloajat ja kielet on kerrottu niin kuin palvelut itse ne ilmoittavat, ja lähteet ovat sivun lopussa.',
  ],
  sections: [
    {
      heading: 'Hätätilanteessa',
      body: [
        'Soittakaa hätänumeroon 112, jos jonkun henki tai turvallisuus on uhattuna [[mtalo-where]]. Soitto on maksuton mistä tahansa puhelimesta [[e112-en]]. Hätäkeskusten velvollisuus on palvella suomeksi ja ruotsiksi. Muilla kielillä hätäkeskuspäivystäjä voi ottaa avuksi tulkkauspalvelun, jolloin soittajan pitää odottaa hetki linjalla [[e112]].',
        'Soittakaa Päivystysapuun 116117, jos hengenvaaraa ei ole, mutta tilanne on vakava tai vaatii päivystyksellistä apua [[mtalo-where]]. Päivystysapu palvelee kiireellisissä terveysongelmissa 24/7, puhelu on maksuton, ja palvelu on käytössä kaikkialla Suomessa Ahvenanmaata lukuun ottamatta [[m116117]].',
      ],
    },
    {
      heading: 'Keskusteluapua puhelimitse',
      body: [
        {
          table: {
            head: ['Puhelin', 'Numero', 'Päivystysajat'],
            rows: [
              ['MIELIn kriisipuhelin suomeksi', '09 2525 0111', 'Joka päivä, 24 tuntia vuorokaudessa [[mieli-fi]]'],
              ['MIELIn kriisipuhelin ruotsiksi', '09 2525 0112', 'Ma ja ke klo 16–20; ti, to ja pe klo 9–13 [[mieli-sv]]'],
            ],
          },
        },
        'MIELI ry ei peri maksua keskusteluista; soitto maksaa vain oman puhelinoperaattorinne hinnan [[mieli-fi]] [[mieli-sv]]. Kriisipuhelimeen voi soittaa nimettömästi ja luottamuksellisesti [[mieli-fi]].',
        '**Englanniksi:** MIELIn englanninkielinen kriisipuhelin on suljettu [[mieli-en-fi]], ja se päivysti viimeisen kerran 23.3.2026 [[mieli-en]]. Tilalle MIELI tarjoaa englanniksi ajanvarauksellista kriisichattia, etävastaanottoa videolla tai puhelimitse sekä kriisisähköpostia. Keskustelut ovat maksuttomia, eikä lähetettä tarvita [[mieli-en]]. Ajan varaaminen vaatii nimettömän rekisteröitymisen Tukinet-palveluun, ja aika on varattava vähintään 30 minuuttia etukäteen. Sähköpostiin vastaaminen voi kestää jopa kaksi viikkoa [[tukinet-en]].',
      ],
    },
    {
      heading: 'Chatit',
      body: [
        {
          list: [
            'MIELI Kriisichat suomeksi: maanantaista torstaihin klo 15–21 [[mieli-chat]].',
            'Sekasin-chat 12–29-vuotiaille: anonyymi ja ilmainen, auki vuoden jokaisena päivänä, arkisin klo 9–24 ja viikonloppuisin klo 15–24 [[sekasin]].',
          ],
        },
      ],
    },
    {
      heading: 'Keskusteluapua kasvokkain tai etänä',
      body: [
        'MIELI Kriisikeskus Helsinki palvelee koko pääkaupunkiseutua, ja sen Porvoon toimipiste tarjoaa kriisitukea myös Itä-Uudenmaan asukkaille. Keskustelut ovat maksuttomia ja luottamuksellisia, ja tukea tarjotaan suomeksi, ruotsiksi, englanniksi ja venäjäksi tai tarvittaessa tulkin välityksellä. Ajanvaraus puhelimitse numerosta 09 41350 510 ma–to klo 9–12 ja 13–15 sekä pe klo 9–12 [[mieli-cc]].',
        'Helsingissä Mielenterveyspalvelupiste Mieppi palvelee kaikkia yli 13-vuotiaita helsinkiläisiä. Palvelu on maksutonta, mutta peruuttamattomasta ajasta peritään sakkomaksu. Jos äidinkielenne ei ole suomi tai ruotsi, Mieppi voi käyttää tulkkia [[mieppi]].',
      ],
    },
    {
      heading: 'Korkeakouluopiskelijoille',
      body: [
        'YTHS:n yleis- ja mielenterveyden chat palvelee YTHSDigissä ma–to klo 8–15 ja pe klo 8–14 [[yths-home]]. YTHS:n palvelujen piiriin kuuluvat yliopistojen ja ammattikorkeakoulujen tutkinto-opiskelijat [[yths-who]].',
      ],
    },
    {
      heading: 'Omahoitoa milloin tahansa',
      body: [
        'Mielenterveystalon omahoito-ohjelmia voi käyttää ilmaiseksi, nimettömästi ja kirjautumatta, riippumatta siitä, onko teillä diagnoosia [[mtalo-selfhelp]]. Englanniksi on tarjolla ohjelmat muun muassa ahdistukseen, masennukseen, unettomuuteen ja keskittymisvaikeuksiin [[mtalo-selfhelp-en]].',
      ],
    },
  ],
  sources: cite('mtalo-where', 'e112-en', 'e112', 'm116117', 'mieli-fi', 'mieli-sv', 'mieli-en-fi', 'mieli-en', 'tukinet-en', 'mieli-chat', 'sekasin', 'mieli-cc', 'mieppi', 'yths-home', 'yths-who', 'mtalo-selfhelp', 'mtalo-selfhelp-en'),
};
