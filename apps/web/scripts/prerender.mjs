/**
 * Build-time pre-render (SEO step 0, Amir 9.11.2026): writes the screens with an
 * address of their own as static HTML into dist/, from the server bundle that
 * `vite build --ssr src/entry-server.tsx` made in dist-ssr/. Each file is the
 * built index.html with that page's markup in #root and its title; the browser
 * then renders the app over it as before.
 *
 * Plain Node, no build step of its own. A page that fails to render stops the
 * build, so a broken pre-render never ships a blank page.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const { PAGES, render, title } = await import(join(web, 'dist-ssr', 'entry-server.js'));

const ROOT = '<div id="root"></div>';
const template = readFileSync(join(web, 'dist', 'index.html'), 'utf8');
if (!template.includes(ROOT)) throw new Error('[prerender] dist/index.html has no empty #root to fill');

const esc = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

for (const { path, screen } of PAGES) {
  const markup = render(screen);
  if (!markup.includes('<h1')) throw new Error(`[prerender] ${path} rendered no heading`);
  if (!markup.includes('href="tel:112"')) throw new Error(`[prerender] ${path} rendered without the crisis lines`);
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title(screen))}</title>`)
    .replace(ROOT, `<div id="root">${markup}</div>`);
  const file = path === '/' ? join(web, 'dist', 'index.html') : join(web, 'dist', path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
console.log(`[prerender] ${PAGES.length} pages: ${PAGES.map((p) => p.path).join(' ')}`);
