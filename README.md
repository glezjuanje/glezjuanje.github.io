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

Cada artículo es una carpeta dentro de `src/content/blog/` con su texto (`index.md`) y sus imágenes. El nombre de la carpeta es la URL:

```
src/content/blog/
└─ gonzalo-hacia-el-norte/     →  /blog/gonzalo-hacia-el-norte/
   ├─ index.md
   ├─ satelite.jpg
   └─ trayectoria.png
```

1. Copia `plantillas/articulo/` a `src/content/blog/` y renombra la carpeta.
2. Rellena la cabecera (título, fecha, entradilla, categoría, etiquetas) y escribe.
3. Para una figura, pon la imagen en la carpeta y escribe en una línea aparte:

   ```md
   ![Descripción de la imagen](satelite.jpg "Pie de figura, se numera solo.")
   ```

   En **Typora**, **Obsidian** o **VS Code** puedes pegar la imagen con Ctrl+V y el editor guarda el archivo y escribe esa línea por ti (en Typora: *Preferencias → Imagen → Copiar imagen a la carpeta actual `./`*).
4. Con `draft: true` solo se ve en `npm run dev`; cámbialo a `false` para publicar.

Más detalles:

- Fórmulas en LaTeX: `$e_s(T)$` en línea o entre `$$ … $$` en bloque.
- Las imágenes se optimizan solas (WebP, tamaño adecuado).
- El anuncio intermedio se inserta solo tras el 3.er párrafo si hay 5 o más.
- También se admiten artículos `.mdx` (Markdown con componentes); en ellos se puede colocar el anuncio a mano con `<AdSlot />`.

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
