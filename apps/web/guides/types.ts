/**
 * A guide page (docs/next-phase.md, Phase C): plain text that answers what
 * people search for, every figure tied to an official source with its date.
 *
 * Inline markup, kept tiny on purpose:
 *   [text](url)   a link (an internal path or an https address)
 *   [[id]]        a reference to `sources[id]`, printed as a numbered note
 *   **text**      strong
 */
export interface Source {
  id: string;
  /** Who says it, as a reader would name it: "Kela: Rehabilitative psychotherapy". */
  label: string;
  url: string;
  /** The date the page itself shows (updated, edited or published), if it shows one. */
  pageDate?: string;
  /** When we read it. Every figure was checked against the page on this day. */
  checkedOn: string;
}

export type Block = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };

export interface Section {
  heading: string;
  body: Block[];
}

export interface Guide {
  slug: string;
  title: string;
  /** The meta description: one or two sentences, under about 160 characters. */
  description: string;
  /** The day every fact on the page was checked against its source. */
  checkedOn: string;
  intro: string[];
  sections: Section[];
  sources: Source[];
}
