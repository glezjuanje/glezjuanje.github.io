// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeInArticleAd } from './src/utils/rehype-in-article-ad.mjs';
import { rehypeFigure } from './src/utils/rehype-figure.mjs';

// URL pública del sitio (canonical, sitemap, RSS, Open Graph).
// Ahora: GitHub Pages en el repo «glezjuanje.github.io».
// Cuando tengas dominio propio, cámbiala aquí.
const SITE_URL = 'https://glezjuanje.github.io';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  markdown: {
    // Astro 7 usa Sätteri por defecto, que no soporta fórmulas; usamos el
    // procesador unified (remark/rehype) para KaTeX. MDX lo hereda.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        [rehypeKatex, { strict: false }],
        // ![alt](foto.jpg "Pie") sola en su párrafo → figura numerada con pie.
        rehypeFigure,
        // Inserta <AdSlot /> tras unos párrafos (solo artículos .mdx del blog).
        rehypeInArticleAd,
      ],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
