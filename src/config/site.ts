// Configuración central del sitio. Todo lo marcado [PENDIENTE] debe rellenarse.

import { PUBLIC_SECTIONS } from './sections.mjs';

export const SITE = {
  name: 'Meteorología | Clima | Divulgación',
  title: 'Meteorología | Clima | Divulgación · Juan Jesús González Alemán',
  description:
    'Blog de Juan Jesús González Alemán sobre actualidad meteorológica, clima y divulgación.',
  author: 'Juan Jesús González Alemán',
  lang: 'es',
  locale: 'es_ES',
  email: '[PENDIENTE]@ejemplo-dominio.es',
  // Cabecera de la web: título (las barras se pintan atenuadas) y firma.
  masthead: {
    title: 'Meteorología | Clima | Divulgación',
    byline: 'by Juan Jesús González Alemán',
  },
  // Imagen por defecto para Open Graph (1200×630) en public/.
  ogImage: '/og-default.png',
  postsPerPage: 10,
  latestOnHome: 10,
};

// Deja la url vacía ('') para ocultar una red en cabecera/pie.
export const SOCIAL: { name: string; url: string; handle: string }[] = [
  { name: 'X', url: '', handle: '[PENDIENTE] @usuario' },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/juan-jes%C3%BAs-gonz%C3%A1lez-alem%C3%A1n-1a0344b7/',
    handle: 'Juan Jesús González Alemán',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com/citations?user=vyHJB7AAAAAJ&hl=es',
    handle: 'Publicaciones científicas',
  },
  { name: 'ORCID', url: '', handle: '[PENDIENTE]' },
];

export const CATEGORIES = [
  {
    name: 'Actualidad meteo',
    slug: 'actualidad-meteo',
    description: 'Análisis de situaciones meteorológicas y episodios destacados.',
  },
  {
    name: 'Clima',
    slug: 'clima',
    description: 'Cambio climático, datos, tendencias y ciencia del clima.',
  },
  {
    name: 'Divulgación',
    slug: 'divulgacion',
    description: 'Conceptos de meteorología y física de la atmósfera explicados con calma.',
  },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]['name'];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as [CategoryName, ...CategoryName[]];

// AdSense: desactivado mientras PUBLIC_ADSENSE_CLIENT esté vacío.
// Formato del ID de editor: "ca-pub-1234567890123456".
export const ADS = {
  client: (import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '').trim(),
  slots: {
    // IDs de bloque de anuncio (data-ad-slot) que te da AdSense al crear cada bloque.
    inArticle: (import.meta.env.PUBLIC_ADSENSE_SLOT_IN_ARTICLE ?? '').trim(),
    endOfArticle: (import.meta.env.PUBLIC_ADSENSE_SLOT_END ?? '').trim(),
  },
};

export const adsEnabled = import.meta.env.PROD && ADS.client !== '';

// Estadísticas de visitas con GoatCounter (sin cookies). Desactivado mientras
// PUBLIC_GOATCOUNTER_CODE esté vacío. El código es el subdominio de tu cuenta:
// si tu panel es https://juanje.goatcounter.com, el código es «juanje».
const goatcounterCode = (import.meta.env.PUBLIC_GOATCOUNTER_CODE ?? '').trim();
export const ANALYTICS = {
  endpoint: goatcounterCode ? `https://${goatcounterCode}.goatcounter.com` : '',
};
export const analyticsEnabled = import.meta.env.PROD && ANALYTICS.endpoint !== '';

// Secciones publicadas (ver src/config/sections.mjs). En desarrollo, todo visible.
export type Section = keyof typeof PUBLIC_SECTIONS;
export const isVisible = (section: Section) => import.meta.env.DEV || PUBLIC_SECTIONS[section];
export const isHiddenInProd = (section: Section) => !PUBLIC_SECTIONS[section];
