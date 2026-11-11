import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const freeHelpNowSv: Guide = {
  lang: 'sv',
  slug: 'gratis-hjalp-nu',
  title: 'Gratis hjälp för den psykiska hälsan i Finland just nu',
  description: 'Kostnadsfria kristelefoner, chattar och tjänster i Finland med öppettider och språk, från 112 och MIELI till Sekasin och Psykporten.',
  checkedOn: '2026-11-09',
  intro: [
    'Alla tjänster nedan är kostnadsfria. Öppettiderna och språken är de som varje tjänst själv uppger, med länk längst ner på sidan.',
  ],
  sections: [
    {
      heading: 'I en nödsituation',
      body: [
        'Ring 112 om någons liv eller säkerhet är i fara [[psykporten-narvar]]. Samtalet är gratis från alla telefoner [[e112-en]]. Nödcentralerna är skyldiga att ge service på finska och svenska. Om operatören inte kan ge service på svenska flyttar hen samtalet till en annan operatör, och på andra språk kan operatören ta hjälp av en tolk [[e112-sv]].',
        'Ring Jourhjälpen 116117 om det inte föreligger livsfara men situationen är allvarlig eller kräver akutsjukvård [[psykporten-narvar]]. Jourhjälpen betjänar dygnet runt vid brådskande hälsoproblem, samtalet är avgiftsfritt och tjänsten finns i hela Finland utom på Åland [[jour116117]].',
      ],
    },
    {
      heading: 'Prata med någon nu',
      body: [
        {
          table: {
            head: ['Linje', 'Nummer', 'När'],
            rows: [
              ['MIELI Kristelefonen, på svenska', '09 2525 0112', 'mån och ons kl. 16–20, tis, tors och fre kl. 9–13 [[mieli-sv]]'],
              ['MIELI Kriisipuhelin, på finska', '09 2525 0111', 'alla dagar, dygnet runt [[mieli-fi]]'],
            ],
          },
        },
        'Utanför den svenska linjens öppettider svarar den finskspråkiga kristelefonen alla dagar, dygnet runt [[mieli-sv]].',
        'MIELI tar inte betalt för samtalet; du betalar bara din operatörs vanliga samtalsavgift [[mieli-sv]] [[mieli-fi]]. Till den finskspråkiga linjen kan du ringa anonymt [[mieli-fi]].',
        '**På engelska:** MIELI:s engelskspråkiga kristelefon var öppen sista gången den 23 mars 2026. I stället erbjuder MIELI krischatt med tidsbokning, distansmottagning per video eller telefon och krisstöd per e-post på engelska, kostnadsfritt och utan remiss [[mieli-en]]. Du behöver ett anonymt konto på Tukinet och ska boka minst 30 minuter i förväg. Svar per e-post kan dröja upp till två veckor [[tukinet-en]].',
      ],
    },
    {
      heading: 'Chatt',
      body: [
        {
          list: [
            'Sekasin-chatten för 12–29-åringar, på svenska: anonym och kostnadsfri, vardagar kl. 15–19 och veckoslut kl. 17–21 [[sekasin-sv]].',
            'Sekasin-chat på finska: alla dagar året runt, vardagar kl. 9–24 och veckoslut kl. 15–24 [[sekasin-fi]].',
            'MIELI Kriisichat för vuxna, på finska: måndag till torsdag kl. 15–21 [[mieli-chatt-fi]].',
          ],
        },
        'MIELI:s tjänster på nätet är på finska, med undantag av Sekasin-chatten för unga [[mieli-chatt-sv]].',
      ],
    },
    {
      heading: 'Ansikte mot ansikte',
      body: [
        'MIELI Kriscenter Helsingfors erbjuder kortvarigt samtalsstöd för personer som bor i huvudstadsregionen och Östra Nyland, på finska, svenska och engelska. Samtalen är kostnadsfria, ingen remiss behövs och du kan vara anonym om du vill. Tidsbokning per telefon 09 4135 0510, mån–tors kl. 9–12 och 13–15, fre kl. 9–12 [[mieli-kriscenter]].',
        'I Helsingfors betjänar servicestället Mieppi alla Helsingforsbor över 13 år kostnadsfritt. Om ditt modersmål är något annat än finska eller svenska kan Mieppi använda tolk [[mieppi]].',
      ],
    },
    {
      heading: 'För studerande',
      body: [
        'SHVS (Studenternas hälsovårdsstiftelse, YTHS på finska) har chattar för allmän hälsa och psykisk hälsa i YTHSDigi. Öppettiderna ändras, så kontrollera dem på [SHVS webbplats](https://www.yths.fi/sv/startsida/) [[shvs-start]]. SHVS betjänar högskolestuderande som avlägger grundexamen och har anmält sig som närvarande för terminen [[shvs-vem]].',
      ],
    },
    {
      heading: 'Egenvård, när som helst',
      body: [
        'Egenvårdsprogrammen på Psykporten, Mielenterveystalos svenska sidor, kan du använda dygnet runt, gratis, anonymt och utan inloggning, oavsett ålder och oavsett om du har fått en diagnos [[psykporten-egenvard]]. På svenska finns bland annat program för ångest och depression, också för unga [[psykporten-egenvard]].',
      ],
    },
  ],
  sources: cite(
    'psykporten-narvar',
    'e112-en',
    'e112-sv',
    'jour116117',
    'mieli-sv',
    'mieli-fi',
    'mieli-en',
    'tukinet-en',
    'sekasin-sv',
    'sekasin-fi',
    'mieli-chatt-fi',
    'mieli-chatt-sv',
    'mieli-kriscenter',
    'mieppi',
    'shvs-start',
    'shvs-vem',
    'psykporten-egenvard',
  ),
};
