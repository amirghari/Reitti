import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const psychologistWithoutReferralFi: Guide = {
  lang: 'fi',
  slug: 'psykologille-ilman-lahetetta',
  title: 'Psykologille ilman lähetettä: mitä se maksaa',
  description: 'Missä psykologille pääsee ilman lähetettä, mitä julkinen hoito maksaa, mitä Kela korvaa ja mitä ei, ja miksi yksityiselle käynnille ei ole virallista hintaa.',
  checkedOn: '2026-11-09',
  intro: [
    'Julkiseen perusterveydenhuoltoon voitte ottaa yhteyttä ja yksityiselle vastaanotolle varata ajan ilman lähetettä. Ero on hinnassa ja siinä, mitä Kela siitä korvaa.',
  ],
  sections: [
    {
      heading: 'Julkinen hoito: maksutonta, eikä lähetettä tarvita',
      body: [
        'Perusterveydenhuoltoon hakeudutaan ottamalla yhteyttä palveluntuottajaan. Lääkärin lähete tarvitaan erikoissairaanhoitoon ja nettiterapiaan [[mtalo-where]].',
        'Terveyskeskuksissa voi olla psykologien suoravastaanottoja. Niitä koskevat samat enimmäisajat: alle 23-vuotiailla 14 vuorokautta ja tätä vanhemmilla kolme kuukautta [[stm-guidance]]. Kaikissa terveyskeskuksissa niitä ei välttämättä ole: ohjeen mukaan suoravastaanottoja ”voi olla”.',
        'Mielenterveystyö avosairaanhoidon palveluissa on maksutonta, eikä hoitajakäynneistä saa periä maksua [[stm-fees]].',
      ],
    },
    {
      heading: 'Yksityinen psykologi: maksatte itse, eikä Kela korvaa hoitoa',
      body: [
        'Yksityiseen terveydenhuoltoon voi hakeutua varaamalla ajan itse, ja yksityisen terveydenhuollon asiakkaana vastaatte itse hoitomaksuista [[mtalo-where]].',
        'Kela ei maksa sairaanhoitokorvausta psykologin antamasta hoidosta, psykoterapiasta tai neuropsykologisesta kuntoutuksesta, vaan korvaa psykoterapiaa kuntoutuspsykoterapiana [[kela-partner]]. Tämä sanotaan Kelan terveydenhuollon yhteistyökumppaneille tarkoitetulla sivulla, joka on päivitetty huhtikuussa 2021 [[kela-partner]]; Kelan nykyinen henkilöasiakkaiden sivu ei ole sen kanssa ristiriidassa [[kela-private]]. Kelan reitti on kerrottu [kuntoutuspsykoterapiaa koskevassa oppaassamme](/fi/oppaat/kelan-kuntoutuspsykoterapia).',
        'Tutkimukset ovat eri asia. Kelan henkilöasiakkaiden sivun mukaan psykologin tutkimuksista voi saada Kela-korvauksen riippumatta siitä, kuka tutkimuksen on määrännyt [[kela-private]]. Yhteistyökumppaneille tarkoitetulla sivulla edellytyksenä on kuitenkin yksityisen terveydenhuollon lääkärin määräys [[kela-partner]], joten varmistakaa asia Kelasta ennen tutkimusta.',
        '**Yksityisen psykologikäynnin hinnalle ei ole virallista lähdettä.** Kela, STM ja InfoFinland eivät julkaise sellaista, joten emme anna hintaa. Kysykää hinta palveluntuottajalta ennen ajanvarausta.',
      ],
    },
    {
      heading: 'Muita vaihtoehtoja',
      body: [
        {
          list: [
            'Mielenterveystalon omahoito-ohjelmat: ilmaisia, nimettömiä ja ilman kirjautumista [[mtalo-selfhelp]]; osa ohjelmista on englanniksi [[mtalo-selfhelp-en]].',
            'Helsingissä Mielenterveyspalvelupiste Mieppi palvelee maksutta kaikkia yli 13-vuotiaita helsinkiläisiä [[mieppi]].',
            'Yliopistojen ja ammattikorkeakoulujen tutkinto-opiskelijoilla on YTHS; korkeakouluopiskelijan terveydenhoitomaksu on vuonna 2026 35,35 euroa lukukaudessa [[kela-shf]].',
          ],
        },
        'Alle 23-vuotiaille on lisäksi terapiatakuu: perusterveydenhuoltoon kuuluva lyhytpsykoterapia tai psykologiseen vuorovaikutukseen perustuva määrämuotoinen ja aikarajoitteinen psykososiaalinen hoito on 1.5.2025 alkaen aloitettava 28 vuorokauden kuluessa siitä, kun tarve on todettu [[finlex-1107]].',
      ],
    },
  ],
  sources: cite('mtalo-where', 'stm-guidance', 'stm-fees', 'kela-partner', 'kela-private', 'mtalo-selfhelp', 'mtalo-selfhelp-en', 'mieppi', 'kela-shf', 'finlex-1107'),
};
