import type { Guide } from '../types.ts';
import { cite } from './sources.ts';

export const whileYouWaitSv: Guide = {
  lang: 'sv',
  slug: 'medan-du-vantar',
  title: 'Vad du kan göra medan du väntar på terapi',
  description: 'Tidsgränserna som den offentliga vården i Finland ska hålla, gratis stöd du kan använda medan du väntar och vart du vänder dig om det blir värre.',
  checkedOn: '2026-11-09',
  intro: [
    'Det är vanligt att få vänta. Den här sidan beskriver hur länge den offentliga vården får låta dig vänta, vilket gratis stöd som finns under tiden och vem du kan ringa om väntan blir för tung. Det är information, inte råd om behandling.',
  ],
  sections: [
    {
      heading: 'Hur länge den offentliga vården får låta dig vänta',
      body: [
        {
          list: [
            'Vardagar under tjänstetid ska du få kontakt med vårdcentralen omedelbart [[stm-vardgaranti]] och samma dag få en bedömning av ditt vårdbehov [[stm-anvisning]].',
            'Inom primärvården ska vården ges inom 3 månader [[stm-vardgaranti]].',
            'För personer under 23 år gäller en maximitid på 14 dygn för att bli undersökt eller få vård vid sjukdom eller skada [[stm-vardgaranti]].',
            'Inom den specialiserade sjukvården, som kräver remiss: bedömningen av vårdbehovet ska inledas inom tre veckor och undersökningarna göras inom 3 månader från att remissen kom in. Behöver du sjukhusvård ska den inledas senast inom sex månader från att vårdbehovet konstaterades [[stm-vardgaranti]].',
            'Inom den psykiatriska specialiserade sjukvården för barn och unga under 23 år ska bedömningen göras inom sex veckor från att remissen kom in, och vården ska ordnas inom tre månader från att vårdbehovet konstaterades [[stm-vardgaranti]].',
          ],
        },
        'Tidsgränserna gäller psykiska och fysiska hälsoproblem på samma sätt [[stm-anvisning]]. Besök enligt en vård- eller rehabiliteringsplan, till exempel psykoterapi som ges som rehabilitering, omfattas inte av dem [[stm-anvisning]].',
        'För barn och unga under 23 år ska korttidspsykoterapi eller strukturerad psykosocial behandling inom primärvården inledas inom 28 dygn från att behovet konstaterades, sedan den 1 maj 2025 [[stm-anvisning]] [[stm-terapiatakuu]].',
      ],
    },
    {
      heading: 'Gratis stöd som du kan använda nu',
      body: [
        {
          list: [
            'Psykportens egenvårdsprogram: gratis, anonyma och utan inloggning, och du behöver ingen diagnos. På svenska finns bland annat program för ångest och depression [[psykporten-egenvard]].',
            'Sekasin-chatten för 12–29-åringar är anonym och kostnadsfri, på svenska vardagar kl. 15–19 och veckoslut kl. 17–21 [[sekasin-sv]].',
            'MIELI Kriisichat på finska är öppen måndag till torsdag kl. 15–21, och MIELI:s skriftliga samtalsstöd på finska svarar i allmänhet inom en vecka [[mieli-chatt-fi]].',
            'På engelska erbjuder MIELI krischatt med tidsbokning, distansmottagning och krisstöd per e-post, kostnadsfritt och utan remiss [[mieli-en]]. Svar per e-post kan dröja upp till två veckor [[tukinet-en]].',
          ],
        },
        'Mielenreittis [förteckning över alla tjänster](/sv/tjanster) visar de kostnadsfria alternativen först, med de språk som varje tjänst erbjuds på.',
      ],
    },
    {
      heading: 'Om det blir värre medan du väntar',
      body: [
        'MIELI Kristelefonen svarar på svenska på 09 2525 0112, mån och ons kl. 16–20, tis, tors och fre kl. 9–13 [[mieli-sv]]. Den finskspråkiga kristelefonen 09 2525 0111 svarar alla dagar, dygnet runt. MIELI tar inte betalt för samtalet och du kan ringa anonymt [[mieli-fi]].',
        'Ring 116117 om det inte föreligger livsfara men situationen är allvarlig eller kräver akutsjukvård, och 112 om någons liv eller säkerhet är i fara [[psykporten-narvar]]. Båda samtalen är gratis [[jour116117]] [[e112-en]].',
      ],
    },
  ],
  sources: cite(
    'stm-vardgaranti',
    'stm-anvisning',
    'stm-terapiatakuu',
    'psykporten-egenvard',
    'sekasin-sv',
    'mieli-chatt-fi',
    'mieli-en',
    'tukinet-en',
    'mieli-sv',
    'mieli-fi',
    'psykporten-narvar',
    'jour116117',
    'e112-en',
  ),
};
