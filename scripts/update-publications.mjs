// Actualiza src/data/publications.json a partir del perfil público de Google
// Scholar y completa DOI y enlaces en abierto con OpenAlex.
//
//   npm run pubs
//
// Se ejecuta a mano desde tu ordenador (Scholar no tiene API y bloquea las
// consultas desde servidores, así que NO se ejecuta en GitHub Actions). El
// build solo lee el JSON generado. Si Scholar falla, el JSON no se toca.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SCHOLAR_USER = 'vyHJB7AAAAAJ';
const OUT = fileURLToPath(new URL('../src/data/publications.json', import.meta.url));
const OVERRIDES = fileURLToPath(new URL('../src/data/publications-overrides.json', import.meta.url));
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchScholarPage(cstart) {
  const url = `https://scholar.google.com/citations?user=${SCHOLAR_USER}&hl=es&cstart=${cstart}&pagesize=100&sortby=pubdate`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' } });
  if (!res.ok) throw new Error(`Scholar respondió ${res.status}`);
  const html = await res.text();
  if (/gs_captcha|recaptcha|unusual traffic/i.test(html)) throw new Error('Scholar ha pedido un CAPTCHA');
  return html;
}

function parseRows(html) {
  const rows = [];
  for (const m of html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)) {
    const row = m[1];
    const link = row.match(/<a href="([^"]+)" class="gsc_a_at">([\s\S]*?)<\/a>/);
    const grays = [...row.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g)].map((g) => g[1]);
    const cites = row.match(/class="gsc_a_ac[^"]*">(\d*)<\/a>/);
    const year = row.match(/class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})?<\/span>/);
    if (!link) continue;
    const id = decode(link[1]).match(/citation_for_view=([^&]+)/)?.[1] ?? '';
    rows.push({
      id,
      title: decode(link[2]),
      authors: decode(grays[0] ?? ''),
      venue: decode((grays[1] ?? '').replace(/<span class="gs_oph">[\s\S]*?<\/span>/, '')),
      year: year?.[1] ? Number(year[1]) : null,
      citedBy: cites?.[1] ? Number(cites[1]) : 0,
      scholarUrl: `https://scholar.google.com/citations?view_op=view_citation&hl=es&user=${SCHOLAR_USER}&citation_for_view=${id}`,
    });
  }
  return rows;
}

function parseStats(html) {
  const cells = [...html.matchAll(/<td class="gsc_rsb_std">(\d*)<\/td>/g)].map((c) => Number(c[1] || 0));
  // Orden de Scholar: citas (total, 5 años), índice h (total, 5 años), i10 (total, 5 años)
  return cells.length >= 6
    ? { citations: cells[0], hIndex: cells[2], i10Index: cells[4] }
    : null;
}

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 2);

function similarity(a, b) {
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.max(A.size, B.size, 1);
}

async function enrich(pub) {
  const params = new URLSearchParams({ search: pub.title, 'per-page': '3', select: 'title,doi,publication_year,open_access' });
  try {
    const res = await fetch(`https://api.openalex.org/works?${params}`);
    if (!res.ok) return pub;
    const { results = [] } = await res.json();
    const best = results
      .map((r) => ({ r, score: similarity(pub.title, r.title ?? '') }))
      .filter(({ r }) => !pub.year || !r.publication_year || Math.abs(r.publication_year - pub.year) <= 1)
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 0.85) return pub;
    return {
      ...pub,
      doi: best.r.doi ? best.r.doi.replace('https://doi.org/', '') : undefined,
      openAccessUrl: best.r.open_access?.is_oa ? best.r.open_access.oa_url ?? undefined : undefined,
    };
  } catch {
    return pub;
  }
}

async function main() {
  console.log('Leyendo el perfil de Google Scholar…');
  const pubs = [];
  let stats = null;
  for (let cstart = 0; cstart < 1000; cstart += 100) {
    const html = await fetchScholarPage(cstart);
    if (cstart === 0) stats = parseStats(html);
    const rows = parseRows(html);
    pubs.push(...rows);
    if (rows.length < 100) break;
    await sleep(2000);
  }
  if (pubs.length === 0) throw new Error('No se ha encontrado ninguna publicación (¿ha cambiado el HTML de Scholar?)');
  console.log(`${pubs.length} publicaciones. Buscando DOI en OpenAlex…`);

  // Conserva DOI ya resueltos para no repetir consultas.
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { publications: [] };
  const known = new Map(previous.publications.map((p) => [p.id, p]));

  const enriched = [];
  for (const p of pubs) {
    const prev = known.get(p.id);
    if (prev && 'doi' in prev) {
      enriched.push({ ...p, doi: prev.doi, openAccessUrl: prev.openAccessUrl });
      continue;
    }
    enriched.push(await enrich(p));
    await sleep(150);
  }

  // Ajustes manuales: ocultar entradas o corregir campos (ver el archivo).
  const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
  const final = enriched
    .filter((p) => !(overrides.hide ?? []).includes(p.id))
    .map((p) => ({ ...p, ...(overrides.fix?.[p.id] ?? {}) }));

  const data = {
    source: `https://scholar.google.com/citations?user=${SCHOLAR_USER}`,
    updated: new Date().toLocaleDateString('sv-SE'), // AAAA-MM-DD en hora local
    stats,
    publications: final,
  };
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
  const withDoi = final.filter((p) => p.doi).length;
  console.log(`Guardado ${OUT}: ${final.length} publicaciones (${withDoi} con DOI).`);
}

main().catch((err) => {
  console.error(`No se ha actualizado: ${err.message}`);
  process.exit(1);
});
