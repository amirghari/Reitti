/**
 * The official sources the Swedish guides cite. Every quote behind every figure
 * was read on the source page itself on `checkedOn` (9.11.2026), the Swedish page
 * wherever one exists, including the two PDFs. Where a fact exists only on a
 * Finnish or English page, the label says so.
 */
import type { Source } from '../types.ts';

const checkedOn = '2026-11-09';

const list: Source[] = [
  { id: 'stm-vardgaranti', label: 'Social- och hälsovårdsministeriet (STM): Tillgång till vård (vårdgaranti)', url: 'https://stm.fi/sv/vardgaranti', pageDate: '2026-10-29', checkedOn },
  {
    id: 'stm-anvisning',
    label: 'STM: anvisning om tillämpningen av bestämmelserna om tillgången till icke-brådskande primärvård (pdf)',
    url: 'https://stm.fi/documents/1271139/150123656/V%C3%A5rdgarantin_anvisning_24.3.2025_SV.pdf/f43f52d5-e4fe-1776-c58e-0b5a8f914659?t=1742820061740',
    pageDate: '2025-03-24',
    checkedOn,
  },
  {
    id: 'stm-terapiatakuu',
    label: 'STM: Lasten ja nuorten terapiatakuu, terapigarantin för barn och unga (på finska, sidan finns inte på svenska)',
    url: 'https://stm.fi/lasten-ja-nuorten-terapiatakuu',
    checkedOn,
  },
  { id: 'stm-avgifter', label: 'STM: Avgifter för hälsovård', url: 'https://stm.fi/sv/avgifter-for-halsovard', checkedOn },
  { id: 'fpa-rehab', label: 'FPA: Rehabiliterande psykoterapi', url: 'https://www.kela.fi/rehabiliterande-psykoterapi', checkedOn },
  {
    id: 'fpa-rehab-en',
    label: 'FPA: Rehabilitative psychotherapy (på engelska, den enda versionen som anger söktjänstens språk)',
    url: 'https://www.kela.fi/rehabilitative-psychotherapy',
    checkedOn,
  },
  { id: 'fpa-anvisning', label: 'FPA: förmånsanvisning om rehabiliterande psykoterapi (på finska, pdf)', url: 'https://www.kela.fi/etti/Kuntoutuspsykoterapia.pdf', pageDate: '2026-09-11', checkedOn },
  {
    id: 'fpa-statistik',
    label: 'FPA: statistiknyhet, nästan 66 000 personer fick rehabiliterande psykoterapi år 2024',
    url: 'https://www.kela.fi/tietotarjotin/1170107-nastan-66-000-personer-fick-rehabiliterande-psykoterapi-ar-2024-fyra-av-fem-var-kvinnor',
    pageDate: '2025-02-06',
    checkedOn,
  },
  {
    id: 'fpa-psykologiska',
    label: 'FPA: Sjukvårdsersättning för psykologiska undersökningar, sida för hälsovårdspersonal',
    url: 'https://www.kela.fi/samarbetspartner-halsovardspersonal-sjukvardsersattningar-undersokning-och-behandling-psykologiska-undersokningar',
    pageDate: '2023-09-27',
    checkedOn,
  },
  { id: 'fpa-privat', label: 'FPA: Ersättning för privat sjukvård', url: 'https://www.kela.fi/ersattning-for-privat-sjukvard', pageDate: '2026-10-28', checkedOn },
  { id: 'fpa-halsovardsavgift', label: 'FPA: Hälsovårdsavgift för högskolestuderande', url: 'https://www.kela.fi/halsovardsavgift-for-hogskolestuderande', pageDate: '2026-10-29', checkedOn },
  { id: 'psykporten-natterapi', label: 'Psykporten (Mielenterveystalo): Nätterapier', url: 'https://www.mielenterveystalo.fi/sv/natterapier', checkedOn },
  {
    id: 'mtalo-internet-en',
    label: 'Mielenterveystalo: Internet Therapies (på engelska, den enda versionen som anger behandlingens språk)',
    url: 'https://www.mielenterveystalo.fi/en/internet-therapies',
    checkedOn,
  },
  { id: 'psykporten-egenvard', label: 'Psykporten (Mielenterveystalo): Egenvårdsprogram', url: 'https://www.mielenterveystalo.fi/sv/egenvard', checkedOn },
  {
    id: 'mtalo-selfhelp-en',
    label: 'Mielenterveystalo: Self-help programs (på engelska, listar programmen på engelska)',
    url: 'https://www.mielenterveystalo.fi/en/self-help-programs',
    checkedOn,
  },
  {
    id: 'psykporten-narvar',
    label: 'Psykporten (Mielenterveystalo): När och var kan man få hjälp vid psykiska problem?',
    url: 'https://www.mielenterveystalo.fi/sv/mentalvardstjanster/nar-och-var-kan-man-fa-hjalp-vid-psykiska-problem',
    checkedOn,
  },
  { id: 'shvs-vem', label: 'SHVS (YTHS): Rätt att anlita SHVS tjänster', url: 'https://www.yths.fi/sv/anvanda-tjanster/vem-far-anlita-shvs-tjanster/', checkedOn },
  { id: 'shvs-sprak', label: 'SHVS (YTHS): Språkstrategi', url: 'https://www.yths.fi/sv/anvanda-tjanster/sprakstrategi/', checkedOn },
  { id: 'shvs-start', label: 'SHVS (YTHS): startsidan, chattarnas öppettider', url: 'https://www.yths.fi/sv/startsida/', checkedOn },
  { id: 'infofinland', label: 'InfoFinland: Mental hälsa', url: 'https://www.infofinland.fi/sv/health/mental-health', pageDate: '2025-10-06', checkedOn },
  {
    id: 'mieppi',
    label: 'Helsingfors stad: Servicestället för psykisk ohälsa Mieppi',
    url: 'https://www.hel.fi/sv/social-och-halsovardstjanster/halsovard/mentalvardstjanster/servicestallet-for-psykisk-ohalsa-mieppi',
    checkedOn,
  },
  { id: 'mieli-en', label: 'MIELI: New ways to receive support in English (på engelska)', url: 'https://mieli.fi/en/news/new-ways-to-receive-support-in-english/', pageDate: '2026-06-09', checkedOn },
  { id: 'mieli-fi', label: 'MIELI: Kriisipuhelin, den finskspråkiga kristelefonen (på finska)', url: 'https://mieli.fi/tukea-ja-apua/kriisipuhelin/', pageDate: '2026-10-21', checkedOn },
  { id: 'mieli-sv', label: 'MIELI: MIELI Kristelefonen, den svenskspråkiga kristelefonen', url: 'https://mieli.fi/sv/stod-och-hjalp/kristelefon/', pageDate: '2026-05-18', checkedOn },
  {
    id: 'mieli-chatt-fi',
    label: 'MIELI: Chattaa tai kirjoita, chatt och skriftligt stöd (på finska, nyare än den svenska sidan)',
    url: 'https://mieli.fi/tukea-ja-apua/chattaa-tai-kirjoita/',
    pageDate: '2026-01-30',
    checkedOn,
  },
  { id: 'mieli-chatt-sv', label: 'MIELI: Samtalsstöd på nätet', url: 'https://mieli.fi/sv/stod-och-hjalp/samtalsstod-pa-natet/', pageDate: '2025-12-19', checkedOn },
  { id: 'mieli-kriscenter', label: 'MIELI: MIELI Kriscenter Helsingfors', url: 'https://mieli.fi/sv/stod-och-hjalp/mieli-kriscenter-helsingfors/', pageDate: '2026-10-06', checkedOn },
  {
    id: 'tukinet-en',
    label: 'Tukinet: Crisis support via chat or email for English speakers living in Finland (MIELI, på engelska)',
    url: 'https://tukinet.fi/en/palvelut/support-in-english',
    checkedOn,
  },
  { id: 'sekasin-sv', label: 'Sekasin-chatten (på svenska)', url: 'https://sekasin.fi/sv/', checkedOn },
  { id: 'sekasin-fi', label: 'Sekasin-chat (på finska)', url: 'https://sekasin.fi/', checkedOn },
  { id: 'e112-sv', label: 'Nödcentralsverket: Nödnumret 112', url: 'https://112.fi/sv/nodnumret-112', checkedOn },
  {
    id: 'e112-en',
    label: 'Nödcentralsverket: The 112 emergency number (på engelska, den enda versionen som säger att samtalet är gratis)',
    url: 'https://112.fi/en/erc-number',
    checkedOn,
  },
  { id: 'jour116117', label: 'Jourhjälpen 116117', url: 'https://www.116117.fi/sv', checkedOn },
];

export const SOURCES = Object.fromEntries(list.map((s) => [s.id, s])) as Record<string, Source>;

/** The sources a guide cites, in the order given. */
export const cite = (...ids: string[]): Source[] =>
  ids.map((id) => {
    const source = SOURCES[id];
    if (!source) throw new Error(`[guides] no source "${id}"`);
    return source;
  });
