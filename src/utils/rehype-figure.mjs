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

function imageInfo(node) {
  if (node.type === 'element' && node.tagName === 'img') {
    return { alt: node.properties?.alt ?? '', title: node.properties?.title ?? '', clearTitle: () => delete node.properties.title };
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
        const caption = info.title || info.alt;
        info.clearTitle();
        return {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['fig'] },
          children: [
            content[0],
            ...(caption ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }] : []),
          ],
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
