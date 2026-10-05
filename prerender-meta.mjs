import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const pages = JSON.parse(
  fs.readFileSync(path.join(root, 'src/components/seo/pageMeta.json'), 'utf8')
);

const BASE_URL = 'https://enpensent.com';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const setTag = (html, attr, key, value) => {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return html.replace(re, (_, a, b) => `${a}${esc(value)}${b}`);
};

let written = 0;
for (const [route, meta] of Object.entries(pages)) {
  if (route === '/') continue;
  const url = `${BASE_URL}${route}`;
  const image = meta.image || `${BASE_URL}/og-home.png`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = setTag(html, 'name', 'description', meta.description);
  html = setTag(html, 'property', 'og:title', meta.title);
  html = setTag(html, 'property', 'og:description', meta.description);
  html = setTag(html, 'property', 'og:url', url);
  html = setTag(html, 'property', 'og:image', image);
  html = setTag(html, 'property', 'og:image:alt', meta.title);
  html = setTag(html, 'name', 'twitter:title', meta.title);
  html = setTag(html, 'name', 'twitter:description', meta.description);
  html = setTag(html, 'name', 'twitter:image', image);
  const dir = path.join(dist, route.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  written++;
}
console.log(`prerender-meta: wrote ${written} route HTML files`);
