/**
 * The official sources the English guides cite. Every quote behind every figure
 * was read on the source page itself on `checkedOn` (8.11.2026), including the
 * three PDFs. Research notes: company-ops drafts/mielenreitti/guide-sources/
 * (6.11.2026), re-checked for these pages.
 */
import type { Source } from '../types.ts';

const checkedOn = '2026-11-08';

const list: Source[] = [
  { id: 'stm-hoitotakuu', label: 'Ministry of Social Affairs and Health (STM): Hoitotakuu, access to care (Finnish)', url: 'https://stm.fi/hoitotakuu', pageDate: '2026-10-29', checkedOn },
  {
    id: 'stm-guidance',
    label: 'STM: guidance on the rules for access to non-urgent primary care (Finnish, PDF)',
    url: 'https://stm.fi/documents/1271139/150123656/Hoitotakuuta%20koskeva%20ohje_24.3.2025.fi.pdf/9c84004b-d25b-0b0f-d156-d1e4f244339e?t=1742819805585',
    pageDate: '2025-03-24',
    checkedOn,
  },
  { id: 'stm-fees', label: 'STM: Terveydenhuollon maksut, health care fees (Finnish)', url: 'https://stm.fi/terveydenhuollon-maksut', checkedOn },
  { id: 'finlex-1107', label: 'Act 1107/2024 amending the Health Care Act (Finnish, PDF)', url: 'https://finlex.fi/api/media/statute/555/mainPdf/main.pdf', pageDate: '2024-12-30', checkedOn },
  { id: 'kela-rehab', label: 'Kela: Rehabilitative psychotherapy', url: 'https://www.kela.fi/rehabilitative-psychotherapy', checkedOn },
  { id: 'kela-fi', label: 'Kela: Kuntoutuspsykoterapia (Finnish)', url: 'https://www.kela.fi/kuntoutuspsykoterapia', checkedOn },
  { id: 'kela-amounts', label: 'Kela: Kuntoutuspsykoterapian korvauksen määrä, the amounts (Finnish)', url: 'https://www.kela.fi/kuntoutuspsykoterapia-korvauksen-maara', checkedOn },
  { id: 'kela-guideline', label: 'Kela: benefit guideline on rehabilitative psychotherapy (Finnish, PDF)', url: 'https://www.kela.fi/etti/Kuntoutuspsykoterapia.pdf', pageDate: '2026-09-11', checkedOn },
  {
    id: 'kela-stats',
    label: 'Kela: statistics release on rehabilitative psychotherapy in 2024 (Finnish)',
    url: 'https://www.kela.fi/tietotarjotin/1170107-kuntoutuspsykoterapiaa-sai-lahes-66-000-henkiloa-vuonna-2024-nelja-viidesta-saajasta-naisia',
    pageDate: '2025-02-06',
    checkedOn,
  },
  {
    id: 'kela-partner',
    label: 'Kela: psychological examinations, page for healthcare providers (Finnish)',
    url: 'https://www.kela.fi/yhteistyokumppanit-terveydenhuolto-sairaanhoitokorvaukset-tutkimus-ja-hoito-psykologiset-tutkimukset',
    pageDate: '2021-04-22',
    checkedOn,
  },
  { id: 'kela-private', label: 'Kela: Reimbursements for private medical care', url: 'https://www.kela.fi/reimbursements-for-private-medical-care', pageDate: '2026-10-28', checkedOn },
  { id: 'kela-shf', label: 'Kela: Student healthcare fee for higher education students', url: 'https://www.kela.fi/student-healthcare-fee-higher-education', pageDate: '2026-10-29', checkedOn },
  { id: 'mtalo-internet', label: 'Mielenterveystalo: Internet therapies', url: 'https://mielenterveystalo.fi/en/internet-therapies', checkedOn },
  { id: 'mtalo-selfhelp', label: 'Mielenterveystalo: Self-help programs', url: 'https://www.mielenterveystalo.fi/en/self-help-programs', checkedOn },
  {
    id: 'mtalo-where',
    label: 'Mielenterveystalo: when and where to get help (Finnish)',
    url: 'https://www.mielenterveystalo.fi/fi/mielenterveyspalvelut/milloin-ja-mista-apua-mielenterveyden-ongelmiin',
    checkedOn,
  },
  { id: 'yths-who', label: 'FSHS (YTHS): Who can use our services', url: 'https://www.yths.fi/en/using-services/who-can-use-our-services/', checkedOn },
  { id: 'yths-lang', label: 'FSHS (YTHS): Language strategy', url: 'https://www.yths.fi/en/using-services/language-strategy/', checkedOn },
  { id: 'yths-home', label: 'FSHS (YTHS): front page, contact hours', url: 'https://www.yths.fi/en/', checkedOn },
  { id: 'infofinland', label: 'InfoFinland: Mental health', url: 'https://www.infofinland.fi/en/health/mental-health', pageDate: '2025-10-06', checkedOn },
  {
    id: 'mieppi',
    label: 'City of Helsinki: Mental health service unit Mieppi',
    url: 'https://hel.fi/en/health-and-social-services/health-care/mental-health-services/mental-health-service-unit-mieppi',
    checkedOn,
  },
  { id: 'mieli-en', label: 'MIELI: New ways to receive support in English', url: 'https://mieli.fi/en/news/new-ways-to-receive-support-in-english/', pageDate: '2026-06-09', checkedOn },
  { id: 'mieli-fi', label: 'MIELI: Kriisipuhelin, the crisis line (Finnish)', url: 'https://mieli.fi/tukea-ja-apua/kriisipuhelin/', pageDate: '2026-10-21', checkedOn },
  { id: 'mieli-sv', label: 'MIELI: Kristelefon, the Swedish crisis line', url: 'https://mieli.fi/sv/stod-och-hjalp/kristelefon/', pageDate: '2026-05-18', checkedOn },
  { id: 'mieli-chat', label: 'MIELI: Chattaa tai kirjoita, chat and written support (Finnish)', url: 'https://mieli.fi/tukea-ja-apua/chattaa-tai-kirjoita/', pageDate: '2026-01-30', checkedOn },
  // The English 'crisis-helpline' page now redirects to MIELI's general support page, and its English
  // crisis-centres page gives Helsinki two different booking hours (11-12 in the list, 9-12 in the box).
  // The Finnish page states all three facts this guide cites; re-read 12.11.2026.
  { id: 'mieli-cc', label: 'MIELI: MIELI Kriisikeskus Helsinki (Finnish)', url: 'https://mieli.fi/tukea-ja-apua/mieli-kriisikeskus-helsinki/', pageDate: '2026-09-30', checkedOn: '2026-11-12' },
  { id: 'tukinet-en', label: 'Tukinet: Support in English (MIELI)', url: 'https://tukinet.fi/en/palvelut/support-in-english', checkedOn },
  { id: 'sekasin', label: 'Sekasin-chat (Finnish)', url: 'https://sekasin.fi/', checkedOn },
  { id: 'e112', label: 'Emergency Response Centre Agency: The 112 emergency number', url: 'https://112.fi/en/erc-number', checkedOn },
  { id: 'm116117', label: '116117 Medical Helpline', url: 'https://www.116117.fi/en', checkedOn },
];

export const SOURCES = Object.fromEntries(list.map((s) => [s.id, s])) as Record<string, Source>;

/** The sources a guide cites, in the order given. */
export const cite = (...ids: string[]): Source[] =>
  ids.map((id) => {
    const source = SOURCES[id];
    if (!source) throw new Error(`[guides] no source "${id}"`);
    return source;
  });
