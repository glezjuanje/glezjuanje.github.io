// Convierte los artículos de articulos/ en entradas del blog.
//
//   npm run publicar
//
// Formato de articulos/:
//   004-2026-10-02-mediterraneo-sin-dana.md   → Nº 004, fecha, URL /blog/mediterraneo-sin-dana/
//   Figura4.1.png, Figura4.2.jpg…             → figuras del artículo 4
//
// Dentro del .md:
//   # Título
//   ## Entradilla
//   Categoría: Clima                (opcional; Actualidad meteo | Clima | Divulgación)
//   Etiquetas: Mediterráneo, DANA   (opcional)
//   Borrador: sí                    (opcional; solo se ve en local)
//   …texto…
//   [Figura 4.1: Pie de la figura.]  (en una línea aparte; el pie es opcional)
//
// Si el artículo ya existe en el blog, se conservan su categoría, etiquetas y
// estado de borrador salvo que el .md los indique.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'articulos');
const DEST = join(ROOT, 'src', 'content', 'blog');
const CATEGORIES = ['Actualidad meteo', 'Clima', 'Divulgación'];
const DEFAULT_CATEGORY = 'Actualidad meteo';

const FILE_RE = /^(\d{1,4})-(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$/i;
const IMAGE_RE = /^figura\s*[_-]?(\d+)[._-](\d+)\.(png|jpe?g|webp|gif|svg|avif)$/i;
const TOKEN_RE = /^\s*\[\s*figura\s+(\d+)\.(\d+)\s*(?:[:.—–-]\s*(.*?))?\s*\]\s*$/i;

const warnings = [];
const warn = (msg) => warnings.push(msg);
const yamlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const normCat = (s) => CATEGORIES.find((c) => c.toLowerCase() === s.trim().toLowerCase());

// Imágenes disponibles: "4.1" → nombre de archivo
const images = new Map();
for (const f of readdirSync(SRC)) {
  const m = f.match(IMAGE_RE);
  if (m) images.set(`${Number(m[1])}.${Number(m[2])}`, f);
}

/** Lee categoría, etiquetas y borrador de un artículo ya publicado (index.md o index.mdx). */
function existingMeta(dir) {
  for (const name of ['index.md', 'index.mdx']) {
    const p = join(dir, name);
    if (!existsSync(p)) continue;
    const fm = readFileSync(p, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const tags = fm.match(/^tags:\s*\[(.*)\]\s*$/m)?.[1];
    return {
      category: fm.match(/^category:\s*(.+)$/m)?.[1].trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      draft: fm.match(/^draft:\s*(true|false)/m)?.[1] === 'true',
    };
  }
  return null;
}

let published = 0;
for (const file of readdirSync(SRC).sort()) {
  const fm = file.match(FILE_RE);
  if (!fm) {
    if (file.endsWith('.md')) warn(`${file}: nombre no reconocido (usa Nº-AAAA-MM-DD-nombre.md); no se publica.`);
    continue;
  }
  const [, numStr, date, slug] = fm;
  const number = Number(numStr);
  const lines = readFileSync(join(SRC, file), 'utf8').replace(/\r\n/g, '\n').split('\n');

  // Título (#) y entradilla (##)
  let i = 0;
  const next = () => {
    while (i < lines.length && !lines[i].trim()) i++;
    return lines[i];
  };
  const titleLine = next();
  if (!titleLine?.startsWith('# ')) {
    warn(`${file}: la primera línea debe ser el título («# …»); no se publica.`);
    continue;
  }
  const title = titleLine.slice(2).trim();
  i++;
  let description = '';
  if (next()?.startsWith('## ')) {
    description = lines[i].slice(3).trim();
    i++;
  } else warn(`${file}: falta la entradilla («## …» tras el título).`);

  // Metadatos opcionales
  const meta = {};
  while (true) {
    const l = next();
    const m = l?.match(/^(categor[ií]a|etiquetas|borrador)\s*:\s*(.*)$/i);
    if (!m) break;
    const key = m[1].toLowerCase();
    if (key.startsWith('categor')) {
      meta.category = normCat(m[2]);
      if (!meta.category) warn(`${file}: categoría «${m[2]}» desconocida (usa ${CATEGORIES.join(', ')}).`);
    } else if (key === 'etiquetas') meta.tags = m[2].split(',').map((t) => t.trim()).filter(Boolean);
    else meta.draft = /^(s[ií]|true|1)$/i.test(m[2].trim());
    i++;
  }

  // Cuerpo: figuras
  const outDir = join(DEST, slug);
  mkdirSync(outDir, { recursive: true });
  const body = lines.slice(i).map((line) => {
    const t = line.match(TOKEN_RE);
    if (!t) return line;
    const [, a, b, captionRaw] = t;
    const key = `${Number(a)}.${Number(b)}`;
    const caption = (captionRaw ?? '').trim();
    if (Number(a) !== number) warn(`${file}: [Figura ${key}] no corresponde al artículo Nº ${number}.`);
    const img = images.get(key);
    if (!img) {
      warn(`${file}: falta la imagen de la Figura ${key} (p. ej. Figura${key}.png); no se publica esa figura.`);
      return `<!-- Figura ${key} pendiente${caption ? `: ${caption}` : ''} -->`;
    }
    copyFileSync(join(SRC, img), join(outDir, img));
    const alt = (caption || `Figura ${key}`).replace(/[[\]]/g, '');
    return `![${alt}](${img}${caption ? ` "${caption.replace(/"/g, '\\"')}"` : ''})`;
  });

  const prev = existingMeta(outDir);
  const category = meta.category ?? prev?.category ?? DEFAULT_CATEGORY;
  const tags = meta.tags ?? prev?.tags ?? [];
  const draft = meta.draft ?? prev?.draft ?? false;
  if (!meta.category && !prev) warn(`${file}: sin «Categoría:»; se usa «${DEFAULT_CATEGORY}».`);

  const front = [
    '---',
    `title: ${yamlStr(title)}`,
    `date: ${date}`,
    `number: ${number}`,
    `description: ${yamlStr(description)}`,
    `category: ${category}`,
    `tags: [${tags.join(', ')}]`,
    `draft: ${draft}`,
    '---',
    '',
    '<!-- Generado por `npm run publicar` desde articulos/. Edita el original, no este archivo. -->',
    '',
  ].join('\n');

  writeFileSync(join(outDir, 'index.md'), front + body.join('\n').replace(/\s+$/, '') + '\n', 'utf8');
  // Versión antigua en MDX, si la había
  if (existsSync(join(outDir, 'index.mdx'))) rmSync(join(outDir, 'index.mdx'));
  published++;
  console.log(`✔ Nº ${String(number).padStart(3, '0')}  ${slug}  (${category}${draft ? ', borrador' : ''})`);
}

if (warnings.length) {
  console.log('\nAvisos:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
console.log(`\n${published} artículo(s) generados en src/content/blog/.`);
