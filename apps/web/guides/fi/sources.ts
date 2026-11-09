/**
 * The official sources the Finnish guides cite. Every figure and quote was read
 * on the source page itself on `checkedOn` (9.11.2026), from the Finnish page
 * wherever one exists, the three PDFs included. Where a fact is only on an
 * English or Swedish page, the label says so.
 *
 * Draft: not public until the native reviewer has read it (GUIDES_PUBLISHED in
 * ../index.ts).
 */
import type { Source } from '../types.ts';

const checkedOn = '2026-11-09';

const list: Source[] = [
  { id: 'stm-hoitotakuu', label: 'Sosiaali- ja terveysministeriö (STM): Hoitotakuu', url: 'https://stm.fi/hoitotakuu', pageDate: '2026-10-29', checkedOn },
  {
    id: 'stm-guidance',
    label: 'STM: Ohje perusterveydenhuollon kiireettömään hoitoon pääsyä koskevien säännösten soveltamisesta (PDF)',
    url: 'https://stm.fi/documents/1271139/150123656/Hoitotakuuta%20koskeva%20ohje_24.3.2025.fi.pdf/9c84004b-d25b-0b0f-d156-d1e4f244339e?t=1742819805585',
    pageDate: '2025-03-24',
    checkedOn,
  },
  { id: 'stm-fees', label: 'STM: Terveydenhuollon maksut', url: 'https://stm.fi/terveydenhuollon-maksut', checkedOn },
  {
    id: 'finlex-1107',
    label: 'Suomen säädöskokoelma: Laki terveydenhuoltolain 53 ja 55 §:n muuttamisesta 1107/2024 (PDF)',
    url: 'https://finlex.fi/api/media/statute/555/mainPdf/main.pdf',
    pageDate: '2024-12-31',
    checkedOn,
  },
  { id: 'kela-fi', label: 'Kela: Kuntoutuspsykoterapia', url: 'https://www.kela.fi/kuntoutuspsykoterapia', checkedOn },
  { id: 'kela-amounts', label: 'Kela: Kuntoutuspsykoterapian korvauksen määrä', url: 'https://www.kela.fi/kuntoutuspsykoterapia-korvauksen-maara', checkedOn },
  { id: 'kela-guideline', label: 'Kela: Kuntoutuspsykoterapian etuusohje (PDF)', url: 'https://www.kela.fi/etti/Kuntoutuspsykoterapia.pdf', pageDate: '2026-09-11', checkedOn },
  {
    id: 'kela-stats',
    label: 'Kela: Kuntoutuspsykoterapiaa sai lähes 66 000 henkilöä vuonna 2024 (tilastojulkaisu)',
    url: 'https://www.kela.fi/tietotarjotin/1170107-kuntoutuspsykoterapiaa-sai-lahes-66-000-henkiloa-vuonna-2024-nelja-viidesta-saajasta-naisia',
    pageDate: '2025-02-06',
    checkedOn,
  },
  { id: 'kela-rehab-en', label: 'Kela: Rehabilitative psychotherapy (englanninkielinen sivu; terapeuttihaun kielet)', url: 'https://www.kela.fi/rehabilitative-psychotherapy', checkedOn },
  {
    id: 'kela-partner',
    label: 'Kela: Sairaanhoitokorvaus psykologisista tutkimuksista (sivu terveydenhuollon yhteistyökumppaneille)',
    url: 'https://www.kela.fi/yhteistyokumppanit-terveydenhuolto-sairaanhoitokorvaukset-tutkimus-ja-hoito-psykologiset-tutkimukset',
    pageDate: '2021-04-22',
    checkedOn,
  },
  { id: 'kela-private', label: 'Kela: Korvaukset yksityisestä sairaanhoidosta', url: 'https://www.kela.fi/korvaukset-yksityisesta-sairaanhoidosta', pageDate: '2026-10-28', checkedOn },
  { id: 'kela-shf', label: 'Kela: Korkeakouluopiskelijan terveydenhoitomaksu', url: 'https://www.kela.fi/korkeakouluopiskelijan-terveydenhoitomaksu', pageDate: '2026-10-29', checkedOn },
  { id: 'mtalo-internet', label: 'Mielenterveystalo: Nettiterapiat', url: 'https://www.mielenterveystalo.fi/fi/nettiterapiat', checkedOn },
  { id: 'mtalo-internet-en', label: 'Mielenterveystalo: Internet therapies (englanninkielinen sivu; hoidon kielet)', url: 'https://mielenterveystalo.fi/en/internet-therapies', checkedOn },
  { id: 'mtalo-selfhelp', label: 'Mielenterveystalo: Omahoito', url: 'https://www.mielenterveystalo.fi/fi/omahoito', checkedOn },
  { id: 'mtalo-selfhelp-en', label: 'Mielenterveystalo: Self-help programs (englanninkielinen sivu; englanninkieliset ohjelmat)', url: 'https://www.mielenterveystalo.fi/en/self-help-programs', checkedOn },
  {
    id: 'mtalo-where',
    label: 'Mielenterveystalo: Milloin ja mistä apua mielenterveyden ongelmiin',
    url: 'https://www.mielenterveystalo.fi/fi/mielenterveyspalvelut/milloin-ja-mista-apua-mielenterveyden-ongelmiin',
    checkedOn,
  },
  { id: 'yths-who', label: 'YTHS: Palveluiden käyttöoikeus', url: 'https://www.yths.fi/asiointi/palveluiden-kayttooikeus/', checkedOn },
  { id: 'yths-lang', label: 'YTHS: Kielistrategia', url: 'https://www.yths.fi/asiointi/kielistrategia/', checkedOn },
  { id: 'yths-home', label: 'YTHS: etusivu, yhteydenottoajat', url: 'https://www.yths.fi/', checkedOn },
  { id: 'infofinland', label: 'InfoFinland: Mielenterveys', url: 'https://www.infofinland.fi/fi/health/mental-health', pageDate: '2025-10-06', checkedOn },
  {
    id: 'mieppi',
    label: 'Helsingin kaupunki: Mielenterveyspalvelupiste Mieppi',
    url: 'https://www.hel.fi/fi/sosiaali-ja-terveyspalvelut/terveydenhoito/mielenterveyspalvelut/mielenterveyspalvelupiste-mieppi',
    checkedOn,
  },
  {
    id: 'mieli-en',
    label: 'MIELI: New ways to receive support in English (englanninkielinen uutinen)',
    url: 'https://mieli.fi/en/news/new-ways-to-receive-support-in-english/',
    pageDate: '2026-06-09',
    checkedOn,
  },
  {
    id: 'mieli-en-fi',
    label: 'MIELI: MIELI ry avaa uusia englanninkielisiä tukimuotoja (uutinen)',
    url: 'https://mieli.fi/uutiset/mieli-ry-avaa-uusia-englanninkielisia-tukimuotoja/',
    pageDate: '2026-03-24',
    checkedOn,
  },
  { id: 'mieli-fi', label: 'MIELI: Kriisipuhelin', url: 'https://mieli.fi/tukea-ja-apua/kriisipuhelin/', pageDate: '2026-10-21', checkedOn },
  { id: 'mieli-sv', label: 'MIELI: Kristelefon (ruotsinkielinen kriisipuhelin, ruotsinkielinen sivu)', url: 'https://mieli.fi/sv/stod-och-hjalp/kristelefon/', pageDate: '2026-05-18', checkedOn },
  { id: 'mieli-chat', label: 'MIELI: Chattaa tai kirjoita', url: 'https://mieli.fi/tukea-ja-apua/chattaa-tai-kirjoita/', pageDate: '2026-01-30', checkedOn },
  { id: 'mieli-cc', label: 'MIELI: MIELI Kriisikeskus Helsinki', url: 'https://mieli.fi/tukea-ja-apua/mieli-kriisikeskus-helsinki/', pageDate: '2026-09-30', checkedOn },
  { id: 'tukinet-en', label: 'Tukinet (MIELI): Support in English (englanninkielinen sivu)', url: 'https://tukinet.fi/en/palvelut/support-in-english', checkedOn },
  { id: 'sekasin', label: 'Sekasin-chat', url: 'https://sekasin.fi/', checkedOn },
  { id: 'e112', label: 'Hätäkeskuslaitos: Hätänumero 112', url: 'https://112.fi/hatanumero112', checkedOn },
  { id: 'e112-en', label: 'Hätäkeskuslaitos: The 112 emergency number (englanninkielinen sivu; puhelun maksuttomuus)', url: 'https://112.fi/en/erc-number', checkedOn },
  { id: 'm116117', label: 'Päivystysapu 116117', url: 'https://www.116117.fi/', checkedOn },
];

export const SOURCES = Object.fromEntries(list.map((s) => [s.id, s])) as Record<string, Source>;

/** The sources a guide cites, in the order given. */
export const cite = (...ids: string[]): Source[] =>
  ids.map((id) => {
    const source = SOURCES[id];
    if (!source) throw new Error(`[guides] no source "${id}"`);
    return source;
  });
