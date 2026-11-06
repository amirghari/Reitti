/**
 * The professionals directory's data, before any page is drawn (D-39).
 *
 * The rows live in the private repository amirghari/Reitti-data, never here.
 * This module checks them against `docs/schemas/professional.schema.json`,
 * derives what is never stored (the ladder steps, the city's page address), and
 * says why a build may not go public. It does no I/O, so all of it is tested
 * with invented fixtures.
 */
import schema from '../../../docs/schemas/professional.schema.json' with { type: 'json' };

export type ProfessionalType = 'psychotherapist' | 'psychologist';
export type TriState = 'unknown' | 'yes' | 'no';
export type SourceId = 'kela' | 'julkisoteri' | 'julkiterhikki' | 'professional';

export interface SourceRead {
  source: SourceId;
  url: string;
  read_on: string;
  fields: string[];
}

export interface Professional {
  id: string;
  slug: string;
  type: ProfessionalType;
  name: string;
  title: string;
  languages: string[];
  city: string;
  region: string;
  methods: string[];
  kela_approved: boolean;
  kela_checked_on: string;
  licence_checked_on: string | null;
  registered_provider_checked_on: string | null;
  business_id: string | null;
  website: string | null;
  booking_url: string | null;
  phone: string | null;
  email: string | null;
  prices: string | null;
  waiting_time: string | null;
  remote_available: TriState;
  accepting_new_clients: TriState;
  sources: SourceRead[];
  claimed: boolean;
  claimed_on: string | null;
  status: 'active' | 'stale';
  stale_since: string | null;
  do_not_list: boolean;
  do_not_list_on: string | null;
  sample: boolean;
}

/**
 * The first cities (D-39), by the Finnish name a source gives. The slug is the
 * page address in every language; only the shown name changes.
 */
export const CITIES = [
  { slug: 'helsinki', name: { fi: 'Helsinki', sv: 'Helsingfors', en: 'Helsinki' } },
  { slug: 'espoo', name: { fi: 'Espoo', sv: 'Esbo', en: 'Espoo' } },
  { slug: 'vantaa', name: { fi: 'Vantaa', sv: 'Vanda', en: 'Vantaa' } },
  { slug: 'tampere', name: { fi: 'Tampere', sv: 'Tammerfors', en: 'Tampere' } },
  { slug: 'turku', name: { fi: 'Turku', sv: 'Åbo', en: 'Turku' } },
  { slug: 'oulu', name: { fi: 'Oulu', sv: 'Uleåborg', en: 'Oulu' } },
] as const;

export type City = (typeof CITIES)[number];

export const cityOf = (row: Professional): City | undefined => CITIES.find((c) => c.name.fi === row.city);

/**
 * The ladder steps a professional sits on (D-39). Derived, never stored, so a
 * row cannot claim a step its type and Kela status do not give it.
 * Psychiatrists are not in v1 and would get their own section, not a step.
 */
export function ladderSteps(row: Pick<Professional, 'type' | 'kela_approved'>): string[] {
  if (row.type === 'psychotherapist') {
    return row.kela_approved ? ['short-term-individual', 'kela-rehabilitative'] : ['short-term-individual'];
  }
  return ['short-term-individual'];
}

/** Rows that get a page at all. A removal request or a stale source hides it. */
export const listed = (rows: Professional[]): Professional[] =>
  rows.filter((row) => !row.do_not_list && row.status === 'active');

// ---------------------------------------------------------------------------
// Validation: the subset of JSON Schema the professional schema uses, read from
// the schema file itself so the two cannot drift.
// ---------------------------------------------------------------------------

type Node = Record<string, unknown>;
const defs = (schema as Node).$defs as Record<string, Node>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function typeOk(value: unknown, type: string): boolean {
  switch (type) {
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return typeof value === type;
  }
}

function check(value: unknown, node: Node, path: string, out: string[]): void {
  if (typeof node.$ref === 'string') {
    check(value, defs[node.$ref.replace('#/$defs/', '')], path, out);
    // A $ref beside other keywords (a description) adds nothing to check.
    return;
  }
  if (node.enum && !(node.enum as unknown[]).includes(value)) {
    out.push(`${path}: ${JSON.stringify(value)} is not one of ${(node.enum as unknown[]).join(', ')}`);
    return;
  }
  if (node.type) {
    const types = Array.isArray(node.type) ? (node.type as string[]) : [node.type as string];
    if (!types.some((type) => typeOk(value, type))) {
      out.push(`${path}: expected ${types.join(' or ')}`);
      return;
    }
  }
  if (value === null) return;
  if (typeof value === 'string') {
    if (typeof node.minLength === 'number' && value.length < node.minLength) out.push(`${path}: empty`);
    if (typeof node.pattern === 'string' && !new RegExp(node.pattern).test(value)) out.push(`${path}: does not match ${node.pattern}`);
    if (node.format === 'date' && !(DATE.test(value) && !Number.isNaN(Date.parse(value)))) out.push(`${path}: not a date`);
    if (node.format === 'email' && !EMAIL.test(value)) out.push(`${path}: not an email address`);
    if (node.format === 'uri' && !/^https:\/\/[^\s]+$/.test(value)) out.push(`${path}: not an https address`);
  }
  if (Array.isArray(value)) {
    if (typeof node.minItems === 'number' && value.length < node.minItems) out.push(`${path}: needs at least ${node.minItems}`);
    if (node.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) out.push(`${path}: repeats an item`);
    if (node.items) value.forEach((item, i) => check(item, node.items as Node, `${path}[${i}]`, out));
  }
  if (typeOk(value, 'object')) {
    const object = value as Record<string, unknown>;
    const properties = (node.properties ?? {}) as Record<string, Node>;
    for (const key of (node.required ?? []) as string[]) if (!(key in object)) out.push(`${path}.${key}: missing`);
    for (const [key, child] of Object.entries(object)) {
      if (properties[key]) check(child, properties[key], `${path}.${key}`, out);
      else if (node.additionalProperties === false) out.push(`${path}.${key}: not in the schema`);
    }
  }
}

/** Every problem with the dataset, as readable lines. Empty means it is sound. */
export function validate(rows: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(rows)) return ['the dataset is not a list of rows'];
  rows.forEach((row, i) => check(row, schema as Node, `rows[${i}]`, out));
  if (out.length) return out;

  const typed = rows as Professional[];
  const seen = { id: new Set<string>(), slug: new Set<string>() };
  typed.forEach((row, i) => {
    for (const key of ['id', 'slug'] as const) {
      if (seen[key].has(row[key])) out.push(`rows[${i}].${key}: "${row[key]}" is used twice`);
      seen[key].add(row[key]);
    }
    if (!cityOf(row)) out.push(`rows[${i}].city: "${row.city}" is not one of the first cities (D-39)`);
    if (row.do_not_list && !row.do_not_list_on) out.push(`rows[${i}]: do_not_list without do_not_list_on`);
    if (row.status === 'stale' && !row.stale_since) out.push(`rows[${i}]: stale without stale_since`);
    if (row.claimed && !row.claimed_on) out.push(`rows[${i}]: claimed without claimed_on`);
  });
  return out;
}

// ---------------------------------------------------------------------------
// The gate. Nothing built here is public until Amir says so (D-39).
// ---------------------------------------------------------------------------

/**
 * Amir's word that the pages may go public. Changing this is that decision, so
 * it is a reviewed one-line diff, not an environment variable someone can set.
 */
export const PUBLIC_PAGES_APPROVED = false;

/**
 * The address the claim and removal requests go to (Amir, 6.11.2026). A page
 * whose removal link goes nowhere breaks the Article 14 promise it prints, so
 * the address alone is not enough: CONTACT_ADDRESS_CONFIRMED says a test
 * message sent to it from outside has arrived.
 */
export const CONTACT_ADDRESS: string | null = 'tietosuoja@mielenreitti.fi';
export const CONTACT_ADDRESS_CONFIRMED = false;

/**
 * Who the Article 14 notice names as the data controller: Amir personally or a
 * company. Not decided (6.11.2026), and no real entry goes public until it is.
 */
export const DATA_CONTROLLER: string | null = null;

/** Why a production build would be wrong today. Empty means it may proceed. */
export function productionBlockers(rows: Professional[]): string[] {
  const out: string[] = [];
  if (!PUBLIC_PAGES_APPROVED) out.push('the pages are not public until Amir says so (D-39)');
  if (!CONTACT_ADDRESS) out.push('the claim and removal address is not set');
  else if (!CONTACT_ADDRESS_CONFIRMED) out.push(`no test message to ${CONTACT_ADDRESS} has been confirmed as arriving`);
  if (!DATA_CONTROLLER) out.push('the data controller named in the Article 14 notice is not decided');
  const samples = rows.filter((row) => row.sample);
  if (samples.length) out.push(`${samples.length} sample row(s): ${samples.map((r) => r.slug).join(', ')}`);
  const unchecked = listed(rows).filter((row) => !row.licence_checked_on);
  if (unchecked.length) out.push(`${unchecked.length} row(s) without a licence check: ${unchecked.map((r) => r.slug).join(', ')}`);
  return out;
}
