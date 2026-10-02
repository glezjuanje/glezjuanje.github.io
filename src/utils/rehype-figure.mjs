// Plugin rehype: una imagen sola en su párrafo se convierte en figura numerada.
//
//   ![Texto alternativo](foto.jpg "Pie de figura")
//
// → <figure class="fig"><img alt="Texto alternativo" …><figcaption>Pie de figura</figcaption></figure>
//
// Si no hay pie (el texto entre comillas), se usa el texto alternativo como pie.
// Funciona en .md y .mdx; en MDX las imágenes locales llegan como un elemento
// JSX que Astro convierte después en <Image>, así que se tratan los dos casos.

const isWhitespace = (n) => n.type === 'text' && !n.value.trim();

// Archivos «Figura4.1.png» → «4.1»: la figura muestra ese número en el pie.
const FIG_FILE = /figura\s*[_-]?(\d+)[._-](\d+)\.[a-z0-9]+$/i;

function imageInfo(node) {
  if (node.type === 'element' && node.tagName === 'img') {
    const m = String(node.properties?.src ?? '').match(FIG_FILE);
    return {
      alt: node.properties?.alt ?? '',
      title: node.properties?.title ?? '',
      figNumber: m ? `${Number(m[1])}.${Number(m[2])}` : '',
      clearTitle: () => delete node.properties.title,
    };
  }
  if ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') && /image|img/i.test(node.name ?? '')) {
    const attr = (name) => node.attributes?.find((a) => a.name === name);
    const title = attr('title');
    return {
      alt: attr('alt')?.value ?? '',
      title: typeof title?.value === 'string' ? title.value : '',
      clearTitle: () => (node.attributes = node.attributes.filter((a) => a.name !== 'title')),
    };
  }
  return null;
}

function transform(parent) {
  if (!Array.isArray(parent.children)) return;
  parent.children = parent.children.map((child) => {
    if (child.type === 'element' && child.tagName === 'p') {
      const content = child.children.filter((n) => !isWhitespace(n));
      const info = content.length === 1 ? imageInfo(content[0]) : null;
      if (info) {
        // Figuras numeradas (Figura4.1.png): el pie es solo el título; sin título, solo «FIG. 4.1».
        const caption = info.figNumber ? info.title : info.title || info.alt;
        info.clearTitle();
        const numProps = info.figNumber ? { dataFig: info.figNumber } : {};
        const figcaption = caption
          ? { type: 'element', tagName: 'figcaption', properties: numProps, children: [{ type: 'text', value: caption }] }
          : info.figNumber
            ? { type: 'element', tagName: 'figcaption', properties: { ...numProps, className: ['no-text'] }, children: [] }
            : null;
        return {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['fig'], ...(info.figNumber ? { dataFig: info.figNumber } : {}) },
          children: [content[0], ...(figcaption ? [figcaption] : [])],
        };
      }
    }
    transform(child);
    return child;
  });
}

export function rehypeFigure() {
  return (tree, file) => {
    const path = String(file.path ?? '').replaceAll('\\', '/');
    if (!path.includes('/content/blog/')) return;
    transform(tree);
  };
}
