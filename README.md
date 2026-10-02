# juanje-web

Web personal y blog de Juanje (Astro 7, sitio estático).

## Comandos

| Comando | Acción |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo en http://localhost:4321 (muestra borradores y huecos de anuncio) |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Sirve `dist/` en local |

## Escribir un artículo

Los artículos se escriben en `articulos/`, con sus figuras al lado:

```
articulos/
├─ 004-2026-10-02-mediterraneo-sin-dana.md   →  Nº 004 · 02·X·2026 · /blog/mediterraneo-sin-dana/
├─ Figura4.1.png                              →  figura 1 del artículo 4
└─ Figura4.2.jpg
```

1. Copia `plantillas/005-AAAA-MM-DD-nombre-del-articulo.md` a `articulos/` y renómbralo: **Nº-fecha-nombre.md**. El nombre (en minúsculas, sin tildes, con guiones) es la URL.
2. Escribe: `#` título, `##` entradilla y, si quieres, las líneas `Categoría:`, `Etiquetas:` y `Borrador: sí`.
3. Figuras: guarda la imagen como `Figura<Nº artículo>.<Nº figura>` (p. ej. `Figura4.1.png`) y marca su sitio en el texto, en una línea aparte:

   ```md
   [Figura 4.1: Pie de la figura.]
   ```

   En la web aparece como «FIG. 4.1 — Pie de la figura.». Sin pie: `[Figura 4.1]`.
4. Ejecuta:

   ```
   npm run publicar
   ```

   Genera las entradas en `src/content/blog/` y avisa de lo que falte (imágenes, categoría…). Revisa en `npm run dev`, haz commit y push.

Más detalles:

- No edites `src/content/blog/<artículo>/index.md`: se regenera desde `articulos/`.
- Si un artículo ya publicado no indica `Categoría:` o `Etiquetas:`, se conservan las que tenía.
- Fórmulas en LaTeX: `$e_s(T)$` en línea o entre `$$ … $$` en bloque.
- Las imágenes se optimizan solas (WebP, tamaño adecuado).
- El anuncio intermedio se inserta solo tras el 3.er párrafo si hay 5 o más.

## Publicaciones

La página `/publicaciones/` se genera desde `src/data/publications.json`, que es una copia del perfil de Google Scholar con DOI añadidos desde OpenAlex. Para actualizarla:

```
npm run pubs
```

Ejecútalo en tu ordenador y sube a git el JSON actualizado (Scholar bloquea las consultas desde GitHub Actions). Para ocultar entradas, como preprints duplicados, o corregir un DOI, edita `src/data/publications-overrides.json` y vuelve a ejecutar el comando.

## AdSense (desactivado)

Mientras `PUBLIC_ADSENSE_CLIENT` esté vacío no se carga ningún script de terceros. Para activarlo:

1. Define en GitHub (Settings → Secrets and variables → Actions → Variables) `PUBLIC_ADSENSE_CLIENT` (`ca-pub-…`), `PUBLIC_ADSENSE_SLOT_IN_ARTICLE` y `PUBLIC_ADSENSE_SLOT_END`. Para probar en local: copia `.env.example` como `.env`.
2. Actualiza `public/ads.txt` con tu ID de editor.
3. Instala una CMP certificada por Google y actualiza la política de cookies (obligatorio en el EEE).

## Pendiente antes de publicar

- Buscar `[PENDIENTE]` y `[REVISAR]` en `src/`.
- Dominio: `site` en `astro.config.mjs` y `public/CNAME`.
- Redes y email: `src/config/site.ts`.
