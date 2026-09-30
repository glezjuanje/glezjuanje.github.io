// Plugin rehype: marca dónde va el anuncio intermedio de un artículo del blog,
// tras el párrafo AFTER_PARAGRAPH de primer nivel. Aquí no se decide nada
// sobre desarrollo/producción ni sobre AdSense; eso lo hace <AdSlot />.
//
// - .mdx: inserta <AdSlot variant="in-article" />, que ArticleLayout resuelve
//   vía <Content components={{ AdSlot }} />.
// - .md: Markdown no admite componentes, así que inserta un marcador
//   <div data-ad-anchor> que ArticleLayout sustituye por el anuncio.
// - Solo actúa si el artículo tiene al menos MIN_PARAGRAPHS párrafos.
// - En .mdx, si ya hay un <AdSlot /> puesto a mano, se respeta esa ubicación.

const AFTER_PARAGRAPH = 3;
const MIN_PARAGRAPHS = 5;

function hasManualAdSlot(node) {
  if (node.type === 'mdxJsxFlowElement' && node.name === 'AdSlot') return true;
  return Array.isArray(node.children) && node.children.some(hasManualAdSlot);
}

export function rehypeInArticleAd() {
  return (tree, file) => {
    const path = String(file.path ?? '').replaceAll('\\', '/');
    if (!path.includes('/content/blog/')) return;
    const isMdx = path.endsWith('.mdx');
    if (!isMdx && !path.endsWith('.md')) return;
    if (isMdx && hasManualAdSlot(tree)) return;

    const paragraphIdx = [];
    tree.children.forEach((child, i) => {
      if (child.type === 'element' && child.tagName === 'p') paragraphIdx.push(i);
    });
    if (paragraphIdx.length < MIN_PARAGRAPHS) return;

    const insertAt = paragraphIdx[AFTER_PARAGRAPH - 1] + 1;
    tree.children.splice(
      insertAt,
      0,
      isMdx
        ? {
            type: 'mdxJsxFlowElement',
            name: 'AdSlot',
            attributes: [{ type: 'mdxJsxAttribute', name: 'variant', value: 'in-article' }],
            children: [],
          }
        : { type: 'element', tagName: 'div', properties: { dataAdAnchor: 'in-article' }, children: [] },
    );
  };
}
