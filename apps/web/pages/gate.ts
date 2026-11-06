/**
 * Amir's word that the directory pages may go public (D-39). Changing this is
 * that decision, so it is a reviewed one-line diff, not an environment variable
 * someone can set.
 *
 * Its own module with no imports, so robots.txt (apps/web/api/robots.ts) can
 * read it as well as the page build: the directory sitemap is named there only
 * once the pages are public.
 */
export const PUBLIC_PAGES_APPROVED = false;
