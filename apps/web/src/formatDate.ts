/**
 * A day as each language writes it: "8 November 2026" in English, "8.11.2026" in
 * Finnish and Swedish, as Finnish pages write it. One function for the app, the
 * guides and the professional pages, so a date never reads two ways on the site.
 * No imports: the guides and pages build with vite-node and load this directly.
 */
export function formatDate(iso: string, lang: 'en' | 'fi' | 'sv'): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang !== 'en') return `${d}.${m}.${y}`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
