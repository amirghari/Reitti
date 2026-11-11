import type { Guide } from '../types.ts';
import { cite } from './sources.js';

export const kelaPsychotherapySv: Guide = {
  lang: 'sv',
  slug: 'fpa-rehabiliterande-psykoterapi',
  title: 'FPA:s rehabiliterande psykoterapi: vem kan få den och hur ansöker man',
  description: 'Vem som kan få rehabiliterande psykoterapi som FPA ersätter, hur du ansöker med blankett KU 131r, vad FPA betalar per besök och hur länge.',
  checkedOn: '2026-11-09',
  intro: [
    'FPA (Folkpensionsanstalten) ersätter en del av kostnaderna för längre psykoterapi när psykisk ohälsa hotar din arbets- eller studieförmåga. Det kallas rehabiliterande psykoterapi. Den här sidan återger FPA:s egna villkor och belopp, med länk till FPA:s sida för varje uppgift.',
  ],
  sections: [
    {
      heading: 'Vem kan få den',
      body: [
        'FPA räknar upp de här villkoren [[fpa-rehab]]:',
        {
          list: [
            'du är 16–67 år [[fpa-rehab]]',
            'din arbets- eller studieförmåga är hotad på grund av psykisk ohälsa [[fpa-rehab]]',
            'du har diagnostiserats med psykisk ohälsa och har fått lämplig vård för den i minst 3 månader [[fpa-rehab]]',
            'en psykiater, barnpsykiater, ungdomspsykiater eller rättspsykiater har bedömt att terapin behövs, i ett B-utlåtande, ett BC-utlåtande eller en rehabiliteringsplan som är högst ett år gammal [[fpa-rehab]].',
          ],
        },
        'Enligt FPA:s förmånsanvisning ska du dessutom vara försäkrad i Finland enligt sjukförsäkringslagen [[fpa-anvisning]].',
      ],
    },
    {
      heading: 'Så här ansöker du',
      body: [
        'Fyll i blanketten KU 131r och skicka den i MittFPA, FPA:s e-tjänst, med utlåtandet som bilaga, eller per post till Folkpensionsanstalten, PB 10, 00056 FPA [[fpa-rehab]].',
        'Ansök innan terapin börjar, men tidigast 2 månader innan den inleds. FPA kan betala ersättning tidigast från början av den månad då din ansökan kom in till FPA [[fpa-rehab]].',
        'Två kostnader står du själv för. Introduktionsbesöken hos de terapeuter du träffar innan du väljer betalar du själv [[fpa-rehab]]. FPA ersätter inte heller som rehabiliteringskostnad det läkarutlåtande som skrivs för ansökan, men du kan eventuellt få sjukvårdsersättning för läkararvodet enligt sjukförsäkringslagen [[fpa-anvisning]].',
      ],
    },
    {
      heading: 'Vad FPA betalar',
      body: [
        'FPA betalar ett fast belopp per besök [[fpa-rehab]]:',
        {
          table: {
            head: ['Terapi', 'FPA betalar'],
            rows: [
              ['Individuell psykoterapi', '57,60 euro per besök [[fpa-rehab]]'],
              ['Gruppterapi', '42,05 euro per besök [[fpa-rehab]]'],
              ['Familje- eller parpsykoterapi, 1 timme', '63,91 euro [[fpa-rehab]]'],
              ['Familje- eller parpsykoterapi, 1,5 timme', '95,87 euro [[fpa-rehab]]'],
            ],
          },
        },
        'FPA:s sida anger inte från vilket datum beloppen gäller [[fpa-rehab]]. Ersättningen är ofta lägre än priset för terapibesöket, så du kan bli tvungen att betala en del av priset själv [[fpa-rehab]]. I februari 2025 skrev FPA att priset för ett besök ligger kring 100 euro och att självrisken kan vara kring 40–60 euro per gång [[fpa-statistik]]. Priserna kan ha ändrats sedan dess.',
        'I allmänhet drar terapeuten av FPA:s ersättning direkt från priset för besöket. Om du inte får ersättningen vid besöket söker du den i efterhand på blanketten KU 204r, inom 6 månader från att du betalade [[fpa-rehab]].',
      ],
    },
    {
      heading: 'Hur länge den pågår',
      body: [
        'FPA ersätter högst 80 besök per år och sammanlagt högst 200 besök, under högst 3 år. Terapin beviljas för ett år i taget [[fpa-rehab]]. För det andra och tredje året räcker det med ett utlåtande av den behandlande läkaren, om terapin har genomförts enligt planen [[fpa-rehab]]. På särskilda grunder kan terapin beviljas på nytt om det har gått minst 5 år sedan den föregående perioden upphörde [[fpa-rehab]].',
      ],
    },
    {
      heading: 'Hitta en terapeut',
      body: [
        'Terapeuten måste vara godkänd av FPA och ha utbildning i den terapiform som har rekommenderats för dig. FPA:s söktjänst visar bara de godkända terapeuter som vill att deras kontaktuppgifter syns där [[fpa-rehab]]. Söktjänsten finns på finska och svenska [[fpa-rehab-en]]. FPA kan ordna tolkning till ett främmande språk i individuell terapi, men inte i par-, familje- eller gruppterapi [[fpa-anvisning]].',
      ],
    },
    {
      heading: 'Unga: terapigarantin är en annan väg',
      body: [
        'Sedan den 1 maj 2025 ska korttidspsykoterapi eller strukturerad, tidsbegränsad psykosocial behandling för barn och unga under 23 år inom primärvården inledas inom 28 dygn från att behovet konstaterades, om inte medicinska eller andra motsvarande skäl kräver annat [[stm-anvisning]] [[stm-terapiatakuu]]. Det är offentlig hälso- och sjukvård, inte FPA: du börjar vid din hälsostation eller inom studerandehälsovården.',
      ],
    },
  ],
  sources: cite('fpa-rehab', 'fpa-anvisning', 'fpa-statistik', 'fpa-rehab-en', 'stm-anvisning', 'stm-terapiatakuu'),
};
