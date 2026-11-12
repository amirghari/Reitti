/**
 * What every static page shares: the strings, escaping and the crisis lines
 * (invariant 1). Its own module, importing only config, so the guide pages can
 * use it without the directory's data module and the schema it reads (which
 * lives in docs/, not uploaded to Vercel).
 */
import crisis from '../../../config/crisis.json' with { type: 'json' };
import uiEn from '../../../config/i18n/ui/en.json' with { type: 'json' };
import uiFi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import uiSv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import clinicalEn from '../../../config/i18n/clinical/en.json' with { type: 'json' };
import clinicalFi from '../../../config/i18n/clinical/fi.json' with { type: 'json' };
import clinicalSv from '../../../config/i18n/clinical/sv.json' with { type: 'json' };
import directoryEn from '../../../config/i18n/directory/en.json' with { type: 'json' };
import directoryFi from '../../../config/i18n/directory/fi.json' with { type: 'json' };
import directorySv from '../../../config/i18n/directory/sv.json' with { type: 'json' };
import { formatHours, type HoursWindow } from '../src/crisisHours.ts';

export type Lang = 'fi' | 'sv' | 'en';
export const LANGS: Lang[] = ['fi', 'sv', 'en'];

export const ORIGIN = 'https://mielenreitti.fi';

const flatten = (...parts: Record<string, unknown>[]): Record<string, string> =>
  Object.fromEntries(
    parts.flatMap((part) => Object.entries(part).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string')),
  ) as Record<string, string>;

const BUNDLES: Record<Lang, Record<string, string>> = {
  en: flatten(uiEn, clinicalEn, directoryEn),
  fi: flatten(uiFi, clinicalFi, directoryFi),
  sv: flatten(uiSv, clinicalSv, directorySv),
};

/** A missing string fails the build: a page never ships a raw key. */
export function tr(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const value = BUNDLES[lang][key];
  if (value === undefined) throw new Error(`[pages] no "${key}" in ${lang}`);
  return value.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`[pages] "${key}" in ${lang} needs {${name}}`);
    return String(vars[name]);
  });
}

/** A string with its {placeholders} left in, for a script on the page to fill. */
export function template(lang: Lang, key: string): string {
  const value = BUNDLES[lang][key];
  if (value === undefined) throw new Error(`[pages] no "${key}" in ${lang}`);
  return value;
}

export const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);


type Resource = (typeof crisis.resources)[number] & { hours?: HoursWindow[]; languageNoteRef?: string };

export function crisisBand(lang: Lang): string {
  const lines = ([...crisis.resources] as Resource[]).sort(
    (a, b) => Number(b.languages.includes(lang)) - Number(a.languages.includes(lang)),
  );
  const items = lines
    .map((r) => {
      const hours =
        r.availability === '24/7'
          ? tr(lang, 'crisis.aroundTheClock')
          : r.hours
            ? formatHours(r.hours, lang)
            : tr(lang, 'crisis.limitedHours');
      const note = r.languageNoteRef && !r.languages.includes(lang) ? ` <span class="crisis-note">${esc(tr(lang, r.languageNoteRef))}</span>` : '';
      return `<li><a class="crisis-call" href="tel:${r.phone.replace(/\s/g, '')}"><span class="crisis-name">${esc(
        tr(lang, `crisis.${r.id}.name`),
      )}</span> <span class="crisis-phone">${esc(r.phone)}</span></a> <span class="crisis-hours">${esc(hours)}${note ? '.' : ''}</span>${note}</li>`;
    })
    .join('');
  return `<aside class="crisis-band" aria-labelledby="crisis-title">
<div class="wrap">
<h2 id="crisis-title" class="crisis-title">${esc(tr(lang, 'home.crisisStrip.title'))}</h2>
<ul class="crisis-lines">${items}</ul>
<p class="crisis-foot">${esc(tr(lang, 'crisis.ifClosed'))}</p>
</div>
</aside>`;
}
