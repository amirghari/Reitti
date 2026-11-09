import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const psychologistWithoutReferralSv: Guide = {
  lang: 'sv',
  slug: 'psykolog-utan-remiss',
  title: 'Psykolog utan remiss i Finland: vad det kostar',
  description: 'Var du kan träffa en psykolog utan remiss, vad offentlig vård kostar, vad FPA ersätter och inte, och varför det inte finns något officiellt privatpris.',
  checkedOn: '2026-11-09',
  intro: [
    'Du behöver ingen remiss för att kontakta primärvården eller för att boka en privat tid. Det som skiljer är kostnaden och vad FPA betalar.',
  ],
  sections: [
    {
      heading: 'Offentlig vård: avgiftsfri och utan remiss',
      body: [
        'Till primärvården söker du dig genom att själv kontakta en vårdgivare. Remiss från läkare krävs för specialsjukvård och för nätterapi [[psykporten-narvar]].',
        'Hälsostationer kan ha direktmottagning hos psykolog. Där sådan finns gäller samma tidsgränser: inom 14 dygn för personer under 23 år och inom tre månader för dem som är äldre [[stm-anvisning]]. Alla hälsostationer har inte direktmottagning: anvisningen säger att psykologer ”kan” ha det.',
        'Mentalvårdsarbete inom den öppna sjukvårdens tjänster är avgiftsfritt, och för besök på sjukskötarmottagning får ingen avgift tas ut [[stm-avgifter]].',
      ],
    },
    {
      heading: 'Privat psykolog: du betalar, och FPA ersätter inte behandlingen',
      body: [
        'Du kan själv boka tid inom den privata hälso- och sjukvården, och som kund där står du själv för vårdkostnaderna [[psykporten-narvar]].',
        'FPA betalar inte sjukvårdsersättning för behandling som getts av en psykolog, för psykoterapi eller för neuropsykologisk rehabilitering. Psykoterapi ersätter FPA bara som rehabiliterande psykoterapi [[fpa-psykologiska]]. Uppgiften står på FPA:s sida för hälsovårdspersonal, senast ändrad i september 2023 [[fpa-psykologiska]]; FPA:s nuvarande sida för privatpersoner säger inte emot den [[fpa-privat]]. FPA:s väg beskrivs i vår [guide om rehabiliterande psykoterapi](/sv/guider/fpa-rehabiliterande-psykoterapi).',
        'Undersökningar är en annan sak. FPA kan ersätta undersökningar som utförs av en psykolog, oberoende av vem som har ordinerat undersökningen [[fpa-privat]]. Enligt FPA:s sida för hälsovårdspersonal förutsätter ersättningen att en läkare inom den privata hälso- och sjukvården har ordinerat undersökningen [[fpa-psykologiska]].',
        '**Det finns inget officiellt pris för ett besök hos en privat psykolog.** FPA, STM och InfoFinland publicerar inget pris, så vi anger inget. Fråga vårdgivaren innan du bokar.',
      ],
    },
    {
      heading: 'Gratis utan remiss',
      body: [
        {
          list: [
            'Psykportens egenvårdsprogram: gratis, anonyma och utan inloggning, på svenska bland annat för ångest och depression [[psykporten-egenvard]].',
            'I Helsingfors betjänar Mieppi alla Helsingforsbor över 13 år kostnadsfritt [[mieppi]].',
            'Studerande vid universitet och yrkeshögskolor har SHVS. Hälsovårdsavgiften för högskolestuderande är 35,35 euro per termin år 2026, och du betalar inga separata besöksavgifter [[fpa-halsovardsavgift]].',
          ],
        },
        'För unga under 23 år finns dessutom terapigarantin: sedan den 1 maj 2025 ska korttidspsykoterapi eller strukturerad psykosocial behandling inom primärvården inledas inom 28 dygn från att behovet konstaterades [[stm-anvisning]] [[stm-terapiatakuu]].',
      ],
    },
  ],
  sources: cite('psykporten-narvar', 'stm-anvisning', 'stm-avgifter', 'fpa-psykologiska', 'fpa-privat', 'psykporten-egenvard', 'mieppi', 'fpa-halsovardsavgift', 'stm-terapiatakuu'),
};
