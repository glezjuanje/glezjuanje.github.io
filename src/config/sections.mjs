// Secciones visibles en la web publicada.
//
// En desarrollo (`npm run dev`) se ve TODO, para poder seguir trabajando.
// En producción, las secciones a `false` no se publican: desaparecen del menú,
// de los enlaces, del sitemap y del RSS, y sus páginas se borran tras el build.
// Las páginas legales y la 404 son siempre públicas.
//
// Para publicar una sección: cámbiala a `true`, haz commit y push.

export const PUBLIC_SECTIONS = {
  blog: true,
  sobreMi: false,
  publicaciones: false,
  contacto: false,
};

// Rutas de salida (dentro de dist/) que genera cada sección.
export const SECTION_OUTPUT = {
  blog: ['blog', 'rss.xml'],
  sobreMi: ['sobre-mi'],
  publicaciones: ['publicaciones'],
  contacto: ['contacto'],
};

/** Rutas de dist/ que hay que retirar en producción. */
export const hiddenOutput = () =>
  Object.entries(PUBLIC_SECTIONS)
    .filter(([, visible]) => !visible)
    .flatMap(([section]) => SECTION_OUTPUT[section]);
